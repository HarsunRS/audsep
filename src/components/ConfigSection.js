"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Settings, Mic2, Layers, Volume2, Wind } from 'lucide-react';
import TrimSlider from './TrimSlider';

const MODEL_GROUPS = [
    {
        label: 'Music Separation',
        icon: Layers,
        category: 'music',
        models: [
            { value: 'htdemucs', label: 'HTDemucs', desc: 'Best overall music stem quality' },
            { value: 'htdemucs_ft', label: 'HTDemucs Fine-tuned', desc: 'Extra clean on modern pop/EDM' },
            { value: 'htdemucs_6s', label: 'HTDemucs 6-stem', desc: 'Adds guitar + piano stems' },
            { value: 'mdx_extra_q', label: 'MDX-Net Q', desc: 'Faster, still high quality' },
        ],
    },
    {
        label: 'Speech / Speaker',
        icon: Mic2,
        category: 'speech',
        models: [
            { value: 'htdemucs', label: 'Voice Isolation', desc: 'Clean vocal vs. background split' },
        ],
    },
    {
        label: 'Noise Reduction',
        icon: Volume2,
        category: 'noise',
        models: [
            { value: 'denoiser', label: 'Environment Denoiser', desc: 'Remove hiss, hum, room noise' },
        ],
    },
    {
        label: 'Wind Noise',
        icon: Wind,
        category: 'wind',
        models: [
            { value: 'denoiser_dns64', label: 'DNS64 Wind Cleaner', desc: 'Aggressively removes wind artefacts' },
        ],
    },
];

export default function ConfigSection({ model, setModel, category, setCategory, vocalOnly, setVocalOnly, trimStart, setTrimStart, trimEnd, setTrimEnd }) {
    const activeGroup = MODEL_GROUPS.find(g => g.category === category) || MODEL_GROUPS[0];

    // Single callback that lets the parent batch category+model in one setState
    const handleGroupChange = (group) => {
        // Both setCategory and setModel are functional updaters from parent that
        // have been bound to a single modelConfig state object — so these two
        // calls result in ONE re-render, not two.
        setCategory(group.category);
        setModel(group.models[0].value);
        if (group.category !== 'music') setVocalOnly(false);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="glass-panel"
            style={{ padding: '2rem' }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <Settings size={20} color="var(--primary)" />
                <h2 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-primary)' }}>Separation Settings</h2>
            </div>

            {/* Model Category Tabs */}
            <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '0.6rem', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Task</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {MODEL_GROUPS.map(g => {
                        const Icon = g.icon;
                        const active = g.category === category;
                        return (
                            <button
                                key={g.category}
                                onClick={() => handleGroupChange(g)}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '0.4rem',
                                    padding: '0.45rem 1rem', borderRadius: '8px', cursor: 'pointer',
                                    border: active ? '1.5px solid #111' : '1.5px solid #e0e0e0',
                                    background: active ? '#111' : '#fff',
                                    color: active ? '#fff' : '#555',
                                    fontSize: '0.85rem', fontWeight: '600', transition: 'all 0.2s'
                                }}
                            >
                                <Icon size={14} /> {g.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Model Select + Description */}
            <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '0.6rem', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Model</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {activeGroup.models.map(m => {
                        const active = m.value === model;
                        return (
                            <button
                                key={m.value}
                                onClick={() => setModel(m.value)}
                                style={{
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                    padding: '0.75rem 1rem', borderRadius: '10px', cursor: 'pointer',
                                    border: active ? '1.5px solid #111' : '1.5px solid #ebebeb',
                                    background: active ? '#f8f8f8' : '#fff',
                                    textAlign: 'left', transition: 'all 0.2s'
                                }}
                            >
                                <div>
                                    <div style={{ fontWeight: '700', fontSize: '0.9rem', color: '#0a0a0a' }}>{m.label}</div>
                                    <div style={{ fontSize: '0.78rem', color: '#888', marginTop: '2px' }}>{m.desc}</div>
                                </div>
                                {active && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#111', flexShrink: 0 }} />}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Vocal Only toggle — only for music category */}
            {category === 'music' && (
                <div style={{ marginBottom: '1.25rem' }}>
                    <div
                        onClick={() => setVocalOnly(!vocalOnly)}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', padding: '0.6rem 0' }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Mic2 size={16} color={vocalOnly ? '#111' : '#aaa'} />
                            <span style={{ fontSize: '0.9rem', fontWeight: '600', color: vocalOnly ? '#0a0a0a' : '#888' }}>Vocals Only (faster)</span>
                        </div>
                        <div style={{ width: '40px', height: '22px', borderRadius: '11px', background: vocalOnly ? '#111' : '#e0e0e0', position: 'relative', transition: 'all 0.3s' }}>
                            <motion.div layout style={{ position: 'absolute', width: '18px', height: '18px', borderRadius: '50%', background: '#fff', top: '2px', left: vocalOnly ? '20px' : '2px', boxShadow: '0 1px 4px rgba(0,0,0,0.2)' }} />
                        </div>
                    </div>
                </div>
            )}

            {/* Trim controls */}
            <div>
                <label style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '0.75rem', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Trim&nbsp;
                    <span style={{ fontWeight: '400', textTransform: 'none', letterSpacing: 0 }}>— drag to select a section</span>
                </label>
                <TrimSlider
                    start={trimStart || 0}
                    end={trimEnd || 300}
                    max={600}
                    onChange={(s, e) => { setTrimStart(s); setTrimEnd(e); }}
                />
            </div>
        </motion.div>
    );
}
