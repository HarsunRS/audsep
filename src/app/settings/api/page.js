'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Key, Copy, Trash2, Plus, Eye, EyeOff } from 'lucide-react';
import posthog from 'posthog-js';

export default function ApiKeysSettings() {
  const [keys, setKeys] = useState([]);
  const [newKeyName, setNewKeyName] = useState('');
  const [generatedKey, setGeneratedKey] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => { fetchKeys(); }, []);

  const fetchKeys = async () => {
    const res = await fetch('/api/settings/api-keys');
    if (res.ok) setKeys(await res.json().then(d => d.keys || []));
  };

  const createKey = async () => {
    if (!newKeyName.trim()) return;
    setLoading(true);
    const res = await fetch('/api/settings/api-keys', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newKeyName.trim() }),
    });
    const data = await res.json();
    setGeneratedKey(data.key);
    setNewKeyName('');
    posthog.capture('api_key_created');
    fetchKeys();
    setLoading(false);
  };

  const revokeKey = async (keyId) => {
    if (!confirm('Revoke this API key? This cannot be undone.')) return;
    await fetch('/api/settings/api-keys', {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keyId }),
    });
    fetchKeys();
  };

  const copyKey = () => {
    navigator.clipboard.writeText(generatedKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#fafafa', padding: '6rem 2rem 4rem' }}>
      <div style={{ maxWidth: '47.50rem', margin: '0 auto' }}>
        <div style={{ marginBottom: '2.5rem' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: '900', letterSpacing: '-1px', color: '#0a0a0a' }}>API Keys</h1>
          <p style={{ color: '#777', marginTop: '0.4rem' }}>Use API keys to call AudSep programmatically via <code style={{ background: '#f3f3f3', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>/api/v1/separate</code></p>
        </div>

        {/* Generated key banner */}
        {generatedKey && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            style={{ background: '#dcfce7', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '1.25rem 1.5rem', marginBottom: '1.5rem' }}>
            <div style={{ fontWeight: '700', color: '#166534', marginBottom: '0.5rem' }}>
              ✅ Your new API key (save it — it won't be shown again)
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <code style={{ background: '#fff', padding: '0.5rem 0.75rem', borderRadius: '6px', fontSize: '0.85rem', border: '1px solid #bbf7d0', wordBreak: 'break-all' }}>
                {generatedKey}
              </code>
              <button onClick={copyKey} style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid #bbf7d0', background: '#fff', cursor: 'pointer' }}>
                <Copy size={14} />
              </button>
              {copied && <span style={{ fontSize: '0.8rem', color: '#166534', fontWeight: '600' }}>Copied!</span>}
            </div>
          </motion.div>
        )}

        {/* Create new key */}
        <div style={{ background: '#fff', border: '1px solid #ebebeb', borderRadius: '14px', padding: '1.5rem', marginBottom: '1.5rem' }}>
          <div style={{ fontWeight: '700', fontSize: '1rem', color: '#0a0a0a', marginBottom: '1rem' }}>Create new key</div>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <input
              type="text" placeholder="Key name (e.g. My Script)"
              value={newKeyName} onChange={e => setNewKeyName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && createKey()}
              style={{ flex: 1, minWidth: '220px', padding: '0.65rem 1rem', borderRadius: '8px', border: '1.5px solid #e5e5e5', outline: 'none', fontSize: '0.95rem' }}
            />
            <button onClick={createKey} disabled={loading || !newKeyName.trim()}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                padding: '0.65rem 1.4rem', borderRadius: '8px', background: '#111', color: '#fff',
                border: 'none', fontWeight: '700', fontSize: '0.9rem', cursor: 'pointer', opacity: loading ? 0.7 : 1
              }}>
              <Plus size={15} /> Generate
            </button>
          </div>
        </div>

        {/* Key list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {keys.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#999', background: '#fff', borderRadius: '14px', border: '1px solid #ebebeb' }}>
              No API keys yet.
            </div>
          ) : keys.map(k => (
            <div key={k.id} style={{ background: '#fff', borderRadius: '12px', border: '1px solid #ebebeb', padding: '1rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Key size={16} color="#888" />
                <div>
                  <div style={{ fontWeight: '600', fontSize: '0.9rem', color: '#0a0a0a' }}>{k.name}</div>
                  <div style={{ fontSize: '0.75rem', color: '#999', marginTop: '0.15rem' }}>
                    Created {new Date(k.created_at).toLocaleDateString()}
                    {k.last_used_at && ` · Last used ${new Date(k.last_used_at).toLocaleDateString()}`}
                  </div>
                </div>
              </div>
              <button onClick={() => revokeKey(k.id)}
                style={{ padding: '0.45rem', borderRadius: '6px', border: '1px solid #fee2e2', background: '#fff', cursor: 'pointer', color: '#ef4444' }}>
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>

        {/* Usage example */}
        <div style={{ marginTop: '2.5rem', background: '#0a0a0a', borderRadius: '14px', padding: '1.5rem' }}>
          <div style={{ color: '#888', fontSize: '0.8rem', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Example Request</div>
          <pre style={{ color: '#e2e8f0', fontSize: '0.82rem', overflowX: 'auto', margin: 0, lineHeight: 1.7 }}>{`curl -X POST https://audsep.com/api/v1/separate \\
  -H "x-api-key: ask_YOUR_KEY_HERE" \\
  -F "file=@track.mp3" \\
  -F "model=htdemucs" \\
  -F "category=music"`}</pre>
        </div>
      </div>
    </div>
  );
}
