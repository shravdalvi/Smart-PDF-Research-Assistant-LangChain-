"""
Auth controller — stateless business logic for registration, login.
Routes stay thin; all DB calls and token creation live here.
"""

from datetime import datetime, timedelta

from bson import ObjectId
from fastapi import HTTPException, status

from config.db import get_database
from config.settings import settings
from models.user import UserCreate, UserLogin, UserResponse, Token
from utils.auth_utils import create_access_token, get_password_hash, verify_password
from utils.logger import logger


class AuthController:
    """Handles user registration and login flows."""

    @staticmethod
    async def register(user: UserCreate) -> UserResponse:
        """
        Create a new user account.
        Raises 400 if the email or username is already taken.
        """
        db = get_database()

        if await db.users.find_one({"email": user.email}):
            raise HTTPException(status_code=400, detail="Email already registered.")

        if await db.users.find_one({"username": user.username}):
            raise HTTPException(status_code=400, detail="Username already taken.")

        user_dict = user.dict()
        user_dict["password"] = get_password_hash(user.password)
        user_dict["created_at"] = datetime.utcnow()

        result = await db.users.insert_one(user_dict)
        created = await db.users.find_one({"_id": result.inserted_id})

        logger.info("New user registered: %s", user.username)
        return UserResponse(
            id=str(created["_id"]),
            username=created["username"],
            email=created["email"],
        )

    @staticmethod
    async def login(form_data: UserLogin) -> dict:
        """
        Validate credentials, issue a JWT, and persist a session record.
        Raises 401 on bad credentials.
        """
        db = get_database()

        user = await db.users.find_one({"username": form_data.username})
        if not user or not verify_password(form_data.password, user["password"]):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect username or password.",
                headers={"WWW-Authenticate": "Bearer"},
            )

        expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(data={"sub": str(user["_id"])}, expires_delta=expires)

        # Persist session to MongoDB sessions collection
        await db.sessions.insert_one({
            "user_id": str(user["_id"]),
            "token": access_token,
            "login_time": datetime.utcnow(),
            "is_active": True,
        })

        logger.info("User logged in: %s", form_data.username)
        return {"access_token": access_token, "token_type": "bearer"}
