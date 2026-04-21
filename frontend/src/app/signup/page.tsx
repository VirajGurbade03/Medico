'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/lib/auth-context';
import { PageTransition } from '@/components/PageTransition';
import { Stethoscope, AlertTriangle, ArrowRight, Loader2, Mail, Lock, User } from 'lucide-react';

export default function SignupPage() {
  const { signUp } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm) {
      setError('Passwords do not match.');
      return;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    try {
      await signUp(form.email, form.password, form.name);
      router.push('/dashboard');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '';
      if (msg.includes('email-already-in-use')) {
        setError('This email is already registered. Please sign in.');
      } else {
        setError('Registration failed. Please try again.');
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
              Create Account
            </h1>
            <p style={{ color: 'var(--gray-600)', marginBottom: '2rem' }}>
              Join to access intelligent medical transcription.
            </p>

            {error && (
              <div className="toast-error" style={{ position: 'relative', top: 0, right: 0, maxWidth: 'none', marginBottom: '1.5rem', borderRadius: 'var(--radius-sm)' }}>
                <AlertTriangle size={18} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.125rem' }}>
              <div className="input-group">
                <label htmlFor="name">Full Name</label>
                <div style={{ position: 'relative' }}>
                  <User size={18} color="var(--gray-400)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    id="name"
                    type="text"
                    className="input"
                    placeholder="Dr. Jane Smith"
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    required
                    style={{ paddingLeft: '2.75rem' }}
                  />
                </div>
              </div>

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
                    placeholder="Min. 6 characters"
                    value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    required
                    minLength={6}
                    style={{ paddingLeft: '2.75rem' }}
                  />
                </div>
              </div>

              <div className="input-group">
                <label htmlFor="confirm">Confirm Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={18} color="var(--gray-400)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    id="confirm"
                    type="password"
                    className="input"
                    placeholder="Repeat password"
                    value={form.confirm}
                    onChange={e => setForm(f => ({ ...f, confirm: e.target.value }))}
                    required
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
                {loading ? 'Creating account...' : 'Create Account'}
              </button>
            </form>

            <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.9375rem', color: 'var(--gray-600)' }}>
              Already have an account?{' '}
              <Link href="/login" style={{ fontWeight: 600, color: 'var(--blue-600)' }}>Sign in</Link>
            </p>
          </div>

          <div className="disclaimer" style={{ marginTop: 'auto', maxWidth: '450px', alignSelf: 'center', background: 'transparent', border: 'none', borderLeft: '3px solid var(--danger)' }}>
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
