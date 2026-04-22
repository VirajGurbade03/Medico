'use client';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';
import { useAuth } from '@/lib/auth-context';
import { transcribeAudio, extractSymptoms, predictDisease } from '@/lib/api';
import { PageTransition, StaggerContainer, FadeInItem } from '@/components/PageTransition';
import { 
  Stethoscope, FileText, AlertTriangle, Loader2, 
  CheckCircle, ArrowRight, Dna, Activity, Globe, Lightbulb
} from 'lucide-react';

type Step = 'transcribing' | 'extracting' | 'predicting' | 'done' | 'error';

function TranscriptionContent() {
  const { user, getIdToken } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const sessionId = params.get('id') || '';

  const [step, setStep] = useState<Step>('transcribing');
  const [progress, setProgress] = useState(10);
  const [error, setError] = useState('');
  const [transcription, setTranscription] = useState('');
  const [language, setLanguage] = useState('');
  const [wasTranslated, setWasTranslated] = useState(false);
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [symptomPositions, setSymptomPositions] = useState<Array<{ start: number; end: number; keyword: string }>>([]);
  const [predictions, setPredictions] = useState<Array<{ disease: string; confidence_pct: number; rank: number }>>([]);

  useEffect(() => {
    if (!sessionId || !user) return;
    runPipeline();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, user]);

  const runPipeline = async () => {
    try {
      const token = await getIdToken();
      if (!token) throw new Error('Auth error');

      // Step 1: Transcribe
      setStep('transcribing');
      setProgress(20);
      const tx = await transcribeAudio(sessionId, token);
      setTranscription(tx.translated_text || tx.original_text);
      setLanguage(tx.language_name);
      setWasTranslated(tx.was_translated);
      setProgress(40);

      // Step 2: Extract symptoms
      setStep('extracting');
      const symResult = await extractSymptoms(sessionId, token);
      setSymptoms(symResult.symptoms);
      setSymptomPositions(symResult.symptom_positions);
      setProgress(70);

      // Step 3: Predict diseases
      setStep('predicting');
      const predResult = await predictDisease(sessionId, token);
      setPredictions(predResult.predictions);
      setProgress(100);

      setStep('done');
    } catch (err: unknown) {
      setStep('error');
      setError(err instanceof Error ? err.message : 'Pipeline failed');
    }
  };

  // Highlight symptoms in text
  const renderHighlightedText = (text: string) => {
    if (!symptomPositions.length) return <span>{text}</span>;

    const sorted = [...symptomPositions].sort((a, b) => a.start - b.start);
    const parts: React.ReactNode[] = [];
    let last = 0;

    for (const pos of sorted) {
      if (pos.start > last) parts.push(<span key={`t-${last}`}>{text.slice(last, pos.start)}</span>);
      parts.push(
        <span
          key={`s-${pos.start}`}
          className="symptom-highlight"
          title={`Symptom: ${pos.keyword}`}
        >
          {text.slice(pos.start, pos.end)}
        </span>
      );
      last = pos.end;
    }
    if (last < text.length) parts.push(<span key="end">{text.slice(last)}</span>);
    return <>{parts}</>;
  };

  const stepLabels: Record<Step, string> = {
    transcribing: 'Transcribing audio...',
    extracting: 'Extracting symptoms...',
    predicting: 'Predicting conditions...',
    done: 'Analysis complete!',
    error: 'Error occurred',
  };

  return (
    <div className="page-wrapper bg-subtle-pattern">
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
        {step === 'done' && (
          <button
            className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            onClick={() => router.push(`/analysis/${sessionId}`)}
          >
            View Full Analysis <ArrowRight size={18} />
          </button>
        )}
      </nav>

      <PageTransition>
        <main className="main-content">
          <div className="container" style={{ maxWidth: 800 }}>
            {/* Progress Header */}
            <div className="card animate-fade-in" style={{ marginBottom: '1.5rem', background: 'linear-gradient(135deg, var(--blue-800), var(--blue-600))', color: 'white', border: 'none', boxShadow: 'var(--shadow-md)' }}>
              <div className="flex-between" style={{ marginBottom: '1rem' }}>
                <div>
                  <h2 style={{ color: 'white', fontSize: '1.25rem', marginBottom: '0.25rem', fontWeight: 600 }}>
                    {stepLabels[step]}
                  </h2>
                  <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.875rem' }}>
                    Session ID: {sessionId.slice(0, 8)}...
                  </p>
                </div>
                <div style={{ fontSize: '1.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {step === 'done' ? <CheckCircle size={32} color="#10B981" /> : step === 'error' ? <AlertTriangle size={32} color="#EF4444" /> : <Loader2 size={32} className="animate-spin" color="rgba(255,255,255,0.8)" />}
                </div>
              </div>
              <div className="progress-track" style={{ background: 'rgba(255,255,255,0.2)', height: '8px' }}>
                <div className="progress-fill" style={{
                  width: `${progress}%`,
                  background: step === 'error' ? '#EF4444' : 'white',
                  transition: 'width 0.5s ease-out'
                }} />
              </div>
              <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: 'rgba(255,255,255,0.8)', fontWeight: 500 }}>
                {progress}% complete
              </p>
            </div>

            {error && (
              <div className="disclaimer" style={{ marginBottom: '1.5rem', background: '#FCE8E6', borderLeft: '4px solid #D93025', color: '#A50E0E' }}>
                <AlertTriangle size={20} /> {error}
              </div>
            )}

            <StaggerContainer style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Transcription */}
              {transcription && (
                <FadeInItem>
                  <div className="card">
                    <div className="flex-between" style={{ marginBottom: '1rem' }}>
                      <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.125rem' }}>
                        <FileText size={20} color="var(--blue-600)" /> Conversation Transcription
                      </h3>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <span className="badge badge-blue" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Globe size={14} /> {language}
                        </span>
                        {wasTranslated && <span className="badge badge-green">Translated to English</span>}
                      </div>
                    </div>
                    <div style={{
                      background: 'var(--gray-50)', borderRadius: 'var(--radius-sm)',
                      padding: '1.25rem', lineHeight: 1.8, fontSize: '0.9375rem',
                      border: '1px solid var(--gray-200)',
                      maxHeight: 320, overflowY: 'auto',
                    }}>
                      {step === 'done' ? renderHighlightedText(transcription) : transcription}
                    </div>
                    {step === 'done' && symptoms.length > 0 && (
                      <p style={{ marginTop: '1rem', fontSize: '0.875rem', color: 'var(--gray-600)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Lightbulb size={16} color="var(--warning)" />
                        <span>Highlighted words are <span style={{ background: 'rgba(249, 171, 0, 0.2)', borderBottom: '2px solid var(--warning)', padding: '0 4px', borderRadius: 4, fontWeight: 500 }}>detected symptoms</span>.</span>
                      </p>
                    )}
                  </div>
                </FadeInItem>
              )}

              {/* Symptoms */}
              {symptoms.length > 0 && (
                <FadeInItem>
                  <div className="card">
                    <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.125rem' }}>
                      <Activity size={20} color="var(--green-600)" /> Extracted Symptoms ({symptoms.length})
                    </h3>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                      {symptoms.map((sym, i) => (
                        <span key={i} className="badge badge-blue" style={{ fontSize: '0.875rem', padding: '0.375rem 0.875rem', background: 'var(--blue-50)', border: '1px solid var(--blue-200)' }}>
                          {sym.charAt(0).toUpperCase() + sym.slice(1)}
                        </span>
                      ))}
                    </div>
                  </div>
                </FadeInItem>
              )}

              {/* Predictions Preview */}
              {predictions.length > 0 && (
                <FadeInItem>
                  <div className="card">
                    <div className="flex-between" style={{ marginBottom: '1rem' }}>
                      <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.125rem' }}>
                        <Dna size={20} color="var(--success)" /> Top Predicted Conditions
                      </h3>
                      <span className="badge badge-red" style={{ fontWeight: 600 }}>AI Suggestions Only</span>
                    </div>
                    <div className="disclaimer" style={{ marginBottom: '1.25rem', background: '#FCE8E6', borderLeft: '4px solid #D93025', color: '#A50E0E' }}>
                      <AlertTriangle size={18} style={{ flexShrink: 0 }} /> These are AI-generated suggestions, NOT medical diagnoses. Do not rely on them for clinical decisions.
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {predictions.slice(0, 3).map((p, i) => (
                        <div key={i} style={{
                          display: 'flex', alignItems: 'center', gap: '1rem',
                          padding: '1rem', background: 'var(--gray-50)',
                          borderRadius: 'var(--radius-sm)', border: '1px solid var(--gray-200)',
                        }}>
                          <span style={{
                            width: 32, height: 32, borderRadius: '50%',
                            background: i === 0 ? 'var(--blue-600)' : 'var(--gray-400)',
                            color: 'white', display: 'flex', alignItems: 'center',
                            justifyContent: 'center', fontWeight: 700, fontSize: '0.875rem',
                            flexShrink: 0,
                          }}>#{i + 1}</span>
                          <div style={{ flex: 1 }}>
                            <p style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--gray-900)', marginBottom: '0.375rem' }}>
                              {p.disease.charAt(0).toUpperCase() + p.disease.slice(1, 80)}
                              {p.disease.length > 80 ? '...' : ''}
                            </p>
                            <div className="progress-track" style={{ height: 6 }}>
                              <div className="progress-fill" style={{ width: `${p.confidence_pct}%` }} />
                            </div>
                          </div>
                          <span style={{ fontWeight: 700, color: 'var(--blue-600)', fontSize: '1.125rem', flexShrink: 0 }}>
                            {p.confidence_pct}%
                          </span>
                        </div>
                      ))}
                    </div>

                    {step === 'done' && (
                      <button
                        className="btn btn-primary"
                        onClick={() => router.push(`/analysis/${sessionId}`)}
                        style={{ width: '100%', marginTop: '1.5rem', display: 'flex', justifyContent: 'center', gap: '0.5rem' }}
                      >
                        View Full Detailed Analysis <ArrowRight size={18} />
                      </button>
                    )}
                  </div>
                </FadeInItem>
              )}
            </StaggerContainer>

            {/* Loading state */}
            {step !== 'done' && step !== 'error' && !transcription && (
              <div className="card animate-fade-in" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                <div className="waveform" style={{ justifyContent: 'center', marginBottom: '1.5rem', height: '40px' }}>
                  {[...Array(8)].map((_, i) => <div key={i} className="waveform-bar" style={{ width: '4px', margin: '0 2px', borderRadius: '2px' }} />)}
                </div>
                <p style={{ fontWeight: 600, color: 'var(--gray-800)', marginBottom: '0.5rem', fontSize: '1.125rem' }}>
                  {stepLabels[step]}
                </p>
                <p style={{ color: 'var(--gray-500)', fontSize: '0.875rem' }}>
                  This may take 30–60 seconds depending on audio length. Please wait.
                </p>
              </div>
            )}
          </div>
        </main>
      </PageTransition>
    </div>
  );
}

export default function TranscriptionPage() {
  return (
    <Suspense fallback={
      <div className="flex-center bg-subtle-pattern" style={{ minHeight: '100vh' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <Loader2 className="animate-spin" size={32} color="var(--blue-600)" />
          <p style={{ color: 'var(--gray-600)', fontWeight: 500 }}>Initializing View...</p>
        </div>
      </div>
    }>
      <TranscriptionContent />
    </Suspense>
  );
}
