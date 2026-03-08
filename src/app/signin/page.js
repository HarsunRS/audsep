"use client";

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function SignInPage() {
    return (
        <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '7rem 2rem 4rem' }}>
            <motion.div
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
                style={{ width: '100%', maxWidth: '420px' }}
            >
                <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                    <h1 style={{ fontSize: '2rem', fontWeight: '900', letterSpacing: '-1px', color: '#0a0a0a', marginBottom: '0.5rem' }}>Sign in</h1>
                    <p style={{ color: '#666' }}>Welcome back to AudSep.</p>
                </div>

                <div style={{ background: '#fff', border: '1.5px solid #ebebeb', borderRadius: '20px', padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {/* Social logins */}
                    {[
                        { label: 'Continue with Google', icon: '🔵' },
                        { label: 'Continue with GitHub', icon: '⚫' },
                    ].map((btn, i) => (
                        <button key={i} style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem',
                            background: '#fafafa', border: '1.5px solid #e8e8e8', borderRadius: '10px',
                            padding: '0.8rem', cursor: 'pointer', fontWeight: '600', fontSize: '0.95rem', color: '#222',
                            transition: 'border-color 0.2s'
                        }}
                            onMouseEnter={e => e.currentTarget.style.borderColor = '#111'}
                            onMouseLeave={e => e.currentTarget.style.borderColor = '#e8e8e8'}
                        >
                            <span>{btn.icon}</span> {btn.label}
                        </button>
                    ))}

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', margin: '0.5rem 0' }}>
                        <div style={{ flex: 1, height: '1px', background: '#e8e8e8' }} />
                        <span style={{ color: '#aaa', fontSize: '0.8rem', flexShrink: 0 }}>or email</span>
                        <div style={{ flex: 1, height: '1px', background: '#e8e8e8' }} />
                    </div>

                    <form onSubmit={e => e.preventDefault()} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <input type="email" placeholder="you@example.com" required
                            style={{ padding: '0.8rem 1rem', border: '1.5px solid #e8e8e8', borderRadius: '10px', fontSize: '0.95rem', outline: 'none', background: '#fafafa' }}
                            onFocus={e => e.target.style.borderColor = '#111'}
                            onBlur={e => e.target.style.borderColor = '#e8e8e8'}
                        />
                        <input type="password" placeholder="Password" required
                            style={{ padding: '0.8rem 1rem', border: '1.5px solid #e8e8e8', borderRadius: '10px', fontSize: '0.95rem', outline: 'none', background: '#fafafa' }}
                            onFocus={e => e.target.style.borderColor = '#111'}
                            onBlur={e => e.target.style.borderColor = '#e8e8e8'}
                        />
                        <button type="submit" style={{
                            background: '#111', color: '#fff', border: 'none', borderRadius: '10px',
                            padding: '0.9rem', fontWeight: '700', fontSize: '1rem', cursor: 'pointer'
                        }}>
                            Sign In
                        </button>
                    </form>

                    <p style={{ textAlign: 'center', color: '#888', fontSize: '0.88rem', marginTop: '0.5rem' }}>
                        No account?{' '}
                        <Link href="/contact" style={{ color: '#111', fontWeight: '700', textDecoration: 'none' }}>
                            Contact us for early access →
                        </Link>
                    </p>
                </div>
            </motion.div>
        </main>
    );
}
