'use client';

import { useState, useEffect } from 'react';
import AppShell from '@/components/AppShell';
import {
    ClipboardList,
    Search,
    Filter,
    AlertTriangle,
    AlertCircle,
    CheckCircle,
    Clock,
    ChevronDown,
    ChevronUp,
    Users,
    Stethoscope,
    X,
} from 'lucide-react';

interface PatientRecord {
    id: string;
    patient_id: string;
    age: number;
    gender: string;
    symptoms: string[];
    bp?: string;
    hr?: number;
    temp?: number;
    risk_level: string;
    risk_probability: number;
    confidence_score: number;
    recommended_department: string;
    priority_level: number;
    contributing_factors: string[];
    clinical_reasoning: string;
    created_at: string;
}

export default function RecordsPage() {
    const [records, setRecords] = useState<PatientRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterRisk, setFilterRisk] = useState<string>('all');
    const [expandedId, setExpandedId] = useState<string | null>(null);

    useEffect(() => {
        fetchRecords();
    }, []);

    async function fetchRecords() {
        try {
            const res = await fetch('/api/records');
            const data = await res.json();
            setRecords(data.records || []);
        } catch (err) {
            console.error('Failed to fetch records:', err);
        } finally {
            setLoading(false);
        }
    }

    const filtered = records.filter(r => {
        const matchSearch = r.patient_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            r.recommended_department.toLowerCase().includes(searchTerm.toLowerCase());
        const matchRisk = filterRisk === 'all' || r.risk_level === filterRisk;
        return matchSearch && matchRisk;
    });

    function formatDate(dateStr: string) {
        return new Date(dateStr).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    }

    return (
        <AppShell>
            {/* Top Bar */}
            <div className="top-bar">
                <div>
                    <h2>Patient Records</h2>
                    <p className="top-bar-subtitle">Historical triage assessment records</p>
                </div>
                <div className="top-bar-actions">
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-primary)',
                        borderRadius: 'var(--radius-md)',
                        padding: '0 16px',
                    }}>
                        <Search size={16} style={{ color: 'var(--text-muted)' }} />
                        <input
                            type="text"
                            placeholder="Search patients..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                outline: 'none',
                                color: 'var(--text-primary)',
                                fontSize: '14px',
                                padding: '10px 0',
                                fontFamily: 'inherit',
                                width: '180px',
                            }}
                        />
                        {searchTerm && (
                            <button
                                onClick={() => setSearchTerm('')}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Filter Bar */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '24px',
            }}>
                <Filter size={16} style={{ color: 'var(--text-muted)' }} />
                <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 500 }}>Filter:</span>
                {['all', 'High', 'Medium', 'Low'].map(level => (
                    <button
                        key={level}
                        onClick={() => setFilterRisk(level)}
                        style={{
                            padding: '6px 16px',
                            borderRadius: '50px',
                            border: '1px solid',
                            borderColor: filterRisk === level ? 'var(--accent-primary)' : 'var(--border-primary)',
                            background: filterRisk === level ? 'rgba(99, 102, 241, 0.12)' : 'transparent',
                            color: filterRisk === level ? 'var(--accent-primary-light)' : 'var(--text-secondary)',
                            fontSize: '13px',
                            fontWeight: 500,
                            cursor: 'pointer',
                            transition: 'all var(--transition-fast)',
                            fontFamily: 'inherit',
                        }}
                    >
                        {level === 'all' ? 'All' : level}
                    </button>
                ))}
                <span style={{ marginLeft: 'auto', fontSize: '13px', color: 'var(--text-muted)' }}>
                    {filtered.length} record{filtered.length !== 1 ? 's' : ''}
                </span>
            </div>

            {loading ? (
                <div className="loader">
                    <div className="loader-spinner"></div>
                    <span className="loader-text">Loading records...</span>
                </div>
            ) : filtered.length === 0 ? (
                <div className="card">
                    <div className="empty-state">
                        <div className="empty-state-icon">📋</div>
                        <h3>No Records Found</h3>
                        <p>
                            {searchTerm || filterRisk !== 'all'
                                ? 'Try adjusting your search or filter.'
                                : 'No triage assessments have been performed yet.'}
                        </p>
                    </div>
                </div>
            ) : (
                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    <div className="table-container">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Patient</th>
                                    <th>Risk Level</th>
                                    <th>Probability</th>
                                    <th>Confidence</th>
                                    <th>Department</th>
                                    <th>Priority</th>
                                    <th>Date</th>
                                    <th style={{ width: '40px' }}></th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((record, idx) => (
                                    <>
                                        <tr
                                            key={record.id}
                                            className="animate-fade-in"
                                            style={{
                                                animationDelay: `${idx * 50}ms`,
                                                cursor: 'pointer',
                                            }}
                                            onClick={() => setExpandedId(expandedId === record.id ? null : record.id)}
                                        >
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    <div style={{
                                                        width: '36px',
                                                        height: '36px',
                                                        borderRadius: '50%',
                                                        background: record.risk_level === 'High' ? 'var(--risk-high-bg)'
                                                            : record.risk_level === 'Medium' ? 'var(--risk-medium-bg)' : 'var(--risk-low-bg)',
                                                        border: `1px solid ${record.risk_level === 'High' ? 'rgba(244,63,94,0.3)'
                                                            : record.risk_level === 'Medium' ? 'rgba(245,158,11,0.3)' : 'rgba(16,185,129,0.3)'}`,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                    }}>
                                                        <Users size={16} style={{
                                                            color: record.risk_level === 'High' ? 'var(--risk-high)'
                                                                : record.risk_level === 'Medium' ? 'var(--risk-medium)' : 'var(--risk-low)',
                                                        }} />
                                                    </div>
                                                    <div>
                                                        <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '14px' }}>
                                                            {record.patient_id}
                                                        </div>
                                                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                                            {record.age}y / {record.gender}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <span className={`risk-badge ${record.risk_level.toLowerCase()}`}>
                                                    {record.risk_level === 'High' && <AlertTriangle size={12} />}
                                                    {record.risk_level === 'Medium' && <AlertCircle size={12} />}
                                                    {record.risk_level === 'Low' && <CheckCircle size={12} />}
                                                    {record.risk_level}
                                                </span>
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <div className="progress-bar" style={{ width: '60px' }}>
                                                        <div
                                                            className={`progress-fill ${record.risk_level.toLowerCase()}`}
                                                            style={{ width: `${record.risk_probability * 100}%` }}
                                                        />
                                                    </div>
                                                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                                                        {(record.risk_probability * 100).toFixed(0)}%
                                                    </span>
                                                </div>
                                            </td>
                                            <td>
                                                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--accent-primary-light)' }}>
                                                    {record.confidence_score}%
                                                </span>
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    <Stethoscope size={14} style={{ color: 'var(--accent-secondary)' }} />
                                                    <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>
                                                        {record.recommended_department}
                                                    </span>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="priority-indicator">
                                                    <span className={`priority-dot p${record.priority_level}`}></span>
                                                    <span style={{ fontWeight: 600 }}>P{record.priority_level}</span>
                                                </div>
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '13px' }}>
                                                    <Clock size={13} />
                                                    {formatDate(record.created_at)}
                                                </div>
                                            </td>
                                            <td>
                                                {expandedId === record.id ? (
                                                    <ChevronUp size={16} style={{ color: 'var(--text-muted)' }} />
                                                ) : (
                                                    <ChevronDown size={16} style={{ color: 'var(--text-muted)' }} />
                                                )}
                                            </td>
                                        </tr>
                                        {expandedId === record.id && (
                                            <tr key={`${record.id}-details`}>
                                                <td colSpan={8} style={{ padding: '0', background: 'var(--bg-input)' }}>
                                                    <div style={{ padding: '20px 24px' }} className="animate-fade-in">
                                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                                            {/* Symptoms */}
                                                            <div>
                                                                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
                                                                    Presenting Symptoms
                                                                </div>
                                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                                                    {record.symptoms?.map((s, i) => (
                                                                        <span key={i} className="test-tag">{s}</span>
                                                                    )) || <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>None recorded</span>}
                                                                </div>
                                                            </div>

                                                            {/* Contributing Factors */}
                                                            <div>
                                                                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
                                                                    Contributing Factors
                                                                </div>
                                                                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                                    {record.contributing_factors?.map((f, i) => (
                                                                        <li key={i} style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                                                                            <span style={{ color: 'var(--accent-primary-light)', fontWeight: 700 }}>•</span>
                                                                            {f}
                                                                        </li>
                                                                    )) || <li style={{ color: 'var(--text-muted)', fontSize: '13px' }}>None</li>}
                                                                </ul>
                                                            </div>
                                                        </div>

                                                        {/* Clinical Reasoning */}
                                                        <div style={{ marginTop: '16px' }}>
                                                            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
                                                                Clinical Reasoning
                                                            </div>
                                                            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                                                                {record.clinical_reasoning}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </AppShell>
    );
}
