'use client';
import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { uploadAudio } from '@/lib/api';
import { PageTransition } from '@/components/PageTransition';

type UploadState = 'idle' | 'recording' | 'uploading' | 'done' | 'error';

export default function UploadPage() {
  const { user, getIdToken } = useAuth();
  const router = useRouter();
  const [state, setState] = useState<UploadState>('idle');
  const [patientName, setPatientName] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [recordingTime, setRecordingTime] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const handleFile = useCallback((file: File) => {
    const allowed = ['audio/', 'video/mp4', 'video/webm'];
    if (!allowed.some(t => file.type.startsWith(t))) {
      setError('Please upload an audio file (MP3, WAV, M4A).');
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      setError('File is too large. Maximum size is 50 MB.');
      return;
    }
    setError('');
    setSelectedFile(file);
  }, []);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      mediaRecorderRef.current = mr;
      chunksRef.current = [];

      mr.ondataavailable = e => chunksRef.current.push(e.data);
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const file = new File([blob], 'recording.webm', { type: 'audio/webm' });
        setSelectedFile(file);
        stream.getTracks().forEach(t => t.stop());
      };

      mr.start(1000);
      setState('recording');
      setRecordingTime(0);
      timerRef.current = setInterval(() => setRecordingTime(t => t + 1), 1000);
    } catch {
      setError('Could not access microphone. Please allow microphone permission.');
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    if (timerRef.current) clearInterval(timerRef.current);
    setState('idle');
  };

  const handleUpload = async () => {
    if (!selectedFile) { setError('Please select or record an audio file.'); return; }
    if (!user) { router.push('/login'); return; }

    setState('uploading');
    setError('');
    setProgress(20);

    try {
      const token = await getIdToken();
      if (!token) throw new Error('Authentication failed');
      setProgress(40);

      const result = await uploadAudio(selectedFile, patientName, token);
      setProgress(100);
      setState('done');

      setTimeout(() => {
        router.push(`/transcription?id=${result.session_id}`);
      }, 1500);
    } catch (err: unknown) {
      setState('error');
      setError(err instanceof Error ? err.message : 'Upload failed. Please try again.');
      setProgress(0);
    }
  };

  const fmt = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  return (
    <div className="bg-surface font-body text-on-surface antialiased min-h-screen">
      {/* TopAppBar */}
      <header className="fixed top-0 w-full z-50 bg-white/70 backdrop-blur-xl shadow-[0px_10px_30px_rgba(25,28,35,0.04)]">
        <div className="flex items-center justify-between px-6 h-16 w-full max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-blue-700 text-2xl">clinical_notes</span>
            <h1 className="text-xl font-black tracking-tighter text-blue-700">Clinical Luminary</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex gap-6 items-center">
              <Link href="/dashboard" className="text-slate-500 hover:bg-slate-100 px-3 py-1 rounded-lg transition-colors">Dashboard</Link>
            </div>
            <div className="h-10 w-10 flex items-center justify-center font-bold text-white rounded-full bg-surface-container-high overflow-hidden" style={{ background: 'linear-gradient(135deg, var(--blue-600), var(--blue-800))'}}>
                {user?.displayName?.[0] || user?.email?.[0]?.toUpperCase() || '?'}
            </div>
          </div>
        </div>
      </header>

      <PageTransition>
        <main className="pt-24 pb-32 max-w-4xl mx-auto px-6 space-y-10">
          
          <div className="mb-4">
            <label className="block text-sm font-semibold text-on-surface mb-2">Patient Identifier (Optional)</label>
            <input 
              type="text" 
              className="w-full bg-white border border-outline-variant/50 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
              placeholder="e.g. John Doe (or leave blank for anonymous)"
              value={patientName}
              onChange={e => setPatientName(e.target.value)}
            />
          </div>

          {/* Drag & Drop Upload Zone */}
          <section className="relative group cursor-pointer" 
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <div className={`bg-surface-container-lowest border-2 border-dashed ${dragOver ? 'border-primary bg-primary/5' : selectedFile ? 'border-secondary bg-secondary/5' : 'border-outline-variant/30'} rounded-xl p-12 transition-all hover:bg-primary/5 hover:border-primary/50 flex flex-col items-center justify-center gap-4 text-center`}>
              <div className={`h-16 w-16 ${selectedFile ? 'bg-secondary-container text-secondary' : 'bg-primary-fixed text-primary'} rounded-full flex items-center justify-center`}>
                <span className="material-symbols-outlined text-3xl">{selectedFile ? 'check_circle' : 'upload_file'}</span>
              </div>
              <div>
                <h3 className={`text-lg font-semibold ${selectedFile ? 'text-secondary' : 'text-on-surface'}`}>
                  {selectedFile ? selectedFile.name : 'Upload patient session'}
                </h3>
                <p className="text-sm text-on-surface-variant">
                  {selectedFile ? `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB • Click to change` : 'Drag and drop audio files (MP3, WAV, M4A) or click to browse'}
                </p>
              </div>
            </div>
          </section>

          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*,video/mp4,video/webm"
            className="hidden"
            onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
          />

          {error && <div className="text-error bg-error-container/20 p-4 rounded-xl text-sm font-semibold border border-error/20 flex gap-2"><span className="material-symbols-outlined text-sm">warning</span> {error}</div>}

          {/* Live Recording Section */}
          <section className="bg-surface-container-low rounded-xl p-8 space-y-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {state === 'recording' ? (
                  <div className="flex gap-1 items-end h-8">
                    {[...Array(11)].map((_, i) => (
                      <div key={i} className="w-[3px] rounded-full bg-primary animate-pulse" style={{ height: `${Math.random() * 80 + 20}%`, animationDelay: `${i * 0.1}s`}}></div>
                    ))}
                  </div>
                ) : (
                  <div className="flex gap-1 items-end h-8 opacity-30">
                    <div className="w-[3px] rounded-full bg-primary h-2"></div>
                    <div className="w-[3px] rounded-full bg-primary h-2"></div>
                    <div className="w-[3px] rounded-full bg-primary h-2"></div>
                  </div>
                )}
                <span className="text-sm font-bold text-primary tracking-widest uppercase">Live Capture</span>
              </div>
              <div className="text-4xl font-black text-on-surface tracking-tight font-headline">{fmt(recordingTime)}</div>
            </div>
            
            <div className="flex flex-col items-center gap-6">
              <div className="relative flex items-center justify-center">
                {state === 'recording' && <div className="absolute inset-0 bg-error/20 blur-2xl rounded-full scale-110 animate-pulse"></div>}
                <button 
                  onClick={state === 'recording' ? stopRecording : startRecording}
                  disabled={state === 'uploading'}
                  className={`relative px-10 py-4 rounded-full font-bold flex items-center gap-3 shadow-lg active:scale-95 transition-all ${state === 'recording' ? 'bg-error text-white shadow-error/20' : 'bg-primary text-on-primary shadow-primary/20'}`}>
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                    {state === 'recording' ? 'stop' : 'mic'}
                  </span>
                  <span>{state === 'recording' ? 'Stop Recording' : 'Record Live Session'}</span>
                </button>
              </div>
              <p className="text-xs text-on-surface-variant font-medium uppercase tracking-[0.2em]">Active Microphone: Built-in Array (24-bit PCM)</p>
            </div>
          </section>

          {/* Action Button & Processing States */}
          {selectedFile && state !== 'recording' && (
            <div className="space-y-4">
              {state === 'uploading' && (
                <div className="w-full bg-surface-container-high rounded-full h-2 mb-4 overflow-hidden">
                  <div className="bg-primary h-2 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
                </div>
              )}
              
              <button
                onClick={handleUpload}
                disabled={state === 'uploading' || state === 'done'}
                className="w-full bg-secondary text-white px-8 py-5 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-secondary/90 transition-all text-lg shadow-xl shadow-secondary/20"
              >
                {state === 'uploading' ? (
                  <span className="animate-spin material-symbols-outlined">sync</span>
                ) : state === 'done' ? (
                  <span className="material-symbols-outlined">check_circle</span>
                ) : (
                  <span className="material-symbols-outlined">analytics</span>
                )}
                {state === 'uploading' ? 'Analyzing Session...' : state === 'done' ? 'Redirecting to Report...' : 'Upload & Analyze Session'}
              </button>
            </div>
          )}

          {/* Live Transcription Notepad (Animated Demo While Uploading) */}
          {(state === 'uploading' || state === 'done') && (
            <section className="bg-surface-container-lowest rounded-xl p-8 shadow-[0px_10px_30px_rgba(25,28,35,0.06)] min-h-[400px] animate-fade-in">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-secondary">history_edu</span>
                  <h2 className="text-sm font-bold uppercase tracking-widest text-on-surface-variant">Real-time Transcription</h2>
                </div>
                <div className="flex gap-2">
                  <span className="px-3 py-1 bg-secondary-container text-on-secondary-container text-[10px] font-bold rounded uppercase">Auto-Tagging On</span>
                  <span className="px-3 py-1 bg-surface-container-high text-on-surface-variant text-[10px] font-bold rounded uppercase">v1.2.4</span>
                </div>
              </div>
              
              <div className="space-y-6 text-on-surface font-body leading-relaxed">
                <div className="flex gap-4">
                  <span className="text-xs font-bold text-primary w-16 shrink-0 mt-1 uppercase">System</span>
                  <div className="flex gap-1 items-center h-6">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse"></div>
                    <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse delay-75"></div>
                    <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse delay-150"></div>
                  </div>
                </div>
              </div>
              
              <div className="mt-12 p-4 bg-primary/5 rounded-xl flex items-start gap-4">
                <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>analytics</span>
                <div className="space-y-1">
                  <p className="text-sm font-bold text-primary">AI Diagnostic Processing...</p>
                  <p className="text-sm text-on-surface-variant">Securely routing audio through transcript pipelines. Please hold.</p>
                </div>
              </div>
            </section>
          )}

        </main>
      </PageTransition>
    </div>
  );
}
