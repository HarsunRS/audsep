'use client';
import { useState, useEffect, Suspense } from 'react';
import { useUser } from '@clerk/nextjs';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { PlusCircle } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import posthog from 'posthog-js';

const PLAN_COLORS = { free: '#6b7280', pro: '#7c3aed', team: '#0284c7' };

export default function DashboardPage() {
  return (
    <Suspense fallback={<div style={{ padding: '6rem', textAlign: 'center' }}>Loading...</div>}>
      <DashboardContent />
    </Suspense>
  );
}

function DashboardContent() {
  const { user } = useUser();
  const searchParams = useSearchParams();
  const upgraded = searchParams.get('upgraded');

  const [usage, setUsage] = useState({ used: 0, limit: 3, plan: 'free' });

  useEffect(() => {
    if (upgraded) posthog.capture('plan_upgraded');
    fetch('/api/dashboard/usage')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setUsage(d); })
      .catch(() => {});
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: '#fafafa', padding: '6rem 2rem 4rem' }}>
      <div style={{ maxWidth: '56.25rem', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: '900', letterSpacing: '-1px', color: '#0a0a0a' }}>Dashboard</h1>
            <p style={{ color: '#777', marginTop: '0.25rem' }}>Hey {user?.firstName || 'there'} 👋</p>
          </div>
          <Link href="/studio" style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
            background: '#111', color: '#fff', padding: '0.75rem 1.5rem',
            borderRadius: '10px', fontWeight: '700', fontSize: '0.9rem', textDecoration: 'none',
          }}>
            <PlusCircle size={16} /> New Separation
          </Link>
        </div>

        {upgraded && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            style={{ background: '#dcfce7', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '1rem 1.5rem', marginBottom: '1.5rem', color: '#166534', fontWeight: '600' }}>
            Plan upgraded successfully! Enjoy unlimited separations.
          </motion.div>
        )}

        {/* Usage / plan cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2.5rem' }}>
          <StatCard label="Plan" value={
            <span style={{ textTransform: 'capitalize', color: PLAN_COLORS[usage.plan] || '#111', fontWeight: 800 }}>
              {usage.plan}
            </span>
          } />
          <StatCard label="Usage" value={
            usage.plan === 'free'
              ? `${usage.used} / ${usage.limit} today`
              : `${usage.used} this month`
          } />
        </div>

        {/* Upgrade prompt for free tier at limit */}
        {usage.plan === 'free' && usage.used >= usage.limit && (
          <div style={{ background: '#fef3c7', border: '1px solid #fde68a', borderRadius: '12px', padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <span style={{ color: '#92400e', fontWeight: '600' }}>You've used all {usage.limit} free separations today.</span>
            <Link href="/pricing" style={{ background: '#111', color: '#fff', padding: '0.6rem 1.4rem', borderRadius: '8px', textDecoration: 'none', fontWeight: '700', fontSize: '0.85rem' }}>
              Upgrade to Pro →
            </Link>
          </div>
        )}

      </div>
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #ebebeb', borderRadius: '12px', padding: '1.25rem 1.5rem' }}>
      <div style={{ fontSize: '0.8rem', color: '#999', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
      <div style={{ fontSize: '1.6rem', fontWeight: '900', color: '#0a0a0a' }}>{value}</div>
    </div>
  );
}
