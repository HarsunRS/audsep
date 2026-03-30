"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, MessageSquare, Twitter, Github } from 'lucide-react';
import Link from 'next/link';

const fadeUp = {
    hidden: { opacity: 0, y: 25 },
    show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } }
};

export default function ContactPage() {
    const [form, setForm] = useState({ name: '', email: '', subject: 'General Inquiry', message: '' });
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        // In production: POST to an API route / email service
        setSubmitted(true);
    };

    const subjects = ['General Inquiry', 'Enterprise Sales', 'Technical Support', 'Bug Report', 'Feature Request'];

    return (
        <main style={{ minHeight: '100vh', paddingTop: '6rem' }}>
            <section style={{ padding: '4rem 2rem 6rem' }}>
                <div style={{ maxWidth: '62.50rem', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '4rem', alignItems: 'start' }}>

                    {/* Left: Contact info */}
                    <motion.div variants={{ hidden: { opacity: 0, x: -20 }, show: { opacity: 1, x: 0 } }} initial="hidden" animate="show" transition={{ duration: 0.6 }}>
                        <span style={{
                            display: 'inline-block', background: '#f3f3f3', border: '1px solid #e0e0e0',
                            borderRadius: '20px', padding: '0.35rem 1rem', fontSize: '0.8rem',
                            fontWeight: '600', color: '#555', marginBottom: '1.5rem', letterSpacing: '0.05em'
                        }}>
                            CONTACT
                        </span>
                        <h1 style={{ fontSize: '2.75rem', fontWeight: '900', letterSpacing: '-2px', color: '#0a0a0a', marginBottom: '1rem', lineHeight: 1.1 }}>
                            Let's talk.
                        </h1>
                        <p style={{ color: '#666', fontSize: '1rem', lineHeight: 1.7, marginBottom: '3rem' }}>
                            Whether you have a question about pricing, want to explore enterprise options, or just found a bug — we'd love to hear from you.
                        </p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            {[
                                { icon: Mail, label: 'Email us', val: 'hello@audsep.io' },
                                { icon: Twitter, label: 'Twitter / X', val: '@audsep' },
                                { icon: Github, label: 'GitHub', val: 'github.com/audsep' },
                                { icon: MessageSquare, label: 'Response time', val: '< 24 hours' },
                            ].map(({ icon: Icon, label, val }, i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <div style={{ width: '40px', height: '40px', background: '#f3f3f3', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                        <Icon size={18} color="#333" />
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.78rem', color: '#999', marginBottom: '1px' }}>{label}</div>
                                        <div style={{ fontSize: '0.95rem', fontWeight: '600', color: '#222' }}>{val}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>

                    {/* Right: Form */}
                    <motion.div variants={{ hidden: { opacity: 0, x: 20 }, show: { opacity: 1, x: 0 } }} initial="hidden" animate="show" transition={{ duration: 0.6, delay: 0.1 }}>
                        {submitted ? (
                            <div style={{ textAlign: 'center', padding: '4rem 2rem', background: '#fff', border: '1.5px solid #ebebeb', borderRadius: '20px' }}>
                                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✉️</div>
                                <h2 style={{ fontWeight: '800', fontSize: '1.5rem', color: '#0a0a0a', marginBottom: '0.75rem' }}>Message sent!</h2>
                                <p style={{ color: '#666' }}>We'll get back to you within 24 hours.</p>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} style={{ background: '#fff', border: '1.5px solid #ebebeb', borderRadius: '20px', padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                        <label style={{ fontSize: '0.82rem', fontWeight: '600', color: '#555' }}>Name</label>
                                        <input
                                            required value={form.name}
                                            onChange={e => setForm({ ...form, name: e.target.value })}
                                            placeholder="Your name"
                                            style={{ padding: '0.7rem 1rem', border: '1.5px solid #e8e8e8', borderRadius: '8px', fontSize: '0.95rem', outline: 'none', transition: 'border-color 0.2s', background: '#fafafa' }}
                                            onFocus={e => e.target.style.borderColor = '#111'}
                                            onBlur={e => e.target.style.borderColor = '#e8e8e8'}
                                        />
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                        <label style={{ fontSize: '0.82rem', fontWeight: '600', color: '#555' }}>Email</label>
                                        <input
                                            required type="email" value={form.email}
                                            onChange={e => setForm({ ...form, email: e.target.value })}
                                            placeholder="you@example.com"
                                            style={{ padding: '0.7rem 1rem', border: '1.5px solid #e8e8e8', borderRadius: '8px', fontSize: '0.95rem', outline: 'none', transition: 'border-color 0.2s', background: '#fafafa' }}
                                            onFocus={e => e.target.style.borderColor = '#111'}
                                            onBlur={e => e.target.style.borderColor = '#e8e8e8'}
                                        />
                                    </div>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                    <label style={{ fontSize: '0.82rem', fontWeight: '600', color: '#555' }}>Subject</label>
                                    <select value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })}
                                        style={{ padding: '0.7rem 1rem', border: '1.5px solid #e8e8e8', borderRadius: '8px', fontSize: '0.95rem', outline: 'none', background: '#fafafa', cursor: 'pointer' }}>
                                        {subjects.map(s => <option key={s}>{s}</option>)}
                                    </select>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                    <label style={{ fontSize: '0.82rem', fontWeight: '600', color: '#555' }}>Message</label>
                                    <textarea
                                        required value={form.message} rows={6}
                                        onChange={e => setForm({ ...form, message: e.target.value })}
                                        placeholder="Tell us what's on your mind..."
                                        style={{ padding: '0.7rem 1rem', border: '1.5px solid #e8e8e8', borderRadius: '8px', fontSize: '0.95rem', outline: 'none', resize: 'vertical', transition: 'border-color 0.2s', background: '#fafafa', fontFamily: 'inherit' }}
                                        onFocus={e => e.target.style.borderColor = '#111'}
                                        onBlur={e => e.target.style.borderColor = '#e8e8e8'}
                                    />
                                </div>

                                <button type="submit" style={{
                                    background: '#111', color: '#fff', border: 'none',
                                    borderRadius: '10px', padding: '0.9rem', fontWeight: '700',
                                    fontSize: '1rem', cursor: 'pointer', transition: 'opacity 0.2s'
                                }}
                                    onMouseEnter={e => e.target.style.opacity = '0.85'}
                                    onMouseLeave={e => e.target.style.opacity = '1'}
                                >
                                    Send Message →
                                </button>
                            </form>
                        )}
                    </motion.div>
                </div>
            </section>
            {/* ─── FOOTER ─── */}
            <footer style={{ padding: '2rem', borderTop: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', color: '#999', fontSize: '0.85rem' }}>
                <span>© 2026 AudSep. All rights reserved.</span>
                <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                    <Link href="/pricing" style={{ color: '#999', textDecoration: 'none' }}>Pricing</Link>
                    <Link href="/contact" style={{ color: '#999', textDecoration: 'none' }}>Contact</Link>
                    <Link href="/terms" style={{ color: '#999', textDecoration: 'none' }}>Terms of Service</Link>
                    <Link href="/privacy" style={{ color: '#999', textDecoration: 'none' }}>Privacy Policy</Link>
                    <Link href="/studio" style={{ color: '#999', textDecoration: 'none' }}>App</Link>
                </div>
            </footer>
        </main>
    );
}
