"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { Music2 } from 'lucide-react';
import { Show, UserButton, SignInButton, SignUpButton } from '@clerk/nextjs';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <motion.nav
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        padding: '0 2rem', height: '64px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: scrolled ? 'rgba(255,255,255,0.88)' : 'transparent',
        backdropFilter: scrolled ? 'blur(20px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(0,0,0,0.06)' : 'none',
        transition: 'all 0.3s ease',
      }}
    >
      {/* Logo */}
      <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{ width: '32px', height: '32px', background: '#111', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Music2 size={18} color="#fff" />
        </div>
        <span style={{ fontWeight: '800', fontSize: '1.2rem', color: '#111', letterSpacing: '-0.5px' }}>AudSep</span>
      </Link>

      {/* Nav links */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
        {[
          { href: '/#features', label: 'Product' },
          { href: '/pricing', label: 'Pricing' },
          { href: '/contact', label: 'Contact' },
        ].map(link => (
          <Link key={link.href} href={link.href} style={{ textDecoration: 'none', color: '#555', fontWeight: '500', fontSize: '0.9rem', transition: 'color 0.2s' }}
            onMouseEnter={e => e.target.style.color = '#111'}
            onMouseLeave={e => e.target.style.color = '#555'}>
            {link.label}
          </Link>
        ))}
      </div>

      {/* Auth section */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <Show when="signed-out">
          <SignInButton mode="modal">
            <button style={{ background: 'transparent', border: 'none', color: '#555', fontWeight: '500', fontSize: '0.9rem', cursor: 'pointer', padding: 0 }}>
              Sign In
            </button>
          </SignInButton>
          <SignUpButton mode="modal">
            <button style={{
              background: '#111', color: '#fff', border: 'none', cursor: 'pointer',
              fontWeight: '600', fontSize: '0.85rem', padding: '0.5rem 1.25rem', borderRadius: '8px',
            }}>
              Try Free →
            </button>
          </SignUpButton>
        </Show>

        <Show when="signed-in">
          <Link href="/dashboard" style={{
            textDecoration: 'none', color: '#555', fontWeight: '500', fontSize: '0.9rem',
            ...(pathname === '/dashboard' ? { color: '#111', fontWeight: '700' } : {})
          }}>
            Dashboard
          </Link>
          <Link href="/app" style={{
            textDecoration: 'none', background: '#111', color: '#fff',
            fontWeight: '600', fontSize: '0.85rem', padding: '0.5rem 1.25rem', borderRadius: '8px',
          }}>
            Separate
          </Link>
          <UserButton afterSignOutUrl="/" />
        </Show>
      </div>
    </motion.nav>
  );
}
