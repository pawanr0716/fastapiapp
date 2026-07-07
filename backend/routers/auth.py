from backend.utils.token import create_access_token
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import or_, func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from backend.models.users import User
from backend.schemas.users import UserCreate, UserResponse
from backend.schemas.token import Token
from backend.database import get_db
from backend.utils.security import hash_password, verify_password

router = APIRouter(prefix="/auth", tags=["Auth"])

@router.post("/register", response_model=UserResponse)
def register(user: UserCreate, db: Session = Depends(get_db)):
    print("DEBUG auth.register payload:", user)
    normalized_email = user.email.strip().lower()
    normalized_username = user.name.strip().lower()

    existing_user = db.query(User).filter(func.lower(User.email) == normalized_email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already exists")

    existing_username = db.query(User).filter(func.lower(User.username) == normalized_username).first()
    if existing_username:
        raise HTTPException(status_code=400, detail="Username already exists")

    hashed_password = hash_password(user.password)
    db_user = User(
        username=normalized_username,
        email=normalized_email,
        hashed_password=hashed_password,
        role=user.role
    )
    try:
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="User already exists") from None

    return UserResponse(
        id=db_user.id,
        username=db_user.username,
        email=db_user.email,
        role=db_user.role,
    )

@router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    print("DEBUG auth.login form_data:", form_data.username, form_data.scopes)
    email_or_username = form_data.username.strip().lower()
    password = form_data.password
    existing_user = db.query(User).filter(
        or_(func.lower(User.email) == email_or_username, func.lower(User.username) == email_or_username)
    ).first()
    if not existing_user:
        raise HTTPException(status_code=404, detail="User not found")
    if not verify_password(password, existing_user.hashed_password):
        raise HTTPException(status_code=400, detail="Invalid password")
    access_token = create_access_token(data={"sub": str(existing_user.id), "role": existing_user.role})
    return {"access_token": access_token, "token": access_token, "token_type": "bearer"}