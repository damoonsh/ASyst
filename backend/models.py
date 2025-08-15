from sqlalchemy import Column, String, Text, DateTime, ForeignKey, Index, Float
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from datetime import datetime

Base = declarative_base()


class Thread(Base):
    __tablename__ = "threads"
    
    thread_id = Column(String(255), primary_key=True)
    started_at = Column(DateTime, nullable=False, default=func.current_timestamp())
    
    # Relationships
    title = relationship("ThreadTitle", back_populates="thread", uselist=False, cascade="all, delete-orphan")
    conversations = relationship("Conversation", back_populates="thread", cascade="all, delete-orphan")
    
    # Index
    __table_args__ = (
        Index('idx_threads_started_at', 'started_at'),
    )


class ThreadTitle(Base):
    __tablename__ = "thread_titles"
    
    thread_id = Column(String(255), ForeignKey("threads.thread_id", ondelete="CASCADE"), primary_key=True)
    title = Column(String(500), nullable=False)
    
    # Relationships
    thread = relationship("Thread", back_populates="title")


class Conversation(Base):
    __tablename__ = "conversations"
    
    thread_id = Column(String(255), ForeignKey("threads.thread_id", ondelete="CASCADE"), primary_key=True)
    message_id = Column(String(255), primary_key=True)
    edit_id = Column(String(255), primary_key=True)
    question = Column(Text, nullable=False)
    answer = Column(Text, nullable=False)
    created_at = Column(DateTime, nullable=False, default=func.current_timestamp())
    model = Column(String(100), nullable=False)
    time_took = Column(Float, nullable=True)  # Time in seconds for answer generation
    
    # Relationships
    thread = relationship("Thread", back_populates="conversations")
    
    # Indexes
    __table_args__ = (
        Index('idx_conversations_thread_id', 'thread_id'),
        Index('idx_conversations_message_id', 'thread_id', 'message_id'),
        Index('idx_conversations_created_at', 'created_at'),
        Index('idx_conversations_model', 'model'),
    )