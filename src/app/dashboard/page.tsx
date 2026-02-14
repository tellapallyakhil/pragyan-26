'use client';

import { useState, useEffect, useCallback } from 'react';
import AppShell from '@/components/AppShell';
import {
    Activity,
    Users,
    AlertCircle,
    Search,
    ArrowUpRight,
    Database,
    Brain,
    CheckCircle,
    RefreshCw,
    AlertTriangle,
    Stethoscope,
    HeartPulse,
    TrendingUp,
    Loader2,
    Shield,
    Clock,
    Zap,
    Eye,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

const RISK_COLORS: Record<string, { bg: string; text: string; border: string; dot: string }> = {
    High: { bg: 'rgba(239,68,68,0.12)', text: '#f87171', border: 'rgba(239,68,68,0.3)', dot: '#ef4444' },
    Medium: { bg: 'rgba(245,158,11,0.12)', text: '#fbbf24', border: 'rgba(245,158,11,0.3)', dot: '#f59e0b' },
    Low: { bg: 'rgba(16,185,129,0.12)', text: '#34d399', border: 'rgba(16,185,129,0.3)', dot: '#10b981' },
};

const DEPT_COLORS: Record<string, string> = {
    'Cardiology': '#ef4444',
    'Emergency': '#f97316',
    'General Medicine': '#3b82f6',
    'Neurology': '#a855f7',
    'Pulmonology': '#06b6d4',
    'Unknown': '#64748b',
};

export default function DashboardPage() {
    const [isLoading, setIsLoading] = useState(true);
    const [isSeeding, setIsSeeding] = useState(false);
    const [records, setRecords] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [lastUpdated, setLastUpdated] = useState<string>('');
    const [isLive, setIsLive] = useState(true);
    const [stats, setStats] = useState({
        total: 0,
        highRisk: 0,
        mediumRisk: 0,
        lowRisk: 0,
        avgRisk: 0,
    });

    const fetchRecords = useCallback(async () => {
        try {
            const fetchPromise = supabase
                .from('triage_records')
                .select('patient_id,age,gender,symptoms,risk_level,risk_probability,recommended_department,confidence_score,priority_level,created_at')
                .order('created_at', { ascending: false })
                .limit(500);

            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('timeout')), 3000)
            );

            const result: any = await Promise.race([fetchPromise, timeoutPromise]);
            const data = result?.data;

            if (data && !result.error) {
                setRecords(data);
                const high = data.filter((r: any) => r.risk_level === 'High').length;
                const med = data.filter((r: any) => r.risk_level === 'Medium').length;
                const low = data.filter((r: any) => r.risk_level === 'Low').length;
                const avg = data.length > 0
                    ? Math.round(data.reduce((acc: number, r: any) => acc + (r.risk_probability || 0) * 100, 0) / data.length)
                    : 0;
                setStats({ total: data.length, highRisk: high, mediumRisk: med, lowRisk: low, avgRisk: avg });
            }
            setLastUpdated(new Date().toLocaleTimeString());
        } catch (e) {
            console.warn('Dashboard fetch timeout/error:', e);
        }
    }, []);

    useEffect(() => {
        fetchRecords().finally(() => setIsLoading(false));
    }, [fetchRecords]);

    const handleLoadResearchData = async () => {
        setIsSeeding(true);
        try {
            const res = await fetch('/api/seed/static', { method: 'POST' });
            const result = await res.json();
            if (result.success) {
                await fetchRecords();
            }
        } catch (error) {
            console.error('Seeding failed:', error);
        } finally {
            setIsSeeding(false);
        }
    };

    const handleRefresh = () => {
        fetchRecords();
    };

    // Compute department distribution
    const deptMap: Record<string, number> = {};
    records.forEach(r => {
        const dept = r.recommended_department || 'Unknown';
        deptMap[dept] = (deptMap[dept] || 0) + 1;
    });
    const departmentData = Object.entries(deptMap)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 6);
    const maxDeptCount = Math.max(...departmentData.map(d => d.count), 1);

    // Filter records by search
    const filteredRecords = records.filter(r => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return (
            r.patient_id?.toLowerCase().includes(q) ||
            r.risk_level?.toLowerCase().includes(q) ||
            r.recommended_department?.toLowerCase().includes(q) ||
            (Array.isArray(r.symptoms) && r.symptoms.some((s: string) => s.toLowerCase().includes(q)))
        );
    });

    // High risk patients for alerts
    const highRiskPatients = records.filter(r => r.risk_level === 'High').slice(0, 3);

    // Donut chart
    const total = stats.highRisk + stats.mediumRisk + stats.lowRisk || 1;
    const highPct = (stats.highRisk / total) * 100;
    const medPct = (stats.mediumRisk / total) * 100;
    const lowPct = (stats.lowRisk / total) * 100;
    const highEnd = highPct * 3.6;
    const medEnd = highEnd + medPct * 3.6;

    if (isLoading) {
        return (
            <AppShell>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: 16 }}>
                    <Loader2 style={{ width: 40, height: 40, color: '#6366f1', animation: 'spin 1s linear infinite' }} />
                    <span style={{ color: '#94a3b8', fontSize: 14, fontWeight: 500 }}>Initializing Clinical Dashboard...</span>
                </div>
            </AppShell>
        );
    }

    return (
        <AppShell>
            <div style={{ padding: '0', minHeight: '100vh', fontFamily: "'Inter', system-ui, sans-serif" }}>

                {/* ───── Top Bar: Live Monitoring + Search + Actions ───── */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '16px 28px',
                    borderBottom: '1px solid rgba(56,189,248,0.08)',
                    background: 'rgba(2,6,23,0.6)',
                    backdropFilter: 'blur(12px)',
                    position: 'sticky',
                    top: 0,
                    zIndex: 20,
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        {/* Live Badge */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            padding: '5px 12px',
                            borderRadius: 6,
                            background: isLive ? 'rgba(16,185,129,0.15)' : 'rgba(100,116,139,0.15)',
                            border: `1px solid ${isLive ? 'rgba(16,185,129,0.3)' : 'rgba(100,116,139,0.3)'}`,
                            cursor: 'pointer',
                        }} onClick={() => setIsLive(!isLive)}>
                            <div style={{
                                width: 8,
                                height: 8,
                                borderRadius: '50%',
                                background: isLive ? '#10b981' : '#64748b',
                                animation: isLive ? 'pulse-dot 2s infinite' : 'none',
                            }} />
                            <span style={{ fontSize: 11, fontWeight: 700, color: isLive ? '#34d399' : '#94a3b8', letterSpacing: '0.05em' }}>
                                {isLive ? 'LIVE' : 'PAUSED'}
                            </span>
                        </div>
                        <span style={{ fontSize: 12, color: '#64748b' }}>
                            Last updated: {lastUpdated || 'just now'}
                        </span>
                    </div>

                    {/* Search Bar */}
                    <div style={{ position: 'relative', width: 320 }}>
                        <Search style={{
                            position: 'absolute',
                            left: 12,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            width: 14,
                            height: 14,
                            color: '#475569',
                        }} />
                        <input
                            type="text"
                            placeholder="Search Patient ID, Department, or Risk..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '8px 12px 8px 34px',
                                borderRadius: 8,
                                border: '1px solid rgba(71,85,105,0.3)',
                                background: 'rgba(15,23,42,0.6)',
                                color: '#e2e8f0',
                                fontSize: 12,
                                outline: 'none',
                                fontFamily: 'inherit',
                                boxSizing: 'border-box',
                            }}
                        />
                    </div>

                    {/* Action Buttons */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <button
                            onClick={handleRefresh}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                                padding: '7px 14px',
                                borderRadius: 8,
                                border: '1px solid rgba(71,85,105,0.3)',
                                background: 'rgba(15,23,42,0.6)',
                                color: '#94a3b8',
                                fontSize: 12,
                                fontWeight: 600,
                                cursor: 'pointer',
                                fontFamily: 'inherit',
                            }}
                        >
                            <RefreshCw style={{ width: 13, height: 13 }} />
                            Refresh
                        </button>
                        <button
                            onClick={handleLoadResearchData}
                            disabled={isSeeding}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                                padding: '7px 14px',
                                borderRadius: 8,
                                border: 'none',
                                background: 'linear-gradient(135deg, #0891b2, #06b6d4)',
                                color: 'white',
                                fontSize: 12,
                                fontWeight: 700,
                                cursor: isSeeding ? 'wait' : 'pointer',
                                opacity: isSeeding ? 0.6 : 1,
                                fontFamily: 'inherit',
                                boxShadow: '0 4px 12px rgba(6,182,212,0.25)',
                            }}
                        >
                            {isSeeding ? (
                                <Loader2 style={{ width: 13, height: 13, animation: 'spin 1s linear infinite' }} />
                            ) : (
                                <Database style={{ width: 13, height: 13 }} />
                            )}
                            Load Research Dataset
                        </button>
                    </div>
                </div>

                {/* ───── Page Header ───── */}
                <div style={{ padding: '24px 28px 0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
                        <Activity style={{ width: 22, height: 22, color: '#06b6d4' }} />
                        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.02em', margin: 0 }}>
                            Live Triage Monitor
                        </h1>
                    </div>
                    <p style={{ color: '#64748b', fontSize: 13, margin: '4px 0 0 34px' }}>
                        Real-time visualization from Supabase • {stats.total} patients
                    </p>
                </div>

                {/* ───── Alert Banner (High Risk) ───── */}
                {highRiskPatients.length > 0 && (
                    <div style={{
                        margin: '20px 28px 0',
                        padding: '12px 18px',
                        borderRadius: 10,
                        background: 'rgba(239,68,68,0.08)',
                        border: '1px solid rgba(239,68,68,0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <AlertTriangle style={{ width: 18, height: 18, color: '#ef4444', flexShrink: 0 }} />
                            <div>
                                <span style={{ fontSize: 13, fontWeight: 800, color: '#f87171', letterSpacing: '0.02em' }}>
                                    ⚠ HIGH RISK ALERT
                                </span>
                                <span style={{ fontSize: 12, color: '#94a3b8', marginLeft: 12 }}>
                                    {stats.highRisk} patient{stats.highRisk !== 1 ? 's' : ''} classified as high-risk requiring immediate attention
                                </span>
                            </div>
                        </div>
                        <button style={{
                            padding: '6px 14px',
                            borderRadius: 6,
                            background: '#ef4444',
                            color: 'white',
                            border: 'none',
                            fontSize: 11,
                            fontWeight: 700,
                            cursor: 'pointer',
                            fontFamily: 'inherit',
                            whiteSpace: 'nowrap',
                        }}>
                            Review Cases
                        </button>
                    </div>
                )}

                {/* ───── Stats Cards Row ───── */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: 16,
                    padding: '20px 28px',
                }}>
                    {[
                        { label: 'TOTAL PATIENTS', value: stats.total, icon: Users, color: '#06b6d4', bg: 'rgba(6,182,212,0.08)', border: 'rgba(6,182,212,0.15)' },
                        { label: 'HIGH RISK', value: stats.highRisk, icon: AlertTriangle, color: '#ef4444', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.15)' },
                        { label: 'AVG RISK INDEX', value: `${stats.avgRisk}%`, icon: TrendingUp, color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.15)' },
                        { label: 'LOW RISK', value: stats.lowRisk, icon: CheckCircle, color: '#10b981', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.15)' },
                    ].map((s, i) => (
                        <div key={i} style={{
                            padding: '18px 20px',
                            borderRadius: 12,
                            background: s.bg,
                            border: `1px solid ${s.border}`,
                            position: 'relative',
                            overflow: 'hidden',
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                                <s.icon style={{ width: 18, height: 18, color: s.color, opacity: 0.8 }} />
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 4,
                                    fontSize: 9,
                                    fontWeight: 700,
                                    color: '#10b981',
                                    padding: '2px 6px',
                                    borderRadius: 4,
                                    background: 'rgba(16,185,129,0.1)',
                                }}>
                                    <Activity style={{ width: 8, height: 8 }} />
                                    Live
                                </div>
                            </div>
                            <div style={{ fontSize: 32, fontWeight: 900, color: '#f1f5f9', lineHeight: 1, letterSpacing: '-0.02em' }}>
                                {s.value}
                            </div>
                            <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', letterSpacing: '0.1em', marginTop: 6, textTransform: 'uppercase' }}>
                                {s.label}
                            </div>
                        </div>
                    ))}
                </div>

                {/* ───── Main Grid: Charts + Legend ───── */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 340px',
                    gap: 16,
                    padding: '0 28px',
                }}>
                    {/* Department Workload Chart */}
                    <div style={{
                        padding: '22px',
                        borderRadius: 12,
                        background: 'rgba(15,23,42,0.5)',
                        border: '1px solid rgba(56,189,248,0.08)',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <Stethoscope style={{ width: 16, height: 16, color: '#06b6d4' }} />
                                <span style={{ fontWeight: 800, fontSize: 14, color: '#f1f5f9' }}>Department Workload</span>
                            </div>
                            <span style={{ fontSize: 11, color: '#475569' }}>Patient distribution across specialties</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                            {departmentData.map((dept, i) => (
                                <div key={dept.name} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                                    <span style={{
                                        width: 120,
                                        fontSize: 12,
                                        fontWeight: 600,
                                        color: '#cbd5e1',
                                        textAlign: 'right',
                                        flexShrink: 0,
                                    }}>{dept.name}</span>
                                    <div style={{
                                        flex: 1,
                                        height: 26,
                                        borderRadius: 6,
                                        background: 'rgba(30,41,59,0.5)',
                                        overflow: 'hidden',
                                        position: 'relative',
                                    }}>
                                        <div style={{
                                            width: `${(dept.count / maxDeptCount) * 100}%`,
                                            height: '100%',
                                            borderRadius: 6,
                                            background: `linear-gradient(90deg, ${DEPT_COLORS[dept.name] || '#64748b'}88, ${DEPT_COLORS[dept.name] || '#64748b'})`,
                                            transition: 'width 1s ease',
                                            boxShadow: `0 0 12px ${DEPT_COLORS[dept.name] || '#64748b'}44`,
                                        }} />
                                    </div>
                                    <span style={{
                                        fontSize: 13,
                                        fontWeight: 800,
                                        color: '#e2e8f0',
                                        width: 40,
                                        textAlign: 'right',
                                    }}>{dept.count}</span>
                                </div>
                            ))}

                            {departmentData.length === 0 && (
                                <div style={{ textAlign: 'center', padding: '40px 0', color: '#475569', fontSize: 13 }}>
                                    No department data yet. Load the research dataset to populate.
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Panel: Legend + Risk Donut */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {/* Legend Panel */}
                        <div style={{
                            padding: '18px 20px',
                            borderRadius: 12,
                            background: 'rgba(15,23,42,0.5)',
                            border: '1px solid rgba(56,189,248,0.08)',
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                                <Eye style={{ width: 14, height: 14, color: '#06b6d4' }} />
                                <span style={{ fontWeight: 800, fontSize: 13, color: '#f1f5f9' }}>Legend</span>
                            </div>

                            <div style={{ marginBottom: 14 }}>
                                <span style={{ fontSize: 10, fontWeight: 700, color: '#475569', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Risk Levels</span>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
                                    {[
                                        { label: 'High Risk', color: '#ef4444', count: stats.highRisk },
                                        { label: 'Medium Risk', color: '#f59e0b', count: stats.mediumRisk },
                                        { label: 'Low Risk', color: '#10b981', count: stats.lowRisk },
                                    ].map((item) => (
                                        <div key={item.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <div style={{ width: 10, height: 10, borderRadius: '50%', background: item.color }} />
                                                <span style={{ fontSize: 12, color: '#cbd5e1', fontWeight: 500 }}>{item.label}</span>
                                            </div>
                                            <span style={{ fontSize: 13, fontWeight: 800, color: item.color }}>{item.count}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div style={{ height: 1, background: 'rgba(71,85,105,0.2)', margin: '12px 0' }} />

                            <div>
                                <span style={{ fontSize: 10, fontWeight: 700, color: '#475569', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Departments</span>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
                                    {departmentData.map(dept => (
                                        <div key={dept.name} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <div style={{
                                                width: 8,
                                                height: 8,
                                                borderRadius: 2,
                                                background: DEPT_COLORS[dept.name] || '#64748b',
                                            }} />
                                            <span style={{ fontSize: 11, color: '#94a3b8' }}>{dept.name}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Risk Donut Chart */}
                        <div style={{
                            padding: '22px',
                            borderRadius: 12,
                            background: 'rgba(15,23,42,0.5)',
                            border: '1px solid rgba(56,189,248,0.08)',
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                                <HeartPulse style={{ width: 14, height: 14, color: '#f43f5e' }} />
                                <span style={{ fontWeight: 800, fontSize: 13, color: '#f1f5f9' }}>Risk Segmentation</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0' }}>
                                <div style={{ position: 'relative', width: 150, height: 150 }}>
                                    <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                                        <circle cx="18" cy="18" r="15.9" fill="none" stroke="rgba(30,41,59,0.5)" strokeWidth="3.2" />
                                        {stats.total > 0 && (
                                            <>
                                                <circle cx="18" cy="18" r="15.9" fill="none" stroke="#ef4444" strokeWidth="3.2"
                                                    strokeDasharray={`${highPct} ${100 - highPct}`}
                                                    strokeDashoffset="0" strokeLinecap="round"
                                                    style={{ filter: 'drop-shadow(0 0 4px rgba(239,68,68,0.4))' }} />
                                                <circle cx="18" cy="18" r="15.9" fill="none" stroke="#f59e0b" strokeWidth="3.2"
                                                    strokeDasharray={`${medPct} ${100 - medPct}`}
                                                    strokeDashoffset={`${-highPct}`} strokeLinecap="round"
                                                    style={{ filter: 'drop-shadow(0 0 4px rgba(245,158,11,0.4))' }} />
                                                <circle cx="18" cy="18" r="15.9" fill="none" stroke="#10b981" strokeWidth="3.2"
                                                    strokeDasharray={`${lowPct} ${100 - lowPct}`}
                                                    strokeDashoffset={`${-(highPct + medPct)}`} strokeLinecap="round"
                                                    style={{ filter: 'drop-shadow(0 0 4px rgba(16,185,129,0.4))' }} />
                                            </>
                                        )}
                                    </svg>
                                    <div style={{
                                        position: 'absolute',
                                        top: '50%',
                                        left: '50%',
                                        transform: 'translate(-50%, -50%)',
                                        textAlign: 'center',
                                    }}>
                                        <div style={{ fontSize: 26, fontWeight: 900, color: '#f1f5f9', lineHeight: 1 }}>
                                            {stats.total}
                                        </div>
                                        <div style={{ fontSize: 9, color: '#64748b', fontWeight: 600, letterSpacing: '0.05em', marginTop: 2 }}>
                                            TOTAL
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ───── Priority Triage Queue Table ───── */}
                <div style={{
                    margin: '20px 28px 28px',
                    borderRadius: 12,
                    background: 'rgba(15,23,42,0.5)',
                    border: '1px solid rgba(56,189,248,0.08)',
                    overflow: 'hidden',
                }}>
                    <div style={{
                        padding: '16px 22px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        borderBottom: '1px solid rgba(56,189,248,0.06)',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <Zap style={{ width: 16, height: 16, color: '#f59e0b' }} />
                            <span style={{ fontWeight: 800, fontSize: 14, color: '#f1f5f9' }}>Priority Triage Queue</span>
                        </div>
                        <span style={{ fontSize: 11, color: '#475569' }}>
                            Showing top {Math.min(filteredRecords.length, 20)} of {filteredRecords.length}
                        </span>
                    </div>

                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid rgba(56,189,248,0.06)' }}>
                                    {['Patient ID', 'Demographics', 'Risk Level', 'Department', 'Confidence', 'Priority', 'Timestamp'].map(h => (
                                        <th key={h} style={{
                                            padding: '12px 16px',
                                            textAlign: 'left',
                                            fontSize: 10,
                                            fontWeight: 700,
                                            color: '#475569',
                                            letterSpacing: '0.08em',
                                            textTransform: 'uppercase',
                                        }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {filteredRecords.slice(0, 20).map((r, i) => {
                                    const rc = RISK_COLORS[r.risk_level] || RISK_COLORS['Low'];
                                    return (
                                        <tr key={i} style={{
                                            borderBottom: '1px solid rgba(56,189,248,0.04)',
                                            transition: 'background 150ms',
                                        }}
                                            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(56,189,248,0.04)')}
                                            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                        >
                                            <td style={{ padding: '12px 16px', fontWeight: 600, color: '#06b6d4', fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }}>
                                                {r.patient_id}
                                            </td>
                                            <td style={{ padding: '12px 16px', color: '#94a3b8' }}>
                                                {r.age}Y • {r.gender}
                                            </td>
                                            <td style={{ padding: '12px 16px' }}>
                                                <span style={{
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: 6,
                                                    padding: '3px 10px',
                                                    borderRadius: 6,
                                                    background: rc.bg,
                                                    border: `1px solid ${rc.border}`,
                                                    color: rc.text,
                                                    fontSize: 11,
                                                    fontWeight: 700,
                                                }}>
                                                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: rc.dot }} />
                                                    {r.risk_level}
                                                </span>
                                            </td>
                                            <td style={{ padding: '12px 16px', color: '#cbd5e1', fontWeight: 500 }}>
                                                {r.recommended_department}
                                            </td>
                                            <td style={{ padding: '12px 16px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                    <div style={{
                                                        width: 60,
                                                        height: 4,
                                                        borderRadius: 2,
                                                        background: 'rgba(30,41,59,0.5)',
                                                        overflow: 'hidden',
                                                    }}>
                                                        <div style={{
                                                            width: `${(r.confidence_score || 0) * 100}%`,
                                                            height: '100%',
                                                            background: '#06b6d4',
                                                            borderRadius: 2,
                                                        }} />
                                                    </div>
                                                    <span style={{ fontSize: 11, color: '#94a3b8', fontFamily: "'JetBrains Mono', monospace" }}>
                                                        {((r.confidence_score || 0) * 100).toFixed(0)}%
                                                    </span>
                                                </div>
                                            </td>
                                            <td style={{ padding: '12px 16px' }}>
                                                <span style={{
                                                    padding: '2px 8px',
                                                    borderRadius: 4,
                                                    background: 'rgba(139,92,246,0.1)',
                                                    color: '#a78bfa',
                                                    fontSize: 11,
                                                    fontWeight: 700,
                                                    fontFamily: "'JetBrains Mono', monospace",
                                                }}>
                                                    P{r.priority_level || '-'}
                                                </span>
                                            </td>
                                            <td style={{ padding: '12px 16px', color: '#475569', fontSize: 11, fontFamily: "'JetBrains Mono', monospace" }}>
                                                {r.created_at ? new Date(r.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}
                                            </td>
                                        </tr>
                                    );
                                })}
                                {filteredRecords.length === 0 && (
                                    <tr>
                                        <td colSpan={7} style={{ padding: '40px 16px', textAlign: 'center', color: '#475569', fontSize: 13 }}>
                                            {searchQuery ? 'No matching records found.' : 'No triage records yet. Use "Load Research Dataset" to populate.'}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <style jsx global>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                @keyframes pulse-dot {
                    0%, 100% { box-shadow: 0 0 0 0 rgba(16,185,129,0.4); }
                    50% { box-shadow: 0 0 0 6px rgba(16,185,129,0); }
                }
            `}</style>
        </AppShell>
    );
}
