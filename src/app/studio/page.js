"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import UploadSection from '../../components/UploadSection';
import ConfigSection from '../../components/ConfigSection';
import ProcessButton from '../../components/ProcessButton';
import EditorSection from '../../components/EditorSection';
import Link from 'next/link';
import posthog from 'posthog-js';
import { useUser } from '@clerk/nextjs';

const fadeUp = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } }
};
const stagger = {
    hidden: {},
    show: { transition: { staggerChildren: 0.15 } }
};

export default function AppPage() {
    const { user } = useUser();
    const [file, setFile] = useState(null);
    const [modelConfig, setModelConfig] = useState({ model: 'htdemucs', category: 'music' });
    const [vocalOnly, setVocalOnly] = useState(false);
    const [trimStart, setTrimStart] = useState(0);
    const [trimEnd, setTrimEnd] = useState(0);

    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [tracksUrls, setTracksUrls] = useState(null);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const [usage, setUsage] = useState({ used: 0, limit: 3, plan: 'free' });
    const [upgradePrompt, setUpgradePrompt] = useState(false);

    const processingRef = useRef(false);

    useEffect(() => {
        const h = (e) => setMousePos({ x: e.clientX, y: e.clientY });
        window.addEventListener('mousemove', h);
        fetchUsage();
        return () => window.removeEventListener('mousemove', h);
    }, []);

    const fetchUsage = async () => {
        try {
            const res = await fetch('/api/dashboard/usage');
            if (res.ok) setUsage(await res.json());
        } catch { }
    };

    const handleProcess = async () => {
        if (!file || processingRef.current) return;
        processingRef.current = true;
        setIsProcessing(true);
        setProgress(0);
        setTracksUrls(null);
        setUpgradePrompt(false);

        posthog.capture('separation_started', { model: modelConfig.model, category: modelConfig.category });
        const startTime = Date.now();

        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('model', modelConfig.model);
            formData.append('category', modelConfig.category);
            formData.append('vocalOnly', vocalOnly.toString());
            if (trimStart) formData.append('trimStart', String(trimStart));
            if (trimEnd > trimStart) formData.append('trimEnd', String(trimEnd));

            const res = await fetch('/api/separate', {
                method: 'POST', 
                body: formData,
                redirect: 'manual' // Prevent browser from blindly re-posting 5MB files to /signin on 307 auth redirect
            });

            if (res.type === 'opaqueredirect' || res.status === 307 || res.status === 302 || res.status === 401) {
                window.location.href = '/signin';
                return;
            }

            if (res.status === 429) {
                const data = await res.json();
                setUpgradePrompt(true);
                return;
            }

            if (!res.ok) {
                let errorMsg = `HTTP Error ${res.status} (${res.statusText})`;
                try {
                    const rawText = await res.text();
                    errorMsg += ` - Body: ${rawText.slice(0, 500)}`;
                } catch (e) {}
                console.error('[API] Server error response:', errorMsg);
                throw new Error(errorMsg);
            }

            const reader = res.body.getReader();
            const decoder = new TextDecoder('utf-8');
            let done = false;

            while (!done) {
                const { value, done: readerDone } = await reader.read();
                done = readerDone;
                if (value) {
                    const lines = decoder.decode(value, { stream: true }).split('\n').filter(Boolean);
                    for (const line of lines) {
                        try {
                            const data = JSON.parse(line);
                            if (data.type === 'progress') {
                                setProgress(data.percent);
                            } else if (data.type === 'success') {
                                setTracksUrls(data.tracks);
                                posthog.capture('separation_complete', {
                                    model: modelConfig.model,
                                    stem_count: Object.keys(data.tracks || {}).length,
                                });
                                fetchUsage();
                                setTimeout(() => {
                                    document.getElementById('editor-section')?.scrollIntoView({ behavior: 'smooth' });
                                }, 500);
                            } else if (data.type === 'error') {
                                throw new Error(data.message);
                            }
                        } catch (err) {
                            console.warn('Parse error:', err);
                        }
                    }
                }
            }
        } catch (error) {
            console.error('[Process] Error:', error);
            alert(`Backend crashed: ${error.message || 'Unknown error'}`);
        } finally {
            processingRef.current = false;
            setIsProcessing(false);
        }
    };

    return (
        <>
            <div style={{
                position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none', zIndex: -1,
                background: `radial-gradient(circle 600px at ${mousePos.x}px ${mousePos.y}px, rgba(0,0,0,0.04), transparent 70%)`,
                transition: 'background 0.15s ease-out'
            }} />

            <main style={{ maxWidth: '56.25rem', margin: '0 auto', padding: '7rem 2rem 6rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.35rem' }}>
                        <h1 style={{ fontSize: '2rem', fontWeight: '800', letterSpacing: '-1px', color: '#0a0a0a' }}>
                            Audio Separator
                        </h1>
                        {/* Usage counter */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            {usage.plan === 'free' && (
                                <span style={{
                                    fontSize: '0.8rem', fontWeight: '600', color: usage.used >= usage.limit ? '#dc2626' : '#777',
                                    background: usage.used >= usage.limit ? '#fee2e2' : '#f3f3f3',
                                    padding: '0.3rem 0.75rem', borderRadius: '999px', border: '1px solid',
                                    borderColor: usage.used >= usage.limit ? '#fecaca' : '#e5e5e5',
                                }}>
                                    {usage.used} / {usage.limit} free today
                                </span>
                            )}
                            {usage.plan !== 'free' && (
                                <span style={{ fontSize: '0.8rem', fontWeight: '600', color: '#7c3aed', background: '#f5f3ff', padding: '0.3rem 0.75rem', borderRadius: '999px', border: '1px solid #ede9fe' }}>
                                    {usage.plan} — unlimited
                                </span>
                            )}
                        </div>
                    </div>
                    <p style={{ color: '#777', fontSize: '0.95rem' }}>
                        Upload a track, pick a model, and get isolated stems in minutes.
                    </p>
                    {/* Upgrade prompt */}
                    {upgradePrompt && (
                        <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
                            style={{ marginTop: '0.75rem', background: '#fef3c7', border: '1px solid #fde68a', borderRadius: '10px', padding: '0.85rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                            <span style={{ fontWeight: '600', color: '#92400e', fontSize: '0.9rem' }}>You've used all 3 free separations today.</span>
                            <Link href="/pricing" style={{ background: '#111', color: '#fff', padding: '0.5rem 1.2rem', borderRadius: '7px', textDecoration: 'none', fontWeight: '700', fontSize: '0.82rem' }}>Upgrade to Pro →</Link>
                        </motion.div>
                    )}
                </motion.div>

                <motion.div variants={stagger} initial="hidden" animate="show" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <motion.div variants={fadeUp}>
                        <UploadSection onFileSelect={setFile} />
                    </motion.div>
                    <motion.div variants={fadeUp}>
                        <ConfigSection
                            model={modelConfig.model}
                            setModel={(m) => setModelConfig(prev => ({ ...prev, model: m }))}
                            category={modelConfig.category}
                            setCategory={(c) => setModelConfig(prev => ({ ...prev, category: c }))}
                            vocalOnly={vocalOnly} setVocalOnly={setVocalOnly}
                            trimStart={trimStart} setTrimStart={setTrimStart}
                            trimEnd={trimEnd} setTrimEnd={setTrimEnd}
                        />
                    </motion.div>
                    <motion.div variants={fadeUp}>
                        <ProcessButton isProcessing={isProcessing} progress={progress} onClick={handleProcess} disabled={!file} />
                    </motion.div>

                    <motion.div
                        variants={fadeUp}
                        id="editor-section"
                        style={{
                            marginTop: '2rem',
                            opacity: tracksUrls ? 1 : 0.25,
                            pointerEvents: tracksUrls ? 'auto' : 'none',
                            filter: tracksUrls ? 'none' : 'grayscale(100%)',
                            transition: 'all 0.8s ease'
                        }}
                    >
                        {tracksUrls && (
                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
                                <button
                                    onClick={() => { setFile(null); setTracksUrls(null); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                                    style={{ padding: '0.5rem 1.2rem', borderRadius: '8px', border: '1.5px solid #ddd', background: 'transparent', cursor: 'pointer', fontWeight: '600', fontSize: '0.85rem', color: '#555' }}
                                >
                                    ↩  Upload New File
                                </button>
                            </div>
                        )}
                        <EditorSection tracksUrls={tracksUrls} />
                    </motion.div>
                </motion.div>
            </main>
        </>
    );
}
