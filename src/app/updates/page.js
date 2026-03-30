"use client";

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Zap, Shield, Wand2, Layers, GitMerge, Mic2, Settings2, Globe } from 'lucide-react';

const fadeUp = {
    hidden: { opacity: 0, y: 24 },
    show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] } },
};

const stagger = {
    hidden: {},
    show: { transition: { staggerChildren: 0.1 } },
};

const TAG_STYLES = {
    new:        { background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0' },
    improved:   { background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe' },
    fix:        { background: '#fff7ed', color: '#c2410c', border: '1px solid #fed7aa' },
    security:   { background: '#fdf4ff', color: '#7e22ce', border: '1px solid #e9d5ff' },
};

const updates = [
    {
        version: 'v1.4.0',
        date: 'March 29, 2026',
        badge: 'Latest',
        headline: 'Pricing overhaul & billing toggle',
        items: [
            { tag: 'new',      icon: Layers,    text: 'Monthly and yearly billing options with up to 20% savings on all plans.' },
            { tag: 'new',      icon: Zap,       text: 'Three-tier pricing: Basic ($5/mo), Pro ($15/mo), Studio ($35/mo).' },
            { tag: 'improved', icon: Settings2, text: 'Studio plan CTA and Razorpay order keys updated to match new billing variants.' },
            { tag: 'fix',      icon: GitMerge,  text: 'Usage limits were incorrectly defaulting to free-tier for all new plan keys. Fixed.' },
            { tag: 'fix',      icon: GitMerge,  text: 'Free plan daily limit corrected from 2 to 3 separations per day.' },
        ],
    },
    {
        version: 'v1.3.0',
        date: 'March 29, 2026',
        badge: null,
        headline: 'Routing fix & /studio launch',
        items: [
            { tag: 'fix',      icon: Globe,     text: 'Critical 404 fix: /app route renamed to /studio to avoid Next.js app-dir naming conflict.' },
            { tag: 'new',      icon: Zap,       text: 'Permanent 301 redirect added from /app → /studio so old links still work.' },
            { tag: 'improved', icon: Settings2, text: 'All CTAs and navbar links updated to point to /studio.' },
        ],
    },
    {
        version: 'v1.2.0',
        date: 'March 28, 2026',
        badge: null,
        headline: 'Payments & Razorpay integration',
        items: [
            { tag: 'new',      icon: Zap,       text: 'Migrated from Lemon Squeezy to Razorpay for seamless INR-based payments.' },
            { tag: 'new',      icon: Shield,    text: 'Razorpay webhook with signature verification updates user plan in Supabase on payment capture.' },
            { tag: 'new',      icon: Layers,    text: 'Payment receipts automatically emailed via Resend upon successful checkout.' },
            { tag: 'improved', icon: Settings2, text: 'Build-safe dummy keys prevent Vercel build crashes when env vars are absent.' },
            { tag: 'improved', icon: GitMerge,  text: 'Webhook now normalises plan keys (e.g. "basic-monthly" → "basic") before writing to DB.' },
        ],
    },
    {
        version: 'v1.1.0',
        date: 'March 27, 2026',
        badge: null,
        headline: 'REST API & API key management',
        items: [
            { tag: 'new',      icon: Globe,     text: 'Public REST API at /api/v1/separate — integrate AudSep into any workflow.' },
            { tag: 'new',      icon: Shield,    text: 'API key generation with SHA-256 hashing. Keys shown only once at creation.' },
            { tag: 'new',      icon: Settings2, text: 'API key management dashboard: create, list, and revoke keys.' },
            { tag: 'improved', icon: Zap,       text: 'All API routes enforce per-plan usage limits (free: 3/day, paid: monthly quotas).' },
        ],
    },
    {
        version: 'v1.0.1',
        date: 'March 26, 2026',
        badge: null,
        headline: 'Analytics, email & observability',
        items: [
            { tag: 'new',      icon: Layers,    text: 'PostHog analytics integrated for both frontend events and backend API tracking.' },
            { tag: 'new',      icon: Mic2,      text: 'Welcome emails sent via Resend when a new user signs up through Clerk.' },
            { tag: 'fix',      icon: GitMerge,  text: 'PostHog region updated to us.posthog.com to fix EU connectivity errors.' },
            { tag: 'security', icon: Shield,    text: 'NEXT_PUBLIC_RAZORPAY_KEY_ID exposed safely to frontend; secret kept server-side only.' },
        ],
    },
    {
        version: 'v1.0.0',
        date: 'March 25, 2026',
        badge: null,
        headline: 'Initial launch 🎉',
        items: [
            { tag: 'new',      icon: Wand2,     text: 'Audio separation powered by Meta\'s HTDemucs model with real-time streaming progress.' },
            { tag: 'new',      icon: Mic2,      text: 'Vocal isolation mode and support for music, speech, noise, and wind categories.' },
            { tag: 'new',      icon: Zap,       text: 'Stem mixer with per-track volume controls and ffmpeg-powered export.' },
            { tag: 'new',      icon: Layers,    text: 'Supabase backend: job tracking, user profiles, usage metering, and file storage.' },
            { tag: 'new',      icon: Shield,    text: 'Clerk authentication with automatic user provisioning on signup.' },
            { tag: 'new',      icon: Globe,     text: 'Split deployment: Vercel (Next.js frontend) + Railway (Python/Demucs worker).' },
        ],
    },
];

export default function UpdatesPage() {
    return (
        <main style={{ minHeight: '100vh', paddingTop: '6rem', background: '#fff' }}>
            {/* Header */}
            <section style={{ textAlign: 'center', padding: '3rem 2rem 4rem' }}>
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
                    <span style={{
                        display: 'inline-block', background: '#f3f3f3', border: '1px solid #e0e0e0',
                        borderRadius: '20px', padding: '0.35rem 1rem', fontSize: '0.8rem',
                        fontWeight: '600', color: '#555', marginBottom: '1.5rem', letterSpacing: '0.05em'
                    }}>
                        CHANGELOG
                    </span>
                    <h1 style={{ fontSize: 'clamp(2.25rem, 5vw, 3.5rem)', fontWeight: '900', letterSpacing: '-2px', color: '#0a0a0a', marginBottom: '1rem' }}>
                        What's new in AudSep
                    </h1>
                    <p style={{ color: '#666', fontSize: '1.05rem', maxWidth: '30rem', margin: '0 auto', lineHeight: 1.6 }}>
                        We ship improvements every week. Here's a full log of everything we've built, fixed, and launched.
                    </p>
                </motion.div>
            </section>

            {/* Timeline */}
            <section style={{ padding: '0 2rem 8rem' }}>
                <div style={{ maxWidth: '47.50rem', margin: '0 auto' }}>
                    <motion.div variants={stagger} initial="hidden" animate="show" style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
                        {updates.map((release, i) => (
                            <motion.div key={i} variants={fadeUp} style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '2rem', alignItems: 'start' }}>
                                {/* Left: version + date */}
                                <div style={{ paddingTop: '0.25rem', textAlign: 'right' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.35rem' }}>
                                        <span style={{ fontWeight: '800', fontSize: '0.9rem', color: '#0a0a0a', fontFamily: 'monospace' }}>{release.version}</span>
                                        {release.badge && (
                                            <span style={{ fontSize: '0.7rem', fontWeight: '700', background: '#111', color: '#fff', padding: '0.15rem 0.6rem', borderRadius: '99px' }}>{release.badge}</span>
                                        )}
                                        <span style={{ fontSize: '0.78rem', color: '#aaa', fontWeight: '500' }}>{release.date}</span>
                                    </div>
                                </div>

                                {/* Right: content */}
                                <div style={{ background: '#fafafa', border: '1px solid #ebebeb', borderRadius: '16px', padding: '1.75rem', position: 'relative' }}>
                                    {/* Connecting dot */}
                                    <div style={{
                                        position: 'absolute', left: '-2.5rem', top: '1.6rem',
                                        width: '10px', height: '10px', borderRadius: '50%',
                                        background: i === 0 ? '#111' : '#ddd',
                                        border: i === 0 ? '2px solid #111' : '2px solid #ccc',
                                    }} />

                                    <h2 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#0a0a0a', marginBottom: '1.25rem' }}>{release.headline}</h2>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                                        {release.items.map((item, j) => {
                                            const Icon = item.icon;
                                            const tagStyle = TAG_STYLES[item.tag];
                                            return (
                                                <div key={j} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem' }}>
                                                    <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: '#fff', border: '1px solid #e5e5e5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '1px' }}>
                                                        <Icon size={13} color="#555" strokeWidth={2} />
                                                    </div>
                                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', flexWrap: 'wrap', flex: 1 }}>
                                                        <span style={{ fontSize: '0.7rem', fontWeight: '700', padding: '0.18rem 0.55rem', borderRadius: '99px', ...tagStyle, marginTop: '2px', flexShrink: 0, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                                            {item.tag}
                                                        </span>
                                                        <span style={{ fontSize: '0.9rem', color: '#444', lineHeight: 1.5 }}>{item.text}</span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>

                    {/* Bottom CTA */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                        style={{ marginTop: '4rem', textAlign: 'center', background: '#111', borderRadius: '20px', padding: '3rem 2rem' }}
                    >
                        <h2 style={{ fontSize: '1.75rem', fontWeight: '900', color: '#fff', letterSpacing: '-1px', marginBottom: '0.75rem' }}>Stay in the loop</h2>
                        <p style={{ color: '#aaa', fontSize: '0.95rem', marginBottom: '2rem', maxWidth: '23.75rem', margin: '0 auto 2rem', lineHeight: 1.6 }}>
                            We ship weekly. Follow along on Twitter or just keep checking back here.
                        </p>
                        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                            <Link href="/studio" style={{ background: '#fff', color: '#111', fontWeight: '700', padding: '0.8rem 1.5rem', borderRadius: '10px', textDecoration: 'none', fontSize: '0.95rem' }}>
                                Try AudSep Free →
                            </Link>
                            <Link href="/contact" style={{ background: 'transparent', color: '#aaa', fontWeight: '600', padding: '0.8rem 1.5rem', borderRadius: '10px', textDecoration: 'none', fontSize: '0.95rem', border: '1px solid #333' }}>
                                Request a Feature
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Footer */}
            <footer style={{ padding: '2rem', borderTop: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', color: '#999', fontSize: '0.85rem' }}>
                <span>© 2026 AudSep. All rights reserved.</span>
                <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                    <Link href="/pricing" style={{ color: '#999', textDecoration: 'none' }}>Pricing</Link>
                    <Link href="/updates" style={{ color: '#999', textDecoration: 'none' }}>Updates</Link>
                    <Link href="/contact" style={{ color: '#999', textDecoration: 'none' }}>Contact</Link>
                    <Link href="/terms" style={{ color: '#999', textDecoration: 'none' }}>Terms of Service</Link>
                    <Link href="/privacy" style={{ color: '#999', textDecoration: 'none' }}>Privacy Policy</Link>
                    <Link href="/studio" style={{ color: '#999', textDecoration: 'none' }}>App</Link>
                </div>
            </footer>
        </main>
    );
}
