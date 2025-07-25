#!/usr/bin/env python3
"""
Test script for the conversation creation API endpoints.
"""

import sys
import os
sys.path.append(os.path.dirname(__file__))

from main import app
import json
try:
    from fastapi.testclient import TestClient
except ImportError:
    from starlette.testclient import TestClient

def test_endpoints():
    """Test the new conversation creation endpoints."""
    client = TestClient(app)
    
    print("Testing conversation creation API endpoints...")
    print("=" * 50)
    
    # Test 1: Create a new message in a new thread
    print("\n1. Testing POST /conversations/{thread_id} - Create new message")
    test_thread_id = "test-thread-123"
    create_message_payload = {
        "question": "What is the capital of France?",
        "answer": "The capital of France is Paris.",
        "model": "gpt-4"
    }
    
    try:
        response = client.post(f"/conversations/{test_thread_id}", json=create_message_payload)
        print(f"Status Code: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"Response: {json.dumps(data, indent=2)}")
            message_id = data.get("message_id")
            print(f"✅ Successfully created message with ID: {message_id}")
        else:
            print(f"❌ Failed: {response.text}")
    except Exception as e:
        print(f"❌ Error: {e}")
    
    # Test 2: Create an edit for the existing message
    if 'message_id' in locals():
        print(f"\n2. Testing POST /conversations/{message_id}/edits - Create edit")
        create_edit_payload = {
            "question": "What is the capital city of France?",
            "answer": "Paris is the capital and largest city of France.",
            "model": "gpt-4-turbo"
        }
        
        try:
            response = client.post(f"/conversations/{message_id}/edits", json=create_edit_payload)
            print(f"Status Code: {response.status_code}")
            if response.status_code == 200:
                data = response.json()
                print(f"Response: {json.dumps(data, indent=2)}")
                print(f"✅ Successfully created edit {data.get('edit_id')} for message {message_id}")
            else:
                print(f"❌ Failed: {response.text}")
        except Exception as e:
            print(f"❌ Error: {e}")
    
    # Test 3: Try to create edit for non-existent message
    print("\n3. Testing POST /conversations/non-existent/edits - Error handling")
    try:
        response = client.post("/conversations/non-existent-message/edits", json=create_edit_payload)
        print(f"Status Code: {response.status_code}")
        if response.status_code == 404:
            print("✅ Correctly returned 404 for non-existent message")
        else:
            print(f"❌ Unexpected status code: {response.status_code}")
        print(f"Response: {response.text}")
    except Exception as e:
        print(f"❌ Error: {e}")
    
    # Test 4: Test input validation
    print("\n4. Testing input validation - Empty question")
    invalid_payload = {
        "question": "",  # Empty question should fail validation
        "answer": "Some answer",
        "model": "gpt-4"
    }
    
    try:
        response = client.post(f"/conversations/test-validation/", json=invalid_payload)
        print(f"Status Code: {response.status_code}")
        if response.status_code == 422:
            print("✅ Correctly returned 422 for validation error")
        else:
            print(f"❌ Unexpected status code: {response.status_code}")
        print(f"Response: {response.text}")
    except Exception as e:
        print(f"❌ Error: {e}")
    
    print("\n" + "=" * 50)
    print("Endpoint testing completed!")

if __name__ == "__main__":
    test_endpoints()