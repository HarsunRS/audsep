'use client';
import { useState, useEffect, Suspense } from 'react';
import { useUser } from '@clerk/nextjs';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Download, Clock, CheckCircle, AlertCircle, Loader, PlusCircle } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import posthog from 'posthog-js';

const STATUS_COLORS = {
  queued: { bg: '#fef3c7', text: '#92400e' },
  processing: { bg: '#dbeafe', text: '#1e40af' },
  done: { bg: '#dcfce7', text: '#166534' },
  failed: { bg: '#fee2e2', text: '#991b1b' },
};

const STATUS_ICONS = {
  queued: Clock,
  processing: Loader,
  done: CheckCircle,
  failed: AlertCircle,
};

const PLAN_COLORS = { free: '#6b7280', pro: '#7c3aed', team: '#0284c7' };

export default function DashboardPage() {
  return (
    <Suspense fallback={<div style={{ padding: '6rem', textAlign: 'center' }}>Loading dashboard...</div>}>
      <DashboardContent />
    </Suspense>
  );
}

function DashboardContent() {
  const { user } = useUser();
  const searchParams = useSearchParams();
  const upgraded = searchParams.get('upgraded');

  const [jobs, setJobs] = useState([]);
  const [usage, setUsage] = useState({ used: 0, limit: 2, plan: 'free' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (upgraded) posthog.capture('plan_upgraded');
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const [jobsRes, usageRes] = await Promise.all([
        fetch('/api/dashboard/jobs'),
        fetch('/api/dashboard/usage'),
      ]);
      if (jobsRes.ok) setJobs(await jobsRes.json());
      if (usageRes.ok) setUsage(await usageRes.json());
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const formatDate = (iso) =>
    new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

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

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2.5rem' }}>
          <StatCard label="Plan" value={
            <span style={{ textTransform: 'capitalize', color: PLAN_COLORS[usage.plan] || '#111', fontWeight: 800 }}>
              {usage.plan}
            </span>
          } />
          <StatCard label="Today's Usage" value={
            usage.plan === 'free'
              ? `${usage.used} / ${usage.limit}`
              : `${usage.used} (unlimited)`
          } />
          <StatCard label="Total Jobs" value={jobs.length} />
          <StatCard label="Completed" value={jobs.filter(j => j.status === 'done').length} />
        </div>

        {upgraded && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            style={{ background: '#dcfce7', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '1rem 1.5rem', marginBottom: '1.5rem', color: '#166534', fontWeight: '600' }}>
            🎉 Plan upgraded successfully! Enjoy unlimited separations.
          </motion.div>
        )}

        {/* Upgrade prompt for free tier near limit */}
        {usage.plan === 'free' && usage.used >= usage.limit && (
          <div style={{ background: '#fef3c7', border: '1px solid #fde68a', borderRadius: '12px', padding: '1rem 1.5rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <span style={{ color: '#92400e', fontWeight: '600' }}>You've used all 2 free separations today.</span>
            <Link href="/pricing" style={{ background: '#111', color: '#fff', padding: '0.6rem 1.4rem', borderRadius: '8px', textDecoration: 'none', fontWeight: '700', fontSize: '0.85rem' }}>
              Upgrade to Pro →
            </Link>
          </div>
        )}

        {/* Jobs list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '4rem', color: '#999' }}>Loading history…</div>
          ) : jobs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem', color: '#999' }}>
              <p style={{ marginBottom: '1rem' }}>No separations yet.</p>
              <Link href="/studio" style={{ color: '#111', fontWeight: '700', textDecoration: 'underline' }}>Start your first →</Link>
            </div>
          ) : jobs.map(job => (
            <JobCard key={job.id} job={job} formatDate={formatDate} />
          ))}
        </div>
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

function JobCard({ job, formatDate }) {
  const colors = STATUS_COLORS[job.status] || STATUS_COLORS.queued;
  const Icon = STATUS_ICONS[job.status] || Clock;
  const stems = job.tracks ? Object.entries(job.tracks) : [];

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      style={{ background: '#fff', border: '1px solid #ebebeb', borderRadius: '14px', padding: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <div style={{ fontWeight: '700', color: '#0a0a0a', fontSize: '1rem' }}>{job.filename || 'audio file'}</div>
          <div style={{ fontSize: '0.8rem', color: '#999', marginTop: '0.2rem' }}>
            {job.model} · {job.category} · {formatDate(job.createdAt)}
          </div>
        </div>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
          background: colors.bg, color: colors.text,
          padding: '0.3rem 0.85rem', borderRadius: '999px', fontWeight: '700', fontSize: '0.78rem',
        }}>
          <Icon size={12} className={job.status === 'processing' ? 'spin' : ''} />
          {job.status}
        </span>
      </div>

      {stems.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '1rem' }}>
          {stems.map(([stem, url]) => (
            <a key={stem} href={url} download
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                padding: '0.45rem 1rem', borderRadius: '8px', fontSize: '0.82rem', fontWeight: '600',
                background: '#f4f4f4', color: '#333', textDecoration: 'none', border: '1px solid #e5e5e5',
              }}>
              <Download size={12} /> {stem}.wav
            </a>
          ))}
        </div>
      )}

      {job.status === 'failed' && job.error && (
        <div style={{ marginTop: '0.75rem', fontSize: '0.82rem', color: '#991b1b', background: '#fee2e2', padding: '0.5rem 0.75rem', borderRadius: '6px' }}>
          {job.error}
        </div>
      )}
    </motion.div>
  );
}
