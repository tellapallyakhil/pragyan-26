'use client';

import { useState } from 'react';
import {
    AlertTriangle,
    AlertCircle,
    CheckCircle,
    Activity,
    ArrowRight,
    ClipboardCheck,
    Stethoscope,
    TrendingUp,
    Shield,
    MessageSquare,
    FileText,
    Clock,
    Printer,
    Share2,
    Code,
    ChevronDown,
    ChevronUp,
    Copy,
    Check,
    Database,
} from 'lucide-react';
import { TriageResult } from '@/lib/types';

interface Props {
    result: TriageResult;
}

export default function TriageResultPanel({ result }: Props) {
    const [showJson, setShowJson] = useState(false);
    const [copied, setCopied] = useState(false);

    const getRiskColor = (risk: string) => {
        switch (risk) {
            case 'High': return 'var(--risk-high)';
            case 'Medium': return 'var(--risk-medium)';
            case 'Low': return 'var(--risk-low)';
            default: return 'var(--text-primary)';
        }
    };

    const getRiskBg = (risk: string) => {
        switch (risk) {
            case 'High': return 'var(--risk-high-bg)';
            case 'Medium': return 'var(--risk-medium-bg)';
            case 'Low': return 'var(--risk-low-bg)';
            default: return 'var(--bg-card)';
        }
    };

    const copyJson = async () => {
        await navigator.clipboard.writeText(JSON.stringify(result, null, 2));
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Risk Summary Header */}
            <div className="card" style={{
                borderLeft: `6px solid ${getRiskColor(result.risk_level)}`,
                background: `linear-gradient(to right, ${getRiskBg(result.risk_level)}, var(--bg-card))`,
                padding: '24px',
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                            <span className={`risk-badge ${result.risk_level.toLowerCase()}`} style={{ fontSize: '13px', padding: '6px 16px' }}>
                                {result.risk_level === 'High' && <AlertTriangle size={16} />}
                                {result.risk_level === 'Medium' && <AlertCircle size={16} />}
                                {result.risk_level === 'Low' && <CheckCircle size={16} />}
                                {result.risk_level.toUpperCase()} RISK
                            </span>
                            <div className="priority-indicator" style={{ background: 'rgba(255,255,255,0.05)', padding: '6px 12px', borderRadius: '50px' }}>
                                <span className={`priority-dot p${result.priority_level}`}></span>
                                <span style={{ fontWeight: 700, fontSize: '13px' }}>PRIORITY P{result.priority_level}</span>
                            </div>
                        </div>
                        <h1 style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)', margin: '12px 0 4px 0' }}>
                            {result.recommended_department} Recommended
                        </h1>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>
                            AI-driven triage routing based on current patient presentation.
                        </p>
                    </div>

                    <div style={{ display: 'flex', gap: '24px' }}>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: 700, textTransform: 'uppercase' }}>Probability</div>
                            <div style={{ fontSize: '24px', fontWeight: 800, color: getRiskColor(result.risk_level) }}>
                                {(result.risk_probability * 100).toFixed(0)}%
                            </div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: 700, textTransform: 'uppercase' }}>Confidence</div>
                            <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--accent-primary-light)' }}>
                                {result.confidence_score}%
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="two-col-grid">
                {/* Clinical Reasoning */}
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Stethoscope size={18} style={{ color: 'var(--accent-primary-light)' }} />
                            Clinical Reasoning
                        </h3>
                    </div>
                    <div style={{
                        padding: '16px',
                        background: 'rgba(255,255,255,0.02)',
                        borderRadius: 'var(--radius-md)',
                        lineHeight: 1.6,
                        color: 'var(--text-secondary)',
                        fontSize: '14px',
                        whiteSpace: 'pre-wrap',
                        border: '1px solid var(--border-primary)'
                    }}>
                        {result.clinical_reasoning}
                    </div>

                    <div style={{ marginTop: '24px' }}>
                        <h4 style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '12px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                            Contributing Factors (Ranked)
                        </h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {result.contributing_factors.map((factor, idx) => (
                                <div key={idx} style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    padding: '8px 12px',
                                    background: 'var(--bg-input)',
                                    border: '1px solid var(--border-primary)',
                                    borderRadius: 'var(--radius-sm)'
                                }}>
                                    <div style={{
                                        width: '18px',
                                        height: '18px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        background: idx === 0 ? getRiskColor(result.risk_level) : 'var(--bg-card)',
                                        borderRadius: '4px',
                                        fontSize: '10px',
                                        fontWeight: 800,
                                        color: idx === 0 ? 'white' : 'var(--text-muted)',
                                        border: idx === 0 ? 'none' : '1px solid var(--border-primary)'
                                    }}>
                                        {idx + 1}
                                    </div>
                                    <span style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{factor}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {/* Follow-up Tests */}
                    <div className="card">
                        <div className="card-header">
                            <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <ClipboardCheck size={18} style={{ color: 'var(--accent-secondary)' }} />
                                Suggested Tests
                            </h3>
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                            {result.suggested_followup_tests.map((test, idx) => (
                                <div key={idx} style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    padding: '6px 12px',
                                    background: 'rgba(6, 182, 212, 0.05)',
                                    border: '1px solid rgba(6, 182, 212, 0.15)',
                                    borderRadius: '50px',
                                    fontSize: '12px',
                                    color: 'var(--accent-secondary)',
                                    fontWeight: 500
                                }}>
                                    <Activity size={12} />
                                    {test}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Trend Analysis */}
                    <div className="card">
                        <div className="card-header">
                            <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <TrendingUp size={18} style={{ color: 'var(--accent-emerald)' }} />
                                Trend Analysis
                            </h3>
                        </div>
                        <div style={{
                            display: 'flex',
                            gap: '12px',
                            alignItems: 'flex-start',
                            padding: '12px',
                            background: 'rgba(16, 185, 129, 0.04)',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid rgba(16, 185, 129, 0.12)',
                        }}>
                            <TrendingUp size={18} style={{ color: 'var(--accent-emerald)', marginTop: '2px', flexShrink: 0 }} />
                            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                                {result.trend_analysis}
                            </p>
                        </div>
                    </div>

                    {/* Fairness Check */}
                    <div className="card">
                        <div className="card-header">
                            <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Shield size={18} style={{ color: 'var(--accent-violet)' }} />
                                Fairness Check
                            </h3>
                        </div>
                        <div style={{
                            display: 'flex',
                            gap: '10px',
                            alignItems: 'flex-start',
                            padding: '12px',
                            background: 'rgba(139, 92, 246, 0.04)',
                            borderRadius: 'var(--radius-md)',
                            fontSize: '13px',
                            color: 'var(--text-muted)',
                            border: '1px solid rgba(139, 92, 246, 0.12)'
                        }}>
                            <Shield size={14} style={{ color: 'var(--accent-violet)', flexShrink: 0, marginTop: '2px' }} />
                            <span>{result.fairness_check_note}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Voice & EHR Extraction Highlights */}
            <div className="two-col-grid">
                <div className="card" style={{ padding: '20px' }}>
                    <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '16px', textTransform: 'uppercase' }}>
                        <MessageSquare size={16} style={{ color: 'var(--accent-emerald)' }} />
                        Voice Extraction
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div style={{ background: 'var(--bg-input)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-primary)' }}>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '4px' }}>EXTRACTED SYMPTOMS</div>
                            <div style={{ fontSize: '13px', color: 'var(--text-primary)' }}>
                                {result.extracted_from_voice.symptoms.length > 0 ? result.extracted_from_voice.symptoms.join(', ') : 'None detected'}
                            </div>
                        </div>
                        <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                            <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>Severity:</span> {result.extracted_from_voice.severity_clues}
                        </div>
                        <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                            <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>Flags:</span> {result.extracted_from_voice.emergency_flags}
                        </div>
                    </div>
                </div>

                <div className="card" style={{ padding: '20px' }}>
                    <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '16px', textTransform: 'uppercase' }}>
                        <FileText size={16} style={{ color: 'var(--accent-violet)' }} />
                        EHR Extraction
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div style={{ background: 'var(--bg-input)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-primary)' }}>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '4px' }}>VITALS DETECTED</div>
                            <div style={{ fontSize: '13px', color: 'var(--text-primary)' }}>
                                {Object.keys(result.extracted_from_ehr.vitals).length > 0
                                    ? Object.entries(result.extracted_from_ehr.vitals).map(([k, v]) => `${k.toUpperCase()}: ${v}`).join(', ')
                                    : 'None detected'}
                            </div>
                        </div>
                        <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                            <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>Clinical Data:</span>{' '}
                            {[...result.extracted_from_ehr.abnormal_findings, ...result.extracted_from_ehr.chronic_conditions].join(', ') || 'No data found'}
                        </div>
                    </div>
                </div>
            </div>

            {/* Actions Bar */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '16px 24px',
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid var(--border-primary)',
                borderRadius: 'var(--radius-lg)',
                marginTop: '12px'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '12px' }}>
                        <Clock size={14} />
                        Assessed at {new Date().toLocaleTimeString()}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--risk-high)', fontSize: '12px', fontWeight: 600 }}>
                        <AlertTriangle size={14} />
                        Official Triage Assessment - Not a Diagnosis
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => setShowJson(!showJson)} className="btn btn-ghost btn-sm">
                        <Code size={14} /> {showJson ? 'Hide JSON' : 'View JSON'}
                    </button>
                    <button className="btn btn-ghost btn-sm">
                        <Printer size={14} /> Print
                    </button>
                </div>
            </div>

            {showJson && (
                <div className="card animate-fade-in" style={{ padding: '0', overflow: 'hidden' }}>
                    <div className="card-header" style={{ padding: '12px 20px', background: 'rgba(255,255,255,0.02)' }}>
                        <h4 className="card-title" style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Database size={14} /> Raw Structured JSON Output
                        </h4>
                        <button onClick={copyJson} className="btn btn-ghost btn-sm">
                            {copied ? <Check size={14} /> : <Copy size={14} />}
                            {copied ? 'Copied' : 'Copy'}
                        </button>
                    </div>
                    <pre style={{
                        margin: 0,
                        padding: '20px',
                        background: '#050505',
                        color: '#10b981',
                        fontSize: '12px',
                        overflowX: 'auto',
                        fontFamily: 'var(--font-mono)'
                    }}>
                        <code>{JSON.stringify(result, null, 2)}</code>
                    </pre>
                </div>
            )}
        </div>
    );
}
