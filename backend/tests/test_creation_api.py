#!/usr/bin/env python3
"""
Simple test script for the conversation creation API endpoints.
"""

import requests
import json
import time
import subprocess
import sys
import os
from threading import Thread

def start_server():
    """Start the FastAPI server in the background."""
    os.chdir('backend')
    subprocess.run([sys.executable, 'main.py'], check=False)

def test_api():
    """Test the API endpoints."""
    base_url = "http://localhost:8001"
    
    # Wait for server to start
    print("Waiting for server to start...")
    for i in range(10):
        try:
            response = requests.get(f"{base_url}/health", timeout=2)
            if response.status_code == 200:
                print("✅ Server is running!")
                break
        except:
            time.sleep(1)
    else:
        print("❌ Server failed to start")
        return
    
    print("\nTesting conversation creation API endpoints...")
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
        response = requests.post(f"{base_url}/conversations/{test_thread_id}", 
                               json=create_message_payload, timeout=10)
        print(f"Status Code: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"Response: {json.dumps(data, indent=2)}")
            message_id = data.get("message_id")
            print(f"✅ Successfully created message with ID: {message_id}")
        else:
            print(f"❌ Failed: {response.text}")
            return
    except Exception as e:
        print(f"❌ Error: {e}")
        return
    
    # Test 2: Create an edit for the existing message
    if message_id:
        print(f"\n2. Testing POST /conversations/{message_id}/edits - Create edit")
        create_edit_payload = {
            "question": "What is the capital city of France?",
            "answer": "Paris is the capital and largest city of France.",
            "model": "gpt-4-turbo"
        }
        
        try:
            response = requests.post(f"{base_url}/conversations/{message_id}/edits", 
                                   json=create_edit_payload, timeout=10)
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
        response = requests.post(f"{base_url}/conversations/non-existent-message/edits", 
                               json=create_edit_payload, timeout=10)
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
        response = requests.post(f"{base_url}/conversations/test-validation", 
                               json=invalid_payload, timeout=10)
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
    # Start server in background thread
    server_thread = Thread(target=start_server, daemon=True)
    server_thread.start()
    
    # Wait a bit then test
    time.sleep(3)
    test_api()