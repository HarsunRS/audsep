"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Mic2, Drum, Music, Layers, Zap, Shield, Globe, ChevronRight, Play } from 'lucide-react';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } }
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } }
};

export default function LandingPage() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handler = (e) => setMousePos({ x: e.clientX, y: e.clientY });
    window.addEventListener('mousemove', handler);
    return () => window.removeEventListener('mousemove', handler);
  }, []);

  const features = [
    { icon: Mic2, title: 'Isolate Vocals', desc: 'Crystal-clear vocal stems with sub-100ms latency. Perfect for remixes, karaoke, or sample packs.' },
    { icon: Drum, title: 'Extract Drums', desc: 'Pull out a perfect drum track from any genre. Machine-grade transient accuracy.' },
    { icon: Music, title: 'Pull Bass Lines', desc: 'Separate the bass line in full fidelity. No bleed, no artifacts.' },
    { icon: Layers, title: 'All Elements', desc: 'Fully decompose any track into 4 isolated stems using the HTDemucs model.' },
    { icon: Zap, title: 'Fast Processing', desc: 'CPU-optimized inference pipeline. Full song separation under 2 minutes.' },
    { icon: Globe, title: 'Any Format', desc: 'Upload MP3, WAV, FLAC, OGG, AIFF. We handle all audio codecs seamlessly.' },
  ];

  const steps = [
    { num: '01', title: 'Upload Your Track', desc: 'Drag and drop any audio file up to 100MB. We accept everything.' },
    { num: '02', title: 'Choose Your Model', desc: 'Pick HTDemucs for pro quality or select which stems you need.' },
    { num: '03', title: 'Download Stems', desc: 'Get back individual WAV stems or a custom-mixed master in seconds.' },
  ];

  const testimonials = [
    { name: 'Diego M.', role: 'Music Producer', quote: 'AudSep is unreal. I separated a full orchestral track in under 3 minutes. The vocal isolation is studio-grade.' },
    { name: 'Priya S.', role: 'DJ & Remixer', quote: 'Finally a tool that just works. No subscriptions, no watermarks, crispy clean outputs every time.' },
    { name: 'Tom B.', role: 'Podcast Editor', quote: "I've tried every stem separator. AudSep's model output is legitimately the best I've heard." },
  ];

  return (
    <div style={{ overflowX: 'hidden' }}>
      {/* ─── HERO ─── */}
      <section style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem 2rem 4rem', textAlign: 'center' }}>
        <motion.div variants={stagger} initial="hidden" animate="show" style={{ maxWidth: '48.75rem', width: '100%' }}>

          <motion.h1 variants={fadeUp} style={{
            fontSize: 'clamp(3rem, 8vw, 5.5rem)', fontWeight: '900', letterSpacing: '-3px',
            lineHeight: 1.05, color: '#0a0a0a', marginBottom: '1.5rem'
          }}>
            Separate Any Song<br />Into Its Parts.
          </motion.h1>

          <motion.p variants={fadeUp} style={{ fontSize: '1.2rem', color: '#666', maxWidth: '35rem', margin: '0 auto 2.5rem', lineHeight: 1.7 }}>
            Upload any audio track. AudSep's AI separates vocals, drums, bass, and instruments in under 2 minutes — with studio-grade output quality.
          </motion.p>

          <motion.div variants={fadeUp} style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/studio" style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
              background: '#111', color: '#fff', padding: '0.9rem 2rem',
              borderRadius: '10px', fontWeight: '700', fontSize: '1rem', textDecoration: 'none',
              boxShadow: '0 4px 20px rgba(0,0,0,0.15)', transition: 'transform 0.2s'
            }}>
              Start Separating Free <ChevronRight size={18} />
            </Link>
            <Link href="/pricing" style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
              background: 'transparent', color: '#333', padding: '0.9rem 2rem',
              borderRadius: '10px', fontWeight: '600', fontSize: '1rem', textDecoration: 'none',
              border: '1.5px solid #ddd'
            }}>
              View Pricing
            </Link>
          </motion.div>

          <motion.p variants={fadeUp} style={{ marginTop: '1.25rem', fontSize: '0.85rem', color: '#999' }}>
            No credit card required · 3 free separations per day
          </motion.p>

          {/* Animated soundwave */}
          <motion.div variants={fadeUp} style={{ marginTop: '4rem', display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: '5px', height: '80px' }}>
            {Array.from({ length: 60 }).map((_, i) => {
              const h = Math.round(10 + Math.abs(Math.sin(i * 0.4)) * 60);
              const h2 = Math.max(8, Math.round(h * 0.4));
              return (
                <motion.div
                  key={i}
                  animate={{ height: [`${h}px`, `${h2}px`, `${h}px`] }}
                  transition={{ repeat: Infinity, duration: 1.2 + (i % 5) * 0.15, delay: i * 0.03, ease: 'easeInOut' }}
                  style={{ width: '4px', background: i % 3 === 0 ? '#111' : '#ddd', borderRadius: '2px', height: `${h}px` }}
                />
              );
            })}
          </motion.div>
        </motion.div>
      </section>

      {/* ─── FEATURES ─── */}
      <section id="features" style={{ padding: '6rem 2rem', background: '#fafafa', borderTop: '1px solid #f0f0f0' }}>
        <div style={{ maxWidth: '70rem', margin: '0 auto' }}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <h2 style={{ fontSize: '2.5rem', fontWeight: '800', letterSpacing: '-1.5px', color: '#0a0a0a', marginBottom: '1rem' }}>Everything a producer needs</h2>
            <p style={{ color: '#666', fontSize: '1.1rem', maxWidth: '32rem', margin: '0 auto' }}>Professional stem separation without expensive DAW plugins.</p>
          </motion.div>

          <motion.div
            variants={stagger} initial="hidden" animate="show"
            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}
          >
            {features.map((f, i) => (
              <motion.div key={i} variants={fadeUp} style={{
                background: '#fff', border: '1px solid #ebebeb', borderRadius: '16px',
                padding: '2rem', transition: 'box-shadow 0.3s, transform 0.3s',
              }}
                whileHover={{ y: -4, boxShadow: '0 12px 40px rgba(0,0,0,0.08)' }}
              >
                <div style={{ width: '44px', height: '44px', background: '#f3f3f3', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
                  <f.icon size={22} color="#111" />
                </div>
                <h3 style={{ fontWeight: '700', fontSize: '1.1rem', marginBottom: '0.5rem', color: '#0a0a0a' }}>{f.title}</h3>
                <p style={{ color: '#666', fontSize: '0.95rem', lineHeight: 1.6 }}>{f.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section style={{ padding: '7rem 2rem' }}>
        <div style={{ maxWidth: '56.25rem', margin: '0 auto' }}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <h2 style={{ fontSize: '2.5rem', fontWeight: '800', letterSpacing: '-1.5px', color: '#0a0a0a', marginBottom: '1rem' }}>Three steps. Seconds to results.</h2>
          </motion.div>

          <motion.div variants={stagger} initial="hidden" animate="show" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {steps.map((s, i) => (
              <motion.div key={i} variants={fadeUp} style={{
                display: 'flex', gap: '2rem', alignItems: 'flex-start',
                background: '#fff', border: '1px solid #ebebeb', borderRadius: '16px', padding: '2rem',
              }}>
                <span style={{ fontSize: '2.5rem', fontWeight: '900', color: '#e8e8e8', lineHeight: 1, flexShrink: 0 }}>{s.num}</span>
                <div>
                  <h3 style={{ fontWeight: '700', fontSize: '1.15rem', marginBottom: '0.5rem', color: '#0a0a0a' }}>{s.title}</h3>
                  <p style={{ color: '#666', fontSize: '0.95rem', lineHeight: 1.6 }}>{s.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── TESTIMONIALS ─── */}
      <section style={{ padding: '6rem 2rem', background: '#fafafa', borderTop: '1px solid #f0f0f0' }}>
        <div style={{ maxWidth: '70rem', margin: '0 auto' }}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <h2 style={{ fontSize: '2.5rem', fontWeight: '800', letterSpacing: '-1.5px', color: '#0a0a0a' }}>Loved by creators</h2>
          </motion.div>

          <motion.div variants={stagger} initial="hidden" animate="show"
            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}
          >
            {testimonials.map((t, i) => (
              <motion.div key={i} variants={fadeUp} style={{
                background: '#fff', border: '1px solid #ebebeb', borderRadius: '16px', padding: '2rem',
              }}>
                <p style={{ color: '#333', fontSize: '1rem', lineHeight: 1.7, marginBottom: '1.5rem', fontStyle: 'italic' }}>"{t.quote}"</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: '700', fontSize: '0.9rem' }}>
                    {t.name[0]}
                  </div>
                  <div>
                    <div style={{ fontWeight: '700', fontSize: '0.9rem', color: '#0a0a0a' }}>{t.name}</div>
                    <div style={{ fontSize: '0.8rem', color: '#888' }}>{t.role}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── FINAL CTA ─── */}
      <section style={{ padding: '8rem 2rem', textAlign: 'center' }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
          <h2 style={{ fontSize: '3rem', fontWeight: '900', letterSpacing: '-2px', color: '#0a0a0a', marginBottom: '1.25rem' }}>
            Start separating today.<br />It's free.
          </h2>
          <p style={{ color: '#666', fontSize: '1.1rem', marginBottom: '2.5rem' }}>No account needed. Upload your first track in seconds.</p>
          <Link href="/studio" style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
            background: '#111', color: '#fff', padding: '1rem 2.5rem',
            borderRadius: '12px', fontWeight: '700', fontSize: '1.05rem', textDecoration: 'none',
            boxShadow: '0 4px 24px rgba(0,0,0,0.15)',
          }}>
            Open AudSep App <ChevronRight size={20} />
          </Link>
        </motion.div>
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
    </div>
  );
}
