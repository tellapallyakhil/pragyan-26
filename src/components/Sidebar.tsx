'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
    LayoutDashboard,
    UserPlus,
    ClipboardList,
    Activity,
    Settings,
    ShieldCheck,
    HeartPulse,
    LogOut,
    User,
    ChevronUp
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

const navItems = [
    { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', badge: null },
    { href: '/triage', icon: UserPlus, label: 'New Triage', badge: null },
    { href: '/records', icon: ClipboardList, label: 'Patient Records', badge: null },
    { href: '/analytics', icon: Activity, label: 'Analytics', badge: null },
];

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
    const pathname = usePathname();
    const router = useRouter();
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        // No auth checks — instant render with demo user
        setUser({ email: 'clinician@triageai.health' });
    }, []);

    const handleLogout = () => {
        router.push('/login');
    };

    return (
        <>
            <div
                className={`sidebar-overlay ${isOpen ? 'open' : ''}`}
                onClick={onClose}
            />
            <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
                {/* Logo */}
                <div className="sidebar-logo">
                    <div className="sidebar-logo-icon">
                        <HeartPulse size={22} color="white" />
                    </div>
                    <div className="sidebar-logo-text">
                        <h1>TriageAI</h1>
                        <p>Decision Support</p>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="sidebar-nav">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`nav-item ${isActive ? 'active' : ''}`}
                                onClick={onClose}
                            >
                                <Icon className="nav-icon" size={20} />
                                <span>{item.label}</span>
                                {item.badge && (
                                    <span className="nav-badge">{item.badge}</span>
                                )}
                            </Link>
                        );
                    })}

                    <div style={{ flex: 1 }} />

                    <Link
                        href="/settings"
                        className={`nav-item ${pathname === '/settings' ? 'active' : ''}`}
                        onClick={onClose}
                    >
                        <Settings className="nav-icon" size={20} />
                        <span>Settings</span>
                    </Link>

                    {user && (
                        <button
                            onClick={handleLogout}
                            className="nav-item"
                            style={{
                                marginTop: '4px',
                                background: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                width: '100%',
                                textAlign: 'left',
                                color: 'var(--risk-high)'
                            }}
                        >
                            <LogOut className="nav-icon" size={20} />
                            <span>Logout</span>
                        </button>
                    )}
                </nav>

                {/* Footer / Profile */}
                <div className="sidebar-footer">
                    {user ? (
                        <div style={{
                            padding: '12px',
                            background: 'rgba(255,255,255,0.03)',
                            borderRadius: '12px',
                            border: '1px solid rgba(255,255,255,0.05)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            marginBottom: '16px'
                        }}>
                            <div style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '8px',
                                background: 'var(--gradient-primary)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white',
                                fontWeight: 'bold',
                                fontSize: '14px'
                            }}>
                                {user.email?.charAt(0).toUpperCase()}
                            </div>
                            <div style={{ overflow: 'hidden' }}>
                                <p style={{ fontSize: '12px', fontWeight: 'bold', color: 'white', margin: 0 }}>Clinician</p>
                                <p style={{ fontSize: '10px', color: 'var(--text-muted)', margin: 0, textOverflow: 'ellipsis', overflow: 'hidden' }}>
                                    {user.email}
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="sidebar-footer-card">
                            <h3>
                                <ShieldCheck size={14} />
                                Clinical Safety
                            </h3>
                            <p>
                                Triage-level assessment only. Always requires physician evaluation.
                            </p>
                        </div>
                    )}
                </div>
            </aside>
        </>
    );
}
