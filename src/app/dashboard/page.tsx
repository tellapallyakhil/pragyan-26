'use client';

import { useState, useEffect } from 'react';
import AppShell from '@/components/AppShell';
import {
    Activity,
    Users,
    Clock,
    AlertCircle,
    Search,
    Filter,
    ArrowUpRight,
    MoreHorizontal,
    Database,
    Brain,
    CheckCircle,
    RefreshCw,
    AlertTriangle,
    Stethoscope,
    HeartPulse,
    TrendingUp,
    Loader2,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

const RISK_COLORS: Record<string, { bg: string; text: string; border: string }> = {
    High: { bg: 'var(--risk-high-bg)', text: 'var(--risk-high)', border: 'rgba(244,63,94,0.3)' },
    Medium: { bg: 'var(--risk-medium-bg)', text: 'var(--risk-medium)', border: 'rgba(245,158,11,0.3)' },
    Low: { bg: 'var(--risk-low-bg)', text: 'var(--risk-low)', border: 'rgba(16,185,129,0.3)' },
};

export default function DashboardPage() {
    const [isLoading, setIsLoading] = useState(true);
    const [isSeeding, setIsSeeding] = useState(false);
    const [records, setRecords] = useState<any[]>([]);
    const [stats, setStats] = useState({
        total: 0,
        highRisk: 0,
        mediumRisk: 0,
        lowRisk: 0,
        avgRisk: 0,
    });

    const fetchRecords = async () => {
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
        } catch (e) {
            // Timeout or DB error — show empty state without blocking
            console.warn('Dashboard fetch timeout/error:', e);
        }
    };

    useEffect(() => {
        fetchRecords().finally(() => setIsLoading(false));
    }, []);

    const handleLoadResearchData = async () => {
        setIsSeeding(true);
        try {
            const res = await fetch('/api/seed/static', { method: 'POST' });
            const result = await res.json();
            if (result.success) {
                await fetchRecords();
            } else {
                console.error('Seeding error:', result.error);
            }
        } catch (error) {
            console.error('Seeding failed:', error);
        } finally {
            setIsSeeding(false);
        }
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

    return (
        <AppShell>
            {/* Top Bar */}
            <div className="top-bar">
                <div>
                    <h2>Clinical Dashboard</h2>
                    <p className="top-bar-subtitle">Real-time AI-assisted patient prioritization and department routing</p>
                </div>
                <div className="top-bar-actions">
                    <button
                        onClick={handleLoadResearchData}
                        disabled={isSeeding}
                        className="btn btn-primary"
                        style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                        {isSeeding ? (
                            <RefreshCw size={16} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
                        ) : (
                            <Database size={16} />
                        )}
                        {isSeeding ? 'Ingesting Data...' : 'Load Research Dataset'}
                    </button>
                </div>
            </div>

            {isLoading ? (
                <div className="loader">
                    <div className="loader-spinner"></div>
                    <span className="loader-text">Initializing Triage Command Center...</span>
                </div>
            ) : (
                <>
                    {/* Stats Cards */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(4, 1fr)',
                        gap: '16px',
                        marginBottom: '28px',
                    }}>
                        {[
                            { label: 'Total Patients', value: stats.total, icon: Users, color: 'var(--accent-primary-light)', bgColor: 'rgba(99,102,241,0.1)' },
                            { label: 'High Risk', value: stats.highRisk, icon: AlertTriangle, color: 'var(--risk-high)', bgColor: 'var(--risk-high-bg)' },
                            { label: 'Avg Risk Index', value: `${stats.avgRisk}%`, icon: Brain, color: 'var(--accent-violet)', bgColor: 'rgba(139,92,246,0.1)' },
                            { label: 'Low Risk', value: stats.lowRisk, icon: CheckCircle, color: 'var(--risk-low)', bgColor: 'var(--risk-low-bg)' },
                        ].map((stat, i) => (
                            <div
                                key={i}
                                className="card animate-fade-in"
                                style={{
                                    padding: '24px',
                                    animationDelay: `${i * 80}ms`,
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                                    <div style={{
                                        width: 44,
                                        height: 44,
                                        borderRadius: 12,
                                        background: stat.bgColor,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}>
                                        <stat.icon size={22} style={{ color: stat.color }} />
                                    </div>
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 4,
                                        fontSize: 11,
                                        fontWeight: 700,
                                        color: 'var(--risk-low)',
                                        background: 'var(--risk-low-bg)',
                                        padding: '4px 8px',
                                        borderRadius: 8,
                                    }}>
                                        <TrendingUp size={12} />
                                        Live
                                    </div>
                                </div>
                                <div style={{ fontSize: 32, fontWeight: 900, color: 'var(--text-primary)', marginBottom: 4, letterSpacing: '-0.02em' }}>
                                    {stat.value}
                                </div>
                                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                                    {stat.label}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Charts Row */}
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px', marginBottom: '28px' }}>
                        {/* Department Workload Bar Chart */}
                        <div className="card" style={{ padding: '28px' }}>
                            <div className="card-header" style={{ marginBottom: '24px' }}>
                                <div>
                                    <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <Stethoscope size={18} style={{ color: 'var(--accent-primary-light)' }} />
                                        Department Workload
                                    </h3>
                                    <p className="card-subtitle">Patient distribution across specialties</p>
                                </div>
                            </div>
                            {departmentData.length > 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                    {departmentData.map((dept, i) => (
                                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                            <div style={{ width: 120, fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', flexShrink: 0, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                                                {dept.name}
                                            </div>
                                            <div style={{ flex: 1, height: 28, background: 'var(--bg-input)', borderRadius: 8, overflow: 'hidden', position: 'relative' }}>
                                                <div
                                                    className="animate-fade-in"
                                                    style={{
                                                        height: '100%',
                                                        width: `${(dept.count / maxDeptCount) * 100}%`,
                                                        background: 'var(--gradient-primary)',
                                                        borderRadius: 8,
                                                        transition: 'width 0.8s ease',
                                                        animationDelay: `${i * 100}ms`,
                                                    }}
                                                />
                                            </div>
                                            <div style={{ width: 40, fontSize: 14, fontWeight: 800, color: 'var(--text-primary)', textAlign: 'right' }}>
                                                {dept.count}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="empty-state" style={{ padding: '40px 0' }}>
                                    <div className="empty-state-icon">📊</div>
                                    <p>No department data yet. Load the research dataset.</p>
                                </div>
                            )}
                        </div>

                        {/* Risk Segmentation Donut */}
                        <div className="card" style={{ padding: '28px' }}>
                            <div className="card-header" style={{ marginBottom: '24px' }}>
                                <div>
                                    <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <HeartPulse size={18} style={{ color: 'var(--risk-high)' }} />
                                        Risk Segmentation
                                    </h3>
                                    <p className="card-subtitle">Clinical severity breakdown</p>
                                </div>
                            </div>
                            {stats.total > 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px' }}>
                                    {/* Visual Donut using CSS */}
                                    <div style={{ position: 'relative', width: 180, height: 180 }}>
                                        <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                                            {(() => {
                                                const total = stats.total || 1;
                                                const highPct = stats.highRisk / total * 100;
                                                const medPct = stats.mediumRisk / total * 100;
                                                const lowPct = stats.lowRisk / total * 100;
                                                const circumference = 2 * Math.PI * 14;
                                                let offset = 0;
                                                const segments = [
                                                    { pct: highPct, color: '#f43f5e' },
                                                    { pct: medPct, color: '#f59e0b' },
                                                    { pct: lowPct, color: '#10b981' },
                                                ];
                                                return segments.map((seg, i) => {
                                                    const dashLen = (seg.pct / 100) * circumference;
                                                    const dashGap = circumference - dashLen;
                                                    const el = (
                                                        <circle
                                                            key={i}
                                                            cx="18"
                                                            cy="18"
                                                            r="14"
                                                            fill="none"
                                                            stroke={seg.color}
                                                            strokeWidth="4"
                                                            strokeDasharray={`${dashLen} ${dashGap}`}
                                                            strokeDashoffset={-offset}
                                                            strokeLinecap="round"
                                                        />
                                                    );
                                                    offset += dashLen;
                                                    return el;
                                                });
                                            })()}
                                            <circle cx="18" cy="18" r="11" fill="var(--bg-card)" />
                                        </svg>
                                        <div style={{
                                            position: 'absolute',
                                            inset: 0,
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            pointerEvents: 'none',
                                        }}>
                                            <span style={{ fontSize: 28, fontWeight: 900, color: 'var(--text-primary)' }}>{stats.total}</span>
                                            <span style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.15em' }}>Total</span>
                                        </div>
                                    </div>
                                    {/* Legend */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
                                        {[
                                            { label: 'High Risk', value: stats.highRisk, color: '#f43f5e' },
                                            { label: 'Medium Risk', value: stats.mediumRisk, color: '#f59e0b' },
                                            { label: 'Low Risk', value: stats.lowRisk, color: '#10b981' },
                                        ].map((item, i) => (
                                            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: item.color }} />
                                                    <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{item.label}</span>
                                                </div>
                                                <span style={{ fontWeight: 800, fontSize: 14, color: 'var(--text-primary)' }}>{item.value}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="empty-state" style={{ padding: '40px 0' }}>
                                    <div className="empty-state-icon">🎯</div>
                                    <p>No risk data available yet.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Triage Queue Table */}
                    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                        <div style={{
                            padding: '24px 28px',
                            borderBottom: '1px solid var(--border-primary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                        }}>
                            <div>
                                <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <Activity size={16} style={{ color: 'var(--accent-primary-light)' }} />
                                    Priority Triage Queue
                                </h3>
                                <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0, marginTop: 2 }}>Live monitoring of patient cases</p>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>
                                    Showing top {Math.min(records.length, 15)} of {records.length}
                                </span>
                            </div>
                        </div>
                        <div className="table-container">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Patient ID</th>
                                        <th>Demographics</th>
                                        <th>Risk Level</th>
                                        <th>Department</th>
                                        <th>Confidence</th>
                                        <th>Priority</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {records.length > 0 ? records.slice(0, 15).map((record, i) => {
                                        const risk = RISK_COLORS[record.risk_level] || RISK_COLORS.Low;
                                        return (
                                            <tr key={i} className="animate-fade-in" style={{ animationDelay: `${i * 40}ms` }}>
                                                <td>
                                                    <span style={{ fontWeight: 700, color: 'var(--accent-primary-light)' }}>
                                                        {record.patient_id}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div>
                                                        <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>
                                                            {record.age}Y • {record.gender}
                                                        </div>
                                                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                                                            {record.symptoms?.slice(0, 2).join(', ') || 'N/A'}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>
                                                    <span className={`risk-badge ${record.risk_level?.toLowerCase()}`}>
                                                        {record.risk_level === 'High' && <AlertTriangle size={12} />}
                                                        {record.risk_level === 'Medium' && <AlertCircle size={12} />}
                                                        {record.risk_level === 'Low' && <CheckCircle size={12} />}
                                                        {record.risk_level}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                        <Stethoscope size={14} style={{ color: 'var(--accent-secondary)' }} />
                                                        <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>
                                                            {record.recommended_department}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                        <div className="progress-bar" style={{ width: 60 }}>
                                                            <div
                                                                className={`progress-fill ${record.risk_level?.toLowerCase()}`}
                                                                style={{ width: `${(record.confidence_score || 0) * 100}%` }}
                                                            />
                                                        </div>
                                                        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                                                            {Math.round((record.confidence_score || 0) * 100)}%
                                                        </span>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="priority-indicator">
                                                        <span className={`priority-dot p${record.priority_level}`}></span>
                                                        <span style={{ fontWeight: 700 }}>P{record.priority_level}</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    }) : (
                                        <tr>
                                            <td colSpan={6} style={{ padding: '60px 24px', textAlign: 'center' }}>
                                                <div className="empty-state">
                                                    <div className="empty-state-icon">🏥</div>
                                                    <h3>No Patient Records</h3>
                                                    <p>Click &quot;Load Research Dataset&quot; above to populate with clinical data.</p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}
        </AppShell>
    );
}
