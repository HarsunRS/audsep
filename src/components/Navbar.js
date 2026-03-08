"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { Music2, Menu, X } from 'lucide-react';

export default function Navbar() {
    const [scrolled, setScrolled] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const pathname = usePathname();

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', onScroll);
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    const navLinks = [
        { href: '/#features', label: 'Product' },
        { href: '/pricing', label: 'Pricing' },
        { href: '/contact', label: 'Contact' },
    ];

    return (
        <motion.nav
            initial={{ y: -60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            style={{
                position: 'fixed',
                top: 0, left: 0, right: 0,
                zIndex: 100,
                padding: '0 2rem',
                height: '64px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: scrolled ? 'rgba(255,255,255,0.85)' : 'transparent',
                backdropFilter: scrolled ? 'blur(20px)' : 'none',
                borderBottom: scrolled ? '1px solid rgba(0,0,0,0.06)' : 'none',
                transition: 'all 0.3s ease',
            }}
        >
            {/* Logo */}
            <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                    width: '32px', height: '32px', background: '#111',
                    borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <Music2 size={18} color="#fff" />
                </div>
                <span style={{ fontWeight: '800', fontSize: '1.2rem', color: '#111', letterSpacing: '-0.5px' }}>AudSep</span>
            </Link>

            {/* Desktop Nav */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '2.5rem' }} className="desktop-nav">
                {navLinks.map(link => (
                    <Link
                        key={link.href}
                        href={link.href}
                        style={{
                            textDecoration: 'none',
                            color: '#444',
                            fontWeight: '500',
                            fontSize: '0.95rem',
                            transition: 'color 0.2s',
                        }}
                        onMouseEnter={e => e.target.style.color = '#111'}
                        onMouseLeave={e => e.target.style.color = '#444'}
                    >
                        {link.label}
                    </Link>
                ))}
            </div>

            {/* CTA Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <Link href="/signin" style={{
                    textDecoration: 'none',
                    color: '#444',
                    fontWeight: '500',
                    fontSize: '0.95rem',
                }}>
                    Sign In
                </Link>
                <Link href="/app" style={{
                    textDecoration: 'none',
                    background: '#111',
                    color: '#fff',
                    fontWeight: '600',
                    fontSize: '0.9rem',
                    padding: '0.5rem 1.25rem',
                    borderRadius: '8px',
                    transition: 'all 0.2s',
                }}>
                    Try Free →
                </Link>
            </div>
        </motion.nav>
    );
}
