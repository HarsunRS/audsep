"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

const fadeUp = {
    hidden: { opacity: 0, y: 24 },
    show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] } },
};
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };

const CATEGORIES = ['All', 'Tutorial', 'Use Case', 'Deep Dive', 'Workflow'];

const posts = [
    {
        slug: 'how-stem-separation-works',
        category: 'Deep Dive',
        date: 'March 28, 2026',
        readTime: '7 min read',
        featured: true,
        title: 'How AI Stem Separation Actually Works',
        excerpt: 'A plain-English breakdown of source separation — from classic NMF methods to Meta\'s HTDemucs Hybrid Transformer architecture that powers AudSep today.',
        tag: '#AI #AudioScience',
        gradient: 'linear-gradient(135deg, #0a0a0a 0%, #2d2d2d 100%)',
        textColor: '#fff',
    },
    {
        slug: 'dj-workflow-isolate-acapellas',
        category: 'Use Case',
        date: 'March 26, 2026',
        readTime: '5 min read',
        featured: false,
        title: 'The DJ\'s Guide to Isolating Acapellas in 60 Seconds',
        excerpt: 'Stop hunting for official vocal stems. Learn how to rip a clean acapella from any track in under a minute using AudSep — and blend it live with perfect pitch.',
        tag: '#DJ #VocalIsolation',
        gradient: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
        textColor: '#fff',
    },
    {
        slug: 'podcast-noise-removal',
        category: 'Tutorial',
        date: 'March 24, 2026',
        readTime: '4 min read',
        featured: false,
        title: 'Remove Background Noise from Podcast Recordings',
        excerpt: 'HVAC hum, street noise, and keyboard clicks ruin podcast audio. Here\'s a step-by-step workflow for getting broadcast-clean dialogue using AudSep\'s denoiser mode.',
        tag: '#Podcast #NoiseRemoval',
        gradient: 'linear-gradient(135deg, #1a1a1a 0%, #3a3a3a 100%)',
        textColor: '#fff',
    },
    {
        slug: 'music-production-sampling',
        category: 'Use Case',
        date: 'March 22, 2026',
        readTime: '6 min read',
        featured: false,
        title: 'Sampling in 2026: How Producers Use AI Stems',
        excerpt: 'Modern beat makers don\'t flip vinyl anymore — they flip stems. We explore how producers use AudSep to legally sample elements from reference tracks, then rebuild them into something entirely new.',
        tag: '#BeatMaking #Sampling',
        gradient: 'linear-gradient(135deg, #111 0%, #444 100%)',
        textColor: '#fff',
    },
    {
        slug: 'stem-separation-for-music-teachers',
        category: 'Use Case',
        date: 'March 20, 2026',
        readTime: '4 min read',
        featured: false,
        title: 'How Music Teachers Use Stem Separation in the Classroom',
        excerpt: 'From transcribing solos to teaching chord voicings, isolated stems are a secret weapon for music education. Here\'s how teachers have incorporated AudSep into lessons.',
        tag: '#Education #MusicTheory',
        gradient: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)',
        textColor: '#fff',
    },
    {
        slug: 'karaoke-track-creation',
        category: 'Tutorial',
        date: 'March 18, 2026',
        readTime: '3 min read',
        featured: false,
        title: 'Build a Perfect Karaoke Track in 3 Steps',
        excerpt: 'Upload. Remove vocals. Export instrumental. It really is that simple. We walk through the exact settings to get a clean, full-band karaoke backing track with no bleed-through.',
        tag: '#Karaoke #Tutorial',
        gradient: 'linear-gradient(135deg, #1a1a1a 0%, #333 100%)',
        textColor: '#fff',
    },
    {
        slug: 'htdemucs-vs-mdxnet',
        category: 'Deep Dive',
        date: 'March 15, 2026',
        readTime: '9 min read',
        featured: false,
        title: 'HTDemucs vs MDX-Net: Which Model Should You Use?',
        excerpt: 'Both models are excellent, but they excel in different scenarios. We ran 200 test tracks through both and break down exactly when you should pick each one.',
        tag: '#Models #Benchmarks',
        gradient: 'linear-gradient(135deg, #111 0%, #2a2a2a 100%)',
        textColor: '#fff',
    },
    {
        slug: 'film-score-stem-workflows',
        category: 'Workflow',
        date: 'March 12, 2026',
        readTime: '5 min read',
        featured: false,
        title: 'How Film Composers Use Stem Separation for Reference Tracks',
        excerpt: 'When a director says "I want it to sound like Zimmer", composers need to study that reference deeply. Here\'s how to tear apart a film score stems-by-stem to understand what makes it tick.',
        tag: '#FilmScore #Composers',
        gradient: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
        textColor: '#fff',
    },
];

