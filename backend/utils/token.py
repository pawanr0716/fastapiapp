from datetime import datetime, timedelta
import os
from jose import JWTError, jwt
from dotenv import load_dotenv
from fastapi import Depends, HTTPException
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models.users import User

load_dotenv()
SECRET_KEY = os.getenv("SECRET_KEY", "your_secret_key")
ALGORITHM = os.getenv("ALGORITHM", "HS256")


def create_access_token(data: dict, expires_delta: timedelta = timedelta(hours=2)):
    to_encode = data.copy()
    expire = datetime.utcnow() + expires_delta
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def verify_access_token(token: str, db: Session = Depends(get_db)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    if user_id is None:
        raise HTTPException(status_code=401, detail="Invalid token payload")

    user = db.query(User).filter(User.id == int(user_id)).first()
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    return user