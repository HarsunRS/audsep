"use client";

import React, { useCallback, useState } from 'react';
import { UploadCloud, Music } from 'lucide-react';
import { motion } from 'framer-motion';

export default function UploadSection({ onFileSelect }) {
    const [dragActive, setDragActive] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);

    const handleDrag = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    }, []);

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const file = e.dataTransfer.files[0];
            setSelectedFile(file);
            onFileSelect(file);
        }
    }, [onFileSelect]);

    const handleChange = (e) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setSelectedFile(file);
            onFileSelect(file);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            style={{ marginBottom: '2rem' }}
        >
            <div
                className="glass-panel"
                style={{
                    padding: '3rem',
                    textAlign: 'center',
                    border: dragActive ? '2px dashed var(--primary)' : '2px dashed var(--glass-border)',
                    transition: 'all 0.3s ease',
                    backgroundColor: dragActive ? 'rgba(0, 0, 0, 0.04)' : 'var(--panel-bg)',
                    cursor: 'pointer',
                    position: 'relative'
                }}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
            >
                <input
                    type="file"
                    accept="audio/*"
                    onChange={handleChange}
                    style={{
                        position: 'absolute',
                        top: 0, left: 0, right: 0, bottom: 0,
                        opacity: 0,
                        cursor: 'pointer'
                    }}
                />

                {selectedFile ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                        <Music size={48} color="var(--primary)" />
                        <h3 style={{ fontSize: '1.5rem', fontWeight: '600' }}>{selectedFile.name}</h3>
                        <p style={{ color: 'var(--text-muted)' }}>{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                        <UploadCloud size={48} color="var(--primary)" style={{ marginBottom: '1rem' }} />
                        <h3 style={{ fontSize: '1.5rem', fontWeight: '600' }}>Drag & Drop Audio</h3>
                        <p style={{ color: 'var(--text-muted)' }}>or click to browse from your device</p>
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>MP3, WAV, FLAC, etc.</p>
                    </div>
                )}
            </div>
        </motion.div>
    );
}
