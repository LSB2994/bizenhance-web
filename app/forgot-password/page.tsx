'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import type { ApiResponse, ForgotPasswordPayload, VerifyResetOtpRequest } from '@/lib/types';
import { Loader2, Zap, Mail, ArrowLeft, Lock, Eye, EyeOff, X } from 'lucide-react';

type ModalStep = 'otp' | 'password' | 'success';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [sent, setSent] = useState(false);
    const [showModal, setShowModal] = useState(false);

    // Modal state: OTP step → password step → success
    const [modalStep, setModalStep] = useState<ModalStep>('otp');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [modalError, setModalError] = useState('');
    const [isVerifyOtp, setIsVerifyOtp] = useState(false);
    const [isResendOtp, setIsResendOtp] = useState(false);
    const [isResetPassword, setIsResetPassword] = useState(false);
    const [resendMessage, setResendMessage] = useState('');

    const handleSubmitEmail = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);
        setSent(false);
        try {
            await api.post<ApiResponse<ForgotPasswordPayload>>('/api/auth/forgot-password', { email: email.trim() });
            setSent(true);
            setShowModal(true);
            setModalStep('otp');
            setOtp('');
            setModalError('');
            setResendMessage('');
        } catch (err: unknown) {
            const msg =
                err && typeof err === 'object' && 'response' in err
                    ? (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Something went wrong.'
                    : 'Network error. Please try again.';
            setError(msg);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleResendOtp = async () => {
        setModalError('');
        setResendMessage('');
        setIsResendOtp(true);
        try {
            await api.post<ApiResponse<ForgotPasswordPayload>>('/api/auth/forgot-password', { email: email.trim() });
            setResendMessage('OTP sent again. Check your inbox.');
        } catch {
            setModalError('Failed to resend OTP. Try again.');
        } finally {
            setIsResendOtp(false);
        }
    };

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setModalError('');
        if (!otp.trim()) {
            setModalError('Enter the 6-digit code from your email.');
            return;
        }
        setIsVerifyOtp(true);
        try {
            await api.post<ApiResponse<void>>('/api/auth/verify-reset-otp', {
                email: email.trim(),
                otp: otp.trim(),
            } as VerifyResetOtpRequest);
            setModalStep('password');
            setNewPassword('');
            setConfirmPassword('');
            setModalError('');
        } catch (err: unknown) {
            const msg =
                err && typeof err === 'object' && 'response' in err
                    ? (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Invalid or expired OTP.'
                    : 'Invalid or expired OTP.';
            setModalError(msg);
        } finally {
            setIsVerifyOtp(false);
        }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setModalError('');
        if (newPassword.length < 4) {
            setModalError('Password must be at least 4 characters.');
            return;
        }
        if (newPassword !== confirmPassword) {
            setModalError('Passwords do not match.');
            return;
        }
        setIsResetPassword(true);
        try {
            await api.post<ApiResponse<void>>('/api/auth/reset-password', {
                email: email.trim(),
                otp: otp.trim(),
                newPassword,
            });
            setModalStep('success');
        } catch (err: unknown) {
            const msg =
                err && typeof err === 'object' && 'response' in err
                    ? (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Failed to reset password.'
                    : 'Failed to reset password.';
            setModalError(msg);
        } finally {
            setIsResetPassword(false);
        }
    };

    const closeModal = () => {
        setShowModal(false);
        setModalStep('otp');
        setOtp('');
        setModalError('');
        setResendMessage('');
    };

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
                            Forgot password
                        </h1>
                        <p style={{ fontSize: 15, color: 'var(--text-muted)', margin: 0 }}>
                            Enter your email and we&apos;ll send an OTP to your inbox
                        </p>
                    </div>

                    <div className="glass-card" style={{ padding: '36px 32px' }}>
                        {sent && !error ? (
                            <div style={{ textAlign: 'center' }}>
                                <div
                                    style={{
                                        padding: '16px 20px',
                                        borderRadius: 'var(--radius-md)',
                                        background: 'rgba(16, 185, 129, 0.1)',
                                        border: '1px solid rgba(16, 185, 129, 0.2)',
                                        color: '#10b981',
                                        fontSize: 14,
                                        marginBottom: 20,
                                    }}
                                >
                                    If an account exists with this email, we&apos;ve sent an OTP. Check your inbox (and spam folder).
                                </div>
                                <button
                                    type="button"
                                    className="btn-primary"
                                    style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 24px' }}
                                    onClick={() => {
                                        setShowModal(true);
                                        setModalStep('otp');
                                        setOtp('');
                                        setModalError('');
                                    }}
                                >
                                    Enter OTP
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmitEmail}>
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
                                <div style={{ marginBottom: 24 }}>
                                    <label
                                        htmlFor="email"
                                        style={{
                                            display: 'block',
                                            fontSize: 13,
                                            fontWeight: 600,
                                            color: 'var(--text-secondary)',
                                            marginBottom: 8,
                                            letterSpacing: '0.02em',
                                        }}
                                    >
                                        EMAIL
                                    </label>
                                    <div style={{ position: 'relative' }}>
                                        <Mail
                                            size={18}
                                            style={{
                                                position: 'absolute',
                                                left: 14,
                                                top: '50%',
                                                transform: 'translateY(-50%)',
                                                color: 'var(--text-muted)',
                                            }}
                                        />
                                        <input
                                            id="email"
                                            type="email"
                                            className="input-field"
                                            placeholder="Enter your email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                            autoComplete="email"
                                            autoFocus
                                            style={{ paddingLeft: 44, width: '100%' }}
                                        />
                                    </div>
                                </div>
                                <button
                                    type="submit"
                                    className="btn-primary"
                                    disabled={isSubmitting || !email.trim()}
                                    style={{ width: '100%', height: 52, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 size={18} className="animate-spin-slow" />
                                            Sending...
                                        </>
                                    ) : (
                                        'Send OTP'
                                    )}
                                </button>
                            </form>
                        )}

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

            {/* Popup: OTP → New password → Success */}
            {showModal && (
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="otp-modal-title"
                    style={{
                        position: 'fixed',
                        inset: 0,
                        zIndex: 50,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: 24,
                        background: 'rgba(0,0,0,0.6)',
                        backdropFilter: 'blur(4px)',
                    }}
                    onClick={(e) => e.target === e.currentTarget && closeModal()}
                >
                    <div
                        className="glass-card animate-fade-in-up"
                        style={{
                            width: '100%',
                            maxWidth: 400,
                            padding: 28,
                            position: 'relative',
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            type="button"
                            onClick={closeModal}
                            style={{
                                position: 'absolute',
                                top: 16,
                                right: 16,
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                color: 'var(--text-muted)',
                                padding: 4,
                            }}
                            aria-label="Close"
                        >
                            <X size={20} />
                        </button>

                        {modalStep === 'otp' && (
                            <>
                                <h2 id="otp-modal-title" style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>
                                    Enter OTP
                                </h2>
                                <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 20 }}>
                                    We sent a 6-digit code to <strong style={{ color: 'var(--text-secondary)' }}>{email}</strong>
                                </p>
                                {resendMessage && (
                                    <div style={{ padding: '10px 14px', borderRadius: 'var(--radius-md)', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', fontSize: 13, marginBottom: 16 }}>
                                        {resendMessage}
                                    </div>
                                )}
                                {modalError && (
                                    <div style={{ padding: '10px 14px', borderRadius: 'var(--radius-md)', background: 'rgba(239, 68, 68, 0.1)', color: '#f87171', fontSize: 13, marginBottom: 16 }}>
                                        {modalError}
                                    </div>
                                )}
                                <form onSubmit={handleVerifyOtp}>
                                    <div style={{ marginBottom: 20 }}>
                                        <label htmlFor="modal-otp" style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>
                                            OTP
                                        </label>
                                        <input
                                            id="modal-otp"
                                            type="text"
                                            inputMode="numeric"
                                            autoComplete="one-time-code"
                                            className="input-field"
                                            placeholder="000000"
                                            value={otp}
                                            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                            maxLength={6}
                                            style={{ width: '100%', letterSpacing: 6, fontVariantNumeric: 'tabular-nums' }}
                                        />
                                    </div>
                                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                                        <button
                                            type="button"
                                            onClick={handleResendOtp}
                                            disabled={isResendOtp}
                                            style={{
                                                flex: 1,
                                                minWidth: 100,
                                                padding: '12px 16px',
                                                borderRadius: 'var(--radius-md)',
                                                border: '1px solid var(--border)',
                                                background: 'var(--bg-secondary)',
                                                color: 'var(--text-secondary)',
                                                fontSize: 14,
                                                cursor: isResendOtp ? 'not-allowed' : 'pointer',
                                            }}
                                        >
                                            {isResendOtp ? (
                                                <>
                                                    <Loader2 size={16} className="animate-spin-slow" style={{ display: 'inline-block', verticalAlign: 'middle' }} />
                                                    {' Resending...'}
                                                </>
                                            ) : (
                                                'Resend OTP'
                                            )}
                                        </button>
                                        <button
                                            type="submit"
                                            className="btn-primary"
                                            disabled={isVerifyOtp || otp.length !== 6}
                                            style={{ flex: 1, minWidth: 100, padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                                        >
                                            {isVerifyOtp ? <Loader2 size={18} className="animate-spin-slow" /> : 'Continue'}
                                        </button>
                                    </div>
                                </form>
                            </>
                        )}

                        {modalStep === 'password' && (
                            <>
                                <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>
                                    Set new password
                                </h2>
                                <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 20 }}>
                                    Choose a new password for your account.
                                </p>
                                {modalError && (
                                    <div style={{ padding: '10px 14px', borderRadius: 'var(--radius-md)', background: 'rgba(239, 68, 68, 0.1)', color: '#f87171', fontSize: 13, marginBottom: 16 }}>
                                        {modalError}
                                    </div>
                                )}
                                <form onSubmit={handleResetPassword}>
                                    <div style={{ marginBottom: 16 }}>
                                        <label htmlFor="modal-new-password" style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>
                                            NEW PASSWORD
                                        </label>
                                        <div style={{ position: 'relative' }}>
                                            <Lock size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                            <input
                                                id="modal-new-password"
                                                type={showPassword ? 'text' : 'password'}
                                                className="input-field"
                                                placeholder="At least 4 characters"
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                                required
                                                minLength={4}
                                                autoComplete="new-password"
                                                style={{ paddingLeft: 44, paddingRight: 44, width: '100%' }}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}
                                            >
                                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                            </button>
                                        </div>
                                    </div>
                                    <div style={{ marginBottom: 24 }}>
                                        <label htmlFor="modal-confirm-password" style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>
                                            CONFIRM PASSWORD
                                        </label>
                                        <input
                                            id="modal-confirm-password"
                                            type={showPassword ? 'text' : 'password'}
                                            className="input-field"
                                            placeholder="Re-enter new password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            required
                                            minLength={4}
                                            autoComplete="new-password"
                                            style={{ width: '100%' }}
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        className="btn-primary"
                                        disabled={isResetPassword || !newPassword || !confirmPassword || newPassword.length < 4}
                                        style={{ width: '100%', height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                                    >
                                        {isResetPassword ? <Loader2 size={18} className="animate-spin-slow" /> : 'Reset password'}
                                    </button>
                                </form>
                            </>
                        )}

                        {modalStep === 'success' && (
                            <div style={{ textAlign: 'center', padding: '8px 0' }}>
                                <div style={{ width: 56, height: 56, borderRadius: 14, background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: '#10b981' }}>
                                    <Lock size={28} />
                                </div>
                                <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>
                                    Password reset
                                </h2>
                                <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 24 }}>
                                    Your password has been updated. You can now sign in with your new password.
                                </p>
                                <Link href="/login" className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 24px' }} onClick={closeModal}>
                                    <ArrowLeft size={18} /> Sign in
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
