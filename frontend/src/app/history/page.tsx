'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { listSessions } from '@/lib/api';
import Navbar from '@/components/Navbar';
import { PageTransition, StaggerContainer, FadeInItem } from '@/components/PageTransition';

interface SessionSummary {
  session_id: string;
  patient_name?: string;
  symptoms?: string[];
  created_at?: string;
  status?: string;
}

export default function HistoryPage() {
  const { user, getIdToken } = useAuth();
  const router = useRouter();
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    loadHistory();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const loadHistory = async () => {
    try {
      const token = await getIdToken();
      if (token) {
        const data = await listSessions(token);
        setSessions(data.sessions as unknown as SessionSummary[]);
      }
    } catch { } // No sessions
    finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-surface text-on-surface antialiased selection:bg-primary-fixed selection:text-on-primary-fixed font-body min-h-screen">
      <Navbar activePage="history" />

      <PageTransition>
        <main className="pt-28 pb-32 px-6 max-w-7xl mx-auto space-y-10">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-4xl font-extrabold text-on-surface tracking-tight">Record History</h2>
            <Link href="/upload" className="btn btn-primary shadow-lg shadow-primary/20">
              <span className="material-symbols-outlined text-xl">add</span>
              New Session
            </Link>
          </div>

          <div className="bg-surface-container-lowest p-8 rounded-xl shadow-[0px_10px_30px_rgba(25,28,35,0.06)] border border-outline-variant/30 min-h-[500px]">
            {loading ? (
               <div className="space-y-4">
                 {[...Array(6)].map((_, i) => (
                   <div key={i} className="skeleton h-16 rounded-xl" />
                 ))}
               </div>
            ) : sessions.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-center text-on-surface-variant">
                <span className="material-symbols-outlined text-6xl mb-4 text-outline-variant">history_toggle_off</span>
                <p className="font-medium text-lg text-on-surface">No clinical history found</p>
                <p className="text-sm mt-1 max-w-md">Your analyzed sessions will appear here chronologically for future reference and continuity of care.</p>
              </div>
            ) : (
              <StaggerContainer className="space-y-3">
                {sessions.map((s) => {
                  const date = s.created_at ? new Date(s.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'Unknown Date';
                  return (
                  <FadeInItem key={s.session_id}>
                    <Link href={`/analysis/${s.session_id}`} className="block group">
                      <div className="flex items-center justify-between p-4 rounded-xl border border-transparent hover:border-primary/20 hover:bg-primary/5 transition-all duration-200">
                        <div className="flex items-center gap-5">
                          <div className="w-12 h-12 rounded-xl bg-surface-container-high flex flex-shrink-0 items-center justify-center text-primary overflow-hidden group-hover:bg-primary group-hover:text-white transition-colors">
                            <span className="material-symbols-outlined">description</span>
                          </div>
                          <div>
                            <h4 className="font-bold text-on-surface text-lg">{s.patient_name || 'Anonymous Patient'}</h4>
                            <div className="flex items-center gap-3 text-sm text-on-surface-variant font-medium mt-0.5">
                              <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[1rem]">calendar_today</span> {date}</span>
                              <span className="w-1 h-1 rounded-full bg-outline-variant"></span>
                              <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[1rem]">stethoscope</span> {s.symptoms?.length || 0} Symptoms</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                           <span className="px-3 py-1 bg-secondary-container text-on-secondary-container text-xs font-bold rounded-sm tracking-wide uppercase hidden sm:inline-block">
                              {s.status === 'predicted' ? 'Analyzed' : 'Session'}
                           </span>
                           <span className="material-symbols-outlined text-outline-variant group-hover:text-primary group-hover:translate-x-1 transition-all">chevron_right</span>
                        </div>
                      </div>
                    </Link>
                  </FadeInItem>
                )})}
              </StaggerContainer>
            )}
          </div>
        </main>
      </PageTransition>
    </div>
  );
}
