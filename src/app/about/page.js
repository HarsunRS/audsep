"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Zap, Shield, Mic2, Globe, Heart, Users, Code2, Wand2 } from 'lucide-react';

const fadeUp = {
    hidden: { opacity: 0, y: 28 },
    show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
};
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.1 } } };

const values = [
    {
        icon: Zap,
        title: 'Speed over perfection',
        desc: 'We ship fast, learn from real users, and iterate relentlessly. A working tool in your hands beats a perfect tool on a whiteboard.',
    },
    {
        icon: Shield,
        title: 'Privacy by default',
        desc: 'Your audio is yours. We process files in-memory and delete them within an hour. We never train models on your uploads.',
    },
    {
        icon: Heart,
        title: 'Built for creators',
        desc: 'Every decision starts with the creator. Not the enterprise buyer, not the investor deck — the producer, educator, or podcaster who just needs it to work.',
    },
    {
        icon: Code2,
        title: 'Open by nature',
        desc: 'We build on open-source models, publish our API, and write openly about how everything works. Transparency is a feature.',
    },
];

const timeline = [
    { year: 'Feb 2026', label: 'Idea', text: 'Frustrated by clunky, expensive stem separators, we asked: what if this was just fast, clean, and free to try?' },
    { year: 'Mar 2026', label: 'First build', text: 'Wrapped Meta\'s HTDemucs in a Next.js frontend with real-time streaming progress. First separation took 4 minutes. We knew there was a long way to go.' },
    { year: 'Mar 2026', label: 'Launch', text: 'Shipped v1.0 with Supabase for job tracking, Clerk for auth, and a Railway-hosted Python worker handling the heavy lifting.' },
    { year: 'Mar 2026', label: 'Payments live', text: 'Integrated Razorpay with monthly and yearly billing. Added the REST API for developers and studios.' },
    { year: 'Now', label: 'Growing', text: 'Hundreds of tracks separated weekly. Roadmap includes batch processing, webhook-driven workflows, and multi-speaker diarisation.' },
];

const stats = [
    { value: '4', label: 'AI models supported', icon: Wand2 },
    { value: '99%', label: 'Uptime since launch', icon: Globe },
    { value: '<1hr', label: 'File retention window', icon: Shield },
    { value: '∞', label: 'Format support', icon: Mic2 },
];

