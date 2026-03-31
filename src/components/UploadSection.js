"use client";

import React, { useCallback, useState } from 'react';
import { UploadCloud, Music } from 'lucide-react';
import { motion } from 'framer-motion';

const MAX_FILE_MB = 200;

export default function UploadSection({ onFileSelect }) {
    const [dragActive, setDragActive] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [sizeError, setSizeError] = useState(null);

    const handleDrag = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    }, []);

    const acceptFile = useCallback((file) => {
        if (file.size > MAX_FILE_MB * 1024 * 1024) {
            setSizeError(`File is too large (${(file.size / (1024 * 1024)).toFixed(0)} MB). Maximum is ${MAX_FILE_MB} MB.`);
            return;
        }
        setSizeError(null);
        setSelectedFile(file);
        onFileSelect(file);
    }, [onFileSelect]);

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            acceptFile(e.dataTransfer.files[0]);
        }
    }, [acceptFile]);

    const handleChange = (e) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            acceptFile(e.target.files[0]);
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
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>MP3, WAV, FLAC, etc. · Max {MAX_FILE_MB} MB</p>
                    </div>
                )}
            </div>
            {sizeError && (
                <p style={{ marginTop: '0.75rem', color: '#dc2626', fontSize: '0.875rem', fontWeight: '500', textAlign: 'center' }}>
                    {sizeError}
                </p>
            )}
        </motion.div>
    );
}
