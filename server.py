from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import os
import asyncio
from typing import List
from rag import RAG  # Assuming the RAG class is in a file named rag.py

app = FastAPI(title="RAG PDF Question Answering API")

# Available LLM models
AVAILABLE_LLM_MODELS = [
    "tinyllama:latest",
    "qwen3:0.6b",
    "qwen3:0.6b",
    "smollm2:360m",
]

# Initialize RAG instance
rag = RAG()

class QueryRequest(BaseModel):
    question: str
    model_name: str

class ModelLoadRequest(BaseModel):
    model_name: str

@app.post("/upload_pdf")
async def upload_pdf(file: UploadFile = File(...)):
    """Upload and ingest a PDF file for context."""
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")
    
    # Save uploaded file temporarily
    temp_file_path = f"temp_{file.filename}"
    try:
        with open(temp_file_path, "wb") as temp_file:
            content = await file.read()
            temp_file.write(content)
        
        # Ingest PDF
        rag.ingest_pdf(temp_file_path)
        return {"message": f"Successfully ingested {file.filename}"}
    finally:
        # Clean up temporary file
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)

@app.post("/load_model")
async def load_model(request: ModelLoadRequest):
    """Load a specific LLM model."""
    if request.model_name not in AVAILABLE_LLM_MODELS:
        raise HTTPException(status_code=400, detail=f"Model must be one of {AVAILABLE_LLM_MODELS}")
    
    try:
        rag.load_model(request.model_name)
        return {"message": f"Successfully loaded model {request.model_name}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error loading model: {str(e)}")

@app.post("/query")
async def query(request: QueryRequest):
    """Answer a question using the loaded model and ingested context."""
    if request.model_name not in AVAILABLE_LLM_MODELS:
        raise HTTPException(status_code=400, detail=f"Model must be one of {AVAILABLE_LLM_MODELS}")
    
    async def stream_response():
        try:
            async for chunk in rag.context_answer(request.question):
                yield chunk + "\n"
        except Exception as e:
            yield f"Error: {str(e)}\n"
    
    return StreamingResponse(stream_response(), media_type="text/plain")

@app.post("/query_without_context")
async def query_without_context(request: QueryRequest):
    """Answer a question using the loaded model without context."""
    if request.model_name not in AVAILABLE_LLM_MODELS:
        raise HTTPException(status_code=400, detail=f"Model must be one of {AVAILABLE_LLM_MODELS}")
    
    async def stream_response():
        try:
            # Load model if not already loaded
            if rag.llm is None or rag.llm.model != request.model_name:
                rag.load_model(request.model_name)
            
            async for chunk in rag.answer(request.question):
                yield chunk + "\n"
        except Exception as e:
            yield f"Error: {str(e)}\n"
    
    return StreamingResponse(stream_response(), media_type="text/plain")

@app.get("/available_models")
async def get_available_models():
    """Return list of available LLM models."""
    return {"models": AVAILABLE_LLM_MODELS}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)