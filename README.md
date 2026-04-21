# 🏥 AI Clinical Assistant — Medical Conversation Intelligence System

> ⚠️ **IMPORTANT DISCLAIMER**: This is an AI-assisted tool for informational purposes only. It is **NOT a substitute for professional medical advice, diagnosis, or treatment**. All predictions are AI-generated suggestions based on semantic similarity — not clinical diagnoses. Always consult a qualified healthcare professional.

---

## 📋 Overview

A production-ready full-stack application that:
1. **Accepts** doctor-patient conversation audio (MP3, WAV, M4A, etc.)
2. **Transcribes** speech using OpenAI Whisper (local model)
3. **Translates** Hindi/multilingual audio to English (NLLB)
4. **Extracts** symptoms, severity, and duration using NLP
5. **Predicts** probable diseases using Sentence-BERT + 120+ disease database
6. **Generates** downloadable professional PDF reports
7. **Stores** data securely in Firebase (Auth + Firestore + Storage)

---

## 🏗️ Project Structure

```
Medico/
├── backend/                    ← FastAPI Python backend
│   ├── main.py                 ← App entry point
│   ├── requirements.txt        ← Python dependencies
│   ├── .env.example            ← Environment variables template
│   ├── data/
│   │   └── diseases.json       ← 120+ disease database
│   ├── models/
│   │   ├── transcriber.py      ← Whisper + NLLB
│   │   ├── symptom_extractor.py
│   │   └── disease_predictor.py ← Sentence-BERT
│   ├── routes/
│   │   ├── audio.py            ← /upload-audio, /transcribe
│   │   ├── analysis.py         ← /extract-symptoms, /predict-disease
│   │   └── report.py           ← /generate-report, /report/{id}
│   ├── services/
│   │   ├── firebase_service.py
│   │   └── pdf_service.py      ← ReportLab PDF
│   └── utils/
│       ├── auth.py             ← Firebase token verification
│       └── medical_dictionary.py
│
├── frontend/                   ← Next.js 14 frontend
│   ├── src/
│   │   ├── app/
│   │   │   ├── login/page.tsx
│   │   │   ├── signup/page.tsx
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── upload/page.tsx
│   │   │   ├── transcription/page.tsx
│   │   │   ├── analysis/[id]/page.tsx
│   │   │   └── report/[id]/page.tsx
│   │   ├── lib/
│   │   │   ├── firebase.ts
│   │   │   ├── auth-context.tsx
│   │   │   └── api.ts
│   │   └── styles/globals.css
│   ├── package.json
│   └── .env.local.example
│
└── Medical_Report_Analysis.ipynb ← Original research notebook
```

---

## 🚀 Quick Start

