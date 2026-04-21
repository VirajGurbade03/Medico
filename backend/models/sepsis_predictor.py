import logging
import joblib
import pandas as pd
from pathlib import Path

logger = logging.getLogger(__name__)

class SepsisPredictorService:
    def __init__(self):
        self.model = None
        self._load_model()

    def _load_model(self):
        model_path = Path(__file__).resolve().parent / "weights" / "sepsis_rf_model.joblib"
        try:
            if model_path.exists():
                self.model = joblib.load(model_path)
                logger.info(f"\u2705 Sepsis predictor loaded from {model_path.name}")
            else:
                logger.warning(f"Sepsis model not found at {model_path}. Predictor will return defaults.")
        except Exception as e:
            logger.error(f"Failed to load Sepsis model: {e}")

    def predict_risk(self, vitals: dict) -> dict:
        """
        Takes raw vitals, formats them for the pipeline, and predicts sepsis risk.
        Requires features matching training:
        age, mean_heart_rate, max_heart_rate, min_heart_rate, mean_temperature, ...
        """
        if self.model is None:
            return {"risk_probability": 0.5, "status": "Model Unavailable", "confidence_level": "UNKNOWN"}

        # Provide a default payload mapping 
        # Typically frontend sends standard names: hr, temp, resp, sys_bp, age
        # Create a single-row DataFrame using required training feature names
        
        feature_dict = {
            'age': [vitals.get('age', 60.0)],
            'mean_heart_rate': [vitals.get('hr_mean', 80.0)],
            'max_heart_rate': [vitals.get('hr_max', vitals.get('hr', 80.0))],
            'min_heart_rate': [vitals.get('hr_min', vitals.get('hr', 80.0))],
            
            'mean_temperature': [vitals.get('temp_mean', 37.0)],
            'max_temperature': [vitals.get('temp_max', vitals.get('temp', 37.0))],
            'min_temperature': [vitals.get('temp_min', vitals.get('temp', 37.0))],
            
            'mean_resp_rate': [vitals.get('resp_mean', 16.0)],
            'max_resp_rate': [vitals.get('resp_max', vitals.get('resp', 16.0))],
            'min_resp_rate': [vitals.get('resp_min', vitals.get('resp', 16.0))],
            
            'mean_sys_bp': [vitals.get('sys_bp_mean', 120.0)],
            'max_sys_bp': [vitals.get('sys_bp_max', vitals.get('sys_bp', 120.0))],
            'min_sys_bp': [vitals.get('sys_bp_min', vitals.get('sys_bp', 120.0))]
        }
        
        df = pd.DataFrame(feature_dict)
        
        try:
            proba = self.model.predict_proba(df)[0][1]
            prob_percent = int(proba * 100)
            
            if proba > 0.65:
                status = "CRITICAL"
            elif proba > 0.40:
                status = "ELEVATED"
            else:
                status = "NORMAL"
                
            return {
                "risk_probability": prob_percent,
                "status": status,
                "confidence_level": "HIGH"
            }
        except Exception as e:
            logger.error(f"Sepsis prediction error: {e}")
            return {"risk_probability": 0, "status": "ERROR", "confidence_level": "UNKNOWN"}
