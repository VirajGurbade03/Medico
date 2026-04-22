import type { Metadata } from 'next';
import { AuthProvider } from '@/lib/auth-context';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: 'Clinica AI | Medical Conversation Analyzer',
  description:
    'AI-powered Doctor-Patient Conversation Intelligence System. Transcribes audio, extracts symptoms, and generates structured medical reports. ⚠️ Not a medical diagnosis tool.',
  keywords: 'AI medical assistant, doctor patient conversation, symptom extraction, medical transcription',
  openGraph: {
    title: 'Clinica AI',
    description: 'AI-powered Medical Conversation Intelligence System',
    type: 'website',
  },
  icons: {
    icon: '/favicon.png',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
