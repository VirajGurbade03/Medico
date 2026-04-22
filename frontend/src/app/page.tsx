'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { PageTransition } from '@/components/PageTransition';
import { Loader2 } from 'lucide-react';
import Image from 'next/image';

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      router.replace(user ? '/dashboard' : '/login');
    }
  }, [user, loading, router]);

  return (
    <PageTransition>
      <div className="flex-center bg-subtle-pattern" style={{ minHeight: '100vh', flexDirection: 'column' }}>
        <div style={{ textAlign: 'center', maxWidth: '600px', padding: '2rem' }}>
          
          {/* Professional Hero Graphic */}
          <div style={{ marginBottom: '2rem', position: 'relative', width: '280px', height: '280px', margin: '0 auto 2rem' }}>
            <Image 
              src="/hero-abstract.png" 
              alt="Medical AI Abstract" 
              fill
              style={{ objectFit: 'contain', filter: 'drop-shadow(0 10px 15px rgba(0,0,0,0.1))' }}
              priority
            />
          </div>

          <h1 style={{ marginBottom: '1rem', color: 'var(--blue-900)' }}>
            Clinica AI
          </h1>
          <p style={{ color: 'var(--gray-600)', fontSize: '1.125rem', marginBottom: '2rem', lineHeight: '1.6' }}>
            Intelligent transcription and symptom analysis for modern healthcare professionals.
          </p>
          
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.75rem', background: 'var(--surface)', padding: '0.75rem 1.5rem', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)' }}>
            <Loader2 className="animate-spin" size={20} color="var(--blue-600)" />
            <span style={{ color: 'var(--gray-600)', fontWeight: 500 }}>Initializing Workspace...</span>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
