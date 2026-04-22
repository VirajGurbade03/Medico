'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { healthCheck } from '@/lib/api';

interface NavbarProps {
  activePage: 'home' | 'history' | 'alerts' | 'metrics';
}

export default function Navbar({ activePage }: NavbarProps) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    const checkAndPoll = async () => {
      try {
        await healthCheck();
        setBackendStatus('online');
        if (interval) clearInterval(interval);
      } catch {
        setBackendStatus('offline');
      }
    };

    checkAndPoll(); // Initial check
    
    // If offline, ping every 5 seconds until PyTorch models finish loading
    interval = setInterval(() => {
      if (backendStatus !== 'online') {
        checkAndPoll();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [backendStatus]);

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/login');
    } catch (e) {
      console.error(e);
    }
  };

  const linkClass = (page: string) => `font-medium px-3 py-2 rounded-lg transition-colors ${activePage === page ? 'text-primary font-bold bg-primary/5' : 'text-slate-500 hover:bg-primary/5'}`;

  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl shadow-[0px_10px_30px_rgba(25,28,35,0.06)]">
      <div className="flex justify-between items-center px-6 py-4">
        {/* Logo Section */}
        <Link href="/dashboard" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary-container text-white shadow-sm ring-1 ring-primary/10">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>clinical_notes</span>
          </div>
          <h1 className="text-lg font-bold text-blue-900 dark:text-blue-100 font-['Inter'] tracking-tight">Clinica AI</h1>
        </Link>
        
        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-8">
          <nav className="flex items-center gap-4">
            <Link className={linkClass('home')} href="/dashboard">Home</Link>
            <Link className={linkClass('history')} href="/history">History</Link>
            <Link className={linkClass('alerts')} href="/alerts">Alerts</Link>
            <Link className={linkClass('metrics')} href="/metrics">Metrics</Link>
          </nav>
          
          <div className="flex items-center gap-4 border-l border-outline-variant/30 pl-6">
            <div className={`flex items-center gap-2 text-xs px-3 py-1.5 rounded-full font-semibold tracking-wide ${backendStatus === 'online' ? 'bg-green-50 text-green-700 ring-1 ring-green-600/20' : backendStatus === 'offline' ? 'bg-red-50 text-red-700 ring-1 ring-red-600/20' : 'bg-yellow-50 text-yellow-700 ring-1 ring-yellow-600/20'}`}>
              <div className={`w-2 h-2 rounded-full shadow-sm ${backendStatus === 'online' ? 'bg-green-500 shadow-green-500/40' : backendStatus === 'offline' ? 'bg-red-500 shadow-red-500/40' : 'bg-yellow-500 animate-pulse'}`} />
              Backend {backendStatus === 'checking' ? 'Checking' : backendStatus === 'online' ? 'Online' : 'Offline'}
            </div>
            
            <button onClick={handleLogout} className="text-sm font-semibold text-primary hover:text-blue-800 transition-colors">
              Sign Out
            </button>

            <div className="h-10 w-10 flex items-center justify-center font-bold text-white rounded-full bg-surface-container-high overflow-hidden border-2 border-white shadow-md ring-1 ring-outline/10 text-lg select-none" style={{ background: 'linear-gradient(135deg, var(--blue-600), var(--blue-800))'}}>
                {user?.displayName?.[0] || user?.email?.[0]?.toUpperCase() || '?'}
            </div>
          </div>
        </div>
        
        {/* Mobile Menu Button */}
        <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="md:hidden w-10 h-10 flex items-center justify-center rounded-lg hover:bg-surface-variant text-on-surface-variant transition-colors">
          <span className="material-symbols-outlined">{isMenuOpen ? 'close' : 'menu'}</span>
        </button>
      </div>

      {/* Mobile Dropdown */}
      {isMenuOpen && (
        <div className="md:hidden border-t border-outline-variant/30 bg-surface px-6 py-4 flex flex-col gap-4 animate-fade-in shadow-xl">
          <nav className="flex flex-col gap-2">
            <Link onClick={() => setIsMenuOpen(false)} className={`block px-4 py-3 rounded-lg ${activePage === 'home' ? 'bg-primary/10 text-primary font-bold' : 'text-on-surface-variant'}`} href="/dashboard">Home</Link>
            <Link onClick={() => setIsMenuOpen(false)} className={`block px-4 py-3 rounded-lg ${activePage === 'history' ? 'bg-primary/10 text-primary font-bold' : 'text-on-surface-variant'}`} href="/history">History</Link>
            <Link onClick={() => setIsMenuOpen(false)} className={`block px-4 py-3 rounded-lg ${activePage === 'alerts' ? 'bg-primary/10 text-primary font-bold' : 'text-on-surface-variant'}`} href="/alerts">Alerts</Link>
            <Link onClick={() => setIsMenuOpen(false)} className={`block px-4 py-3 rounded-lg ${activePage === 'metrics' ? 'bg-primary/10 text-primary font-bold' : 'text-on-surface-variant'}`} href="/metrics">Metrics</Link>
          </nav>
          <hr className="border-outline-variant/30" />
          <div className="flex items-center justify-between">
            <div className={`flex items-center gap-2 text-xs px-3 py-1.5 rounded-full font-semibold ${backendStatus === 'online' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
               <div className={`w-2 h-2 rounded-full ${backendStatus === 'online' ? 'bg-green-500' : 'bg-red-500'}`} />
               API {backendStatus}
            </div>
            <button onClick={handleLogout} className="text-error font-bold tracking-wide">
              Sign Out
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
