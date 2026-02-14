'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Lock,
    Mail,
    Loader2,
    ShieldCheck,
    ArrowRight,
    Stethoscope,
    Sparkles,
    Zap,
    Heart,
    Brain,
    AlertTriangle
} from 'lucide-react';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        // Direct navigation — no auth required
        setTimeout(() => {
            router.push('/dashboard');
        }, 400);
    };

    const handleDemoLogin = () => {
        // Instant redirect to dashboard — no auth overhead
        router.push('/dashboard');
    };

    return (
        <div style={{
            minHeight: '100vh',
            background: '#030712',
            position: 'relative',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
        }}>
            {/* Animated Background Orbs */}
            <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
                <motion.div
                    animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.15, 0.25, 0.15],
                        x: [0, 50, 0],
                        y: [0, -30, 0]
                    }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    style={{
                        position: 'absolute',
                        top: '-20%',
                        left: '-10%',
                        width: '60%',
                        height: '60%',
                        background: '#4f46e5',
                        borderRadius: '50%',
                        filter: 'blur(150px)',
                    }}
                />
                <motion.div
                    animate={{
                        scale: [1, 1.3, 1],
                        opacity: [0.1, 0.2, 0.1],
                        x: [0, -40, 0],
                        y: [0, 40, 0]
                    }}
                    transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                    style={{
                        position: 'absolute',
                        bottom: '-20%',
                        right: '-10%',
                        width: '50%',
                        height: '50%',
                        background: '#059669',
                        borderRadius: '50%',
                        filter: 'blur(150px)',
                    }}
                />
                <motion.div
                    animate={{
                        scale: [1, 1.15, 1],
                        opacity: [0.08, 0.15, 0.08],
                    }}
                    transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                    style={{
                        position: 'absolute',
                        top: '30%',
                        right: '20%',
                        width: '30%',
                        height: '30%',
                        background: '#7c3aed',
                        borderRadius: '50%',
                        filter: 'blur(120px)',
                    }}
                />
            </div>

            <div style={{
                width: '100%',
                maxWidth: '1100px',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '64px',
                alignItems: 'center',
                position: 'relative',
                zIndex: 10,
            }}>
                {/* Left Side: Branding */}
                <motion.div
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                            width: 56,
                            height: 56,
                            borderRadius: 16,
                            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 8px 32px rgba(99, 102, 241, 0.3)',
                        }}>
                            <Stethoscope style={{ width: 28, height: 28, color: 'white' }} />
                        </div>
                        <span style={{
                            fontSize: 30,
                            fontWeight: 900,
                            color: 'white',
                            letterSpacing: '-0.02em',
                        }}>
                            Triage<span style={{
                                background: 'linear-gradient(135deg, #818cf8, #a78bfa)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                            }}>AI</span>
                        </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <h1 style={{
                            fontSize: 48,
                            fontWeight: 900,
                            color: 'white',
                            lineHeight: 1.1,
                            letterSpacing: '-0.03em',
                        }}>
                            Clinical Decisions,{' '}
                            <span style={{
                                background: 'linear-gradient(135deg, #818cf8, #a78bfa, #34d399)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                            }}>
                                Powered by AI.
                            </span>
                        </h1>
                        <p style={{
                            fontSize: 18,
                            color: '#94a3b8',
                            lineHeight: 1.6,
                            maxWidth: 440,
                        }}>
                            Next-gen clinical decision support with real-time AI risk classification, voice-powered symptom capture, and intelligent department routing.
                        </p>
                    </div>

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '16px',
                    }}>
                        {[
                            { icon: Zap, label: 'Real-time Analysis', desc: '<10s triage', color: '#f59e0b' },
                            { icon: ShieldCheck, label: 'HIPAA Compliant', desc: 'End-to-end encryption', color: '#10b981' },
                            { icon: Brain, label: 'Hybrid AI Engine', desc: 'Rules + LLM', color: '#8b5cf6' },
                            { icon: Heart, label: 'Dept Routing', desc: '6 specialties', color: '#f43f5e' },
                        ].map((item, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 + i * 0.1 }}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    padding: '16px',
                                    borderRadius: 16,
                                    background: 'rgba(255,255,255,0.03)',
                                    border: '1px solid rgba(255,255,255,0.06)',
                                }}
                            >
                                <div style={{
                                    width: 40,
                                    height: 40,
                                    borderRadius: 12,
                                    background: `${item.color}22`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0,
                                }}>
                                    <item.icon style={{ width: 20, height: 20, color: item.color }} />
                                </div>
                                <div>
                                    <span style={{ fontSize: 13, fontWeight: 700, color: 'white', display: 'block' }}>{item.label}</span>
                                    <span style={{ fontSize: 11, color: '#64748b' }}>{item.desc}</span>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>

                {/* Right Side: Login Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                >
                    <div style={{
                        background: '#111827',
                        border: '1px solid rgba(71,85,105,0.5)',
                        borderRadius: 24,
                        padding: '40px',
                        boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
                    }}>
                        <div style={{ marginBottom: 32 }}>
                            <h2 style={{ fontSize: 24, fontWeight: 900, color: 'white', marginBottom: 4 }}>
                                Clinician Access
                            </h2>
                            <p style={{ color: '#94a3b8', fontSize: 14 }}>
                                Enter your credentials to access the command center.
                            </p>
                        </div>

                        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            {/* Email Field */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                <label style={{
                                    fontSize: 11,
                                    fontWeight: 700,
                                    color: '#94a3b8',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.1em',
                                    marginLeft: 4,
                                }}>Work Email</label>
                                <div style={{ position: 'relative' }}>
                                    <Mail style={{
                                        position: 'absolute',
                                        left: 16,
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        width: 18,
                                        height: 18,
                                        color: '#64748b',
                                    }} />
                                    <input
                                        type="email"
                                        id="login-email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        style={{
                                            width: '100%',
                                            background: '#1e293b',
                                            border: '2px solid rgba(100,116,139,0.4)',
                                            borderRadius: 12,
                                            padding: '14px 14px 14px 48px',
                                            color: 'white',
                                            fontSize: 14,
                                            outline: 'none',
                                            fontFamily: 'inherit',
                                            boxSizing: 'border-box',
                                        }}
                                        placeholder="doctor@hospital.ai"
                                        onFocus={(e) => {
                                            e.target.style.borderColor = '#6366f1';
                                            e.target.style.boxShadow = '0 0 0 4px rgba(99,102,241,0.15)';
                                        }}
                                        onBlur={(e) => {
                                            e.target.style.borderColor = 'rgba(100,116,139,0.4)';
                                            e.target.style.boxShadow = 'none';
                                        }}
                                    />
                                </div>
                            </div>

                            {/* Password Field */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                <label style={{
                                    fontSize: 11,
                                    fontWeight: 700,
                                    color: '#94a3b8',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.1em',
                                    marginLeft: 4,
                                }}>Password</label>
                                <div style={{ position: 'relative' }}>
                                    <Lock style={{
                                        position: 'absolute',
                                        left: 16,
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        width: 18,
                                        height: 18,
                                        color: '#64748b',
                                    }} />
                                    <input
                                        type="password"
                                        id="login-password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        style={{
                                            width: '100%',
                                            background: '#1e293b',
                                            border: '2px solid rgba(100,116,139,0.4)',
                                            borderRadius: 12,
                                            padding: '14px 14px 14px 48px',
                                            color: 'white',
                                            fontSize: 14,
                                            outline: 'none',
                                            fontFamily: 'inherit',
                                            boxSizing: 'border-box',
                                        }}
                                        placeholder="••••••••"
                                        onFocus={(e) => {
                                            e.target.style.borderColor = '#6366f1';
                                            e.target.style.boxShadow = '0 0 0 4px rgba(99,102,241,0.15)';
                                        }}
                                        onBlur={(e) => {
                                            e.target.style.borderColor = 'rgba(100,116,139,0.4)';
                                            e.target.style.boxShadow = 'none';
                                        }}
                                    />
                                </div>
                            </div>

                            {/* Error Display */}
                            <AnimatePresence>
                                {error && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        style={{
                                            padding: '14px',
                                            borderRadius: 12,
                                            background: 'rgba(244,63,94,0.08)',
                                            border: '1px solid rgba(244,63,94,0.25)',
                                            color: '#fb7185',
                                            fontSize: 13,
                                            fontWeight: 500,
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 8,
                                        }}
                                    >
                                        <AlertTriangle style={{ width: 16, height: 16, flexShrink: 0 }} />
                                        {error}
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Login Button */}
                            <button
                                type="submit"
                                disabled={loading}
                                id="login-submit"
                                style={{
                                    width: '100%',
                                    background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                                    color: 'white',
                                    fontWeight: 700,
                                    height: 48,
                                    borderRadius: 12,
                                    border: 'none',
                                    cursor: loading ? 'wait' : 'pointer',
                                    opacity: loading ? 0.5 : 1,
                                    boxShadow: '0 8px 24px rgba(99,102,241,0.25)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 8,
                                    fontSize: 14,
                                    fontFamily: 'inherit',
                                    transition: 'all 150ms ease',
                                }}
                            >
                                {loading ? (
                                    <Loader2 style={{ width: 20, height: 20, animation: 'spin 1s linear infinite' }} />
                                ) : (
                                    <>
                                        <span>Log in to Command Center</span>
                                        <ArrowRight style={{ width: 16, height: 16 }} />
                                    </>
                                )}
                            </button>
                        </form>

                        {/* Divider */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 16,
                            margin: '24px 0',
                        }}>
                            <div style={{ height: 1, flex: 1, background: '#334155' }} />
                            <span style={{ fontSize: 10, textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.15em', color: '#64748b' }}>
                                Quick Access
                            </span>
                            <div style={{ height: 1, flex: 1, background: '#334155' }} />
                        </div>

                        {/* Demo Login — Instant redirect */}
                        <button
                            onClick={handleDemoLogin}
                            id="demo-login-btn"
                            style={{
                                width: '100%',
                                padding: '14px 16px',
                                borderRadius: 12,
                                border: '2px dashed rgba(245,158,11,0.3)',
                                background: 'rgba(245,158,11,0.05)',
                                color: '#fcd34d',
                                fontWeight: 700,
                                fontSize: 14,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 8,
                                cursor: 'pointer',
                                fontFamily: 'inherit',
                                transition: 'all 150ms ease',
                            }}
                        >
                            <Sparkles style={{ width: 16, height: 16 }} />
                            Launch Demo Mode
                        </button>

                        {/* Register Link */}
                        <p style={{ textAlign: 'center', color: '#64748b', fontSize: 14, marginTop: 24 }}>
                            New clinician?{' '}
                            <Link href="/signup" style={{ color: '#818cf8', fontWeight: 700, textDecoration: 'none' }}>
                                Register ID →
                            </Link>
                        </p>

                        {/* Security Badge */}
                        <div style={{
                            marginTop: 24,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 8,
                            color: '#475569',
                            fontSize: 11,
                        }}>
                            <ShieldCheck style={{ width: 14, height: 14 }} />
                            <span>256-bit SSL • HIPAA Compliant • SOC 2 Type II</span>
                        </div>
                    </div>
                </motion.div>
            </div>

            <style jsx global>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}
