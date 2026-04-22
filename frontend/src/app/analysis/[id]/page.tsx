'use client';
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts';
import { useAuth } from '@/lib/auth-context';
import { generateReport } from '@/lib/api';
import { PageTransition, StaggerContainer, FadeInItem } from '@/components/PageTransition';
import { 
  Stethoscope, FileText, AlertTriangle, Loader2, 
  Dna, Activity, Globe, ClipboardList, Clock, 
  BrainCircuit, LayoutDashboard, BarChart as BarChartIcon
} from 'lucide-react';

interface SessionData {
  session_id: string;
  patient_name?: string;
  translated_text?: string;
  original_text?: string;
  language_name?: string;
  was_translated?: boolean;
  symptoms?: string[];
  severity?: string;
  duration?: string;
  diseases?: Array<{ disease: string; confidence_pct: number; rank: number }>;
}

// Custom tooltip for Recharts
const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: { full: string }; value: number }> }) => {
  if (active && payload?.length) {
    return (
      <div style={{
        background: 'white', border: '1px solid var(--gray-200)',
        borderRadius: 8, padding: '0.75rem 1rem',
        boxShadow: 'var(--shadow-md)', maxWidth: 280,
      }}>
        <p style={{ fontSize: '0.8125rem', color: 'var(--gray-700)', marginBottom: '0.25rem', lineHeight: 1.4 }}>
          {payload[0].payload.full}
        </p>
        <p style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--blue-600)' }}>
          {payload[0].value}% similarity
        </p>
      </div>
    );
  }
  return null;
};

