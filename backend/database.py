from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.orm import declarative_base
from pathlib import Path

# Use SQLite for development
# Create database in the backend directory
BACK_END_DIR = Path(__file__).parent
DATABASE_FILE = BACK_END_DIR / "app.db"
SQLALCHEMY_DATABASE_URL = f"sqlite:///{DATABASE_FILE}"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()