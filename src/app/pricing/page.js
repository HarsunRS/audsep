"use client";

import React, { useState } from 'react';
import posthog from 'posthog-js';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Script from 'next/script';
import { Check, Zap, Shield } from 'lucide-react';

const fadeUp = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } }
};

const stagger = {
    hidden: {},
    show: { transition: { staggerChildren: 0.12 } }
};

const plans = [
    {
        name: 'Free',
        price: '$0',
        period: 'forever',
        desc: 'Perfect for casual use and exploring AI stem separation.',
        features: [
            '2 separations per day',
            'Standard quality MP3 output',
            'HTDemucs model only',
            'Max 5 min track length',
        ],
        cta: 'Get Started Free',
        href: '/studio',
        highlight: false,
    },
    {
        name: 'Basic',
        price: '$9',
        period: 'per month',
        desc: 'Great for hobbyists who need more length and quality.',
        features: [
            '30 separations per month',
            'High quality WAV output',
            'HTDemucs model only',
            'Max 15 min track length',
            'Standard processing queue',
        ],
        cta: 'Get Basic',
        plan: 'basic',
        highlight: false,
    },
    {
        name: 'Pro',
        price: '$19',
        period: 'per month',
        desc: 'For producers & DJs who need high volume & all models.',
        features: [
            '100 separations per month',
            'Hi-res 32-bit float output',
            'All models (HTDemucs, MDX-Net)',
            'Max 60 min track length',
            'Priority processing queue',
            'Batch upload (up to 10 tracks)',
        ],
        cta: 'Get Pro',
        plan: 'pro',
        highlight: true,
    },
    {
        name: 'Studio',
        price: '$49',
        period: 'per month',
        desc: 'API access, SLA guarantees, and volume pricing for studios.',
        features: [
            '300 separations per month',
            'Everything else in Pro',
            'REST API access + API keys',
            'Webhooks & callbacks',
            'SLA & uptime guarantee',
            'Priority support',
            'Dedicated processing queue',
        ],
        cta: 'Get Team',
        plan: 'team',
        highlight: false,
    },
];

const faqs = [
    { q: 'What audio formats are supported?', a: 'We support MP3, WAV, FLAC, OGG, AIFF, and M4A. Files up to 100MB are accepted on the Free plan.' },
    { q: 'How does the AI model work?', a: 'We use Meta\'s HTDemucs — a Hybrid Transformer architecture trained on thousands of hours of multitrack audio data. It\'s one of the highest-quality open source separation models available.' },
    { q: 'Can I use the stems commercially?', a: 'The stems you generate are derivatives of the original song. Commercial usage rights depend on the original track\'s license. We do not impose any additional restrictions.' },
    { q: 'Is my audio stored on your servers?', a: 'Audio files are processed in-memory and automatically deleted within 1 hour after separation is complete. We do not retain or analyze your files.' },
];

