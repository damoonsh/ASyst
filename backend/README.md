# Chat Data Modeling Backend

This is the FastAPI backend for the chat data modeling system. It provides a REST API for managing conversation threads, messages, and edit history.

## Setup

### Prerequisites

- Python 3.10+
- Podman (for PostgreSQL container)
- Required Python packages (see requirements.txt)

### Database Setup

1. Start PostgreSQL container:
   ```bash
   ./scripts/setup-postgres.sh
   ```

2. Initialize database schema and mock data:
   ```bash
   ./scripts/init-database.sh
   ```

### Running the Server

1. Test database connection:
   ```bash
   python3 backend/test_connection.py
   ```

2. Start the FastAPI server:
   ```bash
   python3 backend/run_server.py
   ```

The server will start on `http://localhost:8001`

### API Documentation

Once the server is running, you can access:

- **Swagger UI**: http://localhost:8001/docs
- **ReDoc**: http://localhost:8001/redoc
- **OpenAPI JSON**: http://localhost:8001/openapi.json

### Health Check

Test if the server and database are working:

```bash
curl http://localhost:8001/health
```

Expected response:
```json
{
  "status": "healthy",
  "database": "connected", 
  "message": "All systems operational"
}
```

## Database Schema

The system uses three main tables:

### threads
- `thread_id` (VARCHAR(255), PRIMARY KEY)
- `started_at` (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP)

### thread_titles  
- `thread_id` (VARCHAR(255), PRIMARY KEY, FOREIGN KEY to threads)
- `title` (VARCHAR(500))

### conversations
- `thread_id` (VARCHAR(255), FOREIGN KEY to threads)
- `message_id` (VARCHAR(255))
- `edit_id` (VARCHAR(255))
- `question` (TEXT)
- `answer` (TEXT)
- `created_at` (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP)
- `model` (VARCHAR(100))
- PRIMARY KEY: (thread_id, message_id, edit_id)

## Configuration

The database connection can be configured via environment variable:

```bash
export DATABASE_URL="postgresql://chatuser:chatpass@127.0.0.1:5432/chatdb"
```

Default connection string: `postgresql://chatuser:chatpass@127.0.0.1:5432/chatdb`

## Development

### Project Structure

```
backend/
├── __init__.py          # Package initialization
├── main.py              # FastAPI application and routes
├── models.py            # SQLAlchemy database models
├── database.py          # Database connection and session management
├── test_connection.py   # Database connection test script
├── run_server.py        # Server startup script
└── README.md           # This file
```

### Key Features

- **Connection Pooling**: Configured with QueuePool for optimal performance
- **Session Management**: Proper database session handling with dependency injection
- **Health Checks**: Built-in health check endpoint for monitoring
- **Auto-documentation**: Automatic API documentation with Swagger UI
- **Error Handling**: Comprehensive error handling and logging
- **Database Migrations**: Table creation and schema management

### Next Steps

This backend is ready for implementing the API endpoints defined in the tasks:

- Thread management endpoints (GET, POST, PUT)
- Conversation retrieval endpoints
- Message creation and editing endpoints
- UI-specific data formatting endpoints
- Error handling and validation