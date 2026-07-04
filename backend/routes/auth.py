"""
Authentication routes — register, login, get current user.
All business logic lives in AuthController.
"""

from fastapi import APIRouter, Depends

from controllers.auth_controller import AuthController
from models.user import UserCreate, UserLogin, UserResponse, Token
from utils.auth_utils import get_current_user

router = APIRouter()


@router.post("/register", response_model=UserResponse, summary="Register a new user")
async def register(user: UserCreate):
    """Create a new account. Returns the created user (no password)."""
    return await AuthController.register(user)


@router.post("/login", response_model=Token, summary="Login and obtain JWT")
async def login(form_data: UserLogin):
    """Authenticate with username + password. Returns a Bearer JWT token."""
    return await AuthController.login(form_data)


@router.get("/me", response_model=UserResponse, summary="Get current authenticated user")
async def read_users_me(current_user: dict = Depends(get_current_user)):
    """Returns the profile of the currently authenticated user."""
    return UserResponse(
        id=current_user["id"],
        username=current_user["username"],
        email=current_user["email"],
    )
