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
        self.nllb_tokenizer = None
        self.nllb_model = None
        self._load_models()

    def _load_models(self):
        """Load Whisper and NLLB models."""
        import whisper

        model_size = os.getenv("WHISPER_MODEL", "base")
        logger.info(f"Loading Whisper model: {model_size}")
        self.whisper_model = whisper.load_model(model_size)
        logger.info("✅ Whisper loaded")

        # Load NLLB for Hindi→English (optional: only loaded when needed)
        # We lazy-load to save startup time if only English audio is expected
        self._nllb_loaded = False

    def _ensure_nllb(self):
        """Lazy-load NLLB translation model."""
        if self._nllb_loaded:
            return
        from transformers import AutoTokenizer, AutoModelForSeq2SeqLM

        model_name = "facebook/nllb-200-distilled-600M"
        logger.info(f"Loading NLLB model: {model_name}")
        self.nllb_tokenizer = AutoTokenizer.from_pretrained(model_name)
        self.nllb_model = AutoModelForSeq2SeqLM.from_pretrained(model_name)
        self._nllb_loaded = True
        logger.info("✅ NLLB translation model loaded")

    def transcribe(self, audio_path: str) -> dict:
        """
        Transcribe audio file and optionally translate to English.

        Returns:
            {
                original_text: str,
                translated_text: str,        # English (may equal original)
                language: str,               # detected language code
                language_name: str,
                segments: list[dict],        # word-level timestamps
                was_translated: bool,
            }
        """
        logger.info(f"Transcribing: {audio_path}")
        result = self.whisper_model.transcribe(
            audio_path,
            task="transcribe",
            verbose=False,
        )

        original_text = result["text"].strip()
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

        # Translate if Hindi (hi) or other non-English language
        was_translated = False
        translated_text = original_text

        if language != "en":
            logger.info(f"Detected language: {language}. Translating to English...")
            translated_text = self._translate_to_english(original_text, language)
            was_translated = True
            logger.info(f"Translation complete.")

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
            "original_text": original_text,
            "translated_text": translated_text,
            "language": language,
            "language_name": LANGUAGE_NAMES.get(language, language.upper()),
            "segments": segments,
            "was_translated": was_translated,
        }

    def _translate_to_english(self, text: str, src_lang: str) -> str:
        """
        Translate text from src_lang to English using NLLB.
        """
        self._ensure_nllb()

        # NLLB language codes
        NLLB_LANG_MAP = {
            "hi": "hin_Deva",
            "ta": "tam_Taml",
            "te": "tel_Telu",
            "mr": "mar_Deva",
            "bn": "ben_Beng",
            "gu": "guj_Gujr",
            "kn": "kan_Knda",
            "ml": "mal_Mlym",
            "pa": "pan_Guru",
            "ur": "urd_Arab",
        }

        src_nllb = NLLB_LANG_MAP.get(src_lang, f"{src_lang}_Latn")

        inputs = self.nllb_tokenizer(
            text,
            return_tensors="pt",
            padding=True,
            truncation=True,
            max_length=512,
        )
        translated_tokens = self.nllb_model.generate(
            **inputs,
            forced_bos_token_id=self.nllb_tokenizer.lang_code_to_id["eng_Latn"],
            max_length=512,
        )
        translated = self.nllb_tokenizer.batch_decode(
            translated_tokens, skip_special_tokens=True
        )
        return translated[0] if translated else text