export default function PricingPage() {
    const [loadingPlan, setLoadingPlan] = useState(null);

    const handleCheckout = async (plan) => {
        if (!plan) return;
        setLoadingPlan(plan);
        posthog.capture('checkout_started', { plan });
        try {
            const res = await fetch('/api/razorpay/create-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ plan }),
            });
            if (res.status === 401) { window.location.href = '/signin'; return; }
            const orderDetail = await res.json();
            
            if (orderDetail.id) {
                const options = {
                    key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_your_key_id',
                    amount: orderDetail.amount,
                    currency: orderDetail.currency,
                    name: "AudSep",
                    description: `Upgrade to ${plan} plan`,
                    order_id: orderDetail.id,
                    handler: function(response) {
                        posthog.capture('checkout_completed', { plan });
                        window.location.href = '/dashboard?upgraded=1';
                    },
                    theme: { color: "#111111" }
                };
                const rzp = new window.Razorpay(options);
                rzp.open();
            } else if (orderDetail.error) {
                alert(orderDetail.error);
            }
        } catch (e) { console.error(e); }
        finally { setLoadingPlan(null); }
    };

    return (
        <main style={{ minHeight: '100vh', paddingTop: '6rem' }}>
            <Script id="razorpay-checkout-js" src="https://checkout.razorpay.com/v1/checkout.js" />
            {/* Header */}
            <section style={{ textAlign: 'center', padding: '4rem 2rem 3rem' }}>
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
                    <span style={{
                        display: 'inline-block', background: '#f3f3f3', border: '1px solid #e0e0e0',
                        borderRadius: '20px', padding: '0.35rem 1rem', fontSize: '0.8rem',
                        fontWeight: '600', color: '#555', marginBottom: '1.5rem', letterSpacing: '0.05em'
                    }}>
                        SIMPLE PRICING
                    </span>
                    <h1 style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', fontWeight: '900', letterSpacing: '-2px', color: '#0a0a0a', marginBottom: '1rem' }}>
                        Plans for every workflow
                    </h1>
                    <p style={{ color: '#666', fontSize: '1.1rem', maxWidth: '460px', margin: '0 auto' }}>
                        Start free. Upgrade when you need more. No hidden fees.
                    </p>
                </motion.div>
            </section>

            {/* Plans */}
            <section style={{ padding: '2rem 2rem 6rem' }}>
                <motion.div
                    variants={stagger} initial="hidden" animate="show"
                    style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', maxWidth: '1100px', margin: '0 auto' }}
                >
                    {plans.map((plan, i) => (
                        <motion.div key={i} variants={fadeUp} style={{
                            background: plan.highlight ? '#111' : '#fff',
                            border: plan.highlight ? 'none' : '1.5px solid #ebebeb',
                            borderRadius: '20px', padding: '2.5rem',
                            position: 'relative', overflow: 'hidden',
                            boxShadow: plan.highlight ? '0 20px 60px rgba(0,0,0,0.2)' : '0 2px 12px rgba(0,0,0,0.04)',
                            transform: plan.highlight ? 'scale(1.03)' : 'scale(1)',
                        }}>
                            {plan.highlight && <div style={{ position: 'absolute', top: '1rem', right: '1.5rem', background: 'rgba(255,255,255,0.15)', color: '#fff', borderRadius: '20px', padding: '0.25rem 0.75rem', fontSize: '0.75rem', fontWeight: '700' }}>MOST POPULAR</div>}

                            <h2 style={{ fontWeight: '700', fontSize: '1.1rem', color: plan.highlight ? '#aaa' : '#666', marginBottom: '1rem' }}>{plan.name}</h2>
                            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.35rem', marginBottom: '0.5rem' }}>
                                <span style={{ fontSize: '3rem', fontWeight: '900', letterSpacing: '-2px', color: plan.highlight ? '#fff' : '#0a0a0a' }}>{plan.price}</span>
                                <span style={{ fontSize: '0.9rem', color: plan.highlight ? '#aaa' : '#888', marginBottom: '0.5rem' }}>/ {plan.period}</span>
                            </div>
                            <p style={{ color: plan.highlight ? '#bbb' : '#666', fontSize: '0.9rem', marginBottom: '2rem', lineHeight: 1.6 }}>{plan.desc}</p>

                            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 2rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {plan.features.map((f, j) => (
                                    <li key={j} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.95rem', color: plan.highlight ? '#ddd' : '#444' }}>
                                        <Check size={16} color={plan.highlight ? '#4ade80' : '#111'} strokeWidth={2.5} />
                                        {f}
                                    </li>
                                ))}
                            </ul>

                            {plan.plan ? (
                                <button onClick={() => handleCheckout(plan.plan)}
                                    disabled={loadingPlan === plan.plan}
                                    style={{
                                        display: 'block', width: '100%', textAlign: 'center',
                                        fontWeight: '700', padding: '0.9rem', borderRadius: '10px',
                                        fontSize: '0.95rem', cursor: 'pointer', border: 'none',
                                        background: plan.highlight ? '#fff' : '#111',
                                        color: plan.highlight ? '#111' : '#fff',
                                        opacity: loadingPlan === plan.plan ? 0.7 : 1,
                                    }}>
                                    {loadingPlan === plan.plan ? 'Redirecting…' : plan.cta}
                                </button>
                            ) : (
                                <Link href={plan.href || '/studio'} style={{
                                    display: 'block', textAlign: 'center', textDecoration: 'none',
                                    fontWeight: '700', padding: '0.9rem', borderRadius: '10px',
                                    fontSize: '0.95rem',
                                    background: plan.highlight ? '#fff' : '#111',
                                    color: plan.highlight ? '#111' : '#fff',
                                }}>
                                    {plan.cta}
                                </Link>
                            )}
                        </motion.div>
                    ))}
                </motion.div>
            </section>

            {/* FAQ */}
            <section style={{ padding: '4rem 2rem 8rem', background: '#fafafa', borderTop: '1px solid #f0f0f0' }}>
                <div style={{ maxWidth: '700px', margin: '0 auto' }}>
                    <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} style={{ fontSize: '2rem', fontWeight: '800', letterSpacing: '-1px', marginBottom: '3rem', textAlign: 'center', color: '#0a0a0a' }}>
                        Frequently asked questions
                    </motion.h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        {faqs.map((f, i) => (
                            <motion.div key={i} initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} style={{ background: '#fff', border: '1px solid #ebebeb', borderRadius: '12px', padding: '1.5rem' }}>
                                <h3 style={{ fontWeight: '700', fontSize: '1rem', color: '#0a0a0a', marginBottom: '0.5rem' }}>{f.q}</h3>
                                <p style={{ color: '#666', fontSize: '0.95rem', lineHeight: 1.7 }}>{f.a}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>
            {/* ─── FOOTER ─── */}
            <footer style={{ padding: '2rem', borderTop: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', color: '#999', fontSize: '0.85rem' }}>
                <span>© 2026 AudSep. All rights reserved.</span>
                <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                    <Link href="/pricing" style={{ color: '#999', textDecoration: 'none' }}>Pricing</Link>
                    <Link href="/contact" style={{ color: '#999', textDecoration: 'none' }}>Contact</Link>
                    <Link href="/terms" style={{ color: '#999', textDecoration: 'none' }}>Terms of Service</Link>
                    <Link href="/privacy" style={{ color: '#999', textDecoration: 'none' }}>Privacy Policy</Link>
                    <Link href="/studio" style={{ color: '#999', textDecoration: 'none' }}>App</Link>
                </div>
            </footer>
        </main>
    );
}
