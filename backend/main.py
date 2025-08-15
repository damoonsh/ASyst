from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from contextlib import asynccontextmanager
from typing import List, Dict, Any, AsyncIterator, Optional
from pydantic import BaseModel, Field
import logging
import uuid
from datetime import datetime
import json
import tempfile
import os

from database import get_db, create_tables, engine
from models import Thread, ThreadTitle, Conversation
from rag import RAG


# Pydantic models for request validation
class CreateMessageRequest(BaseModel):
    """Request model for creating a new message in a conversation."""
    question: str = Field(..., min_length=1, max_length=10000, description="The question text")
    answer: str = Field(..., min_length=1, max_length=50000, description="The answer text")
    model: str = Field(..., min_length=1, max_length=100, description="The model used to generate the answer")
    firstMessage: bool = Field(default=False, description="Whether this is the first message in the thread")
    time_took: Optional[float] = Field(None, description="Time taken to generate the answer in seconds")


class CreateEditRequest(BaseModel):
    """Request model for creating a new edit for the most recent message."""
    question: str = Field(..., min_length=1, max_length=10000, description="The edited question text")
    answer: str = Field(..., min_length=1, max_length=50000, description="The edited answer text")
    model: str = Field(..., min_length=1, max_length=100, description="The model used to generate the edited answer")
    time_took: Optional[float] = Field(None, description="Time taken to generate the edited answer in seconds")


class LLMRequest(BaseModel):
    """Request model for LLM call endpoint."""
    question: str = Field(..., min_length=1, max_length=10000, description="The question text")
    model: str = Field(..., min_length=1, max_length=100, description="The model to use for generating the response")


class RAGRequest(BaseModel):
    """Request model for RAG context endpoint."""
    question: str = Field(..., min_length=1, max_length=10000, description="The question text")
    model: str = Field(..., min_length=1, max_length=100, description="The model to use for generating the response")
    pdf_path: Optional[str] = Field(None, description="Optional path to PDF file to ingest before processing the question")


# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize RAG instance
rag_instance = RAG()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan manager.
    Handles startup and shutdown events.
    """
    # Startup
    logger.info("Starting up FastAPI application...")
    try:
        # Create database tables if they don't exist
        create_tables()
        logger.info("Database tables created/verified successfully")
    except Exception as e:
        logger.error(f"Failed to create database tables: {e}")
        raise
    
    yield
    
    # Shutdown
    logger.info("Shutting down FastAPI application...")
    engine.dispose()


# Create FastAPI application
app = FastAPI(
    title="Chat Data Modeling API",
    description="API for managing chat threads, messages, and conversation history",
    version="1.0.0",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],  # Frontend development servers
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    """Health check endpoint."""
    return {"message": "Chat Data Modeling API is running"}


@app.get("/health")
async def health_check(db: Session = Depends(get_db)):
    """
    Health check endpoint that verifies database connectivity.
    """
    try:
        # Test database connection by executing a simple query
        from sqlalchemy import text
        db.execute(text("SELECT 1"))
        return {
            "status": "healthy",
            "database": "connected",
            "message": "All systems operational"
        }
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        raise HTTPException(
            status_code=503,
            detail={
                "status": "unhealthy",
                "database": "disconnected",
                "error": str(e)
            }
        )


@app.get("/threads/titles")
async def get_thread_titles(db: Session = Depends(get_db)) -> List[Dict[str, Any]]:
    """
    Retrieve all thread titles for sidebar display.
    
    Returns a list of threads with their titles, ordered by creation date (newest first).
    Each thread includes thread_id, title, and started_at timestamp.
    
    Requirements: 1.1, 1.2, 4.1
    """
    try:
        # Query threads with their titles using a left join
        # This ensures we get all threads, even if they don't have a title yet
        query = (
            db.query(Thread, ThreadTitle)
            .outerjoin(ThreadTitle, Thread.thread_id == ThreadTitle.thread_id)
            .order_by(Thread.started_at.desc())
        )
        
        results = query.all()
        
        # Format the response for frontend consumption
        thread_titles = []
        for thread, title in results:
            thread_data = {
                "thread_id": thread.thread_id,
                "title": title.title if title else f"Thread {thread.thread_id[:8]}...",  # Default title if none exists
                "started_at": thread.started_at.isoformat()
            }
            thread_titles.append(thread_data)
        
        logger.info(f"Retrieved {len(thread_titles)} thread titles")
        return thread_titles
        
    except Exception as e:
        logger.error(f"Failed to retrieve thread titles: {e}")
        raise HTTPException(
            status_code=500,
            detail={
                "error": "Failed to retrieve thread titles",
                "message": str(e)
            }
        )


@app.post("/threads")
async def create_thread(db: Session = Depends(get_db)) -> Dict[str, Any]:
    """
    Create a new conversation thread.
    
    This endpoint creates a new thread with a randomly generated thread_id.
    The thread starts with a default title that can be updated later.
    
    Requirements: 1.1, 6.3
    """
    try:
        # Generate random thread_id
        thread_id = str(uuid.uuid4())
        
        # Create new thread
        thread = Thread(thread_id=thread_id)
        db.add(thread)
        
        # Create default title for new thread
        default_title = f"New Conversation"
        thread_title = ThreadTitle(thread_id=thread_id, title=default_title)
        db.add(thread_title)
        
        db.commit()
        db.refresh(thread)
        
        response = {
            "thread_id": thread_id,
            "title": default_title,
            "started_at": thread.started_at.isoformat(),
            "status": "created"
        }
        
        logger.info(f"Created new thread {thread_id}")
        return response
        
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to create thread: {e}")
        raise HTTPException(
            status_code=500,
            detail={
                "error": "Failed to create thread",
                "message": str(e)
            }
        )



@app.get("/conversations/{thread_id}")
async def get_conversation_history(thread_id: str, db: Session = Depends(get_db)) -> Dict[str, Any]:
    """
    Retrieve full conversation history for a specific thread.
    
    Returns messages with all edits in chronological order, grouped by message_id.
    Each message includes all its edits with metadata for frontend consumption.
    
    Requirements: 2.1, 2.2, 2.3, 2.4
    """
    try:
        # First verify the thread exists
        thread = db.query(Thread).filter(Thread.thread_id == thread_id).first()
        if not thread:
            raise HTTPException(
                status_code=404,
                detail={
                    "error": "Thread not found",
                    "thread_id": thread_id
                }
            )
        
        # Query all conversations for this thread, ordered by creation time
        conversations = (
            db.query(Conversation)
            .filter(Conversation.thread_id == thread_id)
            .order_by(Conversation.created_at.asc())
            .all()
        )
        
        # Group conversations by message_id and organize edits
        messages_dict = {}
        for conv in conversations:
            message_id = conv.message_id
            
            if message_id not in messages_dict:
                messages_dict[message_id] = {
                    "message_id": message_id,
                    "edits": []
                }
            
            # Add this edit to the message
            edit_data = {
                "edit_id": conv.edit_id,
                "question": conv.question,
                "answer": conv.answer,
                "created_at": conv.created_at.isoformat(),
                "model": conv.model,
                "time_took": conv.time_took
            }
            messages_dict[message_id]["edits"].append(edit_data)
        
        # Convert to list and sort messages by the earliest edit timestamp
        messages = list(messages_dict.values())
        for message in messages:
            # Sort edits within each message by creation time
            message["edits"].sort(key=lambda x: x["created_at"])
        
        # Sort messages by the timestamp of their first edit
        messages.sort(key=lambda x: x["edits"][0]["created_at"] if x["edits"] else "")
        
        # Get thread title for context
        thread_title = db.query(ThreadTitle).filter(ThreadTitle.thread_id == thread_id).first()
        
        response = {
            "thread_id": thread_id,
            "title": thread_title.title if thread_title else f"Thread {thread_id[:8]}...",
            "started_at": thread.started_at.isoformat(),
            "messages": messages,
            "total_messages": len(messages),
            "total_edits": len(conversations)
        }
        
        logger.info(f"Retrieved conversation history for thread {thread_id}: {len(messages)} messages, {len(conversations)} total edits")
        return response
        
    except HTTPException:
        # Re-raise HTTP exceptions (like 404)
        raise
    except Exception as e:
        logger.error(f"Failed to retrieve conversation history for thread {thread_id}: {e}")
        raise HTTPException(
            status_code=500,
            detail={
                "error": "Failed to retrieve conversation history",
                "thread_id": thread_id,
                "message": str(e)
            }
        )


@app.get("/conversations/{thread_id}/{message_id}")
async def get_message_edits(thread_id: str, message_id: str, db: Session = Depends(get_db)) -> Dict[str, Any]:
    """
    Retrieve all edits for a specific message within a thread.
    
    Returns all edits for the specified message with metadata including timestamp, 
    model, and edit_number for easy frontend rendering of edit history.
    
    Requirements: 2.2, 2.3, 2.5
    """
    try:
        # First verify the thread exists
        thread = db.query(Thread).filter(Thread.thread_id == thread_id).first()
        if not thread:
            raise HTTPException(
                status_code=404,
                detail={
                    "error": "Thread not found",
                    "thread_id": thread_id
                }
            )
        
        # Query all edits for this specific message, ordered by creation time
        edits = (
            db.query(Conversation)
            .filter(
                Conversation.thread_id == thread_id,
                Conversation.message_id == message_id
            )
            .order_by(Conversation.created_at.asc())
            .all()
        )
        
        if not edits:
            raise HTTPException(
                status_code=404,
                detail={
                    "error": "Message not found",
                    "thread_id": thread_id,
                    "message_id": message_id
                }
            )
        
        # Format edits with edit_number (1-based index) and metadata
        formatted_edits = []
        for index, edit in enumerate(edits, 1):
            edit_data = {
                "edit_id": edit.edit_id,
                "edit_number": index,
                "question": edit.question,
                "answer": edit.answer,
                "created_at": edit.created_at.isoformat(),
                "model": edit.model,
                "time_took": edit.time_took,
                "timestamp": edit.created_at.isoformat()  # Alias for timestamp
            }
            formatted_edits.append(edit_data)
        
        # Get thread title for context
        thread_title = db.query(ThreadTitle).filter(ThreadTitle.thread_id == thread_id).first()
        
        response = {
            "thread_id": thread_id,
            "message_id": message_id,
            "thread_title": thread_title.title if thread_title else f"Thread {thread_id[:8]}...",
            "total_edits": len(formatted_edits),
            "edits": formatted_edits,
            "latest_edit": formatted_edits[-1] if formatted_edits else None,
            "first_edit": formatted_edits[0] if formatted_edits else None
        }
        
        logger.info(f"Retrieved {len(formatted_edits)} edits for message {message_id} in thread {thread_id}")
        return response
        
    except HTTPException:
        # Re-raise HTTP exceptions (like 404)
        raise
    except Exception as e:
        logger.error(f"Failed to retrieve edits for message {message_id} in thread {thread_id}: {e}")
        raise HTTPException(
            status_code=500,
            detail={
                "error": "Failed to retrieve message edits",
                "thread_id": thread_id,
                "message_id": message_id,
                "message": str(e)
            }
        )


@app.post("/conversations/{thread_id}/")
async def create_message(
    thread_id: str,
    request: CreateMessageRequest, 
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Create a new message in an existing conversation thread.
    
    This endpoint adds a new message to the specified thread.
    The thread must already exist. Backend generates message_id and edit_id.
    
    Requirements: 2.1, 2.2, 6.3, 6.4
    """
    try:
        # Generate message_id and edit_id in backend
        message_id = str(uuid.uuid4())
        edit_id = str(uuid.uuid4())
        
        # Verify thread exists
        thread = db.query(Thread).filter(Thread.thread_id == thread_id).first()
        if not thread:
            raise HTTPException(
                status_code=404,
                detail={
                    "error": "Thread not found",
                    "thread_id": thread_id,
                    "message": "Cannot create message in non-existent thread"
                }
            )
        
        logger.info(f"Creating message in existing thread {thread_id}")
        
        # Check if message_id already exists in this thread
        existing_message = (
            db.query(Conversation)
            .filter(
                Conversation.thread_id == thread_id,
                Conversation.message_id == message_id
            )
            .first()
        )
        
        if existing_message:
            raise HTTPException(
                status_code=409,
                detail={
                    "error": "Message already exists",
                    "thread_id": thread_id,
                    "message_id": message_id,
                    "message": "Use the edit endpoint to add new versions of existing messages"
                }
            )
        
        # Create new conversation entry
        conversation = Conversation(
            thread_id=thread_id,
            message_id=message_id,
            edit_id=edit_id,
            question=request.question,
            answer=request.answer,
            model=request.model,
            time_took=request.time_took,
            created_at=datetime.utcnow()
        )
        
        db.add(conversation)
        db.commit()
        db.refresh(conversation)
        
        # Generate and update thread title automatically if this is the first message
        # Use a separate database session to avoid affecting the main transaction
        if request.firstMessage:
            from database import get_db_session
            title_db = None
            
            try:
                title_db = get_db_session()
                
                # Load the model for title generation
                rag_instance.load_model(request.model)
                
                # Generate title using the question
                title_chunks = []
                async for chunk in rag_instance.generate_question(request.question):
                    title_chunks.append(chunk)
                
                # Combine chunks and clean up the title
                generated_title = "".join(title_chunks).strip()
                
                # Clean up the title extensively
                # Remove thinking tags and content
                if "<think>" in generated_title:
                    # Extract content after </think> tag
                    parts = generated_title.split("</think>")
                    if len(parts) > 1:
                        generated_title = parts[-1].strip()
                    else:
                        generated_title = generated_title.replace("<think>", "").strip()
                
                # Remove any remaining XML-like tags
                import re
                generated_title = re.sub(r'<[^>]+>', '', generated_title)
                
                # Remove quotes and extra whitespace
                generated_title = generated_title.replace('"', '').replace("'", "").strip()
                
                # Limit to reasonable title length (much less than 500 chars)
                if len(generated_title) > 100:
                    generated_title = generated_title[:97] + "..."
                
                # Fallback to default if generation failed or is empty
                if not generated_title or len(generated_title.strip()) == 0:
                    generated_title = f"Conversation {thread_id[:8]}"
                
                # Update the thread title using separate session
                thread_title = title_db.query(ThreadTitle).filter(ThreadTitle.thread_id == thread_id).first()
                if thread_title:
                    thread_title.title = generated_title
                    title_db.commit()
                    logger.info(f"Generated and updated title for thread {thread_id}: {generated_title}")
                else:
                    logger.warning(f"Thread title not found for thread {thread_id}")
                
            except Exception as e:
                # Don't fail the message creation if title generation fails
                logger.error(f"Failed to generate title for thread {thread_id}: {e}")
                if title_db:
                    title_db.rollback()
            finally:
                if title_db:
                    title_db.close()
        
        # Format response
        response = {
            "thread_id": thread_id,
            "message_id": message_id,
            "edit_id": edit_id,
            "question": conversation.question,
            "answer": conversation.answer,
            "model": conversation.model,
            "created_at": conversation.created_at.isoformat(),
            "status": "created"
        }
        
        logger.info(f"Created new message {message_id} in thread {thread_id}")
        return response
        
    except HTTPException:
        # Re-raise HTTP exceptions
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to create message in thread {thread_id}: {e}")
        raise HTTPException(
            status_code=500,
            detail={
                "error": "Failed to create message",
                "thread_id": thread_id,
                "message": str(e)
            }
        )


