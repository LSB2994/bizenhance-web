'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';
import { Loader2, Zap, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
    const { login } = useAuth();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);

        try {
            await login(username, password);
        } catch (err: unknown) {
            const message =
                err && typeof err === 'object' && 'response' in err
                    ? (err as { response?: { data?: { message?: string } } }).response?.data?.message ||
                    'Invalid credentials'
                    : 'Network error. Please try again.';
            setError(message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="login-bg">
            {/* Background floating orbs */}
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

            {/* Login form */}
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
                <div
                    className="animate-fade-in-up"
                    style={{
                        width: '100%',
                        maxWidth: 440,
                    }}
                >
                    {/* Logo / Brand */}
                    <div
                        style={{
                            textAlign: 'center',
                            marginBottom: 40,
                        }}
                    >
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
                        <h1
                            style={{
                                fontSize: 28,
                                fontWeight: 700,
                                color: 'var(--text-primary)',
                                marginBottom: 8,
                                letterSpacing: '-0.02em',
                            }}
                        >
                            BizEnhance
                        </h1>
                        <p
                            style={{
                                fontSize: 15,
                                color: 'var(--text-muted)',
                                margin: 0,
                            }}
                        >
                            Sign in to your business dashboard
                        </p>
                    </div>

                    {/* Card */}
                    <div
                        className="glass-card"
                        style={{ padding: '36px 32px' }}
                    >
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
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 8,
                                    }}
                                >
                                    <span>⚠</span> {error}
                                </div>
                            )}

                            <div style={{ marginBottom: 20 }}>
                                <label
                                    htmlFor="username"
                                    style={{
                                        display: 'block',
                                        fontSize: 13,
                                        fontWeight: 600,
                                        color: 'var(--text-secondary)',
                                        marginBottom: 8,
                                        letterSpacing: '0.02em',
                                    }}
                                >
                                    USERNAME
                                </label>
                                <input
                                    id="username"
                                    type="text"
                                    className="input-field"
                                    placeholder="Enter your username"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    required
                                    autoComplete="username"
                                    autoFocus
                                />
                            </div>

                            <div style={{ marginBottom: 28 }}>
                                <label
                                    htmlFor="password"
                                    style={{
                                        display: 'block',
                                        fontSize: 13,
                                        fontWeight: 600,
                                        color: 'var(--text-secondary)',
                                        marginBottom: 8,
                                        letterSpacing: '0.02em',
                                    }}
                                >
                                    PASSWORD
                                </label>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        className="input-field"
                                        placeholder="Enter your password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        autoComplete="current-password"
                                        style={{ paddingRight: 48 }}
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
                                            display: 'flex',
                                        }}
                                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            <div style={{ marginBottom: 20, textAlign: 'right' }}>
                                <Link
                                    href="/forgot-password"
                                    style={{ fontSize: 13, color: 'var(--text-muted)', textDecoration: 'none' }}
                                >
                                    Forgot password?
                                </Link>
                            </div>

                            <button
                                type="submit"
                                className="btn-primary"
                                disabled={isSubmitting || !username || !password}
                                style={{ width: '100%', height: 52 }}
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 size={18} className="animate-spin-slow" />
                                        Signing in...
                                    </>
                                ) : (
                                    'Sign In'
                                )}
                            </button>
                        </form>
                    </div>

                    <p
                        style={{
                            textAlign: 'center',
                            fontSize: 13,
                            color: 'var(--text-muted)',
                            marginTop: 24,
                        }}
                    >
                        BizEnhance POS &middot; Business Management Platform
                    </p>
                </div>
            </div>
        </div>
    );
}
