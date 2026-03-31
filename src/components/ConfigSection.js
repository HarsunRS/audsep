"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Settings, Mic2, Volume2, Wind, Lock } from 'lucide-react';
import TrimSlider from './TrimSlider';

// ── Model catalogue ────────────────────────────────────────────────────────────
const TIER_ORDER = { free: 0, basic: 1, pro: 2 };

function planToTier(plan) {
    if (!plan || plan === 'free') return 'free';
    if (plan.startsWith('basic')) return 'basic';
    return 'pro'; // pro, studio, team
}

const MUSIC_MODELS = [
    {
        tier: 'free',
        value: 'mdx_extra_q',
        label: 'MDX-Net Q',
        desc: 'Fast & solid. Good for quick previews.',
        quality: 2, speed: 4,
        stems: ['Vocals', 'Drums', 'Bass', 'Other'],
    },
    {
        tier: 'free',
        value: 'mdx_extra',
        label: 'Demucs v3',
        desc: 'Balanced quality. Works on all genres.',
        quality: 3, speed: 3,
        stems: ['Vocals', 'Drums', 'Bass', 'Other'],
    },
    {
        tier: 'basic',
        value: 'htdemucs',
        label: 'HTDemucs',
        desc: 'Best overall stem quality across genres.',
        quality: 4, speed: 2,
        stems: ['Vocals', 'Drums', 'Bass', 'Other'],
    },
    {
        tier: 'basic',
        value: 'htdemucs_ft',
        label: 'HTDemucs Fine-tuned',
        desc: 'Extra clean on modern pop & EDM.',
        quality: 4, speed: 2,
        stems: ['Vocals', 'Drums', 'Bass', 'Other'],
    },
    {
        tier: 'pro',
        value: 'htdemucs_6s',
        label: 'HTDemucs 6-stem',
        desc: 'Adds guitar + piano isolation.',
        quality: 3, speed: 1,
        stems: ['Vocals', 'Drums', 'Bass', 'Guitar', 'Piano', 'Other'],
    },
    {
        tier: 'pro',
        value: 'htdemucs_hybrid',
        label: 'HTDemucs Hybrid',
        desc: 'Highest fidelity. Studio-grade output.',
        quality: 3, speed: 1,
        stems: ['Vocals', 'Drums', 'Bass', 'Guitar', 'Piano', 'Other'],
    },
];

const TIER_LABELS = {
    free:  { text: 'FREE',  color: '#aaa' },
    basic: { text: 'BASIC', color: '#60a5fa' },
    pro:   { text: 'PRO',   color: '#a3e635' },
};

const TASK_GROUPS = [
    { label: 'Music',   icon: Settings, category: 'music',  defaultModel: 'mdx_extra_q' },
    { label: 'Speech',  icon: Mic2,     category: 'speech', defaultModel: 'htdemucs' },
    { label: 'Noise',   icon: Volume2,  category: 'noise',  defaultModel: 'denoiser' },
    { label: 'Wind',    icon: Wind,     category: 'wind',   defaultModel: 'denoiser_dns64' },
];

function Dots({ filled, total = 4, activeColor = '#f59e0b' }) {
    return (
        <span style={{ display: 'inline-flex', gap: '3px', alignItems: 'center' }}>
            {Array.from({ length: total }).map((_, i) => (
                <span key={i} style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: i < filled ? activeColor : 'rgba(255,255,255,0.15)',
                    display: 'inline-block',
                }} />
            ))}
        </span>
    );
}

function StemBadge({ label }) {
    return (
        <span style={{
            padding: '2px 8px', borderRadius: '999px',
            border: '1px solid rgba(255,255,255,0.18)',
            fontSize: '0.7rem', color: 'rgba(255,255,255,0.7)',
            background: 'rgba(255,255,255,0.07)',
        }}>{label}</span>
    );
}