### Prerequisites
- Python 3.10+
- Node.js 18+ (install from [nodejs.org](https://nodejs.org))
- Firebase account (free tier works)
- ~4 GB disk space for ML models

---

### 1. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project (e.g., `ai-clinical-assistant`)
3. Enable **Authentication** → Email/Password
4. Enable **Firestore Database** (Start in test mode)
5. Enable **Storage** (Start in test mode)
6. Go to **Project Settings** → **Service Accounts** → **Generate new private key** → Save as `backend/firebase-service-account.json`
7. Go to **Project Settings** → **General** → your web app → copy Firebase config

---

### 2. Backend Setup

```bash
cd d:\Project\Medico\backend

# Create virtual environment
python -m venv venv
venv\Scripts\activate      # Windows

# Install dependencies (takes 5-10 minutes)
pip install -r requirements.txt

# Download spaCy English model
python -m spacy download en_core_web_sm

# Copy and fill environment variables
copy .env.example .env
# Edit .env with your Firebase storage bucket name

# Place your Firebase service account JSON
# → backend/firebase-service-account.json

# Start the backend
uvicorn main:app --reload --port 8000
```

The backend will:
- Download Whisper base model (~150 MB) on first run
- Download Sentence-BERT model (~90 MB) on first run
- Load disease database from `data/diseases.json`

Backend runs at: http://localhost:8000  
API docs at: http://localhost:8000/docs

---

### 3. Frontend Setup

```bash
cd d:\Project\Medico\frontend

# Install dependencies
npm install

# Copy and fill environment variables
copy .env.local.example .env.local
# Edit .env.local with your Firebase web config

# Start the frontend
npm run dev
```

Frontend runs at: http://localhost:3000

---

## 🔑 Environment Variables

### Backend (`backend/.env`)
```env
FIREBASE_SERVICE_ACCOUNT_PATH=./firebase-service-account.json
FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
SECRET_KEY=your-random-secret-key
WHISPER_MODEL=base       # tiny/base/small/medium/large
```

### Frontend (`frontend/.env.local`)
```env
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
```

---

## 📡 API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/health` | ❌ | Backend health check |
| POST | `/api/upload-audio` | ✅ | Upload audio file |
| POST | `/api/transcribe` | ✅ | Transcribe uploaded audio |
| POST | `/api/extract-symptoms` | ✅ | Extract symptoms from text |
| POST | `/api/predict-disease` | ✅ | Predict probable diseases |
| POST | `/api/generate-report` | ✅ | Generate PDF report |
| GET | `/api/report/{id}` | ✅ | Get report by ID |
| GET | `/api/reports` | ✅ | List user's reports |
| GET | `/api/report/{id}/download` | ✅ | Download PDF directly |

Interactive API docs: http://localhost:8000/docs

---

## 🧠 AI/ML Pipeline

```
Audio File
    ↓
Whisper STT (openai/whisper-base)
    ↓ [if Hindi/non-English]
NLLB Translation (facebook/nllb-200-distilled-600M)
    ↓
English Transcription
    ↓
Symptom Extractor (keyword matching + spaCy NER)
    ↓ symptoms + severity + duration
Disease Predictor
    ├─ Query embedding (all-MiniLM-L6-v2 Sentence-BERT)
    ├─ Cosine similarity vs 120+ disease descriptions
    └─ Top-5 predictions with confidence %
    ↓
PDF Report Generator (ReportLab)
    ↓
Firebase Storage (PDF) + Firestore (metadata)
```

---

## 🌐 Deployment

### Frontend → Vercel
```bash
# In frontend/
npm run build          # Verify build passes
npx vercel --prod      # Deploy to Vercel
# Set environment variables in Vercel dashboard
```

### Backend → Render
1. Create a new Web Service at [render.com](https://render.com)
2. Connect your GitHub repo
3. Set Build Command: `pip install -r requirements.txt && python -m spacy download en_core_web_sm`
4. Set Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Add environment variables in Render dashboard
6. Upload `firebase-service-account.json` as a Secret File

---

## 🔒 Security Notes

- All API endpoints (except `/health`) require Firebase ID tokens
- Audio files are stored in Firebase Storage with user-scoped paths
- PDF reports have user ownership validation before download
- CORS is configured to allow only specified origins
- No sensitive data is logged

---

## 🛠️ Supported Audio Formats

MP3, WAV, M4A, OGG, FLAC, WebM, MP4 · Max 50 MB

## 🌍 Supported Languages

- **English** (primary)
- **Hindi** (with auto-translation via NLLB)
- Other languages Whisper supports (transcribed in original language)

---

## 📦 Key Dependencies

| Package | Purpose |
|---------|---------|
| `openai-whisper` | Speech-to-text |
| `transformers` | NLLB translation model |
| `sentence-transformers` | Semantic disease matching |
| `spacy` | NLP symptom extraction |
| `firebase-admin` | Firebase backend SDK |
| `reportlab` | PDF generation |
| `fastapi` | REST API framework |
| `next` | React frontend framework |
| `recharts` | Disease probability charts |
| `firebase` | Firebase frontend SDK |

---

*Built with ❤️ for healthcare AI — always prioritizing patient safety and data privacy.*
