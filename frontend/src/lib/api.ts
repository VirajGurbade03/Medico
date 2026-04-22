// Backend API client
// Wraps all fetch calls to the FastAPI backend with auth headers

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080';

async function request<T>(
  path: string,
  options: RequestInit & { token?: string } = {}
): Promise<T> {
  const { token, ...fetchOptions } = options;

  const headers: Record<string, string> = {
    ...(fetchOptions.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Don't set Content-Type for FormData (browser sets it with boundary)
  if (!(fetchOptions.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${BACKEND_URL}${path}`, {
    ...fetchOptions,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(error.detail || `HTTP ${response.status}`);
  }

  return response.json();
}

// ─── Audio API ────────────────────────────────────────────────────────────────

export async function uploadAudio(
  file: File,
  patientName: string,
  token: string
): Promise<{ session_id: string; file_size_mb: number; audio_url: string }> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('patient_name', patientName);

  return request('/api/upload-audio', {
    method: 'POST',
    body: formData,
    token,
  });
}

export async function transcribeAudio(
  sessionId: string,
  token: string
): Promise<{
  session_id: string;
  language: string;
  language_name: string;
  original_text: string;
  translated_text: string;
  was_translated: boolean;
  segments: Array<{ start: number; end: number; text: string }>;
}> {
  return request('/api/transcribe', {
    method: 'POST',
    body: JSON.stringify({ session_id: sessionId }),
    token,
  });
}

// ─── Analysis API ─────────────────────────────────────────────────────────────

export async function extractSymptoms(
  sessionId: string,
  token: string
): Promise<{
  symptoms: string[];
  severity: string | null;
  duration: string | null;
  symptom_positions: Array<{ symptom: string; keyword: string; start: number; end: number }>;
  count: number;
}> {
  return request('/api/extract-symptoms', {
    method: 'POST',
    body: JSON.stringify({ session_id: sessionId }),
    token,
  });
}

export async function predictDisease(
  sessionId: string,
  token: string
): Promise<{
  predictions: Array<{
    disease: string;
    confidence: number;
    confidence_pct: number;
    rank: number;
  }>;
  top_condition: string | null;
  disclaimer: string;
}> {
  return request('/api/predict-disease', {
    method: 'POST',
    body: JSON.stringify({ session_id: sessionId }),
    token,
  });
}

// ─── Report API ───────────────────────────────────────────────────────────────

export async function generateReport(
  sessionId: string,
  patientName: string,
  doctorNotes: string,
  token: string
): Promise<{
  report_id: string;
  pdf_url: string;
  local_path: string;
  generated_at: string;
}> {
  return request('/api/generate-report', {
    method: 'POST',
    body: JSON.stringify({
      session_id: sessionId,
      patient_name: patientName,
      doctor_notes: doctorNotes,
    }),
    token,
  });
}

export async function getReport(
  reportId: string,
  token: string
): Promise<{ report: Record<string, unknown> }> {
  return request(`/api/report/${reportId}`, { token });
}

export async function listReports(
  token: string
): Promise<{ reports: Array<Record<string, unknown>> }> {
  return request('/api/reports', { token });
}

export async function listSessions(
  token: string
): Promise<{ sessions: Array<Record<string, unknown>> }> {
  return request('/api/sessions', { token });
}

export async function getSession(
  sessionId: string,
  token: string
): Promise<{ session: Record<string, unknown> }> {
  return request(`/api/session/${sessionId}`, { token });
}

// Health check (no auth)
export async function healthCheck(): Promise<{ status: string }> {
  return request('/health');
}
