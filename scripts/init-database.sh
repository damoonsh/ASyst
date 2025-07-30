#!/bin/bash

# Database Initialization Script
# This script connects to PostgreSQL using Podman and creates the required tables
# for the chat data modeling system

set -e  # Exit on any error

# Configuration variables (should match setup-postgres.sh)
CONTAINER_NAME="chat-postgres"
POSTGRES_DB="chatdb"
POSTGRES_USER="chatuser"

echo "Initializing chat database schema..."

# Check if Podman is installed
if ! command -v podman &> /dev/null; then
    echo "Error: Podman is not installed. Please install Podman first."
    exit 1
fi

# Check if PostgreSQL container is running
if ! podman ps --format "{{.Names}}" | grep -q "^${CONTAINER_NAME}$"; then
    echo "Error: PostgreSQL container '${CONTAINER_NAME}' is not running."
    echo "Please run setup-postgres.sh first to start the PostgreSQL container."
    exit 1
fi

# Test database connection
echo "Testing database connection..."
if ! podman exec ${CONTAINER_NAME} pg_isready -U ${POSTGRES_USER} -d ${POSTGRES_DB} > /dev/null 2>&1; then
    echo "Error: Cannot connect to PostgreSQL database."
    echo "Please ensure the PostgreSQL container is running and healthy."
    exit 1
fi

echo "Database connection successful. Creating tables..."

# Create the database schema using SQL DDL commands
podman exec -i ${CONTAINER_NAME} psql -U ${POSTGRES_USER} -d ${POSTGRES_DB} << 'EOF'
-- Chat Data Modeling Database Schema
-- This script creates the tables for threads, thread titles, and conversations

BEGIN;

-- Drop tables if they exist (for clean re-initialization)
DROP TABLE IF EXISTS conversations CASCADE;
DROP TABLE IF EXISTS thread_titles CASCADE;
DROP TABLE IF EXISTS threads CASCADE;

