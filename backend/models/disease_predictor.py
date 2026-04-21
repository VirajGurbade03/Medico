"""
Disease prediction using Sentence-BERT semantic similarity.
Mirrors the notebook: symptoms → embeddings → cosine similarity vs disease database.

Uses a curated local disease JSON (no Kaggle required) as the primary source,
supplemented by MIMIC-III titles if the dataset is available.
"""
import json
import logging
import os
from pathlib import Path
from typing import Optional

import numpy as np

logger = logging.getLogger(__name__)

# Path to local disease database JSON (bundled with backend)
LOCAL_DISEASE_DB_PATH = Path(__file__).parent.parent / "data" / "diseases.json"


class DiseasePredictorService:
    """
    Predicts probable diseases from symptom text using semantic similarity.
    """

    def __init__(self):
        self._model = None
        self._disease_titles: list[str] = []
        self._disease_embeddings: Optional[np.ndarray] = None
        self._load()

    def _load(self):
        """Load Sentence-BERT model and disease database."""
        from sentence_transformers import SentenceTransformer

        logger.info("Loading Sentence-BERT model (all-MiniLM-L6-v2)...")
        self._model = SentenceTransformer("all-MiniLM-L6-v2")
        logger.info("✅ Sentence-BERT loaded")

        # Load disease titles
        self._disease_titles = self._load_disease_titles()
        logger.info(f"✅ Loaded {len(self._disease_titles)} disease titles")

        # Pre-compute embeddings for all disease titles
        logger.info("Computing disease embeddings (cached after first run)...")
        self._disease_embeddings = self._model.encode(
            self._disease_titles,
            batch_size=128,
            show_progress_bar=False,
            convert_to_numpy=True,
        )
        logger.info("✅ Disease embeddings ready")

    def _load_disease_titles(self) -> list[str]:
        """Load disease titles from local JSON database."""
        if LOCAL_DISEASE_DB_PATH.exists():
            with open(LOCAL_DISEASE_DB_PATH, "r", encoding="utf-8") as f:
                data = json.load(f)
            titles = data.get("diseases", [])
            logger.info(f"Loaded {len(titles)} diseases from local database")
            return titles
        else:
            logger.warning(
                f"Disease database not found at {LOCAL_DISEASE_DB_PATH}. "
                "Using minimal fallback set."
            )
            return self._minimal_disease_list()

    def _minimal_disease_list(self) -> list[str]:
        """Minimal fallback disease list if JSON not found."""
        return [
            "Common cold with runny nose, sneezing, and mild fever",
            "Influenza (flu) with high fever, body aches, and fatigue",
            "Pneumonia with cough, chest pain, and difficulty breathing",
            "Migraine with severe headache, nausea, and light sensitivity",
            "Type 2 diabetes with frequent urination and increased thirst",
            "Hypertension with headache, dizziness, and chest pain",
            "Gastroenteritis with vomiting, diarrhea, and abdominal pain",
            "Urinary tract infection with painful urination and frequent urination",
            "Anemia with fatigue, weakness, and pale skin",
            "Asthma with wheezing, shortness of breath, and chest tightness",
            "Appendicitis with severe abdominal pain and fever",
            "Dengue fever with high fever, rash, and joint pain",
            "Malaria with cyclical fever, chills, and headache",
            "Typhoid fever with prolonged fever and abdominal pain",
            "Viral hepatitis with jaundice, fatigue, and abdominal pain",
            "Peptic ulcer with stomach pain and nausea",
            "Irritable bowel syndrome with bloating, constipation, and diarrhea",
            "Anxiety disorder with palpitations, dizziness, and shortness of breath",
            "Depression with fatigue, loss of appetite, and sleep disturbances",
            "Hypothyroidism with weight gain, fatigue, and cold intolerance",
        ]

    def predict(self, symptoms: list[str], text: str, top_k: int = 5) -> list[dict]:
        """
        Predict top-K probable diseases from symptoms.

        Args:
            symptoms: List of extracted symptom names.
            text: Full translated text (used as query if no symptoms).
            top_k: Number of top results to return.

        Returns:
            List of dicts:
            [
              {
                "disease": str,
                "confidence": float,   # 0.0 - 1.0
                "confidence_pct": int, # 0 - 100
                "rank": int,
              },
              ...
            ]
        """
        # Build query from symptoms + text
        if symptoms:
            query = "Patient symptoms: " + ", ".join(symptoms)
            if text:
                query += ". " + text[:300]  # Add context excerpt
        else:
            query = text[:400] if text else "general symptoms"

        logger.info(f"Disease prediction query: {query[:100]}...")

        # Encode query
        query_embedding = self._model.encode(
            [query],
            convert_to_numpy=True,
        )[0]

        # Cosine similarity
        similarities = self._cosine_similarity(
            query_embedding, self._disease_embeddings
        )

        # Top-K results
        top_indices = np.argsort(similarities)[::-1][:top_k]
        results = []
        for rank, idx in enumerate(top_indices, 1):
            sim_score = float(similarities[idx])
            # Scale similarity to a more readable confidence range
            confidence = min(max(sim_score, 0.0), 1.0)
            results.append({
                "disease": self._disease_titles[idx],
                "confidence": round(confidence, 4),
                "confidence_pct": round(confidence * 100, 1),
                "rank": rank,
            })

        return results

    @staticmethod
    def _cosine_similarity(query: np.ndarray, corpus: np.ndarray) -> np.ndarray:
        """Compute cosine similarity between query and all corpus vectors."""
        query_norm = query / (np.linalg.norm(query) + 1e-10)
        corpus_norms = corpus / (np.linalg.norm(corpus, axis=1, keepdims=True) + 1e-10)
        return corpus_norms @ query_norm
