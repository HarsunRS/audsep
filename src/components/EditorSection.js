"use client";

import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Download, Loader2, Music2 } from 'lucide-react';
import WaveSurfer from 'wavesurfer.js';

const TRACK_COLORS = {
    vocals:   { main: '#111', light: '#e8e8e8' },
    drums:    { main: '#333', light: '#efefef' },
    bass:     { main: '#555', light: '#f3f3f3' },
    other:    { main: '#777', light: '#f7f7f7' },
    guitar:   { main: '#444', light: '#eeeeee' },
    piano:    { main: '#222', light: '#eaeaea' },
    enhanced: { main: '#111', light: '#e8e8e8' },
};

function StemCard({ stem, url }) {
    const waveRef = useRef(null);
    const wsRef = useRef(null);
    const mountedRef = useRef(true);

    const [isReady, setIsReady] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isDownloading, setIsDownloading] = useState(false);

    const colors = TRACK_COLORS[stem?.toLowerCase()] || TRACK_COLORS.other;
    const label = stem ? stem.charAt(0).toUpperCase() + stem.slice(1).replace(/_/g, ' ') : '';

    useEffect(() => {
        mountedRef.current = true;
        if (!waveRef.current || !url) return;

        const ws = WaveSurfer.create({
            container: waveRef.current,
            waveColor: colors.light,
            progressColor: colors.main,
            cursorColor: colors.main,
            height: 52,
            barWidth: 2,
            barGap: 1,
            barRadius: 2,
            normalize: true,
            interact: true,
        });
        wsRef.current = ws;

        ws.on('ready', () => {
            if (!mountedRef.current) return;
            setIsReady(true);
            setDuration(ws.getDuration());
        });
        ws.on('audioprocess', () => { if (mountedRef.current) setCurrentTime(ws.getCurrentTime()); });
        ws.on('play',   () => { if (mountedRef.current) setIsPlaying(true); });
        ws.on('pause',  () => { if (mountedRef.current) setIsPlaying(false); });
        ws.on('finish', () => { if (mountedRef.current) setIsPlaying(false); });
        ws.on('error',  (err) => { if (err?.name !== 'AbortError') console.warn('[WaveSurfer]', err); });

        ws.load(url).catch(err => {
            if (err?.name !== 'AbortError' && !err?.message?.includes('abort') && mountedRef.current)
                console.warn('[WaveSurfer load]', err);
        });

        return () => {
            mountedRef.current = false;
            try { ws.destroy(); } catch (_) {}
        };
    }, [url]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleDownload = async () => {
        if (!url || isDownloading) return;
        setIsDownloading(true);
        try {
            const res = await fetch(url);
            const blob = await res.blob();
            const ext = blob.type.includes('mpeg') ? 'mp3' : 'wav';
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = `${stem}.${ext}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(a.href);
        } catch (err) {
            console.error('[download]', err);
            alert('Download failed. Please try again.');
        } finally {
            setIsDownloading(false);
        }
    };

    const fmtTime = (t) => {
        const m = Math.floor(t / 60);
        const s = Math.floor(t % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    return (
        <div style={{ background: '#fff', border: '1.5px solid #ebebeb', borderRadius: '14px', overflow: 'hidden' }}>
            <div style={{ padding: '0.9rem 1.1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                {/* Icon */}
                <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: colors.light, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Music2 size={15} color={colors.main} />
                </div>

                {/* Label + time */}
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: '700', fontSize: '0.88rem', color: '#0a0a0a' }}>{label}</div>
                    {isReady && (
                        <div style={{ fontSize: '0.7rem', color: '#bbb', marginTop: '1px' }}>
                            {fmtTime(currentTime)} / {fmtTime(duration)}
                        </div>
                    )}
                </div>

                {/* Play/Pause */}
                <button
                    onClick={() => wsRef.current?.playPause()}
                    disabled={!isReady}
                    style={{
                        height: '30px', padding: '0 0.85rem', borderRadius: '6px', border: 'none',
                        background: isPlaying ? '#333' : '#111', color: '#fff',
                        fontWeight: '700', fontSize: '0.78rem',
                        cursor: isReady ? 'pointer' : 'not-allowed',
                        opacity: isReady ? 1 : 0.4, transition: 'background 0.2s',
                        flexShrink: 0,
                    }}
                >
                    {isPlaying ? '⏸' : '▶'}
                </button>

                {/* Download */}
                <button
                    onClick={handleDownload}
                    disabled={isDownloading}
                    style={{
                        display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                        padding: '0 1rem', height: '30px', borderRadius: '6px', border: 'none',
                        background: '#111', color: '#fff',
                        fontWeight: '600', fontSize: '0.8rem', cursor: isDownloading ? 'not-allowed' : 'pointer',
                        opacity: isDownloading ? 0.6 : 1, flexShrink: 0,
                    }}
                >
                    {isDownloading ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
                    {isDownloading ? 'Downloading…' : 'Download'}
                </button>
            </div>

            {/* Waveform */}
            <div style={{ padding: '0 1.1rem 0.75rem' }}>
                {!isReady && url && (
                    <div style={{ height: '52px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ccc', fontSize: '0.76rem' }}>
                        Loading waveform…
                    </div>
                )}
                <div ref={waveRef} style={{ display: isReady ? 'block' : 'none' }} />
            </div>
        </div>
    );
}

export default function EditorSection({ tracksUrls, category }) {
    const stems = tracksUrls ? Object.entries(tracksUrls) : [];

    const title = category === 'speech' ? 'Isolated Tracks'
                : category === 'noise' || category === 'wind' ? 'Denoised Audio'
                : 'Stems';

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            style={{ background: '#fff', border: '1px solid #ebebeb', borderRadius: '16px', padding: '1.5rem' }}
        >
            <h2 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#0a0a0a', margin: '0 0 1rem' }}>
                {title}
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {stems.map(([stem, url]) => (
                    <StemCard key={stem} stem={stem} url={url} />
                ))}
            </div>
        </motion.div>
    );
}
