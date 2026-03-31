"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Music2, Mic2, Volume2, Lock } from 'lucide-react';
import TrimSlider from './TrimSlider';

// ── Tier helpers ───────────────────────────────────────────────────────────────
const TIER_ORDER = { free: 0, basic: 1, pro: 2, studio: 3 };

function planToTier(plan) {
    if (!plan || plan === 'free') return 'free';
    // Basic has same model access as free — only usage limits differ
    if (plan.startsWith('basic')) return 'free';
    if (plan.startsWith('studio') || plan === 'team') return 'studio';
    return 'pro';
}

const TIER_META = {
    free:   { label: 'FREE & BASIC', color: '#6b7280' },
    pro:    { label: 'PRO',          color: '#16a34a' },
    studio: { label: 'STUDIO',       color: '#7c3aed' },
};

// ── Task definitions ───────────────────────────────────────────────────────────
const TASKS = [
    { label: 'Separate Stems', icon: Music2, category: 'music' },
    { label: 'Isolate Speech', icon: Mic2,   category: 'speech' },
    { label: 'Denoise',        icon: Volume2, category: 'noise' },
];

// ── Model catalogue ────────────────────────────────────────────────────────────
// Free and Basic have the same models — difference is only usage limits (enforced by the DB).
// Cards show "FREE & BASIC" header so users understand both tiers get access.
const MODELS = {
    music: [
        { tier: 'free', value: 'mdx_extra_q',    label: 'MDX-Net Q',            desc: 'Fast & solid. Good for quick previews.',        quality: 2, speed: 4, stems: ['Vocals', 'Drums', 'Bass', 'Other'] },
        { tier: 'free', value: 'mdx_extra',       label: 'Demucs v3',            desc: 'Balanced quality. Works on all genres.',        quality: 3, speed: 3, stems: ['Vocals', 'Drums', 'Bass', 'Other'] },
        { tier: 'free', value: 'htdemucs',         label: 'HTDemucs',             desc: 'Best overall stem quality across genres.',      quality: 4, speed: 2, stems: ['Vocals', 'Drums', 'Bass', 'Other'] },
        { tier: 'free', value: 'htdemucs_ft',      label: 'HTDemucs Fine-tuned',  desc: 'Extra clean on modern pop & EDM.',              quality: 4, speed: 2, stems: ['Vocals', 'Drums', 'Bass', 'Other'] },
        { tier: 'pro',  value: 'htdemucs_6s',      label: 'HTDemucs 6-stem',      desc: 'Adds guitar + piano isolation.',                quality: 4, speed: 1, stems: ['Vocals', 'Drums', 'Bass', 'Guitar', 'Piano', 'Other'] },
        { tier: 'studio', value: 'htdemucs_hybrid',label: 'HTDemucs Hybrid',      desc: 'Highest fidelity. Studio-grade output.',        quality: 5, speed: 1, stems: ['Vocals', 'Drums', 'Bass', 'Guitar', 'Piano', 'Other'] },
    ],
    speech: [
        { tier: 'free', value: 'mdx_extra_q',    label: 'Quick Voice Lift',      desc: 'Fast vocal vs. background separation.',         quality: 2, speed: 4, stems: ['Vocals', 'Background'] },
        { tier: 'free', value: 'htdemucs',         label: 'HTDemucs Voice',        desc: 'Clean vocal isolation for podcasts & calls.',   quality: 4, speed: 2, stems: ['Vocals', 'Background'] },
        { tier: 'pro',  value: 'htdemucs_ft',      label: 'Fine-tuned Voice',      desc: 'Cleanest isolation, minimal bleed.',            quality: 5, speed: 1, stems: ['Vocals', 'Background'] },
    ],
    noise: [
        { tier: 'free', value: 'denoiser',         label: 'Environment Denoiser',  desc: 'Remove hiss, hum, and room noise.',             quality: 3, speed: 4, stems: ['Enhanced'] },
        { tier: 'pro',  value: 'denoiser_dns64',   label: 'DNS64 Denoiser',        desc: 'Aggressive noise removal for tough recordings.', quality: 5, speed: 2, stems: ['Enhanced'] },
    ],
};