const FeaturedPost = ({ post }) => (
    <motion.div
        variants={fadeUp}
        style={{
            background: post.gradient, borderRadius: '24px', padding: '3rem',
            position: 'relative', overflow: 'hidden', cursor: 'pointer',
            gridColumn: '1 / -1',
        }}
        whileHover={{ scale: 1.005, transition: { duration: 0.2 } }}
    >
        <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: '40%', background: 'radial-gradient(circle at 100% 50%, rgba(255,255,255,0.04), transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', maxWidth: '600px' }}>
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: '700', background: '#fff', color: '#111', padding: '0.25rem 0.75rem', borderRadius: '99px' }}>FEATURED</span>
                <span style={{ fontSize: '0.75rem', fontWeight: '600', color: 'rgba(255,255,255,0.5)' }}>{post.category}</span>
                <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>{post.readTime}</span>
            </div>
            <h2 style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: '900', color: '#fff', letterSpacing: '-1px', marginBottom: '1rem', lineHeight: 1.15 }}>
                {post.title}
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.95rem', lineHeight: 1.65, marginBottom: '1.75rem', maxWidth: '520px' }}>
                {post.excerpt}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span style={{
                    display: 'inline-block', background: '#fff', color: '#111',
                    fontWeight: '700', padding: '0.65rem 1.5rem', borderRadius: '10px', fontSize: '0.9rem',
                }}>
                    Read article →
                </span>
                <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.82rem' }}>{post.date}</span>
            </div>
        </div>
    </motion.div>
);

const PostCard = ({ post }) => (
    <motion.div
        variants={fadeUp}
        style={{
            background: '#fff', border: '1.5px solid #ebebeb', borderRadius: '20px',
            overflow: 'hidden', cursor: 'pointer', display: 'flex', flexDirection: 'column',
            transition: 'border-color 0.2s',
        }}
        whileHover={{ boxShadow: '0 12px 40px rgba(0,0,0,0.08)', borderColor: '#ccc', y: -3 }}
    >
        {/* Card header colour strip */}
        <div style={{ height: '6px', background: post.gradient }} />
        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
            <div style={{ display: 'flex', gap: '0.6rem', marginBottom: '1rem', alignItems: 'center' }}>
                <span style={{ fontSize: '0.7rem', fontWeight: '700', background: '#f3f3f3', color: '#555', padding: '0.2rem 0.6rem', borderRadius: '99px', border: '1px solid #e8e8e8' }}>
                    {post.category.toUpperCase()}
                </span>
                <span style={{ fontSize: '0.75rem', color: '#aaa' }}>{post.readTime}</span>
            </div>
            <h3 style={{ fontWeight: '800', fontSize: '1rem', color: '#111', lineHeight: 1.35, marginBottom: '0.65rem' }}>{post.title}</h3>
            <p style={{ color: '#666', fontSize: '0.85rem', lineHeight: 1.6, flex: 1, marginBottom: '1.25rem' }}>{post.excerpt}</p>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid #f3f3f3' }}>
                <span style={{ fontSize: '0.78rem', color: '#bbb' }}>{post.date}</span>
                <span style={{ fontSize: '0.82rem', fontWeight: '700', color: '#111' }}>Read →</span>
            </div>
        </div>
    </motion.div>
);

