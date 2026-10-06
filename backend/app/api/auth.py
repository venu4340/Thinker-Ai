from datetime import timedelta
from typing import Optional
from urllib.parse import urlencode
import secrets
import httpx
from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.config import settings
from app.core.security import verify_password, get_password_hash, create_access_token, decode_access_token
from app.database.session import get_db
from app.models.models import User
from app.schemas.schemas import UserCreate, UserLogin, UserResponse, Token

router = APIRouter(prefix="/auth", tags=["Authentication"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/login-form")

# Google OAuth URLs
GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo"

async def get_current_user(token: str = Depends(oauth2_scheme), db: AsyncSession = Depends(get_db)) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate authentication credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    payload = decode_access_token(token)
    if payload is None:
        raise credentials_exception
    user_id: str = payload.get("sub")
    if user_id is None:
        raise credentials_exception

    query = select(User).where(User.id == user_id)
    result = await db.execute(query)
    user = result.scalar_one_or_none()
    if user is None:
        raise credentials_exception
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return user

@router.post("/register", response_model=Token)
async def register(user_in: UserCreate, db: AsyncSession = Depends(get_db)):
    query = select(User).where(User.email == user_in.email)
    result = await db.execute(query)
    existing_user = result.scalar_one_or_none()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address already exists."
        )

    user = User(
        email=user_in.email,
        hashed_password=get_password_hash(user_in.password),
        full_name=user_in.full_name or user_in.email.split("@")[0]
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    access_token = create_access_token(user.id)
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }

@router.post("/login", response_model=Token)
async def login(credentials: UserLogin, db: AsyncSession = Depends(get_db)):
    query = select(User).where(User.email == credentials.email)
    result = await db.execute(query)
    user = result.scalar_one_or_none()

    if not user or not user.hashed_password or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password."
        )

    access_token = create_access_token(user.id)
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }

@router.post("/login-form", response_model=Token)
async def login_form(form_data: OAuth2PasswordRequestForm = Depends(), db: AsyncSession = Depends(get_db)):
    query = select(User).where(User.email == form_data.username)
    result = await db.execute(query)
    user = result.scalar_one_or_none()

    if not user or not user.hashed_password or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password."
        )

    access_token = create_access_token(user.id)
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }

@router.post("/demo-login", response_model=Token)
async def demo_login(db: AsyncSession = Depends(get_db)):
    query = select(User).where(User.email == "demo@thinkflow.ai")
    result = await db.execute(query)
    user = result.scalar_one_or_none()

    if not user:
        user = User(
            email="demo@thinkflow.ai",
            hashed_password=get_password_hash("demo12345"),
            full_name="Alex Mercer (Demo Lead)",
            role="admin"
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)

    access_token = create_access_token(user.id)
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }

@router.get("/me", response_model=UserResponse)
async def read_current_user(current_user: User = Depends(get_current_user)):
    return current_user


# ── Google OAuth Endpoints ─────────────────────────────────────────────────────

@router.get("/google/client-id")
async def google_client_id():
    """Return the Google Client ID so the frontend can verify configuration."""
    if not settings.GOOGLE_CLIENT_ID:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Google OAuth is not configured. Please set GOOGLE_CLIENT_ID in the backend .env file."
        )
    return {"client_id": settings.GOOGLE_CLIENT_ID}


@router.get("/google/login")
async def google_login():
    """
    Returns the real Google OAuth authorization URL with account selection prompt.
    The frontend redirects the user's browser to this URL.
    """
    if not settings.GOOGLE_CLIENT_ID or not settings.GOOGLE_CLIENT_SECRET:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Google OAuth is not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in the backend .env file."
        )

    state = secrets.token_urlsafe(32)

    params = {
        "client_id": settings.GOOGLE_CLIENT_ID,
        "redirect_uri": settings.GOOGLE_REDIRECT_URI,
        "response_type": "code",
        "scope": "openid email profile",
        "access_type": "offline",
        "state": state,
        "prompt": "select_account",
    }
    authorization_url = f"{GOOGLE_AUTH_URL}?{urlencode(params)}"
    return {"authorization_url": authorization_url}


