'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import api from '@/lib/api';
import type { ApiResponse } from '@/lib/types';
import { Loader2, Zap, Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react';

function ResetPasswordContent() {
    const searchParams = useSearchParams();
    const emailFromUrl = searchParams.get('email') || '';
    const [email, setEmail] = useState(emailFromUrl);
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        if (emailFromUrl) setEmail(emailFromUrl);
    }, [emailFromUrl]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!email.trim()) {
            setError('Email is required');
            return;
        }
        if (!otp.trim()) {
            setError('OTP is required');
            return;
        }
        if (newPassword.length < 4) {
            setError('Password must be at least 4 characters');
            return;
        }
        if (newPassword !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }
        setIsSubmitting(true);
        try {
            await api.post<ApiResponse<void>>('/api/auth/reset-password', {
                email: email.trim(),
                otp: otp.trim(),
                newPassword,
            });
            setSuccess(true);
        } catch (err: unknown) {
            const msg =
                err && typeof err === 'object' && 'response' in err
                    ? (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Failed to reset password.'
                    : 'Network error. Please try again.';
            setError(msg);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (success) {
        return (
            <div className="login-bg">
                <div
                    style={{
                        position: 'relative',
                        zIndex: 10,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minHeight: '100vh',
                        padding: 24,
                    }}
                >
                    <div className="animate-fade-in-up glass-card" style={{ padding: 40, maxWidth: 400, textAlign: 'center' }}>
                        <div
                            style={{
                                width: 64,
                                height: 64,
                                borderRadius: 16,
                                background: 'rgba(16, 185, 129, 0.15)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto 20px',
                                color: '#10b981',
                            }}
                        >
                            <Lock size={32} />
                        </div>
                        <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 12 }}>
                            Password reset
                        </h1>
                        <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 24 }}>
                            Your password has been updated. You can now sign in with your new password.
                        </p>
                        <Link href="/login" className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 24px' }}>
                            <ArrowLeft size={18} /> Sign in
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="login-bg">
            <div
                style={{
                    position: 'absolute',
                    top: '15%',
                    left: '10%',
                    width: 300,
                    height: 300,
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(6,182,212,0.06), transparent 70%)',
                    filter: 'blur(40px)',
                    animation: 'pulse-soft 8s ease-in-out infinite',
                }}
            />
            <div
                style={{
                    position: 'absolute',
                    bottom: '10%',
                    right: '15%',
                    width: 400,
                    height: 400,
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(139,92,246,0.05), transparent 70%)',
                    filter: 'blur(50px)',
                    animation: 'pulse-soft 10s ease-in-out infinite 2s',
                }}
            />

            <div
                style={{
                    position: 'relative',
                    zIndex: 10,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '100vh',
                    padding: 24,
                }}
            >
                <div className="animate-fade-in-up" style={{ width: '100%', maxWidth: 440 }}>
                    <div style={{ textAlign: 'center', marginBottom: 40 }}>
                        <div
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: 64,
                                height: 64,
                                borderRadius: 16,
                                background: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
                                marginBottom: 20,
                                boxShadow: '0 8px 32px rgba(6,182,212,0.3)',
                            }}
                        >
                            <Zap size={32} color="white" />
                        </div>
                        <h1 style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8, letterSpacing: '-0.02em' }}>
                            Set new password
                        </h1>
                        <p style={{ fontSize: 15, color: 'var(--text-muted)', margin: 0 }}>
                            Enter the OTP we sent to your email and choose a new password
                        </p>
                    </div>

                    <div className="glass-card" style={{ padding: '36px 32px' }}>
                        <form onSubmit={handleSubmit}>
                            {error && (
                                <div
                                    style={{
                                        padding: '12px 16px',
                                        borderRadius: 'var(--radius-md)',
                                        background: 'rgba(239, 68, 68, 0.1)',
                                        border: '1px solid rgba(239, 68, 68, 0.2)',
                                        color: '#f87171',
                                        fontSize: 14,
                                        marginBottom: 20,
                                    }}
                                >
                                    {error}
                                </div>
                            )}
                            <div style={{ marginBottom: 16 }}>
                                <label htmlFor="email" style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>
                                    EMAIL
                                </label>
                                <input
                                    id="email"
                                    type="email"
                                    className="input-field"
                                    placeholder="Email you used to request OTP"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    style={{ width: '100%' }}
                                />
                            </div>
                            <div style={{ marginBottom: 16 }}>
                                <label htmlFor="otp" style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>
                                    OTP
                                </label>
                                <input
                                    id="otp"
                                    type="text"
                                    inputMode="numeric"
                                    autoComplete="one-time-code"
                                    className="input-field"
                                    placeholder="6-digit code from email"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                    maxLength={6}
                                    style={{ width: '100%', letterSpacing: 4, fontVariantNumeric: 'tabular-nums' }}
                                />
                            </div>
                            <div style={{ marginBottom: 20 }}>
                                <label
                                    htmlFor="newPassword"
                                    style={{
                                        display: 'block',
                                        fontSize: 13,
                                        fontWeight: 600,
                                        color: 'var(--text-secondary)',
                                        marginBottom: 8,
                                    }}
                                >
                                    NEW PASSWORD
                                </label>
                                    <div style={{ position: 'relative' }}>
                                        <Lock size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                        <input
                                            id="newPassword"
                                            type={showPassword ? 'text' : 'password'}
                                            className="input-field"
                                            placeholder="At least 4 characters"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            required
                                            minLength={4}
                                            autoComplete="new-password"
                                            style={{ paddingLeft: 44, paddingRight: 48, width: '100%' }}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            style={{
                                                position: 'absolute',
                                                right: 14,
                                                top: '50%',
                                                transform: 'translateY(-50%)',
                                                background: 'none',
                                                border: 'none',
                                                cursor: 'pointer',
                                                color: 'var(--text-muted)',
                                                padding: 4,
                                            }}
                                        >
                                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </div>
                                <div style={{ marginBottom: 28 }}>
                                    <label
                                        htmlFor="confirmPassword"
                                        style={{
                                            display: 'block',
                                            fontSize: 13,
                                            fontWeight: 600,
                                            color: 'var(--text-secondary)',
                                            marginBottom: 8,
                                        }}
                                    >
                                        CONFIRM PASSWORD
                                    </label>
                                    <input
                                        id="confirmPassword"
                                        type={showPassword ? 'text' : 'password'}
                                        className="input-field"
                                        placeholder="Re-enter new password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        required
                                        minLength={4}
                                        autoComplete="new-password"
                                        style={{ paddingLeft: 44, width: '100%' }}
                                    />
                                </div>
                                <button
                                    type="submit"
                                    className="btn-primary"
                                    disabled={isSubmitting || !email.trim() || !otp.trim() || !newPassword || !confirmPassword}
                                    style={{ width: '100%', height: 52, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 size={18} className="animate-spin-slow" />
                                            Resetting...
                                        </>
                                    ) : (
                                        'Reset password'
                                    )}
                                </button>
                            </form>

                        <p style={{ textAlign: 'center', marginTop: 16, fontSize: 13, color: 'var(--text-muted)' }}>
                            No OTP? <Link href="/forgot-password" style={{ color: 'var(--text-secondary)' }}>Request a new one</Link>
                        </p>
                        <Link
                            href="/login"
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 8,
                                marginTop: 24,
                                fontSize: 14,
                                color: 'var(--text-muted)',
                                textDecoration: 'none',
                            }}
                        >
                            <ArrowLeft size={16} /> Back to sign in
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense
            fallback={
                <div className="login-bg" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
                    <Loader2 size={40} className="animate-spin-slow" color="var(--accent-cyan)" />
                </div>
            }
        >
            <ResetPasswordContent />
        </Suspense>
    );
}
