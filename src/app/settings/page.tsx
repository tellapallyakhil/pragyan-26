'use client';

import { useState, useEffect } from 'react';
import AppShell from '@/components/AppShell';
import {
    Settings,
    Database,
    CheckCircle,
    XCircle,
    RefreshCw,
    Shield,
    Globe,
    FileText,
    Copy,
    Check,
    ExternalLink,
    Info,
    DatabaseZap,
    LayoutGrid,
} from 'lucide-react';
import { seedTestData } from '@/lib/seed';
import { ClinicalDataVault } from '@/lib/synthetic-data';

export default function SettingsPage() {
    const [dbStatus, setDbStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');
    const [copied, setCopied] = useState(false);
    const [seeding, setSeeding] = useState(false);

    useEffect(() => {
        checkDbConnection();
    }, []);

    async function handleSeed() {
        setSeeding(true);
        try {
            await seedTestData();
            alert('Test data seeded successfully!');
            checkDbConnection(); // Refresh UI
        } catch (err) {
            console.error(err);
            alert('Failed to seed data.');
        } finally {
            setSeeding(false);
        }
    }

    async function handleGenerateFullDataset() {
        setSeeding(true);
        try {
            const vault = new ClinicalDataVault();
            await vault.generateAndSeed({ count: 50 });
            alert('Data Vault: 50+ Synthetic records generated and seeded successfully!');
            checkDbConnection();
        } catch (err) {
            console.error(err);
            alert('Failed to generate dataset.');
        } finally {
            setSeeding(false);
        }
    }

    async function checkDbConnection() {
        setDbStatus('checking');
        try {
            const res = await fetch('/api/records');
            if (res.ok) {
                setDbStatus('connected');
            } else {
                setDbStatus('disconnected');
            }
        } catch {
            setDbStatus('disconnected');
        }
    }

    async function copySchema() {
        try {
            const res = await fetch('/schema.sql');
            const text = await res.text();
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // Try to copy from inline
            await navigator.clipboard.writeText('See supabase/schema.sql in your project directory.');
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    }

    return (
        <AppShell>
            {/* Top Bar */}
            <div className="top-bar">
                <div>
                    <h2>Settings</h2>
                    <p className="top-bar-subtitle">System configuration and database setup</p>
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {/* Database Connection */}
                <div className="card animate-fade-in">
                    <div className="card-header">
                        <div>
                            <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Database size={18} style={{ color: 'var(--accent-primary-light)' }} />
                                Database Connection
                            </h3>
                            <p className="card-subtitle">Supabase PostgreSQL connection status</p>
                        </div>
                        <button className="btn btn-secondary btn-sm" onClick={checkDbConnection}>
                            <RefreshCw size={14} />
                            Refresh
                        </button>
                    </div>

                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '16px 20px',
                        background: dbStatus === 'connected' ? 'var(--risk-low-bg)' :
                            dbStatus === 'disconnected' ? 'var(--risk-high-bg)' : 'var(--bg-input)',
                        border: '1px solid',
                        borderColor: dbStatus === 'connected' ? 'rgba(16, 185, 129, 0.3)' :
                            dbStatus === 'disconnected' ? 'rgba(244, 63, 94, 0.3)' : 'var(--border-primary)',
                        borderRadius: 'var(--radius-md)',
                    }}>
                        {dbStatus === 'checking' && (
                            <>
                                <RefreshCw size={18} style={{ color: 'var(--text-muted)', animation: 'spin 1s linear infinite' }} />
                                <div>
                                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '14px' }}>Checking connection...</div>
                                    <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Verifying Supabase connectivity</div>
                                </div>
                            </>
                        )}
                        {dbStatus === 'connected' && (
                            <>
                                <CheckCircle size={18} style={{ color: 'var(--risk-low)' }} />
                                <div>
                                    <div style={{ fontWeight: 600, color: 'var(--risk-low)', fontSize: '14px' }}>Connected</div>
                                    <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Supabase database is accessible</div>
                                </div>
                            </>
                        )}
                        {dbStatus === 'disconnected' && (
                            <>
                                <XCircle size={18} style={{ color: 'var(--risk-high)' }} />
                                <div>
                                    <div style={{ fontWeight: 600, color: 'var(--risk-high)', fontSize: '14px' }}>Not Connected</div>
                                    <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                                        Using mock data. Set up the database schema to enable persistence.
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    <div style={{ marginTop: '16px' }}>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            Connection Details
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            <div style={{
                                padding: '12px 16px',
                                background: 'var(--bg-input)',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid var(--border-primary)',
                            }}>
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>URL</div>
                                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px', wordBreak: 'break-all', fontFamily: "'JetBrains Mono', monospace" }}>
                                    {process.env.NEXT_PUBLIC_SUPABASE_URL ? '••••••••.supabase.co' : 'Not configured'}
                                </div>
                            </div>
                            <div style={{
                                padding: '12px 16px',
                                background: 'var(--bg-input)',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid var(--border-primary)',
                            }}>
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>API Key</div>
                                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px', fontFamily: "'JetBrains Mono', monospace" }}>
                                    {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '••••••••••••' : 'Not configured'}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Database Setup */}
                <div className="card animate-fade-in" style={{ animationDelay: '100ms' }}>
                    <div className="card-header">
                        <div>
                            <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <FileText size={18} style={{ color: 'var(--accent-secondary)' }} />
                                Database Schema Setup
                            </h3>
                            <p className="card-subtitle">Run this SQL in your Supabase SQL Editor to create tables</p>
                        </div>
                    </div>

                    <div style={{
                        padding: '16px 20px',
                        background: 'rgba(6, 182, 212, 0.04)',
                        border: '1px solid rgba(6, 182, 212, 0.15)',
                        borderRadius: 'var(--radius-md)',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '12px',
                        marginBottom: '16px',
                    }}>
                        <Info size={18} style={{ color: 'var(--accent-secondary)', flexShrink: 0, marginTop: '2px' }} />
                        <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                            <strong>Steps to set up your database:</strong>
                            <ol style={{ marginTop: '8px', paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <li>Go to your <strong>Supabase Dashboard</strong> → SQL Editor</li>
                                <li>Copy the schema from <code style={{ padding: '2px 6px', background: 'var(--bg-input)', borderRadius: '4px', fontSize: '12px' }}>supabase/schema.sql</code></li>
                                <li>Paste and run the SQL</li>
                                <li>Come back and refresh the connection status</li>
                            </ol>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button className="btn btn-secondary" onClick={copySchema}>
                            {copied ? <Check size={14} /> : <Copy size={14} />}
                            {copied ? 'Copied!' : 'Copy Schema SQL'}
                        </button>
                        <button
                            className="btn btn-secondary"
                            onClick={handleSeed}
                            disabled={seeding || dbStatus !== 'connected'}
                            style={{ borderColor: 'var(--accent-primary-light)', color: 'var(--accent-primary-light)' }}
                        >
                            {seeding ? <RefreshCw size={14} className="animate-spin" /> : <DatabaseZap size={14} />}
                            {seeding ? 'Seeding...' : 'Seed Test Data'}
                        </button>
                        <button
                            className="btn btn-secondary"
                            onClick={handleGenerateFullDataset}
                            disabled={seeding || dbStatus !== 'connected'}
                            style={{ borderColor: 'var(--accent-violet)', color: 'var(--accent-violet)' }}
                        >
                            {seeding ? <RefreshCw size={14} className="animate-spin" /> : <LayoutGrid size={14} />}
                            {seeding ? 'Generating...' : 'Run Synthetic Data Vault (50+ Records)'}
                        </button>
                        <a
                            href="https://supabase.com/dashboard/project/ymjslrffyfzkyushijzk/sql"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-primary"
                        >
                            <ExternalLink size={14} />
                            Open Supabase SQL Editor
                        </a>
                    </div>
                </div>

                {/* System Features */}
                <div className="card animate-fade-in" style={{ animationDelay: '200ms' }}>
                    <div className="card-header">
                        <div>
                            <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Shield size={18} style={{ color: 'var(--accent-violet)' }} />
                                System Capabilities
                            </h3>
                            <p className="card-subtitle">Features and safety mechanisms</p>
                        </div>
                    </div>

                    <div className="three-col-grid">
                        {[
                            {
                                icon: '🎯',
                                title: 'Risk Classification',
                                desc: 'Low / Medium / High classification with probability scoring and confidence metrics.',
                                status: 'Active',
                            },
                            {
                                icon: '🏥',
                                title: 'Department Routing',
                                desc: 'Intelligent routing to General Medicine, Cardiology, Emergency, Neurology, and more.',
                                status: 'Active',
                            },
                            {
                                icon: '🔬',
                                title: 'Follow-up Tests',
                                desc: 'AI-suggested lab tests and imaging based on symptoms and clinical patterns.',
                                status: 'Active',
                            },
                            {
                                icon: '🎙️',
                                title: 'Voice Transcript Analysis',
                                desc: 'Extract symptoms and severity clues from patient verbal descriptions.',
                                status: 'Active',
                            },
                            {
                                icon: '📋',
                                title: 'EHR/EMR Processing',
                                desc: 'Parse electronic health records for vitals, findings, and conditions.',
                                status: 'Active',
                            },
                            {
                                icon: '📈',
                                title: 'Trend Analysis',
                                desc: 'Analyze historical data to detect worsening or improving trends.',
                                status: 'Active',
                            },
                            {
                                icon: '⚖️',
                                title: 'Fairness Check',
                                desc: 'Built-in bias detection to prevent unjustified demographic influence.',
                                status: 'Active',
                            },
                            {
                                icon: '🌍',
                                title: 'Multilingual Support',
                                desc: 'Clinical reasoning in 10+ languages while keeping JSON keys in English.',
                                status: 'Active',
                            },
                            {
                                icon: '🛡️',
                                title: 'Safety Guards',
                                desc: 'Critical vital auto-flagging, no definitive diagnosis, disclaimer enforcement.',
                                status: 'Enforced',
                            },
                        ].map(feature => (
                            <div key={feature.title} style={{
                                padding: '18px',
                                background: 'var(--bg-input)',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid var(--border-primary)',
                                transition: 'all var(--transition-fast)',
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                                    <span style={{ fontSize: '24px' }}>{feature.icon}</span>
                                    <span style={{
                                        padding: '2px 8px',
                                        borderRadius: '50px',
                                        fontSize: '10px',
                                        fontWeight: 700,
                                        color: 'var(--risk-low)',
                                        background: 'var(--risk-low-bg)',
                                        border: '1px solid rgba(16, 185, 129, 0.3)',
                                        textTransform: 'uppercase',
                                    }}>
                                        {feature.status}
                                    </span>
                                </div>
                                <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
                                    {feature.title}
                                </div>
                                <div style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                                    {feature.desc}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Supported Languages */}
                <div className="card animate-fade-in" style={{ animationDelay: '300ms' }}>
                    <div className="card-header">
                        <div>
                            <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Globe size={18} style={{ color: 'var(--accent-emerald)' }} />
                                Supported Languages
                            </h3>
                            <p className="card-subtitle">Multilingual explanation output</p>
                        </div>
                    </div>

                    <div className="tag-grid">
                        {[
                            { code: 'en', name: 'English', flag: '🇬🇧' },
                            { code: 'es', name: 'Español', flag: '🇪🇸' },
                            { code: 'fr', name: 'Français', flag: '🇫🇷' },
                            { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
                            { code: 'hi', name: 'हिन्दी', flag: '🇮🇳' },
                            { code: 'ta', name: 'தமிழ்', flag: '🇮🇳' },
                            { code: 'te', name: 'తెలుగు', flag: '🇮🇳' },
                            { code: 'zh', name: '中文', flag: '🇨🇳' },
                            { code: 'ar', name: 'العربية', flag: '🇸🇦' },
                            { code: 'ja', name: '日本語', flag: '🇯🇵' },
                        ].map(lang => (
                            <div key={lang.code} style={{
                                padding: '10px 18px',
                                background: 'var(--bg-input)',
                                border: '1px solid var(--border-primary)',
                                borderRadius: '50px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                fontSize: '14px',
                                color: 'var(--text-secondary)',
                            }}>
                                <span>{lang.flag}</span>
                                <span style={{ fontWeight: 500 }}>{lang.name}</span>
                                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>({lang.code})</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </AppShell>
    );
}