@router.get("/google/callback")
async def google_callback(
    code: Optional[str] = None,
    error: Optional[str] = None,
    state: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    """
    Handles the real OAuth callback from Google.
    Exchanges the authorization code for tokens, fetches verified user info,
    creates or finds the ThinkFlow user, generates a standard JWT access token,
    and redirects to the frontend with the token.
    """
    frontend_url = settings.FRONTEND_URL

    if error:
        err_param = urlencode({"error": f"Google sign-in error: {error}"})
        return RedirectResponse(url=f"{frontend_url}/login?{err_param}")

    if not code:
        err_param = urlencode({"error": "No authorization code received from Google."})
        return RedirectResponse(url=f"{frontend_url}/login?{err_param}")

    if not settings.GOOGLE_CLIENT_ID or not settings.GOOGLE_CLIENT_SECRET:
        err_param = urlencode({"error": "Google OAuth is not configured on the backend. Please add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to backend/.env."})
        return RedirectResponse(url=f"{frontend_url}/login?{err_param}")

    # 1. Exchange authorization code for tokens securely on the backend
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            token_response = await client.post(
                GOOGLE_TOKEN_URL,
                data={
                    "code": code,
                    "client_id": settings.GOOGLE_CLIENT_ID,
                    "client_secret": settings.GOOGLE_CLIENT_SECRET,
                    "redirect_uri": settings.GOOGLE_REDIRECT_URI,
                    "grant_type": "authorization_code",
                },
            )
    except Exception as e:
        err_param = urlencode({"error": f"Failed to connect to Google token endpoint: {str(e)}"})
        return RedirectResponse(url=f"{frontend_url}/login?{err_param}")

    if token_response.status_code != 200:
        err_detail = "Failed to exchange authorization code with Google."
        try:
            err_json = token_response.json()
            if "error_description" in err_json:
                err_detail = err_json["error_description"]
            elif "error" in err_json:
                err_detail = str(err_json["error"])
        except Exception:
            pass
        err_param = urlencode({"error": err_detail})
        return RedirectResponse(url=f"{frontend_url}/login?{err_param}")

    token_data = token_response.json()
    google_access_token = token_data.get("access_token")

    if not google_access_token:
        err_param = urlencode({"error": "No access token received from Google."})
        return RedirectResponse(url=f"{frontend_url}/login?{err_param}")

    # 2. Fetch verified user identity from Google UserInfo endpoint
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            userinfo_response = await client.get(
                GOOGLE_USERINFO_URL,
                headers={"Authorization": f"Bearer {google_access_token}"},
            )
    except Exception as e:
        err_param = urlencode({"error": f"Failed to fetch Google user profile: {str(e)}"})
        return RedirectResponse(url=f"{frontend_url}/login?{err_param}")

    if userinfo_response.status_code != 200:
        err_param = urlencode({"error": "Failed to verify Google user identity."})
        return RedirectResponse(url=f"{frontend_url}/login?{err_param}")

    google_user = userinfo_response.json()
    google_id = google_user.get("sub")
    google_email = google_user.get("email")
    google_name = google_user.get("name", "")
    google_picture = google_user.get("picture", "")

    if not google_email:
        err_param = urlencode({"error": "Google account does not have an email address."})
        return RedirectResponse(url=f"{frontend_url}/login?{err_param}")

    # 3. Find or create ThinkFlow user
    query = select(User).where(User.google_id == google_id)
    result = await db.execute(query)
    user = result.scalar_one_or_none()

    if not user:
        # Check if user with same email exists
        query = select(User).where(User.email == google_email)
        result = await db.execute(query)
        user = result.scalar_one_or_none()

        if user:
            # Link Google account
            user.google_id = google_id
            if google_picture and not user.avatar_url:
                user.avatar_url = google_picture
            if google_name and not user.full_name:
                user.full_name = google_name
        else:
            # Create new ThinkFlow user with verified Google profile
            user = User(
                email=google_email,
                full_name=google_name or google_email.split("@")[0],
                avatar_url=google_picture,
                auth_provider="google",
                google_id=google_id,
                hashed_password=None,
            )
            db.add(user)

    await db.commit()
    await db.refresh(user)

    # 4. Generate standard ThinkFlow JWT token using existing security architecture
    access_token = create_access_token(user.id)

    # 5. Redirect to frontend with token
    redirect_url = f"{frontend_url}/auth/google/callback?token={access_token}"
    return RedirectResponse(url=redirect_url)
