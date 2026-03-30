"use client";

import React from 'react';

export default function TermsPage() {
    return (
        <main style={{ minHeight: '100vh', paddingTop: '8rem', paddingBottom: '6rem', paddingLeft: '2rem', paddingRight: '2rem', background: '#fafafa' }}>
            <div style={{ maxWidth: '50rem', margin: '0 auto', background: '#fff', border: '1px solid #ebebeb', borderRadius: '16px', padding: '3rem 4rem' }}>
                <h1 style={{ fontSize: '2.5rem', fontWeight: '900', letterSpacing: '-1.5px', color: '#0a0a0a', marginBottom: '2rem' }}>Terms of Service</h1>
                
                <div style={{ color: '#444', lineHeight: 1.8, fontSize: '0.95rem' }}>
                    <p style={{ marginBottom: '1.5rem' }}><strong>Last updated:</strong> {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

                    <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0a0a0a', marginTop: '2.5rem', marginBottom: '1rem' }}>1. Agreement to Terms</h2>
                    <p style={{ marginBottom: '1.5rem' }}>By accessing or using the AudSep service, you agree to be bound by these Terms of Service. If you disagree with any part of the terms, you may not access the service.</p>

                    <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0a0a0a', marginTop: '2.5rem', marginBottom: '1rem' }}>2. Use License</h2>
                    <p style={{ marginBottom: '1.5rem' }}>AudSep grants you a limited, non-exclusive, non-transferable license to use our AI audio separation service for personal or commercial use, subject to the limits of your selected subscription tier.</p>

                    <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0a0a0a', marginTop: '2.5rem', marginBottom: '1rem' }}>3. User Data & Audio Files</h2>
                    <p style={{ marginBottom: '1.5rem' }}>You retain all intellectual property rights to the audio files you upload. You grant AudSep a temporary license solely to process your files for the purpose of fulfilling your separation request. Uploaded files and generated stems are automatically held securely and deleted based on our retention policies.</p>

                    <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0a0a0a', marginTop: '2.5rem', marginBottom: '1rem' }}>4. Subscriptions and Payments</h2>
                    <p style={{ marginBottom: '1.5rem' }}>Paid features require a valid subscription. Payments are processed securely via our Merchant of Record (Stripe or Lemon Squeezy). Subscriptions auto-renew unless canceled prior to the renewal date. Refunds are handled on a case-by-case basis according to our refund policy.</p>

                    <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0a0a0a', marginTop: '2.5rem', marginBottom: '1rem' }}>5. Acceptable Use</h2>
                    <p style={{ marginBottom: '1.5rem' }}>You agree not to use AudSep to process material that infringes on the copyrights of others if you intend to distribute the results illegally. You are solely responsible for ensuring you have the legal right to process and use the audio you upload.</p>
                    
                    <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0a0a0a', marginTop: '2.5rem', marginBottom: '1rem' }}>6. Contact Information</h2>
                    <p style={{ marginBottom: '1.5rem' }}>If you have any questions about these Terms, please contact us at support@audsep.io.</p>
                </div>
            </div>
        </main>
    );
}