export default function BlogPage() {
    const [activeCategory, setActiveCategory] = useState('All');
    const filtered = activeCategory === 'All' ? posts : posts.filter(p => p.category === activeCategory);
    const featured = filtered.find(p => p.featured);
    const rest = filtered.filter(p => !p.featured);

    return (
        <main style={{ minHeight: '100vh', paddingTop: '6rem', background: '#fff' }}>

            {/* Header */}
            <section style={{ textAlign: 'center', padding: '3rem 2rem 3.5rem' }}>
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
                    <span style={{
                        display: 'inline-block', background: '#f3f3f3', border: '1px solid #e0e0e0',
                        borderRadius: '20px', padding: '0.35rem 1rem', fontSize: '0.8rem',
                        fontWeight: '600', color: '#555', marginBottom: '1.5rem', letterSpacing: '0.05em'
                    }}>
                        BLOG
                    </span>
                    <h1 style={{ fontSize: 'clamp(2.25rem, 5vw, 3.5rem)', fontWeight: '900', letterSpacing: '-2px', color: '#0a0a0a', marginBottom: '1rem' }}>
                        Tutorials, deep dives &amp; use cases
                    </h1>
                    <p style={{ color: '#666', fontSize: '1.05rem', maxWidth: '480px', margin: '0 auto', lineHeight: 1.6 }}>
                        Everything we know about stem separation, audio production workflows, and making AI work for real creators.
                    </p>
                </motion.div>
            </section>

            {/* Category filter */}
            <div style={{ display: 'flex', justifyContent: 'center', padding: '0 2rem 2.5rem' }}>
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                    style={{ display: 'flex', gap: '0.5rem', background: '#f5f5f5', padding: '0.35rem', borderRadius: '99px', flexWrap: 'wrap', justifyContent: 'center' }}
                >
                    {CATEGORIES.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setActiveCategory(cat)}
                            style={{
                                padding: '0.4rem 1.1rem', borderRadius: '99px', border: 'none', cursor: 'pointer',
                                fontWeight: '600', fontSize: '0.85rem', transition: 'all 0.2s',
                                background: activeCategory === cat ? '#111' : 'transparent',
                                color: activeCategory === cat ? '#fff' : '#777',
                            }}
                        >
                            {cat}
                        </button>
                    ))}
                </motion.div>
            </div>

            {/* Posts grid */}
            <section style={{ padding: '0 2rem 8rem' }}>
                <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeCategory}
                            variants={stagger} initial="hidden" animate="show"
                            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}
                        >
                            {featured && <FeaturedPost post={featured} />}
                            {rest.map((post, i) => <PostCard key={post.slug} post={post} />)}

                            {filtered.length === 0 && (
                                <motion.div variants={fadeUp} style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '4rem', color: '#aaa' }}>
                                    No posts in this category yet.
                                </motion.div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </section>

            {/* Footer */}
            <footer style={{ padding: '2rem', borderTop: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', color: '#999', fontSize: '0.85rem' }}>
                <span>© 2026 AudSep. All rights reserved.</span>
                <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                    <Link href="/about" style={{ color: '#999', textDecoration: 'none' }}>About</Link>
                    <Link href="/blog" style={{ color: '#999', textDecoration: 'none' }}>Blog</Link>
                    <Link href="/pricing" style={{ color: '#999', textDecoration: 'none' }}>Pricing</Link>
                    <Link href="/updates" style={{ color: '#999', textDecoration: 'none' }}>Updates</Link>
                    <Link href="/contact" style={{ color: '#999', textDecoration: 'none' }}>Contact</Link>
                    <Link href="/terms" style={{ color: '#999', textDecoration: 'none' }}>Terms</Link>
                    <Link href="/privacy" style={{ color: '#999', textDecoration: 'none' }}>Privacy</Link>
                    <Link href="/studio" style={{ color: '#999', textDecoration: 'none' }}>App</Link>
                </div>
            </footer>
        </main>
    );
}
