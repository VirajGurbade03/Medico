"""
Medical symptom dictionary for keyword-based extraction.
Contains symptoms in English and Hindi transliteration.
"""

# Comprehensive symptom keyword mapping
# Format: keyword → normalized symptom name
SYMPTOM_KEYWORDS = {
    # --- Fever / Temperature ---
    "fever": "fever",
    "temperature": "fever",
    "bukhar": "fever",
    "bukhaar": "fever",
    "febrile": "fever",
    "pyrexia": "fever",
    "high temperature": "fever",
    "chills": "chills",
    "ठंड लगना": "chills",
    "shivering": "chills",

    # --- Pain ---
    "pain": "pain",
    "ache": "pain",
    "dard": "pain",
    "hurts": "pain",
    "sore": "pain",
    "soreness": "pain",

    # --- Headache ---
    "headache": "headache",
    "head pain": "headache",
    "sir dard": "headache",
    "migraine": "migraine",
    "cephalgia": "headache",

    # --- Cough ---
    "cough": "cough",
    "khansi": "cough",
    "khaansi": "cough",
    "dry cough": "dry cough",
    "wet cough": "productive cough",
    "productive cough": "productive cough",

    # --- Breathing ---
    "shortness of breath": "shortness of breath",
    "breathlessness": "shortness of breath",
    "difficulty breathing": "shortness of breath",
    "saans": "shortness of breath",
    "saans lene mein taklif": "shortness of breath",
    "dyspnea": "shortness of breath",
    "wheezing": "wheezing",

    # --- Fatigue ---
    "tired": "fatigue",
    "tiredness": "fatigue",
    "fatigue": "fatigue",
    "weakness": "weakness",
    "weak": "weakness",
    "kamzori": "weakness",
    "thakan": "fatigue",
    "lethargy": "fatigue",
    "exhaustion": "fatigue",
    "low energy": "fatigue",

    # --- Nausea / Vomiting ---
    "nausea": "nausea",
    "nauseous": "nausea",
    "vomiting": "vomiting",
    "vomit": "vomiting",
    "ulti": "vomiting",
    "chakkar": "dizziness",
    "dizziness": "dizziness",
    "dizzy": "dizziness",
    "vertigo": "dizziness",

    # --- Stomach / GI ---
    "stomach pain": "abdominal pain",
    "abdominal pain": "abdominal pain",
    "pet dard": "abdominal pain",
    "stomach ache": "abdominal pain",
    "indigestion": "indigestion",
    "bloating": "bloating",
    "constipation": "constipation",
    "diarrhea": "diarrhea",
    "diarrhoea": "diarrhea",
    "loose motions": "diarrhea",
    "loose stools": "diarrhea",
    "motions": "diarrhea",
    "heartburn": "heartburn",
    "acidity": "heartburn",
    "acid reflux": "heartburn",

    # --- Chest ---
    "chest pain": "chest pain",
    "chest tightness": "chest tightness",
    "palpitations": "palpitations",
    "heart racing": "palpitations",
    "chest pressure": "chest pain",

    # --- Skin ---
    "rash": "skin rash",
    "itching": "itching",
    "khujli": "itching",
    "hives": "hives",
    "swelling": "swelling",
    "edema": "edema",
    "redness": "redness",
    "skin rash": "skin rash",
    "jaundice": "jaundice",
    "yellowing": "jaundice",

    # --- Musculoskeletal ---
    "joint pain": "joint pain",
    "muscle pain": "muscle pain",
    "muscle ache": "muscle pain",
    "back pain": "back pain",
    "body ache": "body aches",
    "body pain": "body aches",
    "stiffness": "stiffness",

    # --- Urinary ---
    "frequent urination": "frequent urination",
    "burning urination": "painful urination",
    "painful urination": "painful urination",
    "blood in urine": "hematuria",
    "dark urine": "dark urine",

    # --- Neurological ---
    "numbness": "numbness",
    "tingling": "tingling",
    "confusion": "confusion",
    "memory loss": "memory loss",
    "seizure": "seizure",
    "unconscious": "loss of consciousness",
    "fainting": "syncope",

    # --- ENT ---
    "sore throat": "sore throat",
    "throat pain": "sore throat",
    "gala dard": "sore throat",
    "runny nose": "runny nose",
    "nasal congestion": "nasal congestion",
    "blocked nose": "nasal congestion",
    "sneezing": "sneezing",
    "ear pain": "ear pain",
    "hearing loss": "hearing loss",

    # --- Eye ---
    "eye pain": "eye pain",
    "red eye": "eye redness",
    "blurred vision": "blurred vision",
    "watery eyes": "watery eyes",

    # --- Weight / Appetite ---
    "weight loss": "weight loss",
    "weight gain": "weight gain",
    "loss of appetite": "loss of appetite",
    "increased appetite": "increased appetite",

    # --- Sleep ---
    "insomnia": "insomnia",
    "unable to sleep": "insomnia",
    "excessive sleep": "hypersomnia",

    # --- Mental ---
    "anxiety": "anxiety",
    "depression": "depression",
    "mood swings": "mood changes",

    # --- Reproductive (Female) ---
    "irregular periods": "irregular menstruation",
    "heavy bleeding": "heavy menstrual bleeding",
    "pain during periods": "dysmenorrhea",

    # --- General ---
    "loss of taste": "anosmia/ageusia",
    "loss of smell": "anosmia/ageusia",
    "night sweats": "night sweats",
    "frequent infections": "recurrent infections",
    "slow healing": "poor wound healing",
}

# Severity words recognized in context
SEVERITY_INDICATORS = {
    "severe": "severe",
    "intense": "severe",
    "extreme": "severe",
    "unbearable": "severe",
    "mild": "mild",
    "slight": "mild",
    "minor": "mild",
    "moderate": "moderate",
    "medium": "moderate",
    "thoda": "mild",       # Hindi: a little
    "bahut": "severe",     # Hindi: a lot
    "zyada": "severe",     # Hindi: more/excessive
    "kam": "mild",         # Hindi: less
}

# Duration patterns (matched after symptom)
DURATION_PATTERNS = [
    r"\b(\d+)\s*(day|days|din|dino|week|weeks|month|months|year|years)\b",
    r"\b(since|for|past)\s+(\d+)\s*(day|days|week|weeks|month|months)\b",
    r"\b(kuch|kaafi)\s+(din|dino|hafte|hafton|mahine)\b",  # Hindi patterns
]
