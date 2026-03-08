"use client";
import React from 'react';
import { motion } from 'framer-motion';

export default function Header() {
  return (
    <header style={{ textAlign: 'center', marginBottom: '3rem', marginTop: '2rem' }}>
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        style={{
          fontSize: '4.5rem',
          fontWeight: '900',
          letterSpacing: '-3px',
          color: 'var(--text-primary)',
          lineHeight: 1,
          marginBottom: '0.75rem'
        }}
      >
        AudSep
      </motion.h1>

      {/* Sound wave accent bars under the title */}
      <motion.div
        initial={{ opacity: 0, scaleX: 0 }}
        animate={{ opacity: 1, scaleX: 1 }}
        transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
        style={{ display: 'flex', justifyContent: 'center', gap: '4px', marginBottom: '1.25rem' }}
      >
        {[12, 20, 28, 36, 28, 20, 12].map((h, i) => (
          <motion.div
            key={i}
            animate={{ height: [`${h}px`, `${h + 12}px`, `${h}px`] }}
            transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.1, ease: 'easeInOut' }}
            style={{ width: '5px', background: 'var(--primary)', borderRadius: '3px', height: `${h}px` }}
          />
        ))}
      </motion.div>

      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.5 }}
        style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}
      >
        Next-generation AI audio separation
      </motion.p>
    </header>
  );
}
