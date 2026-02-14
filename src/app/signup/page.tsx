'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import {
    Lock,
    Mail,
    Loader2,
    ShieldCheck,
    Stethoscope,
    User,
    UserPlus,
    CheckCircle2,
    AlertTriangle
} from 'lucide-react';

export default function SignupPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [medicalId, setMedicalId] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const router = useRouter();

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const { data, error: authError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: fullName,
                        medical_id: medicalId,
                    }
                }
            });

            if (authError) throw authError;

            if (data?.user?.identities?.length === 0) {
                setError('An account with this email already exists.');
                return;
            }

            // If session was returned (no email confirm), go to dashboard
            if (data?.session) {
                router.push('/dashboard');
                return;
            }

            setSuccess(true);
            setTimeout(() => router.push('/login'), 3000);
        } catch (err: any) {
            setError(err.message || 'Error creating clinician profile');
        } finally {
            setLoading(false);
        }
    };

    const inputStyle = {
        width: '100%',
        background: '#1e293b',
        border: '2px solid rgba(100,116,139,0.4)',
        borderRadius: 12,
        padding: '14px 14px 14px 48px',
        color: 'white',
        fontSize: 14,
        outline: 'none',
        fontFamily: 'inherit',
        boxSizing: 'border-box' as const,
    };

    const iconStyle = {
        position: 'absolute' as const,
        left: 16,
        top: '50%',
        transform: 'translateY(-50%)',
        width: 18,
        height: 18,
        color: '#64748b',
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
        }}>
            {/* Animated Background */}
            <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
                <motion.div
                    animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.1, 0.2, 0.1],
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
                        opacity: [0.08, 0.15, 0.08],
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
            </div>

            <div style={{ width: '100%', maxWidth: 550, position: 'relative', zIndex: 10 }}>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <div style={{
                        background: '#111827',
                        border: '1px solid rgba(71,85,105,0.5)',
                        borderRadius: 24,
                        padding: '40px',
                        boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
                    }}>
                        {/* Header */}
                        <div style={{ textAlign: 'center', marginBottom: 32 }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 16 }}>
                                <div style={{
                                    width: 48,
                                    height: 48,
                                    borderRadius: 16,
                                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    boxShadow: '0 8px 24px rgba(99,102,241,0.3)',
                                }}>
                                    <Stethoscope style={{ width: 24, height: 24, color: 'white' }} />
                                </div>
                                <span style={{ fontSize: 24, fontWeight: 900, color: 'white', letterSpacing: '-0.02em' }}>TriageAI</span>
                            </div>
                            <h2 style={{ fontSize: 24, fontWeight: 900, color: 'white', marginBottom: 4 }}>Create Clinician ID</h2>
                            <p style={{ color: '#94a3b8', fontSize: 14 }}>Join the clinical decision support network.</p>
                        </div>

                        <AnimatePresence mode="wait">
                            {!success ? (
                                <motion.form
                                    key="form"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    onSubmit={handleSignup}
                                    style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
                                >
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                            <label style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', marginLeft: 4 }}>Full Name</label>
                                            <div style={{ position: 'relative' }}>
                                                <User style={iconStyle} />
                                                <input
                                                    type="text"
                                                    required
                                                    value={fullName}
                                                    onChange={(e) => setFullName(e.target.value)}
                                                    style={inputStyle}
                                                    placeholder="Dr. Akhil"
                                                />
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                            <label style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', marginLeft: 4 }}>Medical ID</label>
                                            <div style={{ position: 'relative' }}>
                                                <ShieldCheck style={iconStyle} />
                                                <input
                                                    type="text"
                                                    required
                                                    value={medicalId}
                                                    onChange={(e) => setMedicalId(e.target.value)}
                                                    style={inputStyle}
                                                    placeholder="MD-2026"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                        <label style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', marginLeft: 4 }}>Work Email</label>
                                        <div style={{ position: 'relative' }}>
                                            <Mail style={iconStyle} />
                                            <input
                                                type="email"
                                                required
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                style={inputStyle}
                                                placeholder="doctor@hospital.ai"
                                            />
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                        <label style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', marginLeft: 4 }}>Password</label>
                                        <div style={{ position: 'relative' }}>
                                            <Lock style={iconStyle} />
                                            <input
                                                type="password"
                                                required
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                style={inputStyle}
                                                placeholder="••••••••"
                                            />
                                        </div>
                                    </div>

                                    {error && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            style={{
                                                padding: 14,
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
                                            <AlertTriangle style={{ width: 14, height: 14, flexShrink: 0 }} />
                                            {error}
                                        </motion.div>
                                    )}

                                    <button
                                        type="submit"
                                        disabled={loading}
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
                                            marginTop: 8,
                                        }}
                                    >
                                        {loading ? (
                                            <Loader2 style={{ width: 20, height: 20, animation: 'spin 1s linear infinite' }} />
                                        ) : (
                                            <>
                                                <UserPlus style={{ width: 16, height: 16 }} />
                                                <span>Create Profile</span>
                                            </>
                                        )}
                                    </button>
                                </motion.form>
                            ) : (
                                <motion.div
                                    key="success"
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    style={{ textAlign: 'center', padding: '40px 0', display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center' }}
                                >
                                    <div style={{
                                        width: 64,
                                        height: 64,
                                        borderRadius: '50%',
                                        background: 'rgba(16,185,129,0.1)',
                                        border: '1px solid rgba(16,185,129,0.2)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}>
                                        <CheckCircle2 style={{ width: 32, height: 32, color: '#10b981' }} />
                                    </div>
                                    <h3 style={{ fontSize: 20, fontWeight: 700, color: 'white' }}>Profile Created!</h3>
                                    <p style={{ color: '#94a3b8', fontSize: 14 }}>
                                        Verification pending. Redirecting to secure login...
                                    </p>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <p style={{ textAlign: 'center', color: '#64748b', fontSize: 14, marginTop: 32 }}>
                            Already have an ID?{' '}
                            <Link href="/login" style={{ color: '#818cf8', fontWeight: 700, textDecoration: 'none' }}>
                                Sign in →
                            </Link>
                        </p>
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
