'use client';
import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#fafafa', padding: '2rem',
    }}>
      <div>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.8rem', fontWeight: '900', letterSpacing: '-1px', color: '#0a0a0a' }}>
            Welcome back
          </h1>
          <p style={{ color: '#777', marginTop: '0.5rem' }}>Sign in to your AudSep account</p>
        </div>
        <SignIn />
      </div>
    </div>
  );
}
