"""
Firebase authentication utility.
Verifies Firebase ID tokens from Authorization headers.
"""
import logging
from fastapi import HTTPException, Security, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import firebase_admin
from firebase_admin import auth as firebase_auth

logger = logging.getLogger(__name__)
security = HTTPBearer(auto_error=False)


def verify_token(
    credentials: HTTPAuthorizationCredentials = Security(security),
) -> dict:
    """
    Verify Firebase ID token from Authorization: Bearer <token>.
    Returns decoded token dict with uid, email, etc.
    Raises HTTP 401 if invalid or missing.
    """
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header missing",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = credentials.credentials
    try:
        decoded = firebase_auth.verify_id_token(token)
        return decoded
    except firebase_admin.exceptions.FirebaseError as e:
        logger.warning(f"Firebase auth error: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication token",
            headers={"WWW-Authenticate": "Bearer"},
        )


def get_optional_user(
    credentials: HTTPAuthorizationCredentials = Security(security),
) -> dict | None:
    """
    Like verify_token but returns None instead of raising if no token.
    Used for endpoints where auth is optional.
    """
    if credentials is None:
        return None
    try:
        return firebase_auth.verify_id_token(credentials.credentials)
    except Exception:
        return None
