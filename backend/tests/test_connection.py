#!/usr/bin/env python3
"""
Test script to verify database connection and table creation.
Run this script to test the database setup.
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.database import get_db_session, create_tables, engine
from backend.models import Thread, ThreadTitle, Conversation
from sqlalchemy import text


def test_database_connection():
    """Test basic database connectivity."""
    print("Testing database connection...")
    
    try:
        # Test engine connection
        with engine.connect() as conn:
            result = conn.execute(text("SELECT version()"))
            version = result.fetchone()[0]
            print(f"✓ Connected to PostgreSQL: {version}")
        
        # Test session creation
        db = get_db_session()
        try:
            result = db.execute(text("SELECT current_database()"))
            db_name = result.fetchone()[0]
            print(f"✓ Using database: {db_name}")
        finally:
            db.close()
        
        return True
    except Exception as e:
        print(f"✗ Database connection failed: {e}")
        return False


def test_table_creation():
    """Test table creation and schema verification."""
    print("\nTesting table creation...")
    
    try:
        create_tables()
        print("✓ Tables created successfully")
        
        # Verify tables exist
        db = get_db_session()
        try:
            # Check if tables exist
            tables = ['threads', 'thread_titles', 'conversations']
            for table in tables:
                result = db.execute(text(f"""
                    SELECT EXISTS (
                        SELECT FROM information_schema.tables 
                        WHERE table_name = '{table}'
                    )
                """))
                exists = result.fetchone()[0]
                if exists:
                    print(f"✓ Table '{table}' exists")
                else:
                    print(f"✗ Table '{table}' missing")
                    return False
        finally:
            db.close()
        
        return True
    except Exception as e:
        print(f"✗ Table creation failed: {e}")
        return False


def main():
    """Run all tests."""
    print("=== Database Connection Test ===")
    
    connection_ok = test_database_connection()
    if not connection_ok:
        print("\nDatabase connection failed. Please check:")
        print("1. PostgreSQL is running")
        print("2. Database credentials are correct")
        print("3. Database 'chatdb' exists")
        sys.exit(1)
    
    tables_ok = test_table_creation()
    if not tables_ok:
        print("\nTable creation failed.")
        sys.exit(1)
    
    print("\n=== All tests passed! ===")
    print("FastAPI server with database connection is ready to use.")


if __name__ == "__main__":
    main()