-- Create threads table
-- Stores the main conversation threads with basic metadata
CREATE TABLE threads (
    thread_id VARCHAR(255) PRIMARY KEY,
    started_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create index for threads table
CREATE INDEX idx_threads_started_at ON threads(started_at);

-- Create thread_titles table
-- Stores the current title for each thread (can be updated)
CREATE TABLE thread_titles (
    thread_id VARCHAR(255) PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    CONSTRAINT fk_thread_titles_thread_id 
        FOREIGN KEY (thread_id) 
        REFERENCES threads(thread_id) 
        ON DELETE CASCADE
);

-- Create conversations table
-- Stores all message edits with questions and answers
-- Multiple edits for the same message share thread_id and message_id but have different edit_ids
CREATE TABLE conversations (
    thread_id VARCHAR(255) NOT NULL,
    message_id VARCHAR(255) NOT NULL,
    edit_id VARCHAR(255) NOT NULL,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    model VARCHAR(100) NOT NULL,
    PRIMARY KEY (thread_id, message_id, edit_id),
    CONSTRAINT fk_conversations_thread_id 
        FOREIGN KEY (thread_id) 
        REFERENCES threads(thread_id) 
        ON DELETE CASCADE
);

-- Create indexes for conversations table
CREATE INDEX idx_conversations_thread_id ON conversations(thread_id);
CREATE INDEX idx_conversations_message_id ON conversations(thread_id, message_id);
CREATE INDEX idx_conversations_created_at ON conversations(created_at);
CREATE INDEX idx_conversations_model ON conversations(model);

-- Verify table creation
\dt

-- Display table information
\d threads
\d thread_titles
\d conversations

COMMIT;

-- Display success message
SELECT 'Database schema created successfully!' as status;

-- Insert mock data for testing and development
INSERT INTO threads (thread_id, started_at) VALUES
    ('thread-001', '2024-01-15 10:30:00'),
    ('thread-002', '2024-01-16 14:20:00'),
    ('thread-003', '2024-01-17 09:15:00');

-- Insert thread titles
INSERT INTO thread_titles (thread_id, title) VALUES
    ('thread-001', 'Creative Writing & Storytelling'),
    ('thread-002', 'Home Cooking & Recipe Ideas'),
    ('thread-003', 'Travel Planning & Photography');

-- Insert conversations with multiple edits per message
-- Thread 1: Creative Writing & Storytelling
INSERT INTO conversations (thread_id, message_id, edit_id, question, answer, created_at, model) VALUES
    ('thread-001', 'msg-001', 'edit-001', 
     'How do I develop compelling characters?', 
     '<think> The user is asking about character development, which is a fundamental aspect of creative writing. I should provide practical, actionable advice that covers the key elements of compelling characters. Let me think about what makes characters memorable and engaging - they need depth, motivation, flaws, and growth potential. </think>Create characters with clear motivations, flaws, and backstories. Give them unique voices and conflicting desires to drive the plot forward.', 
     '2024-01-15 10:31:00', 'qwen2.5-coder:0.5b'),
    ('thread-001', 'msg-001', 'edit-002', 
     'How do I develop compelling characters with depth and authenticity?', 
     'Character development tips: 1) Create detailed backstories that inform their actions, 2) Give them contradictory traits (brave but insecure), 3) Establish clear goals and obstacles, 4) Use dialogue to reveal personality, 5) Show character growth through conflict, 6) Base traits on real people you know, 7) Give them unique speech patterns and mannerisms.', 
     '2024-01-15 10:32:30', 'tinyllama:latest'),
    ('thread-001', 'msg-002', 'edit-001', 
     'What about plot structure?', 
     '<think> Now they''re asking about plot structure, which is another crucial element of storytelling. I should explain the most common and effective structure - the three-act structure - in a clear and concise way that they can immediately apply to their writing. </think>Use the three-act structure: Setup (introduce characters and conflict), Confrontation (rising action and obstacles), Resolution (climax and conclusion).', 
     '2024-01-15 10:35:00', 'qwen3:0.6b'),
    ('thread-001', 'msg-002', 'edit-002', 
     'What are different plot structures I can use?', 
     'Popular plot structures: 1) Three-Act Structure (setup, confrontation, resolution), 2) Hero''s Journey (call to adventure, trials, return), 3) Freytag''s Pyramid (exposition, rising action, climax, falling action, denouement), 4) Save the Cat (15 beats), 5) Seven-Point Story Structure (hook, plot turn 1, pinch point 1, midpoint, pinch point 2, plot turn 2, resolution).', 
     '2024-01-15 10:36:15', 'smollm2:360m');

-- Thread 2: Home Cooking & Recipe Ideas
INSERT INTO conversations (thread_id, message_id, edit_id, question, answer, created_at, model) VALUES
    ('thread-002', 'msg-001', 'edit-001', 
     'What are some quick weeknight dinner ideas?', 
     'Try stir-fries, pasta dishes, sheet pan meals, or grain bowls. These can be prepared in 30 minutes or less with minimal cleanup.', 
     '2024-01-16 14:21:00', 'tinyllama:latest'),
    ('thread-002', 'msg-001', 'edit-002', 
     'What are some quick weeknight dinner ideas that are healthy and budget-friendly?', 
     '<think> This is a great question about practical cooking. They want meals that are quick (for busy weeknights), healthy (nutritious), and budget-friendly (affordable). I should provide a variety of options that meet all three criteria, and maybe add a practical tip about meal prep to make weeknight cooking even easier. </think>Quick healthy dinners: 1) Vegetable stir-fry with tofu and brown rice, 2) Sheet pan chicken with roasted vegetables, 3) Lentil curry with naan, 4) Pasta with seasonal vegetables and olive oil, 5) Black bean quesadillas with avocado, 6) Egg fried rice with frozen vegetables, 7) Chickpea and spinach curry. Prep ingredients on weekends to save time.', 
     '2024-01-16 14:23:45', 'qwen2.5-coder:0.5b'),
    ('thread-002', 'msg-002', 'edit-001', 
     'How do I improve my knife skills?', 
     'Practice proper grip, keep knives sharp, learn basic cuts (julienne, dice, chiffonade), and focus on consistent sizes for even cooking.', 
     '2024-01-16 14:25:00', 'smollm2:360m'),
    ('thread-002', 'msg-003', 'edit-001', 
     'What spices should every kitchen have?', 
     '<think> This is about building a basic spice collection. I should focus on versatile spices that appear in many different cuisines and cooking styles. Salt and pepper are obvious, but I should include spices that can transform simple ingredients into flavorful dishes across various cooking traditions. </think>Essential spices: salt, black pepper, garlic powder, paprika, cumin, oregano, thyme, and red pepper flakes. These cover most cuisines.', 
     '2024-01-16 14:27:30', 'qwen3:0.6b');

-- Thread 3: Travel Planning & Photography
INSERT INTO conversations (thread_id, message_id, edit_id, question, answer, created_at, model) VALUES
    ('thread-003', 'msg-001', 'edit-001', 
     'How do I plan a budget-friendly trip?', 
     '<think> Budget travel is a popular topic and there are many strategies to save money while traveling. I should cover the main expense categories: transportation, accommodation, food, and activities. Let me provide practical tips that can significantly reduce costs without sacrificing the travel experience. </think>Book flights early, stay in hostels or Airbnb, eat local street food, use public transport, and look for free activities like hiking or museums.', 
     '2024-01-17 09:16:00', 'qwen3:0.6b'),
    ('thread-003', 'msg-001', 'edit-002', 
     'How do I plan a comprehensive budget-friendly trip?', 
     'Budget travel planning: 1) Use flight comparison sites and book 6-8 weeks ahead, 2) Consider shoulder season travel, 3) Mix accommodation types (hostels, guesthouses, homestays), 4) Eat where locals eat, 5) Use city tourism cards for discounts, 6) Walk or bike instead of taxis, 7) Book free walking tours, 8) Use apps like Rome2Rio for transport options, 9) Travel overland instead of flying between nearby cities.', 
     '2024-01-17 09:18:20', 'smollm2:360m'),
    ('thread-003', 'msg-002', 'edit-001', 
     'What camera settings work best for travel photography?', 
     'Use aperture priority mode, shoot in RAW format, keep ISO as low as possible, and learn the rule of thirds for composition.', 
     '2024-01-17 09:20:00', 'tinyllama:latest'),
    ('thread-003', 'msg-002', 'edit-002', 
     'What are comprehensive travel photography tips for beginners?', 
     '<think> This is a comprehensive question about travel photography for beginners. I need to cover both technical aspects (camera settings, equipment) and creative aspects (composition, storytelling). I should also include practical travel-specific advice like packing light and respecting local customs. Let me organize this into clear categories that beginners can follow. </think>Travel photography essentials: 1) Camera settings: Aperture priority (A/Av mode), shoot RAW+JPEG, ISO 100-800 for daylight, 2) Composition: Rule of thirds, leading lines, framing, 3) Golden hour shooting (sunrise/sunset), 4) Pack light: one versatile lens, extra batteries, memory cards, 5) Research locations beforehand, 6) Respect local customs and ask permission for portraits, 7) Backup photos daily, 8) Tell stories through your images, not just landmarks.', 
     '2024-01-17 09:22:45', 'qwen2.5-coder:0.5b');



-- Display mock data insertion success
SELECT 'Mock data inserted successfully!' as status;
SELECT 'Threads created: ' || COUNT(*) as thread_count FROM threads;
SELECT 'Conversations created: ' || COUNT(*) as conversation_count FROM conversations;
EOF

echo ""
echo "Database initialization with mock data complete!"
echo "================================================"
echo "Tables created:"
echo "- threads (with idx_threads_started_at index)"
echo "- thread_titles (with foreign key to threads, CASCADE DELETE)"
echo "- conversations (with composite primary key and multiple indexes, CASCADE DELETE)"
echo ""
echo "Mock data inserted:"
echo "- 3 threads with diverse titles and conversation history"
echo "- Multiple edits per message with various models (qwen2.5-coder:0.5b, tinyllama:latest, qwen3:0.6b, smollm2:360m)"
echo "- Timestamps spanning multiple days for realistic data"
echo "- Diverse conversation topics: Creative Writing, Home Cooking, Travel Planning"
echo ""
echo "Foreign key constraints:"
echo "- thread_titles.thread_id -> threads.thread_id (CASCADE DELETE)"
echo "- conversations.thread_id -> threads.thread_id (CASCADE DELETE)"
echo ""
echo "Indexes created:"
echo "- idx_threads_started_at on threads(started_at)"
echo "- idx_conversations_thread_id on conversations(thread_id)"
echo "- idx_conversations_message_id on conversations(thread_id, message_id)"
echo "- idx_conversations_created_at on conversations(created_at)"
echo "- idx_conversations_model on conversations(model)"
echo ""
echo "To connect to the database and verify:"
echo "podman exec -it ${CONTAINER_NAME} psql -U ${POSTGRES_USER} -d ${POSTGRES_DB}"
echo ""
echo "Sample queries to explore mock data:"
echo "SELECT * FROM threads;"
echo "SELECT * FROM thread_titles;"
echo "SELECT thread_id, message_id, COUNT(*) as edit_count FROM conversations GROUP BY thread_id, message_id;"