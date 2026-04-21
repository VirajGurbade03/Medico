"""
AI Clinical Assistant – FastAPI Backend
Main application entry point
"""
import os
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from routes.audio import router as audio_router
from routes.analysis import router as analysis_router
from routes.report import router as report_router

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger(__name__)

# ML model instances (loaded once at startup)
_models = {}


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load ML models at startup, release at shutdown."""
    logger.info("🚀 Starting AI Clinical Assistant backend...")

    # Import model services (lazy load to avoid circular imports)
    from models.transcriber import TranscriberService
    from models.symptom_extractor import SymptomExtractorService
    from models.disease_predictor import DiseasePredictorService
    from models.sepsis_predictor import SepsisPredictorService

    logger.info("📦 Loading Whisper transcription model...")
    _models["transcriber"] = TranscriberService()

    logger.info("🔤 Loading symptom extractor...")
    _models["symptom_extractor"] = SymptomExtractorService()

    logger.info("🧬 Loading disease predictor (Sentence-BERT)...")
    _models["disease_predictor"] = DiseasePredictorService()
    
    logger.info("🩺 Loading Sepsis Predictor pipeline...")
    _models["sepsis_predictor"] = SepsisPredictorService()

    # Make models available via app state
    app.state.transcriber = _models["transcriber"]
    app.state.symptom_extractor = _models["symptom_extractor"]
    app.state.disease_predictor = _models["disease_predictor"]
    app.state.sepsis_predictor = _models["sepsis_predictor"]

    logger.info("✅ All models loaded. Backend ready.")
    yield

    # Cleanup
    logger.info("🛑 Shutting down backend...")
    _models.clear()


app = FastAPI(
    title="AI Clinical Assistant API",
    description=(
        "Backend API for the AI-powered Medical Conversation Intelligence System. "
        "⚠️ All disease predictions are AI-assisted suggestions, NOT medical diagnoses."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

# CORS — allow frontend origin
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "https://*.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount routers
app.include_router(audio_router, prefix="/api", tags=["Audio"])
app.include_router(analysis_router, prefix="/api", tags=["Analysis"])
app.include_router(report_router, prefix="/api", tags=["Report"])


@app.get("/")
async def root():
    return {
        "message": "AI Clinical Assistant API",
        "version": "1.0.0",
        "disclaimer": (
            "This is an AI-assisted tool and NOT a medical diagnosis system. "
            "All predictions are suggestive only."
        ),
        "status": "healthy",
    }


@app.get("/health")
async def health():
    return {"status": "healthy", "models_loaded": list(_models.keys())}


if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8080))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