// ── Sub-components ─────────────────────────────────────────────────────────────
function Dots({ filled, total = 5, activeColor = '#0a0a0a' }) {
    return (
        <span style={{ display: 'inline-flex', gap: '3px', alignItems: 'center' }}>
            {Array.from({ length: total }).map((_, i) => (
                <span key={i} style={{
                    width: 7, height: 7, borderRadius: '50%',
                    background: i < filled ? activeColor : '#e5e7eb',
                    display: 'inline-block',
                }} />
            ))}
        </span>
    );
}

function StemBadge({ label }) {
    return (
        <span style={{
            padding: '2px 7px', borderRadius: '999px',
            border: '1px solid #e5e7eb',
            fontSize: '0.68rem', color: '#555',
            background: '#f9f9f9',
            fontWeight: '500',
        }}>{label}</span>
    );
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function ConfigSection({
    model, setModel, category, setCategory,
    vocalOnly, setVocalOnly, trimStart, setTrimStart, trimEnd, setTrimEnd,
    plan = 'free',
}) {
    const [trimEnabled, setTrimEnabled] = React.useState(false);
    const userTier = planToTier(plan);

    const handleTaskChange = (task) => {
        setCategory(task.category);
        // Default to first accessible model for this task
        const taskModels = MODELS[task.category] || [];
        const firstAccessible = taskModels.find(
            m => TIER_ORDER[userTier] >= TIER_ORDER[m.tier]
        ) || taskModels[0];
        setModel(firstAccessible.value);
        if (task.category !== 'music') setVocalOnly(false);
    };

    const handleTrimToggle = () => {
        const next = !trimEnabled;
        setTrimEnabled(next);
        if (!next) { setTrimStart(0); setTrimEnd(0); }
    };

    const taskModels = MODELS[category] || [];

    // Group by tier — basic is merged into free (same models, different usage limits)
    const tierGroups = ['free', 'pro', 'studio']
        .map(tier => ({ tier, models: taskModels.filter(m => m.tier === tier) }))
        .filter(g => g.models.length > 0);

    return (
        <div style={{ background: '#fff', border: '1px solid #ebebeb', borderRadius: '16px', padding: '1.5rem' }}>

            {/* Task selector */}
            <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: '700', color: '#999', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.6rem' }}>Task</div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {TASKS.map(task => {
                        const Icon = task.icon;
                        const active = task.category === category;
                        return (
                            <button
                                key={task.category}
                                onClick={() => handleTaskChange(task)}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '0.4rem',
                                    padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer',
                                    border: active ? '1.5px solid #111' : '1.5px solid #e5e7eb',
                                    background: active ? '#111' : '#fff',
                                    color: active ? '#fff' : '#555',
                                    fontSize: '0.85rem', fontWeight: '600', transition: 'all 0.15s',
                                }}
                            >
                                <Icon size={14} />{task.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Model grid */}
            <div style={{ marginBottom: category === 'music' ? '1.25rem' : '0' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: '700', color: '#999', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.75rem' }}>Model</div>

                {tierGroups.map(({ tier, models }) => {
                    const tm = TIER_META[tier];
                    const accessible = TIER_ORDER[userTier] >= TIER_ORDER[tier];
                    return (
                        <div key={tier} style={{ marginBottom: '1rem' }}>
                            {/* Tier header */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.45rem' }}>
                                <span style={{ fontSize: '0.65rem', fontWeight: '800', letterSpacing: '0.1em', color: tm.color }}>{tm.label}</span>
                                <div style={{ flex: 1, height: '1px', background: '#f0f0f0' }} />
                            </div>

                            {/* Cards — 2 columns; last card spans full width if count is odd */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                                {models.map((m, idx) => {
                                    const selected = m.value === model;
                                    const locked = !accessible;
                                    const isLastOdd = models.length % 2 !== 0 && idx === models.length - 1;
                                    return (
                                        <button
                                            key={m.value}
                                            onClick={() => !locked && setModel(m.value)}
                                            disabled={locked}
                                            style={{
                                                position: 'relative', textAlign: 'left',
                                                padding: '0.85rem 0.9rem', borderRadius: '12px',
                                                border: selected ? '1.5px solid #111' : '1.5px solid #ebebeb',
                                                background: selected ? '#f8f8f8' : '#fff',
                                                cursor: locked ? 'not-allowed' : 'pointer',
                                                opacity: locked ? 0.5 : 1,
                                                transition: 'all 0.15s',
                                                gridColumn: isLastOdd ? 'span 2' : undefined,
                                            }}
                                        >
                                            {/* Checkmark */}
                                            {selected && (
                                                <div style={{
                                                    position: 'absolute', top: '0.6rem', right: '0.6rem',
                                                    width: 18, height: 18, borderRadius: '50%',
                                                    background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                }}>
                                                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                                                        <path d="M2 5l2.5 2.5L8 3" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                                    </svg>
                                                </div>
                                            )}
                                            {/* Lock */}
                                            {locked && (
                                                <div style={{ position: 'absolute', top: '0.6rem', right: '0.6rem' }}>
                                                    <Lock size={13} color="#bbb" />
                                                </div>
                                            )}

                                            <div style={{ fontWeight: '700', fontSize: '0.85rem', color: '#0a0a0a', marginBottom: '2px', paddingRight: '1.4rem' }}>
                                                {m.label}
                                            </div>
                                            <div style={{ fontSize: '0.72rem', color: '#888', marginBottom: '0.5rem', lineHeight: 1.35 }}>
                                                {m.desc}
                                            </div>

                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', marginBottom: '0.5rem' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    <span style={{ fontSize: '0.63rem', color: '#aaa', width: '38px' }}>Quality</span>
                                                    <Dots filled={m.quality} activeColor="#0a0a0a" />
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    <span style={{ fontSize: '0.63rem', color: '#aaa', width: '38px' }}>Speed</span>
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

                {/* Upgrade nudge */}
                {userTier !== 'studio' && (
                    <a href="/pricing" style={{
                        display: 'block', marginTop: '0.25rem', textAlign: 'center',
                        fontSize: '0.75rem', color: '#bbb', textDecoration: 'none', padding: '0.3rem',
                    }}>
                        ↑ Upgrade to unlock more models
                    </a>
                )}
            </div>

            {/* Vocal Only toggle — only for music */}
            {category === 'music' && (
                <div style={{ borderTop: '1px solid #f5f5f5', paddingTop: '1rem', marginBottom: '0.75rem' }}>
                    <div
                        onClick={() => setVocalOnly(!vocalOnly)}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', padding: '0.3rem 0' }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Mic2 size={15} color={vocalOnly ? '#111' : '#aaa'} />
                            <span style={{ fontSize: '0.87rem', fontWeight: '600', color: vocalOnly ? '#0a0a0a' : '#888' }}>Vocals Only (faster)</span>
                        </div>
                        <div style={{ width: '38px', height: '21px', borderRadius: '11px', background: vocalOnly ? '#111' : '#e5e7eb', position: 'relative', transition: 'all 0.3s', flexShrink: 0 }}>
                            <motion.div layout style={{ position: 'absolute', width: '17px', height: '17px', borderRadius: '50%', background: '#fff', top: '2px', left: vocalOnly ? '19px' : '2px', boxShadow: '0 1px 4px rgba(0,0,0,0.15)' }} />
                        </div>
                    </div>
                </div>
            )}

            {/* Trim toggle */}
            <div style={{ borderTop: '1px solid #f5f5f5', paddingTop: '0.85rem' }}>
                <div
                    onClick={handleTrimToggle}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', padding: '0.3rem 0' }}
                >
                    <div>
                        <span style={{ fontSize: '0.87rem', fontWeight: '600', color: trimEnabled ? '#0a0a0a' : '#888' }}>✂️  Trim Audio</span>
                        <span style={{ fontSize: '0.73rem', color: '#bbb', marginLeft: '0.5rem' }}>select a section to process</span>
                    </div>
                    <div style={{ width: '38px', height: '21px', borderRadius: '11px', background: trimEnabled ? '#111' : '#e5e7eb', position: 'relative', transition: 'background 0.3s', flexShrink: 0 }}>
                        <motion.div layout style={{ position: 'absolute', width: '17px', height: '17px', borderRadius: '50%', background: '#fff', top: '2px', left: trimEnabled ? '19px' : '2px', boxShadow: '0 1px 4px rgba(0,0,0,0.15)' }} />
                    </div>
                </div>
                {trimEnabled && (
                    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} style={{ marginTop: '1rem' }}>
                        <TrimSlider start={trimStart || 0} end={trimEnd || 300} max={600} onChange={(s, e) => { setTrimStart(s); setTrimEnd(e); }} />
                    </motion.div>
                )}
            </div>
        </div>
    );
}
