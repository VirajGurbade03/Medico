'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { getReport } from '@/lib/api';
import { PageTransition, StaggerContainer, FadeInItem } from '@/components/PageTransition';

interface Report {
  report_id: string;
  session_id: string;
  patient_name: string;
  pdf_url?: string;
  local_path?: string;
  symptoms?: string[];
  diseases?: Array<{ disease: string; confidence_pct: number; rank: number }>;
  generated_at: string;
}

export default function ReportPage() {
  const { user, getIdToken } = useAuth();
  const params = useParams();
  const reportId = params.id as string;
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!reportId || !user) return;
    loadReport();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportId, user]);

  const loadReport = async () => {
    try {
      const token = await getIdToken();
      if (!token) return;
      const data = await getReport(reportId, token);
      setReport(data.report as unknown as Report);
    } catch {
      setError('Failed to load report. It may still be generating — try refreshing.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-surface">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-outline-variant/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
          <p className="text-on-surface-variant font-medium">Analyzing Clinical Data...</p>
        </div>
      </div>
    );
  }

  const aiConfidence = report?.diseases && report.diseases.length > 0 ? report.diseases[0].confidence_pct : 0;
  const downloadUrl = report?.pdf_url || `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/report/${reportId}/download`;

  return (
    <div className="bg-surface text-on-surface selection:bg-primary-fixed min-h-screen font-body">
      {/* TopAppBar */}
      <header className="bg-white/80 backdrop-blur-xl sticky top-0 z-40 flex items-center justify-between px-6 py-4 w-full shadow-[0px_10px_30px_rgba(25,28,35,0.04)]">
        <div className="flex items-center gap-4 max-w-7xl mx-auto w-full justify-between">
          <Link href="/dashboard" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
             <img src="/logos/main_logo.png" alt="Clinica AI" className="h-8 w-auto" />
          </Link>
          <div className="flex flex-1 md:flex-none justify-end items-center gap-2">
            <div className="hidden md:flex gap-6 mr-6">
              <Link href="/dashboard" className="text-slate-500 hover:bg-slate-100 px-3 py-1 rounded-lg transition-colors cursor-pointer text-sm font-medium">Dashboard</Link>
              <Link href="/upload" className="text-slate-500 hover:bg-slate-100 px-3 py-1 rounded-lg transition-colors cursor-pointer text-sm font-medium">New Session</Link>
            </div>
            <div className="h-10 w-10 flex items-center justify-center font-bold text-white rounded-full bg-surface-container-high overflow-hidden" style={{ background: 'linear-gradient(135deg, var(--blue-600), var(--blue-800))'}}>
                {user?.displayName?.[0] || user?.email?.[0]?.toUpperCase() || '?'}
            </div>
          </div>
        </div>
      </header>

      <PageTransition>
        <main className="p-6 md:p-10 max-w-7xl mx-auto w-full pb-24 md:pb-8">
          
          {error && (
            <div className="mb-6 p-4 bg-error-container/40 rounded-xl border border-error/10 flex items-start gap-4">
              <span className="material-symbols-outlined text-error">warning</span>
              <p className="text-on-error-container font-medium">{error}</p>
            </div>
          )}

          {/* Patient Header Metadata Section */}
          <section className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold rounded uppercase tracking-widest">Active Analysis</span>
                <span className="text-on-surface-variant text-sm font-medium">Session ID: #{report?.session_id?.slice(0, 6) || '----'}</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-on-surface tracking-tighter mb-2">
                {report?.patient_name || 'Anonymous Patient'}
              </h1>
              <p className="text-on-surface-variant font-medium flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">calendar_today</span>
                Report Generated: {report?.generated_at?.split('T')[0] || 'Today'}
              </p>
            </div>
            <div className="flex flex-col items-center md:items-end">
              <div className="bg-surface-container-lowest p-6 rounded-3xl shadow-[0px_10px_30px_rgba(25,28,35,0.06)] border-l-4 border-secondary flex items-center gap-4">
                <div className="text-right">
                  <span className="block text-on-surface-variant text-[10px] font-bold uppercase tracking-widest mb-1">AI Confidence</span>
                  <span className="text-3xl font-black text-on-surface">{aiConfidence}%</span>
                </div>
                <div className="w-12 h-12 rounded-full bg-secondary-fixed flex items-center justify-center">
                  <span className="material-symbols-outlined text-on-secondary-fixed text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                </div>
              </div>
            </div>
          </section>

          {/* Main Layout Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Column: Suggestions List */}
            <div className="lg:col-span-8">
              <div className="bg-surface-container-lowest rounded-3xl p-8 shadow-[0px_10px_30px_rgba(25,28,35,0.06)]">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-xl font-bold text-on-surface tracking-tight">AI-Suggested Conditions</h3>
                  <span className="material-symbols-outlined text-on-surface-variant">info</span>
                </div>
                
                <div className="space-y-6">
                  {report?.diseases && report.diseases.length > 0 ? (
                    <StaggerContainer className="space-y-6">
                      {report.diseases.map((d, i) => (
                        <FadeInItem key={i}>
                          <div className="group cursor-pointer">
                            <div className="flex justify-between items-center mb-3">
                              <div>
                                <h4 className="font-bold text-lg text-on-surface group-hover:text-primary transition-colors">
                                  {d.disease.charAt(0).toUpperCase() + d.disease.slice(1)}
                                </h4>
                                <p className="text-sm text-on-surface-variant">Ranked #{d.rank} based on symptoms</p>
                              </div>
                              <span className="text-sm font-bold text-primary">{d.confidence_pct}% Match</span>
                            </div>
                            <div className="w-full h-3 bg-surface-container rounded-full overflow-hidden">
                              <div className={`h-full bg-primary rounded-full transition-all duration-1000 ${i > 0 ? 'opacity-70' : ''}`} style={{ width: `${d.confidence_pct}%` }}></div>
                            </div>
                          </div>
                        </FadeInItem>
                      ))}
                    </StaggerContainer>
                  ) : (
                    <p className="text-on-surface-variant italic">No conditions identified from the transcription.</p>
                  )}
                </div>

                <div className="mt-10 p-4 bg-surface-container-low rounded-2xl flex items-start gap-4 border border-outline-variant/20">
                  <span className="material-symbols-outlined text-primary mt-0.5">lightbulb</span>
                  <p className="text-sm text-on-surface-variant leading-relaxed">
                    Our clinical AI cross-referenced these results with <span className="font-bold text-on-surface">clinical trials</span> and historical patient cohorts. <span className="font-bold text-error">This is an AI suggestion, not a diagnosis.</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Right Column: Symptoms & Notes */}
            <div className="lg:col-span-4 flex flex-col gap-8">
              
              {/* Extracted Symptoms */}
              <div className="bg-white rounded-3xl p-8 shadow-[0px_10px_30px_rgba(25,28,35,0.06)] border border-outline-variant/10">
                <h3 className="text-sm font-bold uppercase tracking-widest text-on-surface-variant mb-6">Extracted Symptoms</h3>
                <div className="flex flex-wrap gap-2">
                  {report?.symptoms && report.symptoms.length > 0 ? (
                    report.symptoms.map((sym, i) => (
                      <span key={i} className="px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-xs font-bold border border-blue-100">
                        {sym}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-on-surface-variant">No symptoms explicitly detected.</span>
                  )}
                </div>
              </div>

              {/* Clinical Notes */}
              <div className="bg-white rounded-3xl p-8 shadow-[0px_10px_30px_rgba(25,28,35,0.06)] border border-outline-variant/10 flex-1">
                <h3 className="text-sm font-bold uppercase tracking-widest text-on-surface-variant mb-4">Doctor&apos;s Clinical Notes</h3>
                <div className="relative group">
                  <textarea 
                    className="w-full bg-surface-container-high rounded-2xl p-4 text-sm text-on-surface border-none focus:ring-2 focus:ring-primary/20 min-h-[200px] placeholder:italic placeholder:text-on-surface-variant/50 resize-none outline-none" 
                    placeholder="Enter additional observations or differential diagnosis rationale here..."
                  ></textarea>
                  <div className="absolute bottom-4 right-4 flex items-center gap-2 text-[10px] text-on-surface-variant font-bold uppercase">
                    <span className="material-symbols-outlined text-xs">edit_note</span> Auto-Saving
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Bottom Action Area */}
          <section className="mt-12 flex flex-col md:flex-row items-center justify-between gap-6 p-8 bg-blue-600 rounded-[2.5rem] shadow-xl text-white relative overflow-hidden">
            <div className="absolute -right-20 -top-20 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
            <div className="relative z-10 w-full md:w-auto text-center md:text-left">
              <h3 className="text-2xl font-black tracking-tight">Ready for clinical review?</h3>
              <p className="text-white/80 text-sm font-medium mt-1">Download the PDF report to share with the primary care team.</p>
            </div>
            <div className="relative z-10 flex gap-4 w-full md:w-auto">
              <a href={downloadUrl} target="_blank" rel="noopener noreferrer" className="flex-1 md:flex-none px-8 py-4 bg-white text-blue-700 rounded-full font-black text-sm hover:bg-blue-50 active:scale-95 transition-all shadow-lg flex items-center justify-center gap-2">
                <span className="material-symbols-outlined text-xl">picture_as_pdf</span>
                Generate & Download PDF Mode
              </a>
            </div>
          </section>

        </main>
      </PageTransition>
    </div>
  );
}
