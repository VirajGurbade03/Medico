"""
Whisper Speech-to-Text + NLLB Translation service.
Mirrors the notebook pipeline:
  audio → Whisper → original text (+ language detection)
  if Hindi → NLLB translation → English text
"""
import os
import logging
import tempfile
from pathlib import Path

logger = logging.getLogger(__name__)


class TranscriberService:
    """
    Manages Whisper STT and NLLB translation models.
    Models are loaded once at startup and reused per request.
    """

    def __init__(self):
        self.whisper_model = None
        self._load_models()

    def _load_models(self):
        """Load Whisper model."""
        import whisper

        model_size = os.getenv("WHISPER_MODEL", "base")
        logger.info(f"Loading Whisper model: {model_size} (using built-in translation)")
        self.whisper_model = whisper.load_model(model_size)
        logger.info("✅ Whisper loaded")

    def transcribe(self, audio_path: str) -> dict:
        """
        Transcribe audio file and automatically translate to English.

        Returns:
            {
                original_text: str,
                translated_text: str,        # English (same as original since Whisper translates directly)
                language: str,               # detected language code
                language_name: str,
                segments: list[dict],        # word-level timestamps
                was_translated: bool,
            }
        """
        logger.info(f"Transcribing and translating: {audio_path}")
        # task="translate" will output English text directly, regardless of the source language
        result = self.whisper_model.transcribe(
            audio_path,
            task="translate",
            verbose=False,
        )

        english_text = result["text"].strip()
        language = result.get("language", "en")

        # Segment info for word-level highlighting
        segments = [
            {
                "start": seg["start"],
                "end": seg["end"],
                "text": seg["text"].strip(),
            }
            for seg in result.get("segments", [])
        ]

        was_translated = (language != "en")

        if was_translated:
            logger.info(f"Detected language: {language}. Whisper automatically translated to English.")

        LANGUAGE_NAMES = {
            "en": "English",
            "hi": "Hindi",
            "ta": "Tamil",
            "te": "Telugu",
            "mr": "Marathi",
            "bn": "Bengali",
            "gu": "Gujarati",
            "kn": "Kannada",
            "ml": "Malayalam",
            "pa": "Punjabi",
            "ur": "Urdu",
        }

        return {
            "original_text": english_text,
            "translated_text": english_text,
            "language": language,
            "language_name": LANGUAGE_NAMES.get(language, language.upper()),
            "segments": segments,
            "was_translated": was_translated,
        }
