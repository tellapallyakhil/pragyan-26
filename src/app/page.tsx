'use client';

import { useState, useEffect } from 'react';
import AppShell from '@/components/AppShell';
import Link from 'next/link';
import {
  Users,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  TrendingUp,
  ArrowRight,
  HeartPulse,
  Clock,
  Activity,
  Zap,
} from 'lucide-react';

interface Stats {
  total: number;
  high: number;
  medium: number;
  low: number;
  departments: { name: string; value: number }[];
  averageConfidence: number;
}

interface Record {
  id: string;
  patient_id: string;
  age: number;
  gender: string;
  symptoms: string[];
  risk_level: string;
  risk_probability: number;
  confidence_score: number;
  recommended_department: string;
  priority_level: number;
  clinical_reasoning: string;
  created_at: string;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentRecords, setRecentRecords] = useState<Record[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const res = await fetch('/api/records');
      const data = await res.json();
      setStats(data.stats);
      setRecentRecords(data.records?.slice(0, 5) || []);
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  }

  function formatTime(dateStr: string) {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return d.toLocaleDateString();
  }

  return (
    <AppShell>
      {/* Top Bar */}
      <div className="top-bar">
        <div>
          <h2>Dashboard</h2>
          <p className="top-bar-subtitle">Clinical Triage Decision Support Overview</p>
        </div>
        <div className="top-bar-actions">
          <Link href="/triage" className="btn btn-primary">
            <Zap size={16} />
            New Triage Assessment
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="loader">
          <div className="loader-spinner"></div>
          <span className="loader-text">Loading dashboard...</span>
        </div>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="stats-grid">
            <div className="stat-card total animate-fade-in" style={{ animationDelay: '0ms' }}>
              <div className="stat-card-header">
                <span className="stat-card-label">Total Assessments</span>
                <div className="stat-card-icon">
                  <Users size={20} />
                </div>
              </div>
              <div className="stat-card-value">{stats?.total || 0}</div>
            </div>

            <div className="stat-card high animate-fade-in" style={{ animationDelay: '100ms' }}>
              <div className="stat-card-header">
                <span className="stat-card-label">High Risk</span>
                <div className="stat-card-icon">
                  <AlertTriangle size={20} />
                </div>
              </div>
              <div className="stat-card-value">{stats?.high || 0}</div>
            </div>

            <div className="stat-card medium animate-fade-in" style={{ animationDelay: '200ms' }}>
              <div className="stat-card-header">
                <span className="stat-card-label">Medium Risk</span>
                <div className="stat-card-icon">
                  <AlertCircle size={20} />
                </div>
              </div>
              <div className="stat-card-value">{stats?.medium || 0}</div>
            </div>

            <div className="stat-card low animate-fade-in" style={{ animationDelay: '300ms' }}>
              <div className="stat-card-header">
                <span className="stat-card-label">Low Risk</span>
                <div className="stat-card-icon">
                  <CheckCircle size={20} />
                </div>
              </div>
              <div className="stat-card-value">{stats?.low || 0}</div>
            </div>
          </div>

          {/* Content Grid */}
          <div className="two-col-grid">
            {/* Recent Assessments */}
            <div className="card animate-fade-in" style={{ animationDelay: '400ms' }}>
              <div className="card-header">
                <div>
                  <h3 className="card-title">Recent Assessments</h3>
                  <p className="card-subtitle">Latest patient triage results</p>
                </div>
                <Link href="/records" className="btn btn-ghost btn-sm">
                  View All <ArrowRight size={14} />
                </Link>
              </div>

              {recentRecords.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">📋</div>
                  <h3>No Assessments Yet</h3>
                  <p>Start your first triage assessment to see patient data here.</p>
                  <Link href="/triage" className="btn btn-primary btn-sm" style={{ marginTop: '16px' }}>
                    <Zap size={14} /> Start Assessment
                  </Link>
                </div>
              ) : (
                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Patient</th>
                        <th>Risk</th>
                        <th>Department</th>
                        <th>Priority</th>
                        <th>Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentRecords.map((record, idx) => (
                        <tr key={record.id} className="animate-slide-in-up" style={{ animationDelay: `${idx * 80}ms` }}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <div style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '50%',
                                background: 'var(--gradient-primary)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '13px',
                                fontWeight: 700,
                                color: 'white',
                              }}>
                                {record.patient_id.slice(-2)}
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
                          <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                            {record.recommended_department}
                          </td>
                          <td>
                            <div className="priority-indicator">
                              <span className={`priority-dot p${record.priority_level}`}></span>
                              <span>P{record.priority_level}</span>
                            </div>
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '13px' }}>
                              <Clock size={13} />
                              {formatTime(record.created_at)}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Department Distribution & System Info */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Department Distribution */}
              <div className="card animate-fade-in" style={{ animationDelay: '500ms' }}>
                <div className="card-header">
                  <div>
                    <h3 className="card-title">Department Distribution</h3>
                    <p className="card-subtitle">Patient routing breakdown</p>
                  </div>
                </div>

                {stats?.departments && stats.departments.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {stats.departments.map((dept, idx) => {
                      const maxVal = Math.max(...stats.departments.map(d => d.value));
                      const percentage = maxVal > 0 ? (dept.value / (stats.total || 1)) * 100 : 0;
                      const colors = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#f43f5e', '#8b5cf6', '#ec4899'];
                      return (
                        <div key={dept.name}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                            <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>
                              {dept.name}
                            </span>
                            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                              {dept.value} ({percentage.toFixed(0)}%)
                            </span>
                          </div>
                          <div className="progress-bar">
                            <div
                              className="progress-fill"
                              style={{
                                width: `${percentage}%`,
                                background: colors[idx % colors.length],
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>No department data available.</p>
                )}
              </div>

              {/* System Status */}
              <div className="card animate-fade-in" style={{ animationDelay: '600ms' }}>
                <div className="card-header">
                  <div>
                    <h3 className="card-title">System Status</h3>
                    <p className="card-subtitle">AI engine performance</p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span className="priority-dot p3"></span>
                    <span style={{ fontSize: '13px', color: 'var(--risk-low)', fontWeight: 600 }}>Online</span>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <HeartPulse size={16} style={{ color: 'var(--accent-primary-light)' }} />
                      <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Triage Engine</span>
                    </div>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--risk-low)' }}>Active</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Activity size={16} style={{ color: 'var(--accent-primary-light)' }} />
                      <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Avg Confidence</span>
                    </div>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--accent-primary-light)' }}>
                      {stats?.averageConfidence || 0}%
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <TrendingUp size={16} style={{ color: 'var(--accent-primary-light)' }} />
                      <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Processing</span>
                    </div>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--risk-low)' }}>Real-time</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </AppShell>
  );
}
