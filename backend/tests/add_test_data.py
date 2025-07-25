#!/usr/bin/env python3
"""
Script to add test data for testing the thread titles API.
This creates sample threads and titles to verify the endpoint works correctly.
"""

import sys
import os
from datetime import datetime, timedelta
import uuid

# Add the backend directory to the Python path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import get_db_session, create_tables
from models import Thread, ThreadTitle, Conversation

def create_test_data():
    """Create test threads and titles for API testing"""
    
    # Ensure tables exist
    create_tables()
    
    db = get_db_session()
    
    try:
        # Clear existing test data (optional)
        print("Clearing existing data...")
        db.query(Conversation).delete()
        db.query(ThreadTitle).delete()
        db.query(Thread).delete()
        db.commit()
        
        # Create test threads with titles
        test_data = [
            {
                "thread_id": str(uuid.uuid4()),
                "title": "Python FastAPI Development",
                "started_at": datetime.now() - timedelta(days=2)
            },
            {
                "thread_id": str(uuid.uuid4()),
                "title": "Database Schema Design",
                "started_at": datetime.now() - timedelta(days=1)
            },
            {
                "thread_id": str(uuid.uuid4()),
                "title": "React Frontend Integration",
                "started_at": datetime.now() - timedelta(hours=5)
            },
            {
                "thread_id": str(uuid.uuid4()),
                "title": "API Testing and Documentation",
                "started_at": datetime.now() - timedelta(hours=1)
            }
        ]
        
        print("Creating test threads and titles...")
        
        for data in test_data:
            # Create thread
            thread = Thread(
                thread_id=data["thread_id"],
                started_at=data["started_at"]
            )
            db.add(thread)
            
            # Create thread title
            title = ThreadTitle(
                thread_id=data["thread_id"],
                title=data["title"]
            )
            db.add(title)
            
            print(f"Created thread: {data['thread_id'][:8]}... - {data['title']}")
        
        # Create one thread without a title to test the default title logic
        thread_without_title = Thread(
            thread_id=str(uuid.uuid4()),
            started_at=datetime.now() - timedelta(minutes=30)
        )
        db.add(thread_without_title)
        print(f"Created thread without title: {thread_without_title.thread_id[:8]}...")
        
        # Create sample conversation data for the first thread
        first_thread_id = test_data[0]["thread_id"]
        print(f"\nCreating sample conversations for thread {first_thread_id[:8]}...")
        
        # Message 1 with multiple edits
        message_1_id = str(uuid.uuid4())
        conversations_data = [
            # First message, first edit
            {
                "thread_id": first_thread_id,
                "message_id": message_1_id,
                "edit_id": "edit_1",
                "question": "How do I set up a FastAPI server?",
                "answer": "To set up a FastAPI server, you need to install FastAPI and uvicorn, then create a basic app.",
                "created_at": test_data[0]["started_at"] + timedelta(minutes=1),
                "model": "gpt-4"
            },
            # First message, second edit (user refined the question)
            {
                "thread_id": first_thread_id,
                "message_id": message_1_id,
                "edit_id": "edit_2",
                "question": "How do I set up a FastAPI server with database integration?",
                "answer": "To set up a FastAPI server with database integration, you'll need FastAPI, uvicorn, SQLAlchemy, and a database driver. Here's a complete setup...",
                "created_at": test_data[0]["started_at"] + timedelta(minutes=5),
                "model": "gpt-4"
            }
        ]
        
        # Message 2 with single edit
        message_2_id = str(uuid.uuid4())
        conversations_data.append({
            "thread_id": first_thread_id,
            "message_id": message_2_id,
            "edit_id": "edit_1",
            "question": "What are the best practices for API error handling?",
            "answer": "Best practices for API error handling include: 1) Use appropriate HTTP status codes, 2) Provide clear error messages, 3) Include error codes for programmatic handling...",
            "created_at": test_data[0]["started_at"] + timedelta(minutes=10),
            "model": "gpt-4"
        })
        
        # Message 3 with multiple edits (different models)
        message_3_id = str(uuid.uuid4())
        conversations_data.extend([
            {
                "thread_id": first_thread_id,
                "message_id": message_3_id,
                "edit_id": "edit_1",
                "question": "How to implement authentication?",
                "answer": "For authentication, you can use JWT tokens with FastAPI's security utilities.",
                "created_at": test_data[0]["started_at"] + timedelta(minutes=15),
                "model": "gpt-3.5-turbo"
            },
            {
                "thread_id": first_thread_id,
                "message_id": message_3_id,
                "edit_id": "edit_2",
                "question": "How to implement JWT authentication in FastAPI?",
                "answer": "To implement JWT authentication in FastAPI: 1) Install python-jose and passlib, 2) Create token generation functions, 3) Use FastAPI's Depends for route protection...",
                "created_at": test_data[0]["started_at"] + timedelta(minutes=20),
                "model": "gpt-4"
            }
        ])
        
        # Add conversations to database
        for conv_data in conversations_data:
            conversation = Conversation(**conv_data)
            db.add(conversation)
        
        print(f"Created {len(conversations_data)} conversation entries")
        
        db.commit()
        print(f"\n✓ Successfully created {len(test_data) + 1} test threads with sample conversations")
        
        # Verify the data was created
        threads = db.query(Thread).count()
        titles = db.query(ThreadTitle).count()
        print(f"✓ Database now contains {threads} threads and {titles} titles")
        
    except Exception as e:
        print(f"Error creating test data: {e}")
        db.rollback()
        return False
    finally:
        db.close()
    
    return True

if __name__ == "__main__":
    print("=== Creating Test Data for Thread Titles API ===")
    
    if create_test_data():
        print("\nTest data created successfully!")
        print("You can now test the API endpoints:")
        print("python backend/tests/test_thread_titles_api.py")
        print("python backend/tests/test_conversation_api.py")
    else:
        print("\nFailed to create test data")
        sys.exit(1)