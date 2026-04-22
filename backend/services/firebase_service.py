"""
Firebase Admin SDK service.
Handles Firestore database operations and Storage uploads.
"""
import os
import json
import logging
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

logger = logging.getLogger(__name__)

_firebase_initialized = False


def _init_firebase():
    """Initialize Firebase Admin SDK (idempotent)."""
    global _firebase_initialized
    if _firebase_initialized:
        return

    import firebase_admin
    from firebase_admin import credentials

    sa_path = os.getenv("FIREBASE_SERVICE_ACCOUNT_PATH", "./firebase-service-account.json")

    if Path(sa_path).exists():
        cred = credentials.Certificate(sa_path)
        firebase_admin.initialize_app(cred, {
            "storageBucket": os.getenv("FIREBASE_STORAGE_BUCKET", ""),
        })
        _firebase_initialized = True
        logger.info("✅ Firebase Admin SDK initialized")
    else:
        logger.warning(
            f"Firebase service account not found at {sa_path}. "
            "Firebase operations will be skipped (development mode)."
        )


class FirebaseService:
    """Wrapper for Firebase Firestore and Storage operations."""

    def __init__(self):
        _init_firebase()

    # ─── Storage ────────────────────────────────────────────────────────────

    def upload_audio(self, local_path: str, user_id: str, session_id: str) -> str:
        """
        Upload audio file to Firebase Storage.
        Returns the public download URL or empty string on failure.
        """
        if not _firebase_initialized:
            return ""

        from firebase_admin import storage
        bucket = storage.bucket()
        destination = f"audio/{user_id}/{session_id}/{Path(local_path).name}"
        blob = bucket.blob(destination)
        blob.upload_from_filename(local_path)
        blob.make_public()
        return blob.public_url

    def upload_pdf(self, local_path: str, user_id: str, report_id: str) -> str:
        """Upload PDF report to Firebase Storage."""
        if not _firebase_initialized:
            return ""

        from firebase_admin import storage
        bucket = storage.bucket()
        destination = f"reports/{user_id}/{report_id}.pdf"
        blob = bucket.blob(destination)
        blob.upload_from_filename(local_path)
        blob.make_public()
        return blob.public_url

    # ─── Firestore ──────────────────────────────────────────────────────────

    def save_session(self, session_data: dict) -> str:
        """
        Save a transcription session to Firestore.
        Returns session document ID.
        """
        if not _firebase_initialized:
            return session_data.get("session_id", str(uuid.uuid4()))

        from firebase_admin import firestore
        db = firestore.client()
        session_id = session_data.get("session_id", str(uuid.uuid4()))
        db.collection("sessions").document(session_id).set({
            **session_data,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }, merge=True)
        return session_id

    def get_session(self, session_id: str) -> Optional[dict]:
        """Retrieve a session from Firestore."""
        if not _firebase_initialized:
            return None

        from firebase_admin import firestore
        db = firestore.client()
        doc = db.collection("sessions").document(session_id).get()
        return doc.to_dict() if doc.exists else None

    def save_report(self, report_data: dict) -> str:
        """Save a report record to Firestore. Returns report ID."""
        if not _firebase_initialized:
            return report_data.get("report_id", str(uuid.uuid4()))

        from firebase_admin import firestore
        db = firestore.client()
        report_id = report_data.get("report_id", str(uuid.uuid4()))
        db.collection("reports").document(report_id).set({
            **report_data,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }, merge=True)
        return report_id

    def get_report(self, report_id: str) -> Optional[dict]:
        """Retrieve a report from Firestore."""
        if not _firebase_initialized:
            return None

        from firebase_admin import firestore
        db = firestore.client()
        doc = db.collection("reports").document(report_id).get()
        return doc.to_dict() if doc.exists else None

    def get_user_sessions(self, user_id: str, limit: int = 10) -> list[dict]:
        """Get recent sessions for a user."""
        if not _firebase_initialized:
            return []

        from firebase_admin import firestore
        db = firestore.client()
        docs = (
            db.collection("sessions")
            .where("user_id", "==", user_id)
            .stream()
        )
        # Sort in Python to avoid requiring a Firebase Composite Index
        sessions = [doc.to_dict() for doc in docs]
        sessions.sort(key=lambda x: x.get("created_at", ""), reverse=True)
        return sessions[:limit]

    def get_user_reports(self, user_id: str, limit: int = 10) -> list[dict]:
        """Get recent reports for a user."""
        if not _firebase_initialized:
            return []

        from firebase_admin import firestore
        db = firestore.client()
        docs = (
            db.collection("reports")
            .where("user_id", "==", user_id)
            .stream()
        )
        # Sort in Python to avoid requiring a Firebase Composite Index
        reports = [doc.to_dict() for doc in docs]
        reports.sort(key=lambda x: x.get("created_at", ""), reverse=True)
        return reports[:limit]
