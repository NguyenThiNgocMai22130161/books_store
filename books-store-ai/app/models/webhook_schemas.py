"""
Webhook event schemas
"""
from pydantic import BaseModel, Field
from enum import Enum
from datetime import datetime
from typing import Optional


class EventType(str, Enum):
    """Book change event types"""
    CREATED = "CREATED"
    UPDATED = "UPDATED"
    DELETED = "DELETED"


class BookChangedWebhookRequest(BaseModel):
    """Webhook request from Spring Boot when book changes"""
    event_id: str = Field(..., description="Unique event ID")
    book_id: int = Field(..., description="Book ID")
    event_type: EventType = Field(..., description="Event type: CREATED, UPDATED, or DELETED")
    occurred_at: str = Field(..., description="ISO datetime when event occurred")
    
    class Config:
        json_schema_extra = {
            "example": {
                "event_id": "550e8400-e29b-41d4-a716-446655440000",
                "book_id": 123,
                "event_type": "UPDATED",
                "occurred_at": "2026-07-14T10:30:00"
            }
        }


class WebhookResponse(BaseModel):
    """Response to webhook request"""
    accepted: bool = Field(..., description="Whether event was accepted")
    event_id: str = Field(..., description="Event ID")
    book_id: int = Field(..., description="Book ID")
    message: Optional[str] = Field(None, description="Additional message")
    
    class Config:
        json_schema_extra = {
            "example": {
                "accepted": True,
                "event_id": "550e8400-e29b-41d4-a716-446655440000",
                "book_id": 123,
                "message": "Event processing started in background"
            }
        }


class IngestEventStatus(str, Enum):
    """Status of ingest event processing"""
    PENDING = "PENDING"
    PROCESSING = "PROCESSING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
