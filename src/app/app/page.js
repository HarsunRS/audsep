"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import UploadSection from '../../components/UploadSection';
import ConfigSection from '../../components/ConfigSection';
import ProcessButton from '../../components/ProcessButton';
import EditorSection from '../../components/EditorSection';

const fadeUp = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } }
};
const stagger = {
    hidden: {},
    show: { transition: { staggerChildren: 0.15 } }
};

export default function AppPage() {
    const [file, setFile] = useState(null);
    // Batch model + category into one object so switching tabs
    // causes a single re-render instead of two.
    const [modelConfig, setModelConfig] = useState({ model: 'htdemucs', category: 'music' });
    const [vocalOnly, setVocalOnly] = useState(false);
    const [trimStart, setTrimStart] = useState(0);
    const [trimEnd, setTrimEnd] = useState(0);

    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [tracksUrls, setTracksUrls] = useState(null);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

    // Ref guard: prevents duplicate submissions from StrictMode double-invoke
    // or rapid button clicks.
    const processingRef = useRef(false);

    useEffect(() => {
        const h = (e) => setMousePos({ x: e.clientX, y: e.clientY });
        window.addEventListener('mousemove', h);
        return () => window.removeEventListener('mousemove', h);
    }, []);

    const handleProcess = async () => {
        if (!file || processingRef.current) return; // guard against double-fire
        processingRef.current = true;
        setIsProcessing(true);
        setProgress(0);
        setTracksUrls(null);

        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('model', modelConfig.model);
            formData.append('category', modelConfig.category);
            formData.append('vocalOnly', vocalOnly.toString());
            if (trimStart) formData.append('trimStart', String(trimStart));
            if (trimEnd > trimStart) formData.append('trimEnd', String(trimEnd));

            const res = await fetch('/api/separate', { method: 'POST', body: formData });
            if (!res.ok) throw new Error('Failed to process audio');

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
            console.error(error);
            alert('Error separating audio. Please try again.');
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

            <main style={{ maxWidth: '900px', margin: '0 auto', padding: '7rem 2rem 6rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                    <h1 style={{ fontSize: '2rem', fontWeight: '800', letterSpacing: '-1px', color: '#0a0a0a', marginBottom: '0.35rem' }}>
                        Audio Separator
                    </h1>
                    <p style={{ color: '#777', fontSize: '0.95rem' }}>
                        Upload a track, pick a model, and get isolated stems in minutes.
                    </p>
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
