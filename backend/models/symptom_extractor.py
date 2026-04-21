"""
Symptom extraction from medical conversation text.
Uses keyword matching + spaCy for NLP refinement.
"""
import re
import logging
from typing import Optional

logger = logging.getLogger(__name__)


class SymptomExtractorService:
    """
    Extracts symptoms, severity, and duration from transcribed text.
    """

    def __init__(self):
        self._nlp = None
        self._load()

    def _load(self):
        """Load spaCy model."""
        try:
            import spacy
            # Try English model; fall back to blank if not installed
            try:
                self._nlp = spacy.load("en_core_web_sm")
            except OSError:
                logger.warning(
                    "spaCy 'en_core_web_sm' not found. "
                    "Run: python -m spacy download en_core_web_sm  "
                    "Using blank model as fallback."
                )
                self._nlp = spacy.blank("en")
        except ImportError:
            logger.warning("spaCy not installed. Using regex-only extraction.")
            self._nlp = None

        # Import dictionaries here to avoid circular imports
        from utils.medical_dictionary import SYMPTOM_KEYWORDS, SEVERITY_INDICATORS, DURATION_PATTERNS
        self.symptom_keywords = SYMPTOM_KEYWORDS
        self.severity_indicators = SEVERITY_INDICATORS
        self.duration_patterns = DURATION_PATTERNS

        logger.info("✅ SymptomExtractor loaded")

    def extract(self, text: str) -> dict:
        """
        Extract symptoms, severity, and duration from text.

        Args:
            text: Transcribed (and translated to English) conversation text.

        Returns:
            {
                symptoms: list[str],
                severity: str | None,    # mild / moderate / severe
                duration: str | None,    # e.g. "3 days"
                symptom_positions: list[dict],  # for text highlighting
                raw_text: str,
            }
        """
        if not text:
            return {
                "symptoms": [],
                "severity": None,
                "duration": None,
                "symptom_positions": [],
                "raw_text": text,
            }

        text_lower = text.lower()
        found_symptoms = {}
        symptom_positions = []

        # 1. Keyword matching (with positions for highlighting)
        for keyword, normalized in self.symptom_keywords.items():
            kw_lower = keyword.lower()
            start = 0
            while True:
                idx = text_lower.find(kw_lower, start)
                if idx == -1:
                    break
                if normalized not in found_symptoms:
                    found_symptoms[normalized] = True
                    symptom_positions.append({
                        "symptom": normalized,
                        "keyword": keyword,
                        "start": idx,
                        "end": idx + len(keyword),
                    })
                start = idx + 1

        # 2. Severity detection
        severity = None
        for sev_word, sev_level in self.severity_indicators.items():
            if sev_word.lower() in text_lower:
                severity = sev_level
                # Use the highest severity found
                if sev_level == "severe":
                    break

        # 3. Duration extraction (regex)
        duration = None
        for pattern in self.duration_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                duration = match.group(0).strip()
                break

        # 4. spaCy NER for additional entities (if available)
        if self._nlp and hasattr(self._nlp, "pipe_names") and "ner" in self._nlp.pipe_names:
            doc = self._nlp(text)
            for ent in doc.ents:
                if ent.label_ in ("DATE", "TIME") and duration is None:
                    duration = ent.text

        symptoms_list = list(found_symptoms.keys())

        return {
            "symptoms": symptoms_list,
            "severity": severity,
            "duration": duration,
            "symptom_positions": symptom_positions,
            "raw_text": text,
        }