export default function AnalysisPage() {
  const { user, getIdToken } = useAuth();
  const router = useRouter();
  const params = useParams();
  const sessionId = params.id as string;

  const [session, setSession] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [doctorNotes, setDoctorNotes] = useState('');
  const [generating, setGenerating] = useState(false);
  const [reportId, setReportId] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!sessionId || !user) return;
    loadSession();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, user]);

  const loadSession = async () => {
    try {
      const token = await getIdToken();
      if (!token) return;
      // Load from backend
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/report/${sessionId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      ).catch(() => null);

      // If no stored report, use what we got from transcription page (or show placeholder)
      // In a full app, we'd store session data in Firestore and retrieve here
      // For now, show a rich placeholder
      setSession({
        session_id: sessionId,
        patient_name: 'Patient',
        diseases: [
          { rank: 1, disease: 'Common cold with runny nose, sneezing, and mild fever', confidence_pct: 72.4 },
          { rank: 2, disease: 'Influenza (flu) with high fever, body aches, and fatigue', confidence_pct: 65.1 },
          { rank: 3, disease: 'Allergic rhinitis with sneezing, itchy eyes, and nasal congestion', confidence_pct: 58.3 },
          { rank: 4, disease: 'Sinusitis with facial pressure, nasal congestion, and headache', confidence_pct: 51.2 },
          { rank: 5, disease: 'COVID-19 with fever, cough, loss of taste, and fatigue', confidence_pct: 44.7 },
        ],
        symptoms: ['fever', 'cough', 'fatigue', 'headache', 'sore throat', 'runny nose'],
        severity: 'moderate',
        duration: '3 days',
        translated_text: 'Patient reports fever for 3 days, cough, fatigue, and headache. Sore throat noted. No significant travel history.',
        language_name: 'Hindi',
        was_translated: true,
      });
    } catch {
      setError('Failed to load session data.');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = async () => {
    if (!user || !session) return;
    setGenerating(true);
    setError('');
    try {
      const token = await getIdToken();
      if (!token) throw new Error('Auth error');
      const result = await generateReport(
        sessionId,
        session.patient_name || '',
        doctorNotes,
        token
      );
      setReportId(result.report_id);
      router.push(`/report/${result.report_id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Report generation failed');
    } finally {
      setGenerating(false);
    }
  };

  const chartData = session?.diseases?.map(d => ({
    name: d.disease.split(' ').slice(0, 3).join(' ') + '...',
    full: d.disease,
    value: d.confidence_pct,
    rank: d.rank,
  })) || [];

  const COLORS = ['#1A73E8', '#4285F4', '#669DF6', '#8AB4F8', '#AECBFA'];
  const SEVERITY_COLORS: Record<string, string> = { mild: '#1E8E3E', moderate: '#F9AB00', severe: '#D93025' };

  if (loading) {
    return (
      <div className="flex-center bg-subtle-pattern" style={{ minHeight: '100vh' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <div className="pulse-indicator" style={{ width: 16, height: 16 }} />
          <p style={{ color: 'var(--gray-600)', fontWeight: 500 }}>Loading analysis...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrapper bg-subtle-pattern">
      {/* Navbar */}
      <nav style={{
        background: 'rgba(255, 255, 255, 0.95)', borderBottom: '1px solid var(--gray-200)',
        backdropFilter: 'blur(10px)',
        padding: '0 1.5rem', height: 64, display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50,
        boxShadow: 'var(--shadow-sm)',
      }}>
        <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', textDecoration: 'none' }}>
          <div style={{ background: 'var(--blue-50)', padding: '0.375rem', borderRadius: 'var(--radius-sm)' }}>
             <Stethoscope size={20} color="var(--blue-600)" />
          </div>
          <span style={{ fontWeight: 700, fontSize: '1.0625rem', color: 'var(--blue-900)' }}>Clinica AI</span>
        </Link>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Link href="/dashboard" className="btn btn-secondary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <LayoutDashboard size={16} /> Dashboard
          </Link>
          <button
            className="btn btn-primary btn-sm"
            onClick={handleGenerateReport}
            disabled={generating}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            {generating ? <><span className="pulse-indicator" style={{ width: 10, height: 10, backgroundColor: 'white' }} /> Generating...</> : <><FileText size={16} /> Generate Report</>}
          </button>
        </div>
      </nav>

      <PageTransition>
        <main className="main-content">
          <div className="container">
            <div className="flex-between animate-fade-in" style={{ marginBottom: '1.5rem' }}>
              <div>
                <h1 style={{ fontSize: '1.75rem', marginBottom: '0.25rem', color: 'var(--gray-900)' }}>Analysis Results</h1>
                <p style={{ color: 'var(--gray-600)', fontSize: '0.9375rem', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <span>Session {sessionId.slice(0, 8)}...</span>
                  <span>·</span>
                  <span style={{ fontWeight: 500, color: 'var(--gray-800)' }}>{session?.patient_name || 'Anonymous Patient'}</span>
                  {session?.language_name && (
                    <>
                      <span>·</span>
                      <span className="badge badge-gray" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Globe size={12} /> {session.language_name}
                      </span>
                    </>
                  )}
                  {session?.was_translated && <span className="badge badge-green">Translated</span>}
                </p>
              </div>
              {session?.severity && (
                <span className="badge" style={{
                  background: SEVERITY_COLORS[session.severity] + '15',
                  color: SEVERITY_COLORS[session.severity],
                  fontSize: '0.9375rem', padding: '0.5rem 1rem',
                  border: `1px solid ${SEVERITY_COLORS[session.severity]}30`
                }}>
                  {session.severity.charAt(0).toUpperCase() + session.severity.slice(1)} Severity
                </span>
              )}
            </div>

            <div className="disclaimer animate-fade-in" style={{ marginBottom: '1.5rem', animationDelay: '0.1s', background: '#FCE8E6', borderLeft: '4px solid #D93025', color: '#A50E0E' }}>
              <AlertTriangle size={20} style={{ flexShrink: 0 }} />
              <span><strong>DISCLAIMER:</strong> All predictions below are AI-assisted suggestions based on semantic similarity to medical descriptions. They are NOT medical diagnoses. Please consult a qualified healthcare professional.</span>
            </div>

            <div className="grid-2 animate-fade-in" style={{ animationDelay: '0.15s', marginBottom: '1.5rem' }}>
              {/* Stats Card */}
              <div className="card" style={{ background: 'linear-gradient(135deg, var(--blue-800), var(--blue-600))', color: 'white', border: 'none', boxShadow: 'var(--shadow-md)' }}>
                <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.875rem', marginBottom: '1rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <BrainCircuit size={16} /> Session Overview
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                  {[
                    { label: 'Symptoms Found', value: session?.symptoms?.length || 0 },
                    { label: 'Conditions Analyzed', value: session?.diseases?.length || 0 },
                    { label: 'Duration', value: session?.duration || 'N/A' },
                    { label: 'Top Match', value: `${session?.diseases?.[0]?.confidence_pct || 0}%` },
                  ].map((stat, i) => (
                    <div key={i}>
                      <p style={{ fontSize: '1.875rem', fontWeight: 800, color: 'white', lineHeight: 1, marginBottom: '0.25rem' }}>{stat.value}</p>
                      <p style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>{stat.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Symptoms Card */}
              <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
                <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.125rem' }}>
                  <Activity size={20} color="var(--green-600)" /> Extracted Symptoms
                </h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', flex: 1 }}>
                  {session?.symptoms?.map((sym, i) => (
                    <span key={i} className="badge badge-blue" style={{ fontSize: '0.875rem', padding: '0.375rem 0.875rem', background: 'var(--blue-50)', border: '1px solid var(--blue-200)', height: 'fit-content' }}>
                      {sym.charAt(0).toUpperCase() + sym.slice(1)}
                    </span>
                  )) || <p style={{ color: 'var(--gray-500)' }}>No symptoms extracted</p>}
                </div>
                {session?.duration && (
                  <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--gray-100)', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--gray-700)' }}>
                    <Clock size={16} color="var(--gray-500)" />
                    <span style={{ fontSize: '0.9375rem' }}>Duration: <strong>{session.duration}</strong></span>
                  </div>
                )}
              </div>
            </div>

            <StaggerContainer style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Disease Probability Chart */}
              {chartData.length > 0 && (
                <FadeInItem>
                  <div className="card">
                    <h3 style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.125rem' }}>
                      <BarChartIcon width={20} height={20} color="var(--blue-600)" /> Disease Probability Chart
                    </h3>
                    <div className="disclaimer" style={{ marginBottom: '1.25rem', background: 'var(--blue-50)', borderLeft: '4px solid var(--blue-500)', color: 'var(--blue-900)' }}>
                      <AlertTriangle size={18} color="var(--blue-600)" style={{ flexShrink: 0 }} />
                      <span>Scores represent semantic similarity to disease descriptions, not clinical probability.</span>
                    </div>
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart
                        data={chartData}
                        layout="vertical"
                        margin={{ top: 0, right: 60, left: 20, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                        <XAxis type="number" domain={[0, 100]} tickFormatter={v => `${v}%`} style={{ fontSize: '0.75rem', fill: 'var(--gray-500)' }} />
                        <YAxis type="category" dataKey="name" width={160} style={{ fontSize: '0.75rem', fill: 'var(--gray-700)', fontWeight: 500 }} />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--gray-50)' }} />
                        <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={24}>
                          {chartData.map((_, i) => (
                            <Cell key={i} fill={COLORS[i] || '#CBD5E1'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </FadeInItem>
              )}

              {/* Disease List */}
              <FadeInItem>
                <div className="card">
                  <div className="flex-between" style={{ marginBottom: '1.25rem' }}>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.125rem' }}>
                      <Dna size={20} color="var(--success)" /> Top Predicted Conditions
                    </h3>
                    <span className="badge badge-red" style={{ fontWeight: 600 }}>AI Suggestions Only</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                    {session?.diseases?.map((d, i) => (
                      <div key={i} style={{
                        padding: '1.25rem',
                        background: i === 0 ? '#F0F7FF' : 'var(--gray-50)',
                        borderRadius: 'var(--radius-md)',
                        border: `1px solid ${i === 0 ? 'var(--blue-200)' : 'var(--gray-200)'}`,
                        display: 'flex', alignItems: 'center', gap: '1.25rem',
                        transition: 'transform 0.2s, box-shadow 0.2s',
                      }} className="hover-lift">
                        <div style={{
                          width: 44, height: 44, borderRadius: '50%',
                          background: COLORS[i] || '#CBD5E1',
                          color: 'white', display: 'flex', alignItems: 'center',
                          justifyContent: 'center', fontWeight: 800, flexShrink: 0,
                          fontSize: '1rem', boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                        }}>#{d.rank}</div>
                        <div style={{ flex: 1 }}>
                          <p style={{ fontWeight: 600, marginBottom: '0.375rem', color: 'var(--gray-900)' }}>
                            {d.disease.charAt(0).toUpperCase() + d.disease.slice(1)}
                          </p>
                          <div className="progress-track" style={{ height: 8, marginTop: '0.25rem', background: 'var(--gray-200)' }}>
                            <div className="progress-fill" style={{ width: `${d.confidence_pct}%`, background: COLORS[i] }} />
                          </div>
                        </div>
                        <span style={{ fontWeight: 800, fontSize: '1.25rem', color: COLORS[i], flexShrink: 0 }}>
                          {d.confidence_pct}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </FadeInItem>

              {/* Transcription */}
              {session?.translated_text && (
                <FadeInItem>
                  <div className="card">
                    <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.125rem' }}>
                      <FileText size={20} color="var(--gray-600)" /> Conversation Text
                    </h3>
                    <div style={{
                      background: 'var(--gray-50)', borderRadius: 'var(--radius-sm)',
                      padding: '1.25rem', lineHeight: 1.8, fontSize: '0.9375rem',
                      border: '1px solid var(--gray-200)', color: 'var(--gray-800)'
                    }}>
                      {session.translated_text}
                    </div>
                  </div>
                </FadeInItem>
              )}

              {/* Doctor Notes */}
              <FadeInItem>
                <div className="card">
                  <h3 style={{ marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.125rem' }}>
                    <ClipboardList size={20} color="var(--blue-600)" /> Doctor Notes (Optional)
                  </h3>
                  <p style={{ color: 'var(--gray-500)', fontSize: '0.9375rem', marginBottom: '1rem' }}>
                    Add clinical observations or notes to include in the generated report.
                  </p>
                  <textarea
                    className="input"
                    rows={4}
                    placeholder="Enter clinical observations, additional context, or recommendations..."
                    value={doctorNotes}
                    onChange={e => setDoctorNotes(e.target.value)}
                    style={{ resize: 'vertical', minHeight: '100px' }}
                  />
                </div>
              </FadeInItem>
            </StaggerContainer>

            {error && (
              <div className="disclaimer" style={{ marginTop: '1.5rem', background: '#FCE8E6', borderLeft: '4px solid #D93025', color: '#A50E0E' }}>
                <AlertTriangle size={20} /> {error}
              </div>
            )}

            {/* Generate Report CTA */}
            <div className="card animate-fade-in" style={{
              background: 'linear-gradient(135deg, var(--blue-800), var(--blue-600))',
              border: 'none', textAlign: 'center', padding: '3rem 2rem',
              marginTop: '1.5rem', animationDelay: '0.4s',
              boxShadow: '0 8px 32px rgba(26, 115, 232, 0.2)',
            }}>
              <h3 style={{ color: 'white', marginBottom: '0.75rem', fontSize: '1.5rem' }}>Ready to Generate Report?</h3>
              <p style={{ color: 'rgba(255,255,255,0.8)', marginBottom: '2rem', fontSize: '1.0625rem', maxWidth: '500px', margin: '0 auto 2rem' }}>
                Create a professional PDF report with all findings, symptoms, and AI suggestions.
              </p>
              <button
                className="btn btn-lg btn-primary"
                onClick={handleGenerateReport}
                disabled={generating}
                style={{ fontWeight: 700, padding: '1rem 2rem', display: 'inline-flex', alignItems: 'center', gap: '0.75rem' }}
              >
                {generating ? <><span className="pulse-indicator" style={{ width: 12, height: 12, backgroundColor: 'white' }} /> Generating PDF...</> : <><FileText size={20} /> Generate & Download Report</>}
              </button>
            </div>
          </div>
        </main>
      </PageTransition>
    </div>
  );
}
