from sqlalchemy import Column, String, Text, DateTime
from datetime import datetime
from backend.database import Base


class IdempotencyKey(Base):
    __tablename__ = "idempotency_keys"
    key = Column(String, primary_key=True, index=True)
    status = Column(String, nullable=False, default="processing")
    response = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
