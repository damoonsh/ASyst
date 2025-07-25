#!/usr/bin/env python3
"""
Test script for the thread titles API endpoint.
Run this after starting the FastAPI server to test the /threads/titles endpoint.
"""

import requests
import json
from datetime import datetime

def test_thread_titles_endpoint():
    """Test the GET /threads/titles endpoint"""
    base_url = "http://localhost:8001"
    
    print("Testing /threads/titles endpoint...")
    
    try:
        # Test the endpoint
        response = requests.get(f"{base_url}/threads/titles")
        
        print(f"Status Code: {response.status_code}")
        print(f"Response Headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Success! Retrieved {len(data)} thread titles")
            print("Response structure:")
            print(json.dumps(data, indent=2))
            
            # Validate response structure
            if isinstance(data, list):
                print("✓ Response is a list")
                
                for i, thread in enumerate(data):
                    if isinstance(thread, dict):
                        required_fields = ["thread_id", "title", "started_at"]
                        missing_fields = [field for field in required_fields if field not in thread]
                        
                        if not missing_fields:
                            print(f"✓ Thread {i+1} has all required fields")
                            
                            # Validate started_at is a valid ISO timestamp
                            try:
                                datetime.fromisoformat(thread["started_at"].replace('Z', '+00:00'))
                                print(f"✓ Thread {i+1} has valid timestamp")
                            except ValueError:
                                print(f"✗ Thread {i+1} has invalid timestamp format")
                        else:
                            print(f"✗ Thread {i+1} missing fields: {missing_fields}")
                    else:
                        print(f"✗ Thread {i+1} is not a dictionary")
            else:
                print("✗ Response is not a list")
                
        else:
            print(f"Error: {response.status_code}")
            print(f"Response: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("Error: Could not connect to server. Make sure FastAPI server is running on localhost:8001")
    except Exception as e:
        print(f"Error: {e}")

def test_health_endpoint():
    """Test the health endpoint to ensure server is running"""
    base_url = "http://localhost:8001"
    
    try:
        response = requests.get(f"{base_url}/health")
        if response.status_code == 200:
            print("✓ Server is healthy and database is connected")
            return True
        else:
            print(f"✗ Health check failed: {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print("✗ Cannot connect to server")
        return False

if __name__ == "__main__":
    print("=== Thread Titles API Test ===")
    
    # First check if server is running
    if test_health_endpoint():
        print()
        test_thread_titles_endpoint()
    else:
        print("Please start the FastAPI server first:")
        print("python backend/run_server.py")