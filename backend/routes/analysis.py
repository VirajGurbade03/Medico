"""
Analysis routes: symptom extraction and disease prediction.
POST /api/extract-symptoms  → extract symptoms from text
POST /api/predict-disease   → predict probable diseases
"""
import logging
from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel
from typing import Optional

from utils.auth import verify_token
from services.firebase_service import FirebaseService

router = APIRouter()
logger = logging.getLogger(__name__)
firebase = FirebaseService()


class ExtractSymptomsRequest(BaseModel):
    session_id: Optional[str] = None
    text: Optional[str] = None  # fallback if no session_id


class PredictDiseaseRequest(BaseModel):
    session_id: Optional[str] = None
    symptoms: Optional[list[str]] = None
    text: Optional[str] = None


class SepsisRiskRequest(BaseModel):
    session_id: Optional[str] = None
    vitals: dict


@router.post("/extract-symptoms")
async def extract_symptoms(
    request: Request,
    body: ExtractSymptomsRequest,
    user: dict = Depends(verify_token),
):
    """
    Extract symptoms from transcribed text.
    Either provide session_id (retrieves text from Firestore) or raw text.
    """
    extractor = request.app.state.symptom_extractor
    text = body.text

    # Load text from session if session_id provided
    if body.session_id and not text:
        session = firebase.get_session(body.session_id)
        if not session:
            raise HTTPException(status_code=404, detail=f"Session '{body.session_id}' not found")
        text = session.get("translated_text") or session.get("original_text", "")

    if not text:
        raise HTTPException(status_code=400, detail="No text provided for symptom extraction")

    try:
        result = extractor.extract(text)
    except Exception as e:
        logger.error(f"Symptom extraction error: {e}")
        raise HTTPException(status_code=500, detail=f"Extraction failed: {str(e)}")

    # Save to session if session_id given
    if body.session_id:
        firebase.save_session({
            "session_id": body.session_id,
            "user_id": user.get("uid", "anonymous"),
            "symptoms": result["symptoms"],
            "severity": result["severity"],
            "duration": result["duration"],
            "status": "analyzed",
        })

    return {
        "success": True,
        "session_id": body.session_id,
        "symptoms": result["symptoms"],
        "severity": result["severity"],
        "duration": result["duration"],
        "symptom_positions": result["symptom_positions"],
        "count": len(result["symptoms"]),
    }


@router.post("/predict-disease")
async def predict_disease(
    request: Request,
    body: PredictDiseaseRequest,
    user: dict = Depends(verify_token),
):
    """
    Predict probable diseases from symptoms.
    ⚠️ Results are AI-assisted suggestions ONLY – not medical diagnoses.

    Either provide session_id or symptoms+text directly.
    """
    predictor = request.app.state.disease_predictor
    symptoms = body.symptoms or []
    text = body.text or ""

    # Load from session if provided
    if body.session_id:
        session = firebase.get_session(body.session_id)
        if not session:
            raise HTTPException(status_code=404, detail=f"Session '{body.session_id}' not found")
        if not symptoms:
            symptoms = session.get("symptoms", [])
        if not text:
            text = session.get("translated_text") or session.get("original_text", "")

    if not symptoms and not text:
        raise HTTPException(
            status_code=400,
            detail="Provide symptoms, text, or a session_id with existing analysis"
        )

    try:
        predictions = predictor.predict(symptoms=symptoms, text=text, top_k=5)
    except Exception as e:
        logger.error(f"Disease prediction error: {e}")
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")

    # Save to session if applicable
    if body.session_id:
        firebase.save_session({
            "session_id": body.session_id,
            "user_id": user.get("uid", "anonymous"),
            "diseases": predictions,
            "status": "predicted",
        })

    return {
        "success": True,
        "session_id": body.session_id,
        "disclaimer": (
            "⚠️ These predictions are AI-assisted suggestions based on symptom similarity. "
            "They are NOT medical diagnoses. Please consult a healthcare professional."
        ),
        "predictions": predictions,
        "top_condition": predictions[0]["disease"] if predictions else None,
    }

@router.post("/sepsis-risk")
async def sepsis_risk(
    request: Request,
    body: SepsisRiskRequest,
    user: dict = Depends(verify_token),
):
    """
    Predict Sepsis Risk based on incoming vital signs.
    Requires a dictionary of vitals (e.g. {'hr': 110, 'temp': 39, 'sys_bp': 90, 'resp': 22, 'age': 65}).
    """
    predictor = getattr(request.app.state, 'sepsis_predictor', None)
    
    if not predictor:
        raise HTTPException(status_code=503, detail="Sepsis Predictor model not loaded.")
        
    vitals = body.vitals
    if not vitals:
        raise HTTPException(status_code=400, detail="Vitals data is required.")
        
    try:
        prediction = predictor.predict_risk(vitals)
    except Exception as e:
        logger.error(f"Sepsis prediction error: {e}")
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")

    # Optionally persist the risk evaluation to Firebase
    if body.session_id:
        firebase.save_session({
            "session_id": body.session_id,
            "user_id": user.get("uid", "anonymous"),
            "sepsis_risk": prediction,
            "status": "sepsis_evaluated",
        })

    return {
        "success": True,
        "session_id": body.session_id,
        "sepsis_evaluation": prediction
    }
