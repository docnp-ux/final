"""
Shared Dependencies

Provides reusable dependencies:
  - SessionDep: database session
  - CurrentUser: authenticated user from JWT
  - AdminUser: CurrentUser, but 403s if not an admin
  - CurrentDevice: authenticated device from its API key
  - pagination: skip/limit query params
"""

from typing import Annotated

from fastapi import Depends, Header, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlmodel import Session, select

from backend.app.config import get_settings
from backend.app.db import get_session
from backend.app.models.device import Device
from backend.app.models.user import User

settings = get_settings()

# --- Database Session ---

SessionDep = Annotated[Session, Depends(get_session)]

# --- User Authentication (JWT, human users) ---

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")


def get_current_user(
    token: Annotated[str, Depends(oauth2_scheme)],
    session: SessionDep,
) -> User:
    """Decode the JWT, look up the user, or raise 401."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(
            token,
            settings.secret_key,
            algorithms=[settings.algorithm],
        )
        username: str | None = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = session.exec(select(User).where(User.username == username)).first()
    if user is None:
        raise credentials_exception
    return user


CurrentUser = Annotated[User, Depends(get_current_user)]


def get_admin_user(user: CurrentUser) -> User:
    """Require the current user to be an admin, or raise 403."""
    if not user.is_admin:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Admins only")
    return user


AdminUser = Annotated[User, Depends(get_admin_user)]


# --- Device Authentication (static API key, ESP32) ---


def get_current_device(
    session: SessionDep,
    x_device_api_key: Annotated[str | None, Header()] = None,
) -> Device:
    """
    Look up the device owning the X-Device-API-Key header, or raise 401.

    Devices cannot practically run an OAuth2 password-flow login, so they
    use a lightweight static-key header instead of the JWT flow used by
    human users.
    """
    if not x_device_api_key:
        raise HTTPException(
            status.HTTP_401_UNAUTHORIZED, "Missing X-Device-API-Key header"
        )
    device = session.exec(
        select(Device).where(Device.api_key == x_device_api_key)
    ).first()
    if device is None or not device.is_active:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid device API key")
    return device


CurrentDevice = Annotated[Device, Depends(get_current_device)]


# --- Pagination ---


def pagination(skip: int = 0, limit: int = 20) -> dict:
    """Reusable pagination dependency."""
    return {"skip": skip, "limit": limit}


Page = Annotated[dict, Depends(pagination)]
