'use client';
import Navbar from '@/components/Navbar';
import { PageTransition, StaggerContainer, FadeInItem } from '@/components/PageTransition';

export default function MetricsPage() {
  return (
    <div className="bg-surface text-on-surface antialiased font-body min-h-screen">
      <Navbar activePage="metrics" />

      <PageTransition>
        <main className="pt-28 pb-32 px-6 max-w-6xl mx-auto space-y-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-4">
            <div>
              <h2 className="text-4xl font-extrabold text-on-surface tracking-tight">System Metrics</h2>
              <p className="text-on-surface-variant text-lg mt-2">Platform analytics, model performance, and utilization statistics.</p>
            </div>
            <div className="flex items-center gap-2 bg-surface-container-high px-4 py-2 rounded-lg ext-sm font-bold text-on-surface-variant">
              <span className="material-symbols-outlined text-[1.1rem]">calendar_month</span>
              Last 30 Days
              <span className="material-symbols-outlined text-[1.1rem]">expand_more</span>
            </div>
          </div>

          <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            <FadeInItem>
              <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-sm border border-outline-variant/30 flex flex-col h-full hover:-translate-y-1 transition-transform">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <span className="material-symbols-outlined">analytics</span>
                  </div>
                  <span className="px-2.5 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full flex items-center gap-1">
                    <span className="material-symbols-outlined text-[1rem]">trending_up</span> 14%
                  </span>
                </div>
                <h3 className="text-on-surface-variant font-semibold text-sm uppercase tracking-wider mb-1">Total Sessions Analyzed</h3>
                <p className="text-4xl font-black text-on-surface">1,284</p>
                <div className="mt-4 pt-4 border-t border-outline-variant/20 text-sm text-on-surface-variant font-medium flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary"></span> 842 Live Audio
                  <span className="w-2 h-2 rounded-full bg-secondary ml-2"></span> 442 Transcripts
                </div>
              </div>
            </FadeInItem>

            <FadeInItem>
              <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-sm border border-outline-variant/30 flex flex-col h-full hover:-translate-y-1 transition-transform relative overflow-hidden">
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center">
                      <span className="material-symbols-outlined">auto_awesome</span>
                    </div>
                  </div>
                  <h3 className="text-on-surface-variant font-semibold text-sm uppercase tracking-wider mb-1">Avg. AI Confidence</h3>
                  <p className="text-4xl font-black text-on-surface">96.8%</p>
                  <p className="text-sm text-secondary font-bold mt-1">Exceptional Accuracy</p>
                </div>
                {/* Decorative background curve */}
                <svg className="absolute bottom-0 right-0 w-32 h-32 text-secondary/5" viewBox="0 0 100 100" fill="currentColor">
                  <circle cx="80" cy="80" r="60" />
                  <circle cx="80" cy="80" r="40" className="text-secondary/10" />
                </svg>
              </div>
            </FadeInItem>

            <FadeInItem>
              <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-sm border border-outline-variant/30 flex flex-col h-full hover:-translate-y-1 transition-transform">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-error/10 text-error flex items-center justify-center">
                    <span className="material-symbols-outlined">speed</span>
                  </div>
                  <span className="px-2.5 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full flex items-center gap-1">
                    <span className="material-symbols-outlined text-[1rem]">trending_down</span> 0.2s
                  </span>
                </div>
                <h3 className="text-on-surface-variant font-semibold text-sm uppercase tracking-wider mb-1">Avg. API Latency</h3>
                <p className="text-4xl font-black text-on-surface">1.4s</p>
                <div className="mt-auto pt-4 flex gap-1 h-8 items-end w-full">
                   {/* Fake Bar Graph */}
                   {[40, 60, 30, 80, 50, 45, 90, 30, 20, 55].map((h, i) => (
                     <div key={i} className="flex-1 bg-primary/20 rounded-t-sm" style={{ height: `${h}%` }}></div>
                   ))}
                </div>
              </div>
            </FadeInItem>

          </StaggerContainer>

          <StaggerContainer className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <FadeInItem>
              <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/30 p-8 h-full flex flex-col justify-center items-center text-center">
                 <span className="material-symbols-outlined text-6xl text-outline-variant mb-4">insert_chart</span>
                 <h3 className="text-xl font-bold text-on-surface">Advanced Visualizations</h3>
                 <p className="text-on-surface-variant max-w-sm mt-2">D3.js or Chart.js interactive graphs for longitudinal patient insights will be populated here.</p>
              </div>
            </FadeInItem>

            <FadeInItem>
               {/* Resource Utilization Mock */}
               <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/30 p-8">
                  <h3 className="text-lg font-bold text-on-surface mb-6">Backend Resources</h3>
                  
                  <div className="space-y-6">
                    <div>
                      <div className="flex justify-between text-sm font-bold mb-2">
                        <span className="text-on-surface">GPU Memory (Whisper AI)</span>
                        <span className="text-primary">6.4 GB / 8 GB</span>
                      </div>
                      <div className="w-full bg-surface-container-high h-3 rounded-full overflow-hidden">
                        <div className="bg-primary h-full rounded-full" style={{ width: '80%' }}></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-sm font-bold mb-2">
                        <span className="text-on-surface">RAM (FastAPI + Sepsis Model)</span>
                        <span className="text-secondary">2.1 GB / 16 GB</span>
                      </div>
                      <div className="w-full bg-surface-container-high h-3 rounded-full overflow-hidden">
                        <div className="bg-secondary h-full rounded-full" style={{ width: '13%' }}></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-sm font-bold mb-2">
                        <span className="text-on-surface">Storage</span>
                        <span className="text-on-surface-variant">42 GB / 500 GB</span>
                      </div>
                      <div className="w-full bg-surface-container-high h-3 rounded-full overflow-hidden">
                        <div className="bg-outline-variant h-full rounded-full" style={{ width: '8%' }}></div>
                      </div>
                    </div>
                  </div>
               </div>
            </FadeInItem>

          </StaggerContainer>
        </main>
      </PageTransition>
    </div>
  );
}
