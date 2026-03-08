"use client";

import React, { useRef, useCallback, useEffect, useState } from 'react';

/**
 * Robust dual-handle trim slider built on raw pointer events.
 * No overlapping <input type="range"> — both handles are fully draggable
 * in any direction, anywhere on the track.
 */
export default function TrimSlider({ start, end, onChange, max = 300 }) {
    const trackRef = useRef(null);
    const dragging = useRef(null); // 'start' | 'end' | null

    const clamp = (v) => Math.max(0, Math.min(max, Math.round(v)));

    const posToValue = useCallback((clientX) => {
        const rect = trackRef.current.getBoundingClientRect();
        const ratio = (clientX - rect.left) / rect.width;
        return clamp(ratio * max);
    }, [max]);

    // ── Pointer handlers ──────────────────────────────────────────────────────────
    const onPointerDown = useCallback((handle, e) => {
        e.preventDefault();
        dragging.current = handle;
        trackRef.current?.setPointerCapture?.(e.pointerId);
    }, []);

    const onPointerMove = useCallback((e) => {
        if (!dragging.current) return;
        const v = posToValue(e.clientX);

        if (dragging.current === 'start') {
            // Allow start to move freely; if it passes end, swap handles to end
            if (v >= end) {
                onChange(end, Math.min(max, v + 1));
                dragging.current = 'end';
            } else {
                onChange(v, end);
            }
        } else {
            if (v <= start) {
                onChange(Math.max(0, v - 1), start);
                dragging.current = 'start';
            } else {
                onChange(start, v);
            }
        }
    }, [start, end, max, onChange, posToValue]);

    const onPointerUp = useCallback(() => {
        dragging.current = null;
    }, []);

    // Also allow clicking directly on the track to snap nearest handle
    const onTrackClick = useCallback((e) => {
        if (dragging.current) return;
        const v = posToValue(e.clientX);
        const distToStart = Math.abs(v - start);
        const distToEnd = Math.abs(v - end);
        if (distToStart <= distToEnd) {
            onChange(v, end);
        } else {
            onChange(start, v);
        }
    }, [start, end, onChange, posToValue]);

    const leftPct = (start / max) * 100;
    const rightPct = (end / max) * 100;

    const fmt = (s) => {
        const m = Math.floor(s / 60);
        const sec = Math.floor(s % 60).toString().padStart(2, '0');
        return `${m}:${sec}`;
    };

    const duration = end - start;

    return (
        <div style={{ width: '100%', userSelect: 'none', padding: '0 8px' }}>
            {/* ── Track ── */}
            <div
                ref={trackRef}
                onClick={onTrackClick}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerLeave={onPointerUp}
                style={{
                    position: 'relative',
                    height: '28px',
                    display: 'flex',
                    alignItems: 'center',
                    cursor: 'pointer',
                    touchAction: 'none',
                }}
            >
                {/* Rail */}
                <div style={{
                    position: 'absolute', left: 0, right: 0,
                    height: '5px', borderRadius: '3px', background: '#e8e8e8'
                }} />

                {/* Selected range fill */}
                <div style={{
                    position: 'absolute',
                    left: `${leftPct}%`,
                    width: `${rightPct - leftPct}%`,
                    height: '5px',
                    borderRadius: '3px',
                    background: '#111',
                }} />

                {/* Start thumb */}
                <div
                    onPointerDown={(e) => onPointerDown('start', e)}
                    style={{
                        position: 'absolute',
                        left: `${leftPct}%`,
                        transform: 'translateX(-50%)',
                        width: '20px', height: '20px',
                        borderRadius: '50%',
                        background: '#fff',
                        border: '2.5px solid #111',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                        cursor: 'grab',
                        zIndex: 2,
                        touchAction: 'none',
                        transition: 'box-shadow 0.15s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.boxShadow = '0 0 0 4px rgba(0,0,0,0.08)'}
                    onMouseLeave={e => e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)'}
                />

                {/* End thumb */}
                <div
                    onPointerDown={(e) => onPointerDown('end', e)}
                    style={{
                        position: 'absolute',
                        left: `${rightPct}%`,
                        transform: 'translateX(-50%)',
                        width: '20px', height: '20px',
                        borderRadius: '50%',
                        background: '#111',
                        border: '2.5px solid #111',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                        cursor: 'grab',
                        zIndex: 2,
                        touchAction: 'none',
                        transition: 'box-shadow 0.15s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.boxShadow = '0 0 0 4px rgba(0,0,0,0.12)'}
                    onMouseLeave={e => e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)'}
                />
            </div>

            {/* ── Time labels ── */}
            <div style={{ position: 'relative', height: '36px', marginTop: '4px' }}>
                {/* Start label */}
                <div style={{
                    position: 'absolute',
                    left: `${leftPct}%`,
                    transform: 'translateX(-50%)',
                    textAlign: 'center',
                    pointerEvents: 'none',
                }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: '700', color: '#111', whiteSpace: 'nowrap' }}>{fmt(start)}</div>
                    <div style={{ fontSize: '0.65rem', color: '#aaa', marginTop: '1px' }}>Start</div>
                </div>

                {/* End label — only show if not too close to start */}
                {rightPct - leftPct > 8 && (
                    <div style={{
                        position: 'absolute',
                        left: `${rightPct}%`,
                        transform: 'translateX(-50%)',
                        textAlign: 'center',
                        pointerEvents: 'none',
                    }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: '700', color: '#fff', background: '#111', borderRadius: '4px', padding: '1px 5px', whiteSpace: 'nowrap' }}>{fmt(end)}</div>
                        <div style={{ fontSize: '0.65rem', color: '#aaa', marginTop: '1px' }}>End</div>
                    </div>
                )}
            </div>

            {/* ── Summary ── */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                <span style={{ fontSize: '0.75rem', color: '#999' }}>
                    {start === 0 && end === max
                        ? 'Full track (no trim)'
                        : `${fmt(start)} → ${fmt(end)} · ${duration}s`}
                </span>
                {(start > 0 || end < max) && (
                    <button
                        onClick={() => onChange(0, max)}
                        style={{ fontSize: '0.72rem', color: '#888', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}
                    >
                        Reset
                    </button>
                )}
            </div>
        </div>
    );
}
