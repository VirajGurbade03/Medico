import os
import pandas as pd
import numpy as np
import logging
import joblib
from pathlib import Path
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, roc_auc_score
from sklearn.impute import SimpleImputer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler

logging.basicConfig(level=logging.INFO, format='%(asctime)s [%(levelname)s] %(message)s')
logger = logging.getLogger(__name__)

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data" / "mimic3" / "mimic-iii-clinical-database-demo-1.4"
MODEL_DIR = BASE_DIR / "models" / "weights"

# Common CHARTEVENTS ITEMIDs for Vitals
ITEMIDs = {
    'heart_rate': [211, 220045],
    'temperature': [676, 223761], # F and C
    'resp_rate': [618, 220210, 224690],
    'sys_bp': [51, 442, 455, 6701, 220179, 220050],
}
ALL_ITEMIDS = [item for sublist in ITEMIDs.values() for item in sublist]

def load_and_preprocess_data():
    logger.info("Loading ADMISSIONS...")
    admissions = pd.read_csv(DATA_DIR / "ADMISSIONS.csv")
    admissions.columns = admissions.columns.str.lower()
    admissions = admissions[['hadm_id', 'subject_id', 'admittime']]

    logger.info("Loading DIAGNOSES_ICD (extracting Sepsis labels)...")
    diagnoses = pd.read_csv(DATA_DIR / "DIAGNOSES_ICD.csv")
    diagnoses.columns = diagnoses.columns.str.lower()
    
    # ICD9 for Sepsis/Septicemia: 99591, 99592, 038%
    diagnoses['is_sepsis'] = diagnoses['icd9_code'].astype(str).str.startswith('038') | \
                             diagnoses['icd9_code'].astype(str).isin(['99591', '99592'])
    
    # Label at the hadm_id level
    sepsis_labels = diagnoses.groupby('hadm_id')['is_sepsis'].max().reset_index()
    sepsis_labels['is_sepsis'] = sepsis_labels['is_sepsis'].astype(int)

    logger.info("Loading PATIENTS (for age)...")
    patients = pd.read_csv(DATA_DIR / "PATIENTS.csv")
    patients.columns = patients.columns.str.lower()
    patients = patients[['subject_id', 'dob', 'gender']]

    df = pd.merge(admissions, sepsis_labels, on='hadm_id', how='left')
    df['is_sepsis'] = df['is_sepsis'].fillna(0).astype(int)
    df = pd.merge(df, patients, on='subject_id', how='left')

    # Calculate approximate age at admission
    df['admittime'] = pd.to_datetime(df['admittime'])
    df['dob'] = pd.to_datetime(df['dob'])
    df['age'] = df['admittime'].dt.year - df['dob'].dt.year
    # MIMIC masks ages > 89 by setting dob to 300 years prior. Cap at 90.
    df.loc[df['age'] > 150, 'age'] = 90
    
    logger.info("Loading CHARTEVENTS for vitals ...")
    # Only load columns we need to save memory
    col_names = pd.read_csv(DATA_DIR / "CHARTEVENTS.csv", nrows=0).columns.str.lower().tolist()
    usecols = ['hadm_id', 'itemid', 'valuenum']
    # Check if the CSV uses lower or upper. It's lowercase from our tests.
    chartevents = pd.read_csv(DATA_DIR / "CHARTEVENTS.csv", usecols=usecols)
    
    # Filter only relevant items
    chartevents = chartevents[chartevents['itemid'].isin(ALL_ITEMIDS)]

    # Map ITEMIDs to categories
    item_to_cat = {}
    for cat, ids in ITEMIDs.items():
        for i in ids:
            item_to_cat[i] = cat
    
    chartevents['vital_type'] = chartevents['itemid'].map(item_to_cat)

    # Clean extreme values (simple clipping based on physiological bounds)
    chartevents.loc[(chartevents['vital_type'] == 'heart_rate') & ((chartevents['valuenum'] < 0) | (chartevents['valuenum'] > 300)), 'valuenum'] = np.nan
    chartevents.loc[(chartevents['vital_type'] == 'sys_bp') & ((chartevents['valuenum'] < 0) | (chartevents['valuenum'] > 400)), 'valuenum'] = np.nan
    
    # Fix temperatures: MIMIC has F and C. Convert F > 90 to C roughly.
    temps = chartevents['vital_type'] == 'temperature'
    is_f = temps & (chartevents['valuenum'] > 90)
    chartevents.loc[is_f, 'valuenum'] = (chartevents.loc[is_f, 'valuenum'] - 32) * 5.0 / 9.0

    # Aggregate by hadm_id and vital_type
    logger.info("Aggregating vitals per admission...")
    vitals_agg = chartevents.groupby(['hadm_id', 'vital_type'])['valuenum'].agg(['mean', 'max', 'min']).unstack('vital_type')
    
    # Flatten multi-index columns: mean_heart_rate, max_heart_rate, etc.
    if vitals_agg.columns.nlevels > 1:
        vitals_agg.columns = [f"{stat}_{cat}" for stat, cat in vitals_agg.columns]
    vitals_agg = vitals_agg.reset_index()

    # Merge into main dataframe
    logger.info("Merging features...")
    final_df = pd.merge(df, vitals_agg, on='hadm_id', how='left')

    return final_df

def train_model():
    df = load_and_preprocess_data()
    
    logger.info(f"Total admissions for training: {len(df)}")
    logger.info(f"Sepsis prevalence: {df['is_sepsis'].mean():.2%}")

    # Define features
    features = ['age']
    for cat in ITEMIDs.keys():
        features.extend([f"mean_{cat}", f"max_{cat}", f"min_{cat}"])
        
    # Ensure all features exist (if data is missing that column entirely, impute it)
    for f in features:
        if f not in df.columns:
            df[f] = np.nan
            
    X = df[features]
    y = df['is_sepsis']

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

    # Scikit-learn Pipeline: Impute missing values with median, scale, then RandomForest
    pipeline = Pipeline([
        ('imputer', SimpleImputer(strategy='median')),
        ('scaler', StandardScaler()),
        # class_weight='balanced' helps with class imbalance
        ('classifier', RandomForestClassifier(n_estimators=100, max_depth=10, random_state=42, class_weight='balanced')) 
    ])

    logger.info("Training Sepsis RandomForest Classifier...")
    pipeline.fit(X_train, y_train)

    # Evaluate
    y_pred = pipeline.predict(X_test)
    y_proba = pipeline.predict_proba(X_test)[:, 1]
    
    logger.info("\n" + classification_report(y_test, y_pred))
    logger.info(f"ROC-AUC Score: {roc_auc_score(y_test, y_proba):.4f}")

    # Save Model
    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    model_path = MODEL_DIR / "sepsis_rf_model.joblib"
    joblib.dump(pipeline, model_path)
    logger.info(f"✅ Model saved to {model_path}")

if __name__ == "__main__":
    train_model()
