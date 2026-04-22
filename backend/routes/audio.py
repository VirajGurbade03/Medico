"""
Audio upload and transcription routes.
POST /api/upload-audio  → uploads audio, returns session_id
POST /api/transcribe    → transcribes audio for a session
"""
import os
import uuid
import logging
import tempfile
from pathlib import Path

from fastapi import APIRouter, File, Form, UploadFile, HTTPException, Depends, Request
from pydantic import BaseModel

from utils.auth import verify_token
from services.firebase_service import FirebaseService

router = APIRouter()
logger = logging.getLogger(__name__)
firebase = FirebaseService()

ALLOWED_EXTENSIONS = {".mp3", ".wav", ".m4a", ".ogg", ".flac", ".webm", ".mp4"}
MAX_AUDIO_SIZE_MB = 50


class TranscribeRequest(BaseModel):
    session_id: str


@router.post("/upload-audio")
async def upload_audio(
    request: Request,
    file: UploadFile = File(...),
    patient_name: str = Form(default=""),
    user: dict = Depends(verify_token),
):
    """
    Upload audio file for transcription.
    Returns session_id to track the conversation.
    """
    # Validate file extension
    suffix = Path(file.filename or "audio.wav").suffix.lower()
    if suffix not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type '{suffix}'. Allowed: {', '.join(ALLOWED_EXTENSIONS)}"
        )

    # Read and size-check
    content = await file.read()
    size_mb = len(content) / (1024 * 1024)
    if size_mb > MAX_AUDIO_SIZE_MB:
        raise HTTPException(
            status_code=413,
            detail=f"File too large ({size_mb:.1f} MB). Maximum: {MAX_AUDIO_SIZE_MB} MB"
        )

    session_id = str(uuid.uuid4())
    user_id = user.get("uid", "anonymous")

    # Save to temp file
    tmp_dir = Path(tempfile.gettempdir()) / "medico_audio"
    tmp_dir.mkdir(exist_ok=True)
    audio_path = tmp_dir / f"{session_id}{suffix}"

    with open(audio_path, "wb") as f:
        f.write(content)

    # Upload to Firebase Storage (Disabled by user request, using Firestore only)
    audio_url = ""
    # Create session record
    session_data = {
        "session_id": session_id,
        "user_id": user_id,
        "patient_name": patient_name,
        "audio_filename": file.filename,
        "audio_url": audio_url,
        "audio_size_mb": round(size_mb, 2),
        "status": "uploaded",
    }
    firebase.save_session(session_data)

    # Store local path in app state for transcription step
    # In production, re-download from Firebase Storage
    app_state = request.app.state
    if not hasattr(app_state, "pending_audio"):
        app_state.pending_audio = {}
    app_state.pending_audio[session_id] = str(audio_path)

    logger.info(f"✅ Audio uploaded: session {session_id}, {size_mb:.1f} MB")

    return {
        "success": True,
        "session_id": session_id,
        "message": "Audio uploaded successfully",
        "file_size_mb": round(size_mb, 2),
        "audio_url": audio_url,
    }


@router.post("/transcribe")
async def transcribe_audio(
    request: Request,
    body: TranscribeRequest,
    user: dict = Depends(verify_token),
):
    """
    Transcribe the uploaded audio for a session.
    Uses the loaded Whisper model from app state.
    """
    session_id = body.session_id
    transcriber = request.app.state.transcriber
    app_state = request.app.state

    # Get audio file path
    pending = getattr(app_state, "pending_audio", {})
    audio_path = pending.get(session_id)

    if not audio_path or not Path(audio_path).exists():
        raise HTTPException(
            status_code=404,
            detail=f"Audio file for session '{session_id}' not found. Please upload first."
        )

    logger.info(f"Transcribing session {session_id}...")

    try:
        result = transcriber.transcribe(audio_path)
    except Exception as e:
        logger.error(f"Transcription error: {e}")
        raise HTTPException(status_code=500, detail=f"Transcription failed: {str(e)}")

    # Update session in Firestore
    session_data = {
        "session_id": session_id,
        "user_id": user.get("uid", "anonymous"),
        "status": "transcribed",
        "original_text": result["original_text"],
        "translated_text": result["translated_text"],
        "language": result["language"],
        "language_name": result["language_name"],
        "was_translated": result["was_translated"],
        "segments": result["segments"][:50],  # limit stored segments
    }
    firebase.save_session(session_data)

    logger.info(f"✅ Transcription complete for session {session_id}")

    return {
        "success": True,
        "session_id": session_id,
        "language": result["language"],
        "language_name": result["language_name"],
        "original_text": result["original_text"],
        "translated_text": result["translated_text"],
        "was_translated": result["was_translated"],
        "segments": result["segments"],
    }
