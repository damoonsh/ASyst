#!/usr/bin/env python3
"""
Test script for the message edit retrieval API endpoint.
Tests the GET /conversations/{thread_id}/{message_id} endpoint functionality.
"""

import requests
import json
import sys
import os
from datetime import datetime

# Add the backend directory to the Python path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import get_db_session
from models import Thread, Conversation

def test_message_edits_api():
    """Test the message edit retrieval API endpoint"""
    
    base_url = "http://127.0.0.1:8001"
    
    print("=== Testing Message Edit Retrieval API ===\n")
    
    # First, get a thread ID and message ID from the database
    db = get_db_session()
    try:
        # Find a conversation with multiple edits if possible
        conversation = db.query(Conversation).first()
        if not conversation:
            print("❌ No conversations found in database. Run add_test_data.py first.")
            return False
        
        test_thread_id = conversation.thread_id
        test_message_id = conversation.message_id
        
        print(f"Testing with thread ID: {test_thread_id}")
        print(f"Testing with message ID: {test_message_id}")
        
        # Count total edits for this message
        total_edits = db.query(Conversation).filter(
            Conversation.thread_id == test_thread_id,
            Conversation.message_id == test_message_id
        ).count()
        
        print(f"Expected total edits: {total_edits}")
        
    finally:
        db.close()
    
    # Test 1: Valid thread ID and message ID
    print(f"\n1. Testing GET /conversations/{test_thread_id}/{test_message_id}")
    try:
        response = requests.get(f"{base_url}/conversations/{test_thread_id}/{test_message_id}")
        
        if response.status_code == 200:
            data = response.json()
            print("✓ Request successful")
            print(f"✓ Thread ID: {data['thread_id']}")
            print(f"✓ Message ID: {data['message_id']}")
            print(f"✓ Thread title: {data['thread_title']}")
            print(f"✓ Total edits: {data['total_edits']}")
            
            # Verify edit structure
            if data['edits']:
                print("\n✓ Edit structure verification:")
                for i, edit in enumerate(data['edits']):
                    print(f"  Edit {i+1}:")
                    print(f"    - Edit ID: {edit['edit_id']}")
                    print(f"    - Edit number: {edit['edit_number']}")
                    print(f"    - Model: {edit['model']}")
                    print(f"    - Created at: {edit['created_at']}")
                    print(f"    - Timestamp: {edit['timestamp']}")
                    print(f"    - Question: {edit['question'][:50]}...")
                    print(f"    - Answer: {edit['answer'][:50]}...")
                
                # Verify edit numbers are sequential
                edit_numbers = [edit['edit_number'] for edit in data['edits']]
                expected_numbers = list(range(1, len(data['edits']) + 1))
                if edit_numbers == expected_numbers:
                    print("✓ Edit numbers are sequential starting from 1")
                else:
                    print(f"❌ Edit numbers not sequential. Got: {edit_numbers}, Expected: {expected_numbers}")
                    return False
                
                # Verify latest_edit and first_edit
                if data['latest_edit']:
                    print(f"✓ Latest edit: Edit {data['latest_edit']['edit_number']} from {data['latest_edit']['created_at']}")
                if data['first_edit']:
                    print(f"✓ First edit: Edit {data['first_edit']['edit_number']} from {data['first_edit']['created_at']}")
                
            else:
                print("⚠️  No edits found for message")
            
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
        response = requests.get(f"{base_url}/conversations/{invalid_thread_id}/{test_message_id}")
        
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
    
    # Test 3: Invalid message ID (should return 404)
    print(f"\n3. Testing with invalid message ID")
    try:
        invalid_message_id = "invalid-message-id-12345"
        response = requests.get(f"{base_url}/conversations/{test_thread_id}/{invalid_message_id}")
        
        if response.status_code == 404:
            print("✓ Correctly returned 404 for invalid message ID")
            error_data = response.json()
            print(f"✓ Error message: {error_data['detail']['error']}")
        else:
            print(f"❌ Expected 404, got {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Error testing invalid message ID: {e}")
        return False
    
    print("\n✅ All message edit API tests passed!")
    return True

def test_json_format():
    """Test that the JSON response format matches frontend expectations"""
    
    print("\n=== Testing JSON Response Format ===")
    
    base_url = "http://127.0.0.1:8001"
    
    # Get a conversation with data
    db = get_db_session()
    try:
        conversation = db.query(Conversation).first()
        if not conversation:
            print("❌ No conversations found")
            return False
        thread_id = conversation.thread_id
        message_id = conversation.message_id
    finally:
        db.close()
    
    try:
        response = requests.get(f"{base_url}/conversations/{thread_id}/{message_id}")
        if response.status_code != 200:
            print(f"❌ API request failed: {response.status_code}")
            return False
        
        data = response.json()
        
        # Verify required top-level fields
        required_fields = ['thread_id', 'message_id', 'thread_title', 'total_edits', 'edits', 'latest_edit', 'first_edit']
        for field in required_fields:
            if field not in data:
                print(f"❌ Missing required field: {field}")
                return False
        
        print("✓ All required top-level fields present")
        
        # Verify edit structure
        if data['edits']:
            edit = data['edits'][0]
            required_edit_fields = ['edit_id', 'edit_number', 'question', 'answer', 'created_at', 'model', 'timestamp']
            for field in required_edit_fields:
                if field not in edit:
                    print(f"❌ Missing required edit field: {field}")
                    return False
            
            print("✓ All required edit fields present")
        
        # Verify data types
        assert isinstance(data['thread_id'], str), "thread_id should be string"
        assert isinstance(data['message_id'], str), "message_id should be string"
        assert isinstance(data['thread_title'], str), "thread_title should be string"
        assert isinstance(data['total_edits'], int), "total_edits should be int"
        assert isinstance(data['edits'], list), "edits should be list"
        
        if data['edits']:
            edit = data['edits'][0]
            assert isinstance(edit['edit_number'], int), "edit_number should be int"
            assert isinstance(edit['question'], str), "question should be string"
            assert isinstance(edit['answer'], str), "answer should be string"
            assert isinstance(edit['created_at'], str), "created_at should be ISO string"
            assert isinstance(edit['model'], str), "model should be string"
            assert isinstance(edit['timestamp'], str), "timestamp should be ISO string"
        
        print("✓ All data types correct")
        print("✅ JSON format validation passed!")
        
        return True
        
    except Exception as e:
        print(f"❌ JSON format test failed: {e}")
        return False

if __name__ == "__main__":
    print("Starting message edit API tests...")
    print("Make sure the FastAPI server is running: python backend/run_server.py\n")
    
    success = test_message_edits_api()
    if success:
        success = test_json_format()
    
    if success:
        print("\n🎉 All tests passed! The message edit retrieval API is working correctly.")
    else:
        print("\n❌ Some tests failed. Check the output above for details.")
        sys.exit(1)