export default function AboutPage() {
    const [hoveredValue, setHoveredValue] = useState(null);

    return (
        <main style={{ minHeight: '100vh', paddingTop: '6rem', background: '#fff', overflowX: 'hidden' }}>

            {/* ── HERO ── */}
            <section style={{ padding: '4rem 2rem 5rem', maxWidth: '56.25rem', margin: '0 auto' }}>
                <motion.div initial="hidden" animate="show" variants={stagger}>
                    <motion.div variants={fadeUp}>
                        <span style={{
                            display: 'inline-block', background: '#f3f3f3', border: '1px solid #e0e0e0',
                            borderRadius: '20px', padding: '0.35rem 1rem', fontSize: '0.8rem',
                            fontWeight: '600', color: '#555', marginBottom: '1.75rem', letterSpacing: '0.05em'
                        }}>
                            ABOUT AUDSEP
                        </span>
                    </motion.div>
                    <motion.h1 variants={fadeUp} style={{
                        fontSize: 'clamp(2.75rem, 6vw, 5rem)', fontWeight: '900',
                        letterSpacing: '-3px', color: '#0a0a0a', lineHeight: 1.0,
                        marginBottom: '2rem',
                    }}>
                        We believe great audio<br />
                        <span style={{ color: '#888' }}>tools should be simple.</span>
                    </motion.h1>
                    <motion.p variants={fadeUp} style={{
                        color: '#555', fontSize: '1.15rem', lineHeight: 1.75,
                        maxWidth: '38.75rem', marginBottom: '2.5rem',
                    }}>
                        AudSep is an AI-powered audio stem separator built for producers, DJs, educators, podcasters,
                        and anyone who has ever needed to pull a vocal or instrument out of a mix.
                        We built it because everything else was too slow, too expensive, or too hard to use.
                    </motion.p>
                    <motion.div variants={fadeUp} style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                        <Link href="/studio" style={{
                            background: '#111', color: '#fff', fontWeight: '700',
                            padding: '0.85rem 1.75rem', borderRadius: '12px', textDecoration: 'none', fontSize: '0.95rem',
                        }}>
                            Try it free →
                        </Link>
                        <Link href="/updates" style={{
                            background: '#fff', color: '#111', fontWeight: '600', border: '1.5px solid #ddd',
                            padding: '0.85rem 1.75rem', borderRadius: '12px', textDecoration: 'none', fontSize: '0.95rem',
                        }}>
                            See what we've shipped
                        </Link>
                    </motion.div>
                </motion.div>
            </section>

            {/* ── STATS BAND ── */}
            <section style={{ background: '#0a0a0a', padding: '3.5rem 2rem' }}>
                <motion.div
                    initial="hidden" whileInView="show" viewport={{ once: true }} variants={stagger}
                    style={{ maxWidth: '56.25rem', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '2rem' }}
                >
                    {stats.map(({ value, label, icon: Icon }, i) => (
                        <motion.div key={i} variants={fadeUp} style={{ textAlign: 'center' }}>
                            <div style={{ width: '44px', height: '44px', background: 'rgba(255,255,255,0.08)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.85rem' }}>
                                <Icon size={20} color="#fff" strokeWidth={1.8} />
                            </div>
                            <div style={{ fontSize: '2.25rem', fontWeight: '900', color: '#fff', letterSpacing: '-1.5px', lineHeight: 1 }}>{value}</div>
                            <div style={{ fontSize: '0.83rem', color: '#888', marginTop: '0.4rem', fontWeight: '500' }}>{label}</div>
                        </motion.div>
                    ))}
                </motion.div>
            </section>

            {/* ── MISSION ── */}
            <section style={{ padding: '6rem 2rem' }}>
                <div style={{ maxWidth: '56.25rem', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '5rem', alignItems: 'center' }}>
                    <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={stagger}>
                        <motion.p variants={fadeUp} style={{ fontSize: '0.8rem', fontWeight: '700', color: '#aaa', letterSpacing: '0.1em', marginBottom: '1rem' }}>OUR MISSION</motion.p>
                        <motion.h2 variants={fadeUp} style={{ fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)', fontWeight: '900', letterSpacing: '-1.5px', color: '#0a0a0a', lineHeight: 1.15, marginBottom: '1.5rem' }}>
                            Make every creator's audio sound like it came from a studio session.
                        </motion.h2>
                        <motion.p variants={fadeUp} style={{ color: '#666', lineHeight: 1.75, fontSize: '1rem', marginBottom: '1.25rem' }}>
                            For decades, stem separation was a privilege of major labels with expensive licenses and dedicated engineers. Research labs eventually made the models open-source, but the tooling stayed frustratingly inaccessible.
                        </motion.p>
                        <motion.p variants={fadeUp} style={{ color: '#666', lineHeight: 1.75, fontSize: '1rem' }}>
                            AudSep changes that. We wrap the world's best open separation models in a clean interface that works on any device, in any browser, in under a minute. No software to install. No PhD required.
                        </motion.p>
                    </motion.div>

                    {/* Decorative visual */}
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.7 }}
                        style={{ background: '#f7f7f7', borderRadius: '24px', padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}
                    >
                        {['Vocals', 'Drums', 'Bass', 'Piano', 'Other'].map((stem, i) => (
                            <div key={stem} style={{ display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#111', flexShrink: 0, opacity: 1 - i * 0.12 }} />
                                <div style={{ flex: 1, height: '6px', borderRadius: '99px', background: '#e0e0e0', overflow: 'hidden' }}>
                                    <motion.div
                                        initial={{ width: 0 }}
                                        whileInView={{ width: `${[88, 72, 60, 44, 34][i]}%` }}
                                        viewport={{ once: true }}
                                        transition={{ duration: 1.1, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                                        style={{ height: '100%', background: '#111', borderRadius: '99px' }}
                                    />
                                </div>
                                <span style={{ fontSize: '0.8rem', fontWeight: '600', color: '#555', width: '50px', textAlign: 'right' }}>{stem}</span>
                            </div>
                        ))}
                        <p style={{ fontSize: '0.78rem', color: '#bbb', marginTop: '0.5rem', textAlign: 'center' }}>Stems extracted in real-time</p>
                    </motion.div>
                </div>
            </section>

            {/* ── VALUES ── */}
            <section style={{ background: '#fafafa', borderTop: '1px solid #f0f0f0', borderBottom: '1px solid #f0f0f0', padding: '6rem 2rem' }}>
                <div style={{ maxWidth: '56.25rem', margin: '0 auto' }}>
                    <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={stagger}>
                        <motion.p variants={fadeUp} style={{ fontSize: '0.8rem', fontWeight: '700', color: '#aaa', letterSpacing: '0.1em', marginBottom: '1rem', textAlign: 'center' }}>WHAT WE STAND FOR</motion.p>
                        <motion.h2 variants={fadeUp} style={{ fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)', fontWeight: '900', letterSpacing: '-1.5px', color: '#0a0a0a', lineHeight: 1.15, marginBottom: '3rem', textAlign: 'center' }}>
                            Our values
                        </motion.h2>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem' }}>
                            {values.map(({ icon: Icon, title, desc }, i) => (
                                <motion.div key={i} variants={fadeUp}
                                    onMouseEnter={() => setHoveredValue(i)}
                                    onMouseLeave={() => setHoveredValue(null)}
                                    style={{
                                        background: hoveredValue === i ? '#111' : '#fff',
                                        border: '1.5px solid #ebebeb',
                                        borderRadius: '20px', padding: '2rem',
                                        transition: 'background 0.25s, border-color 0.25s', cursor: 'default',
                                        borderColor: hoveredValue === i ? '#111' : '#ebebeb',
                                    }}
                                >
                                    <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: hoveredValue === i ? 'rgba(255,255,255,0.12)' : '#f3f3f3', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem', transition: 'background 0.25s' }}>
                                        <Icon size={20} color={hoveredValue === i ? '#fff' : '#333'} strokeWidth={1.8} />
                                    </div>
                                    <h3 style={{ fontWeight: '800', fontSize: '1rem', color: hoveredValue === i ? '#fff' : '#111', marginBottom: '0.5rem', transition: 'color 0.25s' }}>{title}</h3>
                                    <p style={{ color: hoveredValue === i ? 'rgba(255,255,255,0.65)' : '#666', fontSize: '0.9rem', lineHeight: 1.65, transition: 'color 0.25s' }}>{desc}</p>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* ── TIMELINE ── */}
            <section style={{ padding: '6rem 2rem' }}>
                <div style={{ maxWidth: '43.75rem', margin: '0 auto' }}>
                    <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={stagger}>
                        <motion.p variants={fadeUp} style={{ fontSize: '0.8rem', fontWeight: '700', color: '#aaa', letterSpacing: '0.1em', marginBottom: '1rem', textAlign: 'center' }}>THE STORY</motion.p>
                        <motion.h2 variants={fadeUp} style={{ fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)', fontWeight: '900', letterSpacing: '-1.5px', color: '#0a0a0a', marginBottom: '3.5rem', textAlign: 'center' }}>
                            How we got here
                        </motion.h2>
                        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: '0' }}>
                            {/* vertical line */}
                            <div style={{ position: 'absolute', left: '68px', top: '8px', bottom: '8px', width: '1px', background: '#ebebeb' }} />
                            {timeline.map((item, i) => (
                                <motion.div key={i} variants={fadeUp} style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: '1.5rem', marginBottom: '2.5rem', alignItems: 'flex-start' }}>
                                    <div style={{ textAlign: 'right', paddingTop: '0.15rem' }}>
                                        <span style={{ fontSize: '0.72rem', fontWeight: '700', color: '#aaa' }}>{item.year}</span>
                                    </div>
                                    <div style={{ position: 'relative' }}>
                                        {/* dot */}
                                        <div style={{ position: 'absolute', left: '-1.85rem', top: '5px', width: '10px', height: '10px', borderRadius: '50%', background: i === timeline.length - 1 ? '#111' : '#ddd', border: i === timeline.length - 1 ? '2px solid #111' : '2px solid #ddd' }} />
                                        <span style={{ fontSize: '0.72rem', fontWeight: '700', background: '#f3f3f3', color: '#555', padding: '0.15rem 0.6rem', borderRadius: '99px', display: 'inline-block', marginBottom: '0.5rem' }}>{item.label}</span>
                                        <p style={{ color: '#444', fontSize: '0.95rem', lineHeight: 1.65 }}>{item.text}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* ── TEAM PHILOSOPHY ── */}
            <section style={{ background: '#0a0a0a', padding: '6rem 2rem' }}>
                <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={stagger}
                    style={{ maxWidth: '43.75rem', margin: '0 auto', textAlign: 'center' }}
                >
                    <motion.div variants={fadeUp} style={{ fontSize: '3rem', marginBottom: '1.5rem' }}>🎧</motion.div>
                    <motion.h2 variants={fadeUp} style={{ fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)', fontWeight: '900', letterSpacing: '-1.5px', color: '#fff', marginBottom: '1.5rem' }}>
                        Small team, strong opinions
                    </motion.h2>
                    <motion.p variants={fadeUp} style={{ color: '#888', fontSize: '1rem', lineHeight: 1.75, marginBottom: '1.5rem' }}>
                        AudSep is built by a small team of engineers who are also musicians. We run the product on honest feedback, real usage logs, and a deep belief that the best audio tools should feel invisible — they just work.
                    </motion.p>
                    <motion.p variants={fadeUp} style={{ color: '#666', fontSize: '0.95rem', lineHeight: 1.75, marginBottom: '2.5rem' }}>
                        We don't have VC money or a 50-person roadmap committee. That means we move faster, prioritise the features that actually matter, and stay honest in our changelog.
                    </motion.p>
                    <motion.div variants={fadeUp} style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <Link href="/contact" style={{ background: '#fff', color: '#111', fontWeight: '700', padding: '0.85rem 1.75rem', borderRadius: '12px', textDecoration: 'none', fontSize: '0.95rem' }}>
                            Say hello →
                        </Link>
                        <Link href="/blog" style={{ background: 'transparent', color: '#aaa', fontWeight: '600', padding: '0.85rem 1.75rem', borderRadius: '12px', textDecoration: 'none', fontSize: '0.95rem', border: '1px solid #2a2a2a' }}>
                            Read our blog
                        </Link>
                    </motion.div>
                </motion.div>
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