@app.post("/conversations/{message_id}/edits")
async def create_message_edit(
    message_id: str,
    request: CreateEditRequest,
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Create a new edit for an existing message.
    
    This endpoint adds a new edit to the specified message. The message_id is provided
    by the frontend (received from previous backend responses), but edit_id is generated by backend.
    
    Requirements: 2.2, 2.3, 6.3, 6.4
    """
    try:
        # Find the existing message to get thread_id
        existing_edits = (
            db.query(Conversation)
            .filter(Conversation.message_id == message_id)
            .order_by(Conversation.created_at.desc())
            .all()
        )
        
        if not existing_edits:
            raise HTTPException(
                status_code=404,
                detail={
                    "error": "Message not found",
                    "message_id": message_id,
                    "message": "Cannot create edit for non-existent message"
                }
            )
        
        # Get thread_id from existing message
        thread_id = existing_edits[0].thread_id
        
        # Generate random edit_id
        next_edit_id = str(uuid.uuid4())
        
        # Since edit_id is now a UUID, duplicates are extremely unlikely
        # but we can still check if needed for extra safety
        
        # Create new edit entry
        new_edit = Conversation(
            thread_id=thread_id,
            message_id=message_id,
            edit_id=next_edit_id,
            question=request.question,
            answer=request.answer,
            model=request.model,
            time_took=request.time_took,
            created_at=datetime.utcnow()
        )
        
        db.add(new_edit)
        db.commit()
        db.refresh(new_edit)
        
        # Get total edit count for this message
        total_edits = len(existing_edits) + 1
        
        # Format response
        response = {
            "thread_id": thread_id,
            "message_id": message_id,
            "edit_id": next_edit_id,
            "edit_number": total_edits,  # Use count instead of trying to convert UUID to int
            "question": new_edit.question,
            "answer": new_edit.answer,
            "model": new_edit.model,
            "created_at": new_edit.created_at.isoformat(),
            "total_edits": total_edits,
            "status": "created"
        }
        
        logger.info(f"Created edit {next_edit_id} for message {message_id} in thread {thread_id}")
        return response
        
    except HTTPException:
        # Re-raise HTTP exceptions
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to create edit for message {message_id}: {e}")
        raise HTTPException(
            status_code=500,
            detail={
                "error": "Failed to create message edit",
                "message_id": message_id,
                "message": str(e)
            }
        )


@app.post("/llm_call")
async def llm_call(request: LLMRequest) -> StreamingResponse:
    """
    Generate LLM response for a given question using the specified model.
    
    This endpoint uses the RAG system to generate responses without document context.
    Returns a streaming response for real-time UI updates.
    
    Requirements: 1.1, 1.3, 6.1, 6.2
    """
    try:
        # Load the specified model
        rag_instance.load_model(request.model)
        logger.info(f"Loaded model {request.model} for LLM call")
        
        async def generate_response() -> AsyncIterator[str]:
            """Generate streaming response chunks."""
            try:
                async for chunk in rag_instance.answer(request.question):
                    # Format each chunk as JSON for consistent frontend parsing
                    yield f"data: {json.dumps({'content': chunk})}\n\n"
            except Exception as e:
                logger.error(f"Error during response generation: {e}")
                yield f"data: {json.dumps({'error': str(e)})}\n\n"
        
        return StreamingResponse(
            generate_response(),
            media_type="text/plain",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
            }
        )
        
    except Exception as e:
        logger.error(f"Failed to process LLM call: {e}")
        raise HTTPException(
            status_code=500,
            detail={
                "error": "Failed to process LLM call",
                "message": str(e)
            }
        )


@app.post("/rag/")
async def rag_call(
    question: str = Form(...),
    model: str = Form(...),
    pdf_file: Optional[UploadFile] = File(None),
    pdf_path: Optional[str] = Form(None)
) -> StreamingResponse:
    """
    Generate RAG-enhanced response for a given question using document context.
    
    This endpoint uses the RAG system to generate context-aware responses using
    documents stored in ChromaDB. Falls back to regular LLM response if no
    documents are available.
    
    If pdf_path is provided, the PDF will be ingested into the vector database
    before processing the question, allowing for immediate context-aware responses.
    
    Requirements: 1.3, 4.1, 4.2, 4.3
    """
    try:
        # Load the specified model
        rag_instance.load_model(model)
        logger.info(f"Loaded model {model} for RAG call")
        
        # Handle PDF ingestion - either from uploaded file or existing path
        if pdf_file:
            # Handle uploaded PDF file
            try:
                logger.info(f"Processing uploaded PDF file: {pdf_file.filename}")
                
                # Create a temporary file to store the uploaded PDF
                with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as temp_file:
                    # Read and write the uploaded file content
                    content = await pdf_file.read()
                    temp_file.write(content)
                    temp_file_path = temp_file.name
                
                # Ingest the PDF from the temporary file
                rag_instance.ingest_pdf(temp_file_path)
                logger.info(f"Successfully ingested uploaded PDF: {pdf_file.filename}")
                
                # Clean up the temporary file
                os.unlink(temp_file_path)
                
            except Exception as e:
                logger.error(f"Failed to ingest uploaded PDF {pdf_file.filename}: {e}")
                # Clean up temp file if it exists
                if 'temp_file_path' in locals():
                    try:
                        os.unlink(temp_file_path)
                    except:
                        pass
                raise HTTPException(
                    status_code=400,
                    detail={
                        "error": "Failed to ingest uploaded PDF",
                        "filename": pdf_file.filename,
                        "message": str(e)
                    }
                )
        elif pdf_path:
            # Handle PDF from existing file path
            try:
                logger.info(f"Ingesting PDF from path: {pdf_path}")
                rag_instance.ingest_pdf(pdf_path)
                logger.info(f"Successfully ingested PDF: {pdf_path}")
            except Exception as e:
                logger.error(f"Failed to ingest PDF {pdf_path}: {e}")
                raise HTTPException(
                    status_code=400,
                    detail={
                        "error": "Failed to ingest PDF",
                        "pdf_path": pdf_path,
                        "message": str(e)
                    }
                )
        
        async def generate_response() -> AsyncIterator[str]:
            """Generate streaming RAG response chunks."""
            try:
                # Check if vectorstore is available and has documents
                if rag_instance.vectorstore is None or rag_instance.retriever is None:
                    logger.info("No documents available in ChromaDB, falling back to regular LLM response")
                    # Fall back to regular LLM response when no documents are available
                    async for chunk in rag_instance.answer(question):
                        yield f"data: {json.dumps({'content': chunk, 'context_used': False})}\n\n"
                else:
                    # Use RAG context-aware response
                    logger.info("Using RAG context-aware response with document context")
                    async for chunk in rag_instance.context_answer(question):
                        yield f"data: {json.dumps({'content': chunk, 'context_used': True})}\n\n"
                        
            except RuntimeError as e:
                # Handle specific RAG errors (no documents, model not loaded)
                logger.warning(f"RAG error, falling back to regular response: {e}")
                async for chunk in rag_instance.answer(question):
                    yield f"data: {json.dumps({'content': chunk, 'context_used': False})}\n\n"
            except Exception as e:
                logger.error(f"Error during RAG response generation: {e}")
                yield f"data: {json.dumps({'error': str(e)})}\n\n"
        
        return StreamingResponse(
            generate_response(),
            media_type="text/plain",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
            }
        )
        
    except Exception as e:
        logger.error(f"Failed to process RAG call: {e}")
        raise HTTPException(
            status_code=500,
            detail={
                "error": "Failed to process RAG call",
                "message": str(e)
            }
        )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "backend.main:app",
        host="0.0.0.0",
        port=8001,
        reload=True,
        log_level="info"
    )