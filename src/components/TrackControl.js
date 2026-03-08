"use client";

import React, { useEffect, useRef, useState } from 'react';
import { Download, Volume2, VolumeX, Music2 } from 'lucide-react';
import WaveSurfer from 'wavesurfer.js';

const TRACK_COLORS = {
    vocals: { main: '#111', light: '#e8e8e8' },
    drums: { main: '#333', light: '#efefef' },
    bass: { main: '#555', light: '#f3f3f3' },
    other: { main: '#777', light: '#f7f7f7' },
    guitar: { main: '#444', light: '#eeeeee' },
    piano: { main: '#222', light: '#eaeaea' },
    enhanced: { main: '#111', light: '#e8e8e8' },
};

export default function TrackControl({
    trackName, url,
    volume, isMuted, isSolo, onVolumeChange, onMuteToggle, onSoloToggle,
}) {
    const waveRef = useRef(null);
    const wsRef = useRef(null);
    const gainRef = useRef(null);
    const panRef = useRef(null);
    const bassRef = useRef(null);
    const trebleRef = useRef(null);
    const mountedRef = useRef(true); // guard against setState-after-unmount

    const [isReady, setIsReady] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [pan, setPan] = useState(0);
    const [bass, setBass] = useState(0);
    const [treble, setTreble] = useState(0);
    const [expanded, setExpanded] = useState(false);

    const colors = TRACK_COLORS[trackName?.toLowerCase()] || TRACK_COLORS.other;

    // ── WaveSurfer init ───────────────────────────────────────────────────────────
    useEffect(() => {
        mountedRef.current = true;

        if (!waveRef.current || !url) return;

        const ws = WaveSurfer.create({
            container: waveRef.current,
            waveColor: colors.light,
            progressColor: colors.main,
            cursorColor: colors.main,
            height: 56,
            barWidth: 2,
            barGap: 1,
            barRadius: 2,
            normalize: true,
            interact: true,
        });

        wsRef.current = ws;

        ws.on('ready', () => {
            if (!mountedRef.current) return;

            // ── Wire Web Audio graph AFTER ready so the media element exists ──────────
            try {
                const media = ws.getMediaElement();
                if (media) {
                    const ctx = new (window.AudioContext || window.webkitAudioContext)();

                    const bassEQ = ctx.createBiquadFilter();
                    bassEQ.type = 'lowshelf';
                    bassEQ.frequency.value = 200;
                    bassRef.current = bassEQ;

                    const trebleEQ = ctx.createBiquadFilter();
                    trebleEQ.type = 'highshelf';
                    trebleEQ.frequency.value = 3000;
                    trebleRef.current = trebleEQ;

                    const gainNode = ctx.createGain();
                    gainNode.gain.value = (volume ?? 80) / 100;
                    gainRef.current = gainNode;

                    const panNode = ctx.createStereoPanner();
                    panNode.pan.value = 0;
                    panRef.current = panNode;

                    const source = ctx.createMediaElementSource(media);
                    source.connect(bassEQ);
                    bassEQ.connect(trebleEQ);
                    trebleEQ.connect(gainNode);
                    gainNode.connect(panNode);
                    panNode.connect(ctx.destination);
                }
            } catch (e) {
                // Web Audio setup is best-effort — WaveSurfer still works without it
                console.warn('[TrackControl] Web Audio init failed:', e.message);
            }

            setIsReady(true);
            setDuration(ws.getDuration());
        });

        ws.on('audioprocess', () => {
            if (mountedRef.current) setCurrentTime(ws.getCurrentTime());
        });
        ws.on('play', () => { if (mountedRef.current) setIsPlaying(true); });
        ws.on('pause', () => { if (mountedRef.current) setIsPlaying(false); });
        ws.on('finish', () => { if (mountedRef.current) setIsPlaying(false); });

        // Suppress uncaught AbortError from cancelled fetch on unmount
        ws.on('error', (err) => {
            if (err?.name === 'AbortError') return; // expected on rapid unmount
            console.warn('[WaveSurfer]', err);
        });

        // .catch() is required: ws.load() returns a Promise that rejects with
        // AbortError when ws.destroy() is called while loading is still in progress.
        // Without this catch, it becomes an unhandled promise rejection.
        ws.load(url).catch(err => {
            if (err?.name === 'AbortError' || err?.message?.includes('abort')) return;
            if (mountedRef.current) console.warn('[WaveSurfer load error]', err);
        });

        return () => {
            mountedRef.current = false;
            try { ws.destroy(); } catch (_) { }
        };
    }, [url]); // eslint-disable-line react-hooks/exhaustive-deps

    // ── Sync volume / mute ────────────────────────────────────────────────────────
    useEffect(() => {
        if (!gainRef.current) return;
        gainRef.current.gain.value = isMuted ? 0 : (volume ?? 80) / 100;
    }, [volume, isMuted]);

    // ── Pan ───────────────────────────────────────────────────────────────────────
    const handlePan = (v) => {
        setPan(v);
        if (panRef.current) panRef.current.pan.value = v;
    };

    // ── EQ ───────────────────────────────────────────────────────────────────────
    const handleBass = (v) => {
        setBass(v);
        if (bassRef.current) bassRef.current.gain.value = v;
    };

    const handleTreble = (v) => {
        setTreble(v);
        if (trebleRef.current) trebleRef.current.gain.value = v;
    };

    const togglePlay = () => {
        if (!wsRef.current || !isReady) return;
        wsRef.current.playPause();
    };

    const fmtTime = (t) => {
        const m = Math.floor(t / 60);
        const s = Math.floor(t % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    const label = trackName ? trackName.charAt(0).toUpperCase() + trackName.slice(1) : '';

    return (
        <div style={{
            background: '#fff', border: '1.5px solid #ebebeb', borderRadius: '16px',
            overflow: 'hidden',
        }}>
            {/* ── Header ── */}
            <div style={{ padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem', borderBottom: '1px solid #f5f5f5' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: colors.light, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Music2 size={16} color={colors.main} />
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: '700', fontSize: '0.9rem', color: '#0a0a0a' }}>{label}</div>
                    {isReady && (
                        <div style={{ fontSize: '0.72rem', color: '#bbb', marginTop: '1px' }}>
                            {fmtTime(currentTime)} / {fmtTime(duration)}
                        </div>
                    )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {/* Solo */}
                    <button onClick={() => onSoloToggle?.()} title="Solo"
                        style={{
                            width: '30px', height: '30px', borderRadius: '6px', border: '1.5px solid',
                            borderColor: isSolo ? '#111' : '#e0e0e0',
                            background: isSolo ? '#111' : '#fff',
                            color: isSolo ? '#fff' : '#888',
                            fontWeight: '700', fontSize: '0.7rem', cursor: 'pointer', transition: 'all 0.2s'
                        }}>S</button>

                    {/* Mute */}
                    <button onClick={() => onMuteToggle?.(!isMuted)} title={isMuted ? 'Unmute' : 'Mute'}
                        style={{
                            width: '30px', height: '30px', borderRadius: '6px', border: '1.5px solid',
                            borderColor: isMuted ? '#ccc' : '#e0e0e0',
                            background: '#fff', color: isMuted ? '#bbb' : '#444',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s'
                        }}>
                        {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
                    </button>

                    {/* Play/Pause */}
                    <button onClick={togglePlay} disabled={!isReady}
                        style={{
                            height: '30px', padding: '0 0.9rem', borderRadius: '6px', border: 'none',
                            background: isPlaying ? '#333' : '#111', color: '#fff',
                            fontWeight: '700', fontSize: '0.78rem',
                            cursor: isReady ? 'pointer' : 'not-allowed', opacity: isReady ? 1 : 0.4, transition: 'all 0.2s'
                        }}>
                        {isPlaying ? '⏸' : '▶'}
                    </button>

                    {/* Download */}
                    <a href={url} download={`${trackName}.wav`} title="Download"
                        style={{
                            width: '30px', height: '30px', borderRadius: '6px', border: '1.5px solid #e0e0e0',
                            background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            textDecoration: 'none', color: '#555'
                        }}>
                        <Download size={14} />
                    </a>

                    {/* EQ Toggle */}
                    <button onClick={() => setExpanded(e => !e)} title="EQ & Pan"
                        style={{
                            width: '30px', height: '30px', borderRadius: '6px', border: '1.5px solid',
                            borderColor: expanded ? '#111' : '#e0e0e0',
                            background: expanded ? '#f5f5f5' : '#fff', color: '#555',
                            fontWeight: '700', fontSize: '0.68rem', cursor: 'pointer', transition: 'all 0.2s'
                        }}>EQ</button>
                </div>
            </div>

            {/* ── Waveform ── */}
            <div style={{ padding: '0.5rem 1.25rem 0' }}>
                {!isReady && url && (
                    <div style={{ height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ccc', fontSize: '0.78rem' }}>
                        Loading waveform…
                    </div>
                )}
                <div ref={waveRef} style={{ display: isReady ? 'block' : 'none' }} />
            </div>

            {/* ── Volume slider ── */}
            <div style={{ padding: '0.4rem 1.25rem 0.85rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <span style={{ fontSize: '0.7rem', color: '#ccc', width: '20px', textAlign: 'right' }}>
                    {isMuted ? 'M' : `${volume}`}
                </span>
                <input
                    type="range" min={0} max={100} value={isMuted ? 0 : volume}
                    onChange={e => {
                        const v = parseInt(e.target.value);
                        onVolumeChange?.(v);
                        if (v > 0 && isMuted) onMuteToggle?.(false);
                    }}
                    className="glass-slider"
                    style={{ flex: 1, accentColor: colors.main }}
                />
                <span style={{ fontSize: '0.7rem', color: '#ccc', width: '24px' }}>Vol</span>
            </div>

            {/* ── EQ + Pan panel ── */}
            {expanded && (
                <div style={{ padding: '0.85rem 1.25rem 1.25rem', borderTop: '1px solid #f5f5f5', background: '#fafafa', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {[
                        { label: 'Bass', val: bass, set: handleBass, min: -15, max: 15, step: 1, fmt: v => v > 0 ? `+${v}` : `${v}` },
                        { label: 'Treble', val: treble, set: handleTreble, min: -15, max: 15, step: 1, fmt: v => v > 0 ? `+${v}` : `${v}` },
                        { label: 'Pan', val: pan, set: handlePan, min: -1, max: 1, step: 0.05, fmt: v => v === 0 ? 'C' : v > 0 ? `R${Math.round(v * 100)}` : `L${Math.round(Math.abs(v) * 100)}` },
                    ].map(({ label, val, set, min, max, step, fmt }) => (
                        <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                            <span style={{ width: '40px', fontSize: '0.77rem', fontWeight: '600', color: '#666', flexShrink: 0 }}>{label}</span>
                            <input type="range" min={min} max={max} step={step} value={val}
                                onChange={e => set(parseFloat(e.target.value))}
                                className="glass-slider" style={{ flex: 1, accentColor: colors.main }} />
                            <span style={{ width: '36px', fontSize: '0.74rem', color: '#999', textAlign: 'right', flexShrink: 0 }}>{fmt(val)}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