export default function ConfigSection({
    model, setModel, category, setCategory,
    vocalOnly, setVocalOnly, trimStart, setTrimStart, trimEnd, setTrimEnd,
    plan = 'free',
}) {
    const [trimEnabled, setTrimEnabled] = React.useState(false);
    const userTier = planToTier(plan);

    const handleTaskChange = (group) => {
        setCategory(group.category);
        setModel(group.defaultModel);
        if (group.category !== 'music') setVocalOnly(false);
    };

    const handleTrimToggle = () => {
        const next = !trimEnabled;
        setTrimEnabled(next);
        if (!next) { setTrimStart(0); setTrimEnd(0); }
    };

    // Group music models by tier for rendering with tier headers
    const tierGroups = [
        { tier: 'free',  models: MUSIC_MODELS.filter(m => m.tier === 'free') },
        { tier: 'basic', models: MUSIC_MODELS.filter(m => m.tier === 'basic') },
        { tier: 'pro',   models: MUSIC_MODELS.filter(m => m.tier === 'pro') },
    ];

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            style={{
                background: '#141414', border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '16px', padding: '1.5rem',
            }}
        >
            {/* Task tabs */}
            <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: '700', color: '#666', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.6rem' }}>TASK</div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {TASK_GROUPS.map(g => {
                        const Icon = g.icon;
                        const active = g.category === category;
                        return (
                            <button key={g.category} onClick={() => handleTaskChange(g)} style={{
                                display: 'flex', alignItems: 'center', gap: '0.4rem',
                                padding: '0.4rem 0.9rem', borderRadius: '8px', cursor: 'pointer',
                                border: active ? '1.5px solid rgba(255,255,255,0.8)' : '1.5px solid rgba(255,255,255,0.12)',
                                background: active ? 'rgba(255,255,255,0.1)' : 'transparent',
                                color: active ? '#fff' : '#666',
                                fontSize: '0.82rem', fontWeight: '600', transition: 'all 0.18s',
                            }}>
                                <Icon size={13} />{g.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Model grid — only shown for music category */}
            {category === 'music' && (
                <div style={{ marginBottom: '1.25rem' }}>
                    <div style={{ fontSize: '0.72rem', fontWeight: '700', color: '#666', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.75rem' }}>MODEL</div>

                    {tierGroups.map(({ tier, models }) => {
                        const tl = TIER_LABELS[tier];
                        const accessible = TIER_ORDER[userTier] >= TIER_ORDER[tier];
                        return (
                            <div key={tier} style={{ marginBottom: '1rem' }}>
                                {/* Tier header */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
                                    <span style={{ fontSize: '0.68rem', fontWeight: '800', letterSpacing: '0.1em', color: tl.color }}>{tl.text}</span>
                                    <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.06)' }} />
                                </div>

                                {/* Model cards — 2 per row */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                                    {models.map(m => {
                                        const selected = m.value === model;
                                        const locked = !accessible;
                                        return (
                                            <button
                                                key={m.value}
                                                onClick={() => !locked && setModel(m.value)}
                                                disabled={locked}
                                                style={{
                                                    position: 'relative', textAlign: 'left',
                                                    padding: '0.85rem 0.9rem',
                                                    borderRadius: '12px',
                                                    border: selected
                                                        ? '1.5px solid rgba(255,255,255,0.7)'
                                                        : '1.5px solid rgba(255,255,255,0.08)',
                                                    background: selected
                                                        ? 'rgba(255,255,255,0.09)'
                                                        : 'rgba(255,255,255,0.03)',
                                                    cursor: locked ? 'not-allowed' : 'pointer',
                                                    opacity: locked ? 0.45 : 1,
                                                    transition: 'all 0.18s',
                                                }}
                                            >
                                                {/* Selected checkmark */}
                                                {selected && (
                                                    <div style={{
                                                        position: 'absolute', top: '0.6rem', right: '0.6rem',
                                                        width: 18, height: 18, borderRadius: '50%',
                                                        background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    }}>
                                                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                                                            <path d="M2 5l2.5 2.5L8 3" stroke="#111" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                                        </svg>
                                                    </div>
                                                )}

                                                {/* Lock icon */}
                                                {locked && (
                                                    <div style={{ position: 'absolute', top: '0.6rem', right: '0.6rem' }}>
                                                        <Lock size={13} color="#666" />
                                                    </div>
                                                )}

                                                <div style={{ fontWeight: '700', fontSize: '0.85rem', color: '#fff', marginBottom: '2px', paddingRight: '1.2rem' }}>
                                                    {m.label}
                                                </div>
                                                <div style={{ fontSize: '0.72rem', color: '#888', marginBottom: '0.55rem', lineHeight: 1.3 }}>
                                                    {m.desc}
                                                </div>

                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', marginBottom: '0.55rem' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                        <span style={{ fontSize: '0.65rem', color: '#555', width: '36px' }}>Quality</span>
                                                        <Dots filled={m.quality} activeColor="rgba(255,255,255,0.75)" />
                                                    </div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                        <span style={{ fontSize: '0.65rem', color: '#555', width: '36px' }}>Speed</span>
                                                        <Dots filled={m.speed} activeColor="#f59e0b" />
                                                    </div>
                                                </div>

                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px' }}>
                                                    {m.stems.map(s => <StemBadge key={s} label={s} />)}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}

                    {/* Upgrade nudge when free user */}
                    {userTier === 'free' && (
                        <a href="/pricing" style={{
                            display: 'block', marginTop: '0.25rem', textAlign: 'center',
                            fontSize: '0.75rem', color: '#555', textDecoration: 'none',
                            padding: '0.4rem', transition: 'color 0.2s',
                        }}>
                            ↑ Upgrade to unlock Basic & Pro models
                        </a>
                    )}
                </div>
            )}

            {/* For non-music tasks, keep a compact model label */}
            {category !== 'music' && (
                <div style={{ marginBottom: '1.25rem', padding: '0.75rem 1rem', borderRadius: '10px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ fontSize: '0.82rem', color: '#aaa', fontWeight: '600' }}>
                        {category === 'speech' ? 'Voice Isolation' : category === 'noise' ? 'Environment Denoiser' : 'DNS64 Wind Cleaner'}
                    </div>
                    <div style={{ fontSize: '0.73rem', color: '#555', marginTop: '2px' }}>
                        {category === 'speech' ? 'Clean vocal vs. background split' : category === 'noise' ? 'Remove hiss, hum, room noise' : 'Aggressively removes wind artefacts'}
                    </div>
                </div>
            )}

            {/* Vocal Only toggle */}
            {category === 'music' && (
                <div style={{ marginBottom: '1rem' }}>
                    <div onClick={() => setVocalOnly(!vocalOnly)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', padding: '0.5rem 0' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Mic2 size={15} color={vocalOnly ? '#fff' : '#555'} />
                            <span style={{ fontSize: '0.85rem', fontWeight: '600', color: vocalOnly ? '#fff' : '#666' }}>Vocals Only (faster)</span>
                        </div>
                        <div style={{ width: '36px', height: '20px', borderRadius: '10px', background: vocalOnly ? '#fff' : 'rgba(255,255,255,0.1)', position: 'relative', transition: 'all 0.3s', flexShrink: 0 }}>
                            <motion.div layout style={{ position: 'absolute', width: '16px', height: '16px', borderRadius: '50%', background: vocalOnly ? '#111' : '#555', top: '2px', left: vocalOnly ? '18px' : '2px' }} />
                        </div>
                    </div>
                </div>
            )}

            {/* Trim toggle */}
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '0.85rem' }}>
                <div onClick={handleTrimToggle} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', padding: '0.3rem 0' }}>
                    <div>
                        <span style={{ fontSize: '0.85rem', fontWeight: '600', color: trimEnabled ? '#fff' : '#666' }}>✂️  Trim Audio</span>
                        <span style={{ fontSize: '0.73rem', color: '#444', marginLeft: '0.5rem' }}>select a section to process</span>
                    </div>
                    <div style={{ width: '36px', height: '20px', borderRadius: '10px', background: trimEnabled ? '#fff' : 'rgba(255,255,255,0.1)', position: 'relative', transition: 'background 0.3s', flexShrink: 0 }}>
                        <motion.div layout style={{ position: 'absolute', width: '16px', height: '16px', borderRadius: '50%', background: trimEnabled ? '#111' : '#555', top: '2px', left: trimEnabled ? '18px' : '2px' }} />
                    </div>
                </div>
                {trimEnabled && (
                    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} style={{ marginTop: '1rem' }}>
                        <TrimSlider start={trimStart || 0} end={trimEnd || 300} max={600} onChange={(s, e) => { setTrimStart(s); setTrimEnd(e); }} />
                    </motion.div>
                )}
            </div>
        </motion.div>
    );
}
