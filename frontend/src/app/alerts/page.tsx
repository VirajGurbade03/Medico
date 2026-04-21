'use client';
import Navbar from '@/components/Navbar';
import { PageTransition, StaggerContainer, FadeInItem } from '@/components/PageTransition';

export default function AlertsPage() {
  return (
    <div className="bg-surface text-on-surface antialiased font-body min-h-screen">
      <Navbar activePage="alerts" />

      <PageTransition>
        <main className="pt-28 pb-32 px-6 max-w-5xl mx-auto space-y-10">
          <div className="mb-8">
            <h2 className="text-4xl font-extrabold text-on-surface tracking-tight">Active Alerts</h2>
            <p className="text-on-surface-variant text-lg mt-2">Critical patient flags requiring immediate attention, powered by MIMIC-III AI Models.</p>
          </div>

          <StaggerContainer className="space-y-6">
            <FadeInItem>
              <div className="bg-error-container p-6 rounded-xl shadow-sm border border-error/20 flex flex-col sm:flex-row sm:items-start gap-5">
                <div className="w-14 h-14 rounded-full bg-error text-white flex flex-shrink-0 items-center justify-center shadow-lg shadow-error/30 mt-1">
                  <span className="material-symbols-outlined text-2xl font-bold">warning</span>
                </div>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-4 mb-2">
                    <h3 className="text-2xl font-extrabold text-on-error-container tracking-tight">Severe Sepsis Alert Risk</h3>
                    <span className="px-3 py-1 bg-error text-white text-xs font-bold rounded-full uppercase tracking-wider animate-pulse">Critical</span>
                  </div>
                  <p className="text-on-error-container/80 font-medium text-lg mb-4">
                    Patient vitals align closely with established trajectories of Systemic Inflammatory Response Syndrome (SIRS).
                  </p>
                  
                  <div className="bg-white/50 rounded-lg p-4 mb-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs uppercase font-bold text-error/70 tracking-wide">Temp</p>
                      <p className="text-error font-black text-xl">39.2°C</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase font-bold text-error/70 tracking-wide">Heart Rate</p>
                      <p className="text-error font-black text-xl">115 bpm</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase font-bold text-error/70 tracking-wide">Resp. Rate</p>
                      <p className="text-error font-black text-xl">28 /min</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase font-bold text-error/70 tracking-wide">WBC</p>
                      <p className="text-error font-black text-xl">14K</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <button className="px-5 py-2.5 bg-error text-white font-bold rounded-lg shadow-sm hover:brightness-110 active:scale-95 transition-all">
                      Review Patient Chart
                    </button>
                    <button className="px-5 py-2.5 bg-transparent text-error border-2 border-error/30 font-bold rounded-lg hover:bg-error/5 active:scale-95 transition-all">
                      Acknowledge
                    </button>
                  </div>
                </div>
              </div>
            </FadeInItem>

            <FadeInItem>
              <div className="bg-yellow-50 p-6 rounded-xl shadow-sm border border-yellow-200/50 flex flex-col sm:flex-row sm:items-start gap-5">
                <div className="w-14 h-14 rounded-full bg-yellow-500 text-white flex flex-shrink-0 items-center justify-center shadow-lg shadow-yellow-500/30 mt-1">
                  <span className="material-symbols-outlined text-2xl font-bold">medication</span>
                </div>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-4 mb-2">
                    <h3 className="text-2xl font-extrabold text-yellow-900 tracking-tight">Medication Interaction Warning</h3>
                    <span className="px-3 py-1 bg-yellow-200 text-yellow-800 text-xs font-bold rounded-full uppercase tracking-wider">Moderate</span>
                  </div>
                  <p className="text-yellow-800/80 font-medium text-lg mb-4">
                    Prescribed Amiodarone has a known moderate interaction with newly requested Simvastatin.
                  </p>
                  <button className="px-5 py-2 bg-yellow-200 text-yellow-900 font-bold rounded-lg hover:brightness-95 active:scale-95 transition-all">
                    View Details
                  </button>
                </div>
              </div>
            </FadeInItem>

          </StaggerContainer>
        </main>
      </PageTransition>
    </div>
  );
}
