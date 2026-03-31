"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
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

const PENDING_JOB_KEY = 'audsep_pending_job';

export default function AppPage() {
    const { user } = useUser();
    const [file, setFile] = useState(null);
    const [modelConfig, setModelConfig] = useState({ model: 'htdemucs', category: 'music' });
    const [vocalOnly, setVocalOnly] = useState(false);
    const [trimStart, setTrimStart] = useState(0);
    const [trimEnd, setTrimEnd] = useState(0);

    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [statusLabel, setStatusLabel] = useState('');
    const [tracksUrls, setTracksUrls] = useState(null);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const [usage, setUsage] = useState({ used: 0, limit: 3, plan: 'free' });
    const [upgradePrompt, setUpgradePrompt] = useState(false);

    const processingRef = useRef(false);
    const cancelRef = useRef(false);
    const jobIdRef = useRef(null);
    // Set to true when the tab becomes visible so the poll loop wakes up immediately
    const wakeRef = useRef(false);

    const fetchUsage = async () => {
        try {
            const res = await fetch('/api/dashboard/usage');
            if (res.ok) setUsage(await res.json());
        } catch { }
    };

    /**
     * Core polling loop. Extracted so it can be called both from handleProcess
     * and from the mount-time recovery path (page refresh while job was running).
     * Pass the model name separately so posthog gets the right value even when
     * called from the recovery path where modelConfig may still be the default.
     */
    const runPolling = useCallback(async (jobId, model) => {
        let attempts = 0;
        const maxAttempts = 120; // 6 min at 3s intervals

        while (attempts < maxAttempts) {
            if (cancelRef.current) break;

            // If the tab just came back into focus, skip the 3s wait and poll now
            if (wakeRef.current) {
                wakeRef.current = false;
            } else {
                await new Promise(r => setTimeout(r, 3000));
            }

            if (cancelRef.current) break;
            attempts++;

            let pollRes;
            try {
                pollRes = await fetch(`/api/jobs/${jobId}`);
            } catch {
                continue; // transient network error — keep trying
            }
            if (!pollRes.ok) {
                if (pollRes.status >= 500) {
                    // Server error — log it so it shows in browser console
                    console.warn(`[poll] job ${jobId} → HTTP ${pollRes.status}`);
                }
                continue;
            }

            const job = await pollRes.json();

            if (job.status === 'queued') {
                setStatusLabel('Waiting for worker…');
            } else if (job.status === 'processing') {
                setStatusLabel('Separating Audio…');
                setProgress(prev => prev + Math.max(0.3, (90 - prev) * 0.03));
            } else if (job.status === 'done') {
                setProgress(100);
                setStatusLabel('Done!');
                setTracksUrls(job.tracks);
                sessionStorage.removeItem(PENDING_JOB_KEY);
                fetchUsage();
                posthog.capture('separation_complete', {
                    model,
                    stem_count: Object.keys(job.tracks || {}).length,
                });
                setTimeout(() => {
                    document.getElementById('editor-section')?.scrollIntoView({ behavior: 'smooth' });
                }, 500);
                return; // exit cleanly
            } else if (job.status === 'failed') {
                sessionStorage.removeItem(PENDING_JOB_KEY);
                throw new Error(job.error || 'Separation failed on the worker.');
            } else if (job.status === 'cancelled') {
                sessionStorage.removeItem(PENDING_JOB_KEY);
                return; // exit silently — user cancelled
            }
        }

        if (attempts >= maxAttempts) {
            sessionStorage.removeItem(PENDING_JOB_KEY);
            throw new Error('Timed out waiting for the worker. Please try again.');
        }
    }, []);

    useEffect(() => {
        const onMouseMove = (e) => setMousePos({ x: e.clientX, y: e.clientY });
        window.addEventListener('mousemove', onMouseMove);
        fetchUsage();

        // Wake up the poll loop immediately when the user switches back to this tab
        const onVisibility = () => {
            if (document.visibilityState === 'visible') wakeRef.current = true;
        };
        document.addEventListener('visibilitychange', onVisibility);

        // Recover any job that was running before a page refresh
        const saved = sessionStorage.getItem(PENDING_JOB_KEY);
        if (saved) {
            try {
                const { jobId, model } = JSON.parse(saved);
                if (jobId) {
                    jobIdRef.current = jobId;
                    processingRef.current = true;
                    cancelRef.current = false;
                    setIsProcessing(true);
                    setProgress(50);
                    setStatusLabel('Reconnecting…');
                    runPolling(jobId, model)
                        .catch(err => alert(`Error: ${err.message || 'Unknown error'}`))
                        .finally(() => {
                            processingRef.current = false;
                            jobIdRef.current = null;
                            setIsProcessing(false);
                        });
                }
            } catch {
                sessionStorage.removeItem(PENDING_JOB_KEY);
            }
        }

        return () => {
            window.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('visibilitychange', onVisibility);
        };
    }, [runPolling]);

    const handleCancel = async () => {
        cancelRef.current = true;
        processingRef.current = false;
        setIsProcessing(false);
        setProgress(0);
        setStatusLabel('');
        sessionStorage.removeItem(PENDING_JOB_KEY);

        if (jobIdRef.current) {
            try {
                await fetch(`/api/jobs/${jobIdRef.current}`, { method: 'DELETE' });
            } catch {
                // best-effort
            }
            jobIdRef.current = null;
        }
    };

    const handleProcess = async () => {
        if (!file || processingRef.current) return;
        processingRef.current = true;
        cancelRef.current = false;
        setIsProcessing(true);
        setProgress(5);
        setStatusLabel('Uploading…');
        setTracksUrls(null);
        setUpgradePrompt(false);

        posthog.capture('separation_started', { model: modelConfig.model, category: modelConfig.category });

        try {
            // ── Step 1: Get a server-signed upload URL
            const urlRes = await fetch('/api/upload-url', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                redirect: 'manual',
                body: JSON.stringify({ filename: file.name, contentType: file.type || 'audio/*' }),
            });
            if (urlRes.type === 'opaqueredirect' || urlRes.status === 307 || urlRes.status === 401) {
                window.location.href = '/signin';
                return;
            }
            if (!urlRes.ok) {
                const e = await urlRes.json().catch(() => ({}));
                throw new Error(e.error || 'Could not get upload URL');
            }
            const { signedUrl, storagePath } = await urlRes.json();

            // ── Upload directly to Supabase Storage
            const uploadRes = await fetch(signedUrl, {
                method: 'PUT',
                headers: { 'Content-Type': file.type || 'audio/*' },
                body: file,
            });
            if (!uploadRes.ok) throw new Error(`Upload failed: HTTP ${uploadRes.status}`);
            setProgress(30);
            setStatusLabel('Queuing job…');

            // ── Step 2: Queue the job
            const queueRes = await fetch('/api/queue', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                redirect: 'manual',
                body: JSON.stringify({
                    inputPath: storagePath,
                    filename: file.name,
                    model: modelConfig.model,
                    category: modelConfig.category,
                    vocalOnly,
                    trimStart: trimStart || 0,
                    trimEnd: trimEnd > trimStart ? trimEnd : 0,
                }),
            });

            if (queueRes.type === 'opaqueredirect' || queueRes.status === 307 || queueRes.status === 401) {
                window.location.href = '/signin';
                return;
            }
            if (queueRes.status === 429) {
                setUpgradePrompt(true);
                return;
            }
            if (!queueRes.ok) {
                const errData = await queueRes.json().catch(() => ({}));
                throw new Error(errData.error || `Queue error: HTTP ${queueRes.status}`);
            }

            const { jobId } = await queueRes.json();
            jobIdRef.current = jobId;

            // Persist so a page refresh can resume polling
            sessionStorage.setItem(PENDING_JOB_KEY, JSON.stringify({ jobId, model: modelConfig.model }));

            setProgress(40);
            setStatusLabel('Separating Audio…');

            // ── Step 3: Poll until done
            await runPolling(jobId, modelConfig.model);

        } catch (error) {
            console.error('[Process] Error:', error);
            setStatusLabel('');
            alert(`Error: ${error.message || 'Unknown error'}`);
        } finally {
            processingRef.current = false;
            jobIdRef.current = null;
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
                            plan={usage.plan}
                        />
                    </motion.div>
                    <motion.div variants={fadeUp}>
                        <ProcessButton isProcessing={isProcessing} progress={progress} statusLabel={statusLabel} onClick={handleProcess} onCancel={handleCancel} disabled={!file} />
                    </motion.div>

                    {/* Output section — stems mixer for music, simple downloads for speech/denoise */}
                    {tracksUrls && (
                        <motion.div variants={fadeUp} id="editor-section" style={{ marginTop: '2rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
                                <button
                                    onClick={() => { setFile(null); setTracksUrls(null); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                                    style={{ padding: '0.5rem 1.2rem', borderRadius: '8px', border: '1.5px solid #ddd', background: 'transparent', cursor: 'pointer', fontWeight: '600', fontSize: '0.85rem', color: '#555' }}
                                >
                                    ↩  Upload New File
                                </button>
                            </div>

                            {modelConfig.category === 'music' ? (
                                <EditorSection tracksUrls={tracksUrls} />
                            ) : (
                                /* Simple download panel for speech / denoise */
                                <div style={{ background: '#fff', border: '1px solid #ebebeb', borderRadius: '16px', padding: '1.5rem' }}>
                                    <h2 style={{ fontSize: '1.3rem', fontWeight: '800', color: '#0a0a0a', marginBottom: '1rem' }}>
                                        {modelConfig.category === 'speech' ? 'Isolated Tracks' : 'Denoised Audio'}
                                    </h2>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                        {Object.entries(tracksUrls).map(([stem, url]) => (
                                            <div key={stem} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.85rem 1rem', border: '1px solid #ebebeb', borderRadius: '10px' }}>
                                                <span style={{ fontWeight: '600', fontSize: '0.9rem', color: '#0a0a0a', textTransform: 'capitalize' }}>
                                                    {stem.replace(/_/g, ' ')}
                                                </span>
                                                <a
                                                    href={url}
                                                    download={`${stem}.wav`}
                                                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.45rem 1rem', background: '#111', color: '#fff', borderRadius: '8px', textDecoration: 'none', fontWeight: '600', fontSize: '0.82rem' }}
                                                >
                                                    ↓ Download
                                                </a>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    )}
                </motion.div>
            </main>
        </>
    );
}
