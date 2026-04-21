'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { listReports, healthCheck } from '@/lib/api';
import { PageTransition, StaggerContainer, FadeInItem } from '@/components/PageTransition';
import Navbar from '@/components/Navbar';

interface ReportSummary {
  report_id: string;
  session_id: string;
  patient_name?: string;
  symptoms?: string[];
  generated_at?: string;
}

export default function DashboardPage() {
  const { user, logout, getIdToken } = useAuth();
  const router = useRouter();
  const [reports, setReports] = useState<ReportSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    loadDashboard();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const loadDashboard = async () => {
    try {
      const token = await getIdToken();
      if (token) {
        const data = await listReports(token);
        setReports(data.reports as unknown as ReportSummary[]);
      }
    } catch { } // No reports yet
    finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <div className="bg-surface text-on-surface antialiased selection:bg-primary-fixed selection:text-on-primary-fixed font-body min-h-screen">
      <Navbar activePage="home" />

      <PageTransition>
        <main className="pt-28 pb-32 px-6 max-w-7xl mx-auto space-y-10">
          
          {/* Hero Section / Context */}
          <section className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
            <div className="md:col-span-8 space-y-2">
              <h2 className="text-4xl font-extrabold text-on-surface tracking-tight">Clinical Overview</h2>
              <p className="text-on-surface-variant text-lg max-w-2xl">
                Welcome back, {user?.displayName || 'Doctor'}. AI is actively monitoring sessions and generating structured reports for your patients.
              </p>
            </div>
            
            <div className="md:col-span-4 bg-primary-container/10 p-6 rounded-xl border border-primary/5 flex items-center justify-between">
              <div>
                <span className="text-primary font-semibold text-sm uppercase tracking-wider block mb-1">AI Confidence</span>
                <span className="text-3xl font-bold text-primary">98.4%</span>
              </div>
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-primary text-3xl">auto_awesome</span>
              </div>
            </div>
          </section>

          {/* Main Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
            
            {/* Left Column: Consultations */}
            <section className="md:col-span-7 lg:col-span-8 space-y-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xl font-bold text-on-surface">Recent Consultations</h3>
                <Link href="/upload" className="text-primary font-semibold text-sm flex items-center gap-1 hover:underline">
                    New Session <span className="material-symbols-outlined text-sm">add</span>
                </Link>
              </div>
              
              <div className="space-y-4">
                {loading ? (
                   [...Array(3)].map((_, i) => (
                     <div key={i} className="skeleton h-20 rounded-xl" />
                   ))
                ) : reports.length === 0 ? (
                  <div className="bg-surface-container-lowest p-10 rounded-xl shadow-[0px_10px_30px_rgba(25,28,35,0.06)] text-center text-on-surface-variant border border-dashed border-outline-variant/30">
                    <span className="material-symbols-outlined text-5xl mb-2 text-outline-variant">folder_open</span>
                    <p className="font-medium text-lg">No reports generated yet</p>
                    <p className="text-sm mt-1 mb-4">Start your first live session to automatically record patient data.</p>
                    <Link href="/upload" className="px-6 py-2 bg-primary text-white rounded-full font-semibold shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all inline-block">
                      Start Session
                    </Link>
                  </div>
                ) : (
                  <StaggerContainer className="space-y-4">
                    {reports.map((r, idx) => (
                      <FadeInItem key={r.report_id}>
                        <Link href={`/report/${r.report_id}`} className="bg-surface-container-lowest p-5 rounded-xl border border-transparent shadow-[0px_10px_30px_rgba(25,28,35,0.06)] flex flex-col sm:flex-row sm:items-center justify-between group hover:translate-x-1 hover:border-primary/20 transition-all duration-300">
                          <div className="flex items-center gap-4 mb-3 sm:mb-0">
                            <div className="w-12 h-12 rounded-xl bg-surface-container-high flex flex-shrink-0 items-center justify-center text-primary overflow-hidden">
                               <span className="material-symbols-outlined">person</span>
                            </div>
                            <div>
                              <h4 className="font-bold text-on-surface">{r.patient_name || 'Anonymous Patient'}</h4>
                              <div className="flex items-center gap-3 text-sm text-on-surface-variant mt-0.5">
                                <span>{r.generated_at}</span>
                                <span className="w-1 h-1 rounded-full bg-outline-variant"></span>
                                <span>{r.symptoms?.length || 0} Symptoms found</span>
                              </div>
                            </div>
                          </div>
                          <span className="px-3 py-1 bg-secondary-container text-on-secondary-container text-xs font-bold rounded-sm tracking-wide self-start sm:self-auto uppercase">Analyzed</span>
                        </Link>
                      </FadeInItem>
                    ))}
                  </StaggerContainer>
                )}
              </div>
            </section>

            {/* Right Column: Metrics & Critical Flags */}
            <aside className="md:col-span-5 lg:col-span-4 space-y-8">
              {/* System Metrics */}
              <section className="bg-surface-container-lowest p-8 rounded-xl shadow-[0px_10px_30px_rgba(25,28,35,0.06)] relative overflow-hidden">
                <div className="relative z-10">
                  <h3 className="text-on-surface-variant font-medium text-sm mb-4">System Metrics</h3>
                  <p className="text-4xl font-black text-on-surface leading-tight">{reports.length} Sessions</p>
                  <p className="mt-2 text-secondary font-bold flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">trending_up</span> Analyzed Total
                  </p>
                </div>
                {/* Decorative Sparkline Graph */}
                <div className="absolute bottom-0 left-0 w-full h-24 opacity-30 pointer-events-none">
                  <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 40">
                    <path d="M0 40 L0 30 Q 10 25, 20 32 T 40 20 T 60 28 T 80 15 T 100 22 L 100 40 Z" fill="url(#gradient-green)"></path>
                    <path d="M0 30 Q 10 25, 20 32 T 40 20 T 60 28 T 80 15 T 100 22" fill="none" stroke="#10b981" strokeWidth="1.5"></path>
                    <defs>
                      <linearGradient id="gradient-green" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="#10b981"></stop>
                        <stop offset="100%" stopColor="transparent"></stop>
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
              </section>

              {/* Critical Flags Placeholder - Matches UI Mock */}
              <section className="space-y-4">
                <h3 className="text-xl font-bold text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-error" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
                  Critical Flags
                </h3>
                <div className="space-y-3">
                  <div className="bg-error-container/40 p-4 rounded-xl border border-error/10 flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-error-container flex flex-shrink-0 items-center justify-center">
                      <span className="material-symbols-outlined text-error text-xl">favorite</span>
                    </div>
                    <div>
                      <p className="font-extrabold text-on-error-container leading-snug">Demo Sepsis Alert Simulation</p>
                      <p className="text-sm text-error/80 mt-1">Pending MIMIC-III Model Integration</p>
                    </div>
                  </div>
                </div>
              </section>

            </aside>
          </div>
        </main>
      </PageTransition>

      {/* Floating Action Button */}
      <div className="fixed bottom-10 right-8 md:bottom-12 md:right-12 z-40">
        <Link href="/upload" className="w-16 h-16 rounded-full bg-primary shadow-[0px_10px_30px_rgba(0,91,191,0.3)] flex items-center justify-center text-white hover:scale-105 active:scale-95 transition-all duration-200">
          <span className="material-symbols-outlined text-3xl">add</span>
        </Link>
      </div>

    </div>
  );
}
