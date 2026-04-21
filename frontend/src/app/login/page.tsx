'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/lib/auth-context';
import { PageTransition } from '@/components/PageTransition';
import { Stethoscope, AlertTriangle, ArrowRight, Loader2, Mail, Lock } from 'lucide-react';

export default function LoginPage() {
  const { signIn } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signIn(form.email, form.password);
      router.push('/dashboard');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '';
      if (msg.includes('user-not-found') || msg.includes('wrong-password') || msg.includes('invalid-credential')) {
        setError('Invalid email or password. Please try again.');
      } else {
        setError('Login failed. Please check your credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageTransition>
      <div style={{ minHeight: '100vh', display: 'flex', background: 'var(--bg)' }}>
        
        {/* Left Side: Form */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '2rem' }}>
          {/* Logo / Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: 'auto' }}>
            <div style={{ background: 'var(--blue-50)', padding: '0.5rem', borderRadius: 'var(--radius-sm)' }}>
              <Stethoscope size={24} color="var(--blue-600)" />
            </div>
            <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--blue-900)' }}>AI Clinical Assistant</span>
          </div>

          <div style={{ maxWidth: '400px', width: '100%', margin: 'auto' }}>
            <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem', color: 'var(--gray-900)' }}>
              Welcome back
            </h1>
            <p style={{ color: 'var(--gray-600)', marginBottom: '2rem' }}>
              Sign in to access medical conversation intelligence.
            </p>

            {error && (
              <div className="toast-error" style={{ position: 'relative', top: 0, right: 0, maxWidth: 'none', marginBottom: '1.5rem', borderRadius: 'var(--radius-sm)' }}>
                <AlertTriangle size={18} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="input-group">
                <label htmlFor="email">Email Address</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={18} color="var(--gray-400)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    id="email"
                    type="email"
                    className="input"
                    placeholder="doctor@hospital.com"
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    required
                    autoComplete="email"
                    style={{ paddingLeft: '2.75rem' }}
                  />
                </div>
              </div>
              <div className="input-group">
                <label htmlFor="password">Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={18} color="var(--gray-400)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    id="password"
                    type="password"
                    className="input"
                    placeholder="Enter your password"
                    value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    required
                    autoComplete="current-password"
                    minLength={6}
                    style={{ paddingLeft: '2.75rem' }}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-lg"
                disabled={loading}
                style={{ marginTop: '0.5rem', width: '100%', display: 'flex', gap: '0.5rem' }}
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : <ArrowRight size={20} />}
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.9375rem', color: 'var(--gray-600)' }}>
              Don&apos;t have an account?{' '}
              <Link href="/signup" style={{ fontWeight: 600, color: 'var(--blue-600)' }}>Create one</Link>
            </p>
          </div>

          <div className="disclaimer" style={{ marginTop: 'auto', maxWidth: '400px', alignSelf: 'center', background: 'transparent', border: 'none', borderLeft: '3px solid var(--danger)' }}>
            <AlertTriangle size={18} color="var(--danger)" style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>This is an AI-assisted tool and NOT a medical diagnosis system. Always consult a qualified healthcare professional.</span>
          </div>
        </div>

        {/* Right Side: Abstract Illustration */}
        <div style={{ flex: 1, backgroundColor: 'var(--blue-50)', display: 'none', position: 'relative' }} className="auth-illustration">
           <Image 
              src="/auth-illustration.png" 
              alt="Clinical Dashboard" 
              fill
              style={{ objectFit: 'cover' }}
              priority
            />
        </div>
        
        <style dangerouslySetInnerHTML={{__html: `
          @media (min-width: 1024px) {
            .auth-illustration { display: block !important; }
          }
        `}} />
      </div>
    </PageTransition>
  );
}
