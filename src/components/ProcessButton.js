"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wand2 } from 'lucide-react';

export default function ProcessButton({ isProcessing, progress, statusLabel, onClick, onCancel, disabled }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            style={{ display: 'flex', justifyContent: 'center', marginBottom: '3rem', width: '100%' }}
        >
            <AnimatePresence mode="wait">
                {!isProcessing ? (
                    <motion.button
                        key="idle-btn"
                        onClick={onClick}
                        disabled={disabled}
                        whileHover={!disabled ? { scale: 1.05 } : {}}
                        whileTap={!disabled ? { scale: 0.95 } : {}}
                        style={{
                            background: disabled
                                ? 'var(--glass-border)'
                                : 'var(--primary)',
                            border: disabled ? 'none' : '1px solid var(--glass-border)',
                            borderRadius: '30px',
                            padding: '1rem 3rem',
                            color: disabled ? 'var(--text-muted)' : '#FFFFFF',
                            fontSize: '1.2rem',
                            fontWeight: '700',
                            cursor: disabled ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            boxShadow: disabled
                                ? 'none'
                                : '0 8px 32px var(--primary-glow)',
                            position: 'relative',
                            overflow: 'hidden'
                        }}
                        exit={{ opacity: 0, scale: 0.8 }}
                    >
                        <Wand2 size={24} />
                        Separate Audio

                        {!disabled && (
                            <motion.div
                                animate={{ x: ['-100%', '200%'] }}
                                transition={{ repeat: Infinity, duration: 2.5, ease: "linear", repeatDelay: 1 }}
                                style={{
                                    position: 'absolute',
                                    top: 0, left: 0, bottom: 0, width: '30%',
                                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
                                    transform: 'skewX(-20deg)',
                                    pointerEvents: 'none'
                                }}
                            />
                        )}
                    </motion.button>
                ) : (
                    <motion.div
                        key="progress-bar"
                        initial={{ opacity: 0, width: '200px', borderRadius: '30px' }}
                        animate={{ opacity: 1, width: '100%', maxWidth: '600px', borderRadius: '15px' }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        style={{
                            background: 'var(--panel-bg)',
                            border: '1px solid var(--panel-border)',
                            boxShadow: '0 8px 32px var(--primary-glow)',
                            padding: '1.5rem',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '1rem',
                            position: 'relative',
                            overflow: 'hidden',
                            backdropFilter: 'blur(20px)'
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{statusLabel || 'Separating Audio...'}</span>
                            <span style={{ fontWeight: '700', color: 'var(--primary)' }}>{progress}%</span>
                        </div>

                        {/* Sound Wave Progress Bar */}
                        <div style={{
                            width: '100%',
                            height: '40px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            position: 'relative'
                        }}>
                            {Array.from({ length: 50 }).map((_, i) => {
                                // 50 bars, so each bar represents 2% of progress
                                const isActive = progress >= (i * 2);
                                return (
                                    <motion.div
                                        key={i}
                                        initial={{ height: '4px' }}
                                        animate={{
                                            height: isActive
                                                ? `${Math.max(8, Math.random() * 32 + 8)}px`
                                                : `${4 + Math.sin(i * 0.5) * 4}px`
                                        }}
                                        transition={{
                                            repeat: isActive ? Infinity : 0,
                                            duration: 0.2 + Math.random() * 0.2,
                                            repeatType: 'reverse'
                                        }}
                                        style={{
                                            flex: 1,
                                            background: isActive ? 'var(--primary)' : 'var(--glass-border)',
                                            borderRadius: '2px',
                                            opacity: isActive ? 1 : 0.3,
                                            transition: 'background 0.3s ease, opacity 0.3s ease'
                                        }}
                                    />
                                );
                            })}
                        </div>

                        {/* Cancel button */}
                        {onCancel && (
                            <div style={{ display: 'flex', justifyContent: 'center' }}>
                                <button
                                    onClick={onCancel}
                                    style={{
                                        background: 'transparent', border: '1px solid #ddd', borderRadius: '8px',
                                        padding: '0.4rem 1.2rem', cursor: 'pointer', fontSize: '0.82rem',
                                        fontWeight: '600', color: '#888', transition: 'all 0.2s'
                                    }}
                                    onMouseEnter={e => { e.target.style.borderColor = '#111'; e.target.style.color = '#111'; }}
                                    onMouseLeave={e => { e.target.style.borderColor = '#ddd'; e.target.style.color = '#888'; }}
                                >
                                    Cancel
                                </button>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
