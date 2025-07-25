#!/usr/bin/env python3
"""
Test script for the conversation retrieval API endpoint.
Tests the GET /conversations/{thread_id} endpoint functionality.
"""

import requests
import json
import sys
import os
from datetime import datetime

# Add the backend directory to the Python path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import get_db_session
from models import Thread

def test_conversation_api():
    """Test the conversation retrieval API endpoint"""
    
    base_url = "http://127.0.0.1:8001"
    
    print("=== Testing Conversation Retrieval API ===\n")
    
    # First, get a thread ID from the database
    db = get_db_session()
    try:
        threads = db.query(Thread).limit(5).all()
        if not threads:
            print("❌ No threads found in database. Run add_test_data.py first.")
            return False
        
        print(f"Found {len(threads)} threads in database")
        
        # Test with the first thread that has conversation data
        test_thread_id = threads[0].thread_id
        print(f"Testing with thread ID: {test_thread_id}")
        
    finally:
        db.close()
    
    # Test 1: Valid thread ID
    print(f"\n1. Testing GET /conversations/{test_thread_id}")
    try:
        response = requests.get(f"{base_url}/conversations/{test_thread_id}")
        
        if response.status_code == 200:
            data = response.json()
            print("✓ Request successful")
            print(f"✓ Thread ID: {data['thread_id']}")
            print(f"✓ Title: {data['title']}")
            print(f"✓ Started at: {data['started_at']}")
            print(f"✓ Total messages: {data['total_messages']}")
            print(f"✓ Total edits: {data['total_edits']}")
            
            # Verify message structure
            if data['messages']:
                print("\n✓ Message structure verification:")
                for i, message in enumerate(data['messages'][:2]):  # Show first 2 messages
                    print(f"  Message {i+1}:")
                    print(f"    - Message ID: {message['message_id']}")
                    print(f"    - Number of edits: {len(message['edits'])}")
                    
                    for j, edit in enumerate(message['edits']):
                        print(f"    - Edit {j+1}:")
                        print(f"      - Edit ID: {edit['edit_id']}")
                        print(f"      - Model: {edit['model']}")
                        print(f"      - Created at: {edit['created_at']}")
                        print(f"      - Question: {edit['question'][:50]}...")
                        print(f"      - Answer: {edit['answer'][:50]}...")
            else:
                print("⚠️  No messages found in conversation")
            
        else:
            print(f"❌ Request failed with status {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except requests.exceptions.ConnectionError:
        print("❌ Connection failed. Make sure the FastAPI server is running:")
        print("   python backend/run_server.py")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False
    
    # Test 2: Invalid thread ID (should return 404)
    print(f"\n2. Testing with invalid thread ID")
    try:
        invalid_thread_id = "invalid-thread-id-12345"
        response = requests.get(f"{base_url}/conversations/{invalid_thread_id}")
        
        if response.status_code == 404:
            print("✓ Correctly returned 404 for invalid thread ID")
            error_data = response.json()
            print(f"✓ Error message: {error_data['detail']['error']}")
        else:
            print(f"❌ Expected 404, got {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Error testing invalid thread ID: {e}")
        return False
    
    # Test 3: Test with thread that has no conversations
    print(f"\n3. Testing with thread that has no conversations")
    try:
        # Use the last thread which likely has no conversation data
        empty_thread_id = threads[-1].thread_id if len(threads) > 1 else test_thread_id
        response = requests.get(f"{base_url}/conversations/{empty_thread_id}")
        
        if response.status_code == 200:
            data = response.json()
            print("✓ Request successful for thread with no conversations")
            print(f"✓ Total messages: {data['total_messages']}")
            print(f"✓ Total edits: {data['total_edits']}")
            
            if data['total_messages'] == 0:
                print("✓ Correctly returned empty conversation list")
            
        else:
            print(f"❌ Request failed with status {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Error testing empty conversation: {e}")
        return False
    
    print("\n✅ All conversation API tests passed!")
    return True

def test_json_format():
    """Test that the JSON response format matches frontend expectations"""
    
    print("\n=== Testing JSON Response Format ===")
    
    base_url = "http://127.0.0.1:8001"
    
    # Get a thread with data
    db = get_db_session()
    try:
        thread = db.query(Thread).first()
        if not thread:
            print("❌ No threads found")
            return False
        thread_id = thread.thread_id
    finally:
        db.close()
    
    try:
        response = requests.get(f"{base_url}/conversations/{thread_id}")
        if response.status_code != 200:
            print(f"❌ API request failed: {response.status_code}")
            return False
        
        data = response.json()
        
        # Verify required top-level fields
        required_fields = ['thread_id', 'title', 'started_at', 'messages', 'total_messages', 'total_edits']
        for field in required_fields:
            if field not in data:
                print(f"❌ Missing required field: {field}")
                return False
        
        print("✓ All required top-level fields present")
        
        # Verify message structure
        if data['messages']:
            message = data['messages'][0]
            required_message_fields = ['message_id', 'edits']
            for field in required_message_fields:
                if field not in message:
                    print(f"❌ Missing required message field: {field}")
                    return False
            
            # Verify edit structure
            if message['edits']:
                edit = message['edits'][0]
                required_edit_fields = ['edit_id', 'question', 'answer', 'created_at', 'model']
                for field in required_edit_fields:
                    if field not in edit:
                        print(f"❌ Missing required edit field: {field}")
                        return False
                
                print("✓ All required edit fields present")
            
            print("✓ All required message fields present")
        
        # Verify data types
        assert isinstance(data['thread_id'], str), "thread_id should be string"
        assert isinstance(data['title'], str), "title should be string"
        assert isinstance(data['started_at'], str), "started_at should be ISO string"
        assert isinstance(data['messages'], list), "messages should be list"
        assert isinstance(data['total_messages'], int), "total_messages should be int"
        assert isinstance(data['total_edits'], int), "total_edits should be int"
        
        print("✓ All data types correct")
        print("✅ JSON format validation passed!")
        
        return True
        
    except Exception as e:
        print(f"❌ JSON format test failed: {e}")
        return False

if __name__ == "__main__":
    print("Starting conversation API tests...")
    print("Make sure the FastAPI server is running: python backend/run_server.py\n")
    
    success = test_conversation_api()
    if success:
        success = test_json_format()
    
    if success:
        print("\n🎉 All tests passed! The conversation retrieval API is working correctly.")
    else:
        print("\n❌ Some tests failed. Check the output above for details.")
        sys.exit(1)