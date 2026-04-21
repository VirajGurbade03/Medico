"""
Report generation and retrieval routes.
POST /api/generate-report    → generate PDF report, store in Firebase
GET  /api/report/{report_id} → retrieve report metadata
GET  /api/reports            → list user's reports
"""
import uuid
import logging
import os
import tempfile
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Depends, Request
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import Optional

from utils.auth import verify_token
from services.firebase_service import FirebaseService
from services.pdf_service import PDFService

router = APIRouter()
logger = logging.getLogger(__name__)
firebase = FirebaseService()
pdf_service = PDFService()


class GenerateReportRequest(BaseModel):
    session_id: str
    patient_name: Optional[str] = None
    doctor_notes: Optional[str] = None


@router.post("/generate-report")
async def generate_report(
    body: GenerateReportRequest,
    user: dict = Depends(verify_token),
):
    """
    Generate a PDF medical report from session data.
    Returns download URL and report_id.
    """
    user_id = user.get("uid", "anonymous")

    # Load session data
    session = firebase.get_session(body.session_id)
    if not session:
        raise HTTPException(status_code=404, detail=f"Session '{body.session_id}' not found")

    report_id = str(uuid.uuid4())
    gen_at = datetime.now(timezone.utc).strftime("%B %d, %Y at %H:%M UTC")

    # Assemble report data
    report_data = {
        "session_id": body.session_id,
        "report_id": report_id,
        "user_id": user_id,
        "patient_name": body.patient_name or session.get("patient_name", ""),
        "doctor_notes": body.doctor_notes or "",
        "generated_at": gen_at,
        "original_text": session.get("original_text", ""),
        "translated_text": session.get("translated_text", ""),
        "transcription": session.get("translated_text") or session.get("original_text", ""),
        "language": session.get("language", "en"),
        "language_name": session.get("language_name", "English"),
        "was_translated": session.get("was_translated", False),
        "symptoms": session.get("symptoms", []),
        "severity": session.get("severity"),
        "duration": session.get("duration"),
        "diseases": session.get("diseases", []),
    }

    # Generate PDF
    try:
        pdf_path = pdf_service.generate_report(report_data)
    except Exception as e:
        logger.error(f"PDF generation error: {e}")
        raise HTTPException(status_code=500, detail=f"PDF generation failed: {str(e)}")

    # Upload PDF to Firebase Storage
    pdf_url = firebase.upload_pdf(pdf_path, user_id, report_id)

    # Save report metadata to Firestore
    firebase.save_report({
        "report_id": report_id,
        "session_id": body.session_id,
        "user_id": user_id,
        "patient_name": report_data["patient_name"],
        "pdf_url": pdf_url,
        "local_path": pdf_path,
        "symptoms": report_data["symptoms"],
        "diseases": report_data["diseases"],
        "generated_at": gen_at,
    })

    logger.info(f"✅ Report generated: {report_id}")

    return {
        "success": True,
        "report_id": report_id,
        "pdf_url": pdf_url,
        "local_path": pdf_path,  # for local download if Firebase not configured
        "generated_at": gen_at,
    }


@router.get("/report/{report_id}")
async def get_report(
    report_id: str,
    user: dict = Depends(verify_token),
):
    """Retrieve report metadata by ID."""
    report = firebase.get_report(report_id)
    if not report:
        raise HTTPException(status_code=404, detail=f"Report '{report_id}' not found")

    # Verify ownership
    if report.get("user_id") != user.get("uid"):
        raise HTTPException(status_code=403, detail="Access denied")

    return {"success": True, "report": report}


@router.get("/reports")
async def list_reports(
    user: dict = Depends(verify_token),
):
    """List all reports for the authenticated user."""
    user_id = user.get("uid", "anonymous")
    reports = firebase.get_user_reports(user_id)
    return {"success": True, "reports": reports, "count": len(reports)}


@router.get("/report/{report_id}/download")
async def download_report_pdf(
    report_id: str,
    user: dict = Depends(verify_token),
):
    """Download PDF directly from local path (fallback when Firebase not configured)."""
    report = firebase.get_report(report_id)
    if not report:
        raise HTTPException(status_code=404, detail=f"Report '{report_id}' not found")

    if report.get("user_id") != user.get("uid"):
        raise HTTPException(status_code=403, detail="Access denied")

    local_path = report.get("local_path")
    if local_path and os.path.exists(local_path):
        return FileResponse(
            local_path,
            media_type="application/pdf",
            filename=f"medical_report_{report_id[:8]}.pdf"
        )

    raise HTTPException(
        status_code=404,
        detail="PDF file not found locally. Use the pdf_url field to download."
    )
