"use client";

import React from 'react';

export default function PrivacyPage() {
    return (
        <main style={{ minHeight: '100vh', paddingTop: '8rem', paddingBottom: '6rem', paddingLeft: '2rem', paddingRight: '2rem', background: '#fafafa' }}>
            <div style={{ maxWidth: '800px', margin: '0 auto', background: '#fff', border: '1px solid #ebebeb', borderRadius: '16px', padding: '3rem 4rem' }}>
                <h1 style={{ fontSize: '2.5rem', fontWeight: '900', letterSpacing: '-1.5px', color: '#0a0a0a', marginBottom: '2rem' }}>Privacy Policy</h1>
                
                <div style={{ color: '#444', lineHeight: 1.8, fontSize: '0.95rem' }}>
                    <p style={{ marginBottom: '1.5rem' }}><strong>Last updated:</strong> {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

                    <p style={{ marginBottom: '1.5rem' }}>Your privacy is critically important to us at AudSep. This Privacy Policy outlines how we collect, use, and protect your information.</p>

                    <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0a0a0a', marginTop: '2.5rem', marginBottom: '1rem' }}>1. Information We Collect</h2>
                    <ul style={{ paddingLeft: '1.5rem', marginBottom: '1.5rem' }}>
                        <li style={{ marginBottom: '0.5rem' }}><strong>Account Information:</strong> When you sign up, we collect your email address and profile name via our authentication provider (Clerk).</li>
                        <li style={{ marginBottom: '0.5rem' }}><strong>Payment Information:</strong> Handled entirely by our secure payment processors (Stripe/Lemon Squeezy). We do not store full credit card numbers on our servers.</li>
                        <li style={{ marginBottom: '0.5rem' }}><strong>Audio Files:</strong> Audio files you upload for processing, and the resulting stems.</li>
                        <li style={{ marginBottom: '0.5rem' }}><strong>Analytics:</strong> Anonymous usage data (via PostHog) to help us understand how the service is used and to improve it.</li>
                    </ul>

                    <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0a0a0a', marginTop: '2.5rem', marginBottom: '1rem' }}>2. How We Use Your Information</h2>
                    <p style={{ marginBottom: '1.5rem' }}>We use the information we collect to provide, maintain, and improve our services, to process transactions, and to communicate with you (e.g., sending job completion emails or payment receipts).</p>

                    <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0a0a0a', marginTop: '2.5rem', marginBottom: '1rem' }}>3. Data Retention</h2>
                    <p style={{ marginBottom: '1.5rem' }}>Uploaded audio files and the generated stems are stored securely in cloud storage for a limited time so you can download them. We routinely purge older files to protect user privacy and manage server costs. We do not use your private audio uploads to train our AI models.</p>

                    <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0a0a0a', marginTop: '2.5rem', marginBottom: '1rem' }}>4. Security</h2>
                    <p style={{ marginBottom: '1.5rem' }}>We implement standard security practices to protect your data. All data transfers are encrypted via HTTPS. Authentication is handled by industry leaders, and our databases are heavily restricted.</p>

                    <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0a0a0a', marginTop: '2.5rem', marginBottom: '1rem' }}>5. Contact Us</h2>
                    <p style={{ marginBottom: '1.5rem' }}>If you have any questions or concerns about this Privacy Policy or your data, please contact us at privacy@audsep.io.</p>
                </div>
            </div>
        </main>
    );
}
