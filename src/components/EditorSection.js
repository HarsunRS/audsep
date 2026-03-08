"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { DownloadCloud, Loader2 } from 'lucide-react';
import TrackControl from './TrackControl';

export default function EditorSection({ tracksUrls }) {
    const defaultVol = 80;

    // Build dynamic track list from whatever stems came back
    const tracks = tracksUrls
        ? Object.entries(tracksUrls).map(([stem, url]) => ({ name: stem, url }))
        : [{ name: 'vocals', url: null }, { name: 'drums', url: null }, { name: 'bass', url: null }, { name: 'other', url: null }];

    // Volumes, mutes, solos — keyed by stem name
    const [volumes, setVolumes] = useState(() =>
        Object.fromEntries(tracks.map(t => [t.name, defaultVol]))
    );
    const [mutes, setMutes] = useState(() =>
        Object.fromEntries(tracks.map(t => [t.name, false]))
    );
    const [soloTrack, setSoloTrack] = useState(null); // only one track can solo
    const [isMixing, setIsMixing] = useState(false);

    const handleVolumeChange = (name, val) => setVolumes(prev => ({ ...prev, [name]: val }));
    const handleMuteToggle = (name, val) => setMutes(prev => ({ ...prev, [name]: val }));

    // Solo: toggle solo on clicked track; if already soloed, clear
    const handleSoloToggle = (name) => {
        setSoloTrack(prev => prev === name ? null : name);
    };

    // Effective mute: if any track is soloed, mute all others
    const isEffectivelyMuted = (name) => {
        if (soloTrack && soloTrack !== name) return true;
        return mutes[name] || false;
    };

    const handleDownloadMix = async () => {
        if (!tracksUrls) return;
        setIsMixing(true);
        try {
            const payload = {
                tracks: tracks.map(t => ({
                    name: t.name,
                    url: t.url,
                    volume: isEffectivelyMuted(t.name) ? 0 : ((volumes[t.name] ?? defaultVol) / 100)
                }))
            };
            const res = await fetch('/api/mix', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!res.ok) throw new Error('Failed to mix audio');
            const data = await res.json();
            const a = document.createElement('a');
            a.href = data.url;
            a.download = 'master_mix.wav';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        } catch (error) {
            console.error(error);
            alert('Error creating master mix.');
        } finally {
            setIsMixing(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            style={{ marginTop: '1.5rem' }}
        >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                <div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: '800', letterSpacing: '-0.5px', color: '#0a0a0a', margin: 0 }}>
                        Stems
                    </h2>
                    {soloTrack && (
                        <p style={{ fontSize: '0.78rem', color: '#888', margin: '4px 0 0' }}>
                            Solo active: <strong>{soloTrack}</strong> — click S again to clear
                        </p>
                    )}
                </div>
                <button
                    onClick={handleDownloadMix}
                    disabled={isMixing || !tracksUrls}
                    style={{
                        display: 'flex', alignItems: 'center', gap: '0.5rem',
                        padding: '0.6rem 1.25rem', borderRadius: '8px', border: 'none',
                        background: '#111', color: '#fff', fontWeight: '700', fontSize: '0.85rem',
                        cursor: (isMixing || !tracksUrls) ? 'not-allowed' : 'pointer',
                        opacity: !tracksUrls ? 0.4 : 1, transition: 'opacity 0.2s'
                    }}
                >
                    {isMixing ? <Loader2 size={16} className="animate-spin" /> : <DownloadCloud size={16} />}
                    {isMixing ? 'Mixing...' : 'Download Mix'}
                </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {tracks.map((t) => (
                    <TrackControl
                        key={t.name}
                        trackName={t.name}
                        url={t.url}
                        volume={volumes[t.name] ?? defaultVol}
                        isMuted={isEffectivelyMuted(t.name)}
                        isSolo={soloTrack === t.name}
                        onVolumeChange={(v) => handleVolumeChange(t.name, v)}
                        onMuteToggle={(m) => handleMuteToggle(t.name, m)}
                        onSoloToggle={() => handleSoloToggle(t.name)}
                    />
                ))}
            </div>
        </motion.div>
    );
}
