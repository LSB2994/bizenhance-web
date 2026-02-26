'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import {
    Zap,
    LayoutDashboard,
    Package,
    BarChart3,
    Users,
    Shield,
    ArrowRight,
    CreditCard,
    Building2,
    Mail,
} from 'lucide-react';

export default function LandingPage() {
    const { isAuthenticated, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading && isAuthenticated) {
            router.replace('/dashboard');
        }
    }, [isAuthenticated, isLoading, router]);

    if (isLoading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg-primary)' }}>
                <div className="animate-pulse-soft" style={{ textAlign: 'center' }}>
                    <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--gradient-primary)', margin: '0 auto 16px' }} />
                    <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Loading...</p>
                </div>
            </div>
        );
    }

    if (isAuthenticated) return null;

    const features = [
        {
            icon: LayoutDashboard,
            title: 'Unified Dashboard',
            description: 'Real-time overview of sales, inventory, and staff. One place to run your business.',
            gradient: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
        },
        {
            icon: CreditCard,
            title: 'POS & Sales',
            description: 'Fast point-of-sale, invoices, and transaction history. Accept and track every sale.',
            gradient: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
        },
        {
            icon: Package,
            title: 'Inventory & Stock',
            description: 'Manage items, categories, stock levels, and movements. Never run out of what sells.',
            gradient: 'linear-gradient(135deg, #10b981, #06b6d4)',
        },
        {
            icon: BarChart3,
            title: 'Reports & Insights',
            description: 'Sales reports, trends, and analytics. Make decisions backed by data.',
            gradient: 'linear-gradient(135deg, #f59e0b, #ef4444)',
        },
        {
            icon: Users,
            title: 'Staff & Roles',
            description: 'Invite staff, assign roles, and control menu permissions per business.',
            gradient: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
        },
        {
            icon: Shield,
            title: 'Secure & Scalable',
            description: 'Role-based access, OTP reset, and multi-business support for growth.',
            gradient: 'linear-gradient(135deg, #06b6d4, #10b981)',
        },
    ];

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', position: 'relative', overflowX: 'hidden' }}>
            {/* Background orbs */}
            <div
                style={{
                    position: 'fixed',
                    top: '-20%',
                    left: '-10%',
                    width: 600,
                    height: 600,
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(6,182,212,0.08), transparent 60%)',
                    filter: 'blur(60px)',
                    pointerEvents: 'none',
                }}
            />
            <div
                style={{
                    position: 'fixed',
                    bottom: '-20%',
                    right: '-10%',
                    width: 500,
                    height: 500,
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(139,92,246,0.06), transparent 60%)',
                    filter: 'blur(60px)',
                    pointerEvents: 'none',
                }}
            />

            {/* Nav */}
            <header
                style={{
                    position: 'sticky',
                    top: 0,
                    zIndex: 40,
                    padding: '16px 24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    maxWidth: 1200,
                    margin: '0 auto',
                    background: 'rgba(11, 15, 26, 0.8)',
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                    backdropFilter: 'blur(20px)',
                }}
            >
                <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none', color: 'inherit' }}>
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 20px rgba(6,182,212,0.3)' }}>
                        <Zap size={22} color="white" />
                    </div>
                    <span style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em' }}>BizEnhance</span>
                </Link>

                <nav style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <a href="#features" style={{ padding: '10px 16px', borderRadius: 10, color: 'var(--text-secondary)', fontSize: 14, fontWeight: 500, textDecoration: 'none' }}>
                        Features
                    </a>
                    <Link
                        href="/login"
                        style={{ padding: '10px 18px', borderRadius: 10, color: 'var(--text-secondary)', fontSize: 14, fontWeight: 500, textDecoration: 'none', border: '1px solid rgba(255,255,255,0.1)' }}
                    >
                        Log in
                    </Link>
                    <Link
                        href="/login"
                        className="btn-primary"
                        style={{ padding: '10px 20px', borderRadius: 10, fontSize: 14, fontWeight: 600, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8 }}
                    >
                        Get started <ArrowRight size={16} />
                    </Link>
                </nav>
            </header>

            {/* Hero */}
            <section style={{ padding: '80px 24px 100px', maxWidth: 900, margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 1 }}>
                <h1
                    style={{
                        fontSize: 'clamp(2.5rem, 5vw, 3.5rem)',
                        fontWeight: 800,
                        color: 'var(--text-primary)',
                        lineHeight: 1.15,
                        letterSpacing: '-0.03em',
                        marginBottom: 24,
                    }}
                >
                    Run your business on one platform
                </h1>
                <p style={{ fontSize: 18, color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 40, maxWidth: 560, margin: '0 auto 40px' }}>
                    POS, inventory, sales reports, and staff management in a single dashboard. Built for speed and scale.
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, justifyContent: 'center' }}>
                    <Link
                        href="/login"
                        className="btn-primary"
                        style={{ padding: '16px 32px', borderRadius: 12, fontSize: 16, fontWeight: 600, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 10, boxShadow: '0 4px 24px rgba(6,182,212,0.35)' }}
                    >
                        Get started <ArrowRight size={20} />
                    </Link>
                    <a
                        href="#features"
                        style={{
                            padding: '16px 32px',
                            borderRadius: 12,
                            fontSize: 16,
                            fontWeight: 600,
                            color: 'var(--text-primary)',
                            background: 'rgba(255,255,255,0.06)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            textDecoration: 'none',
                            display: 'inline-flex',
                            alignItems: 'center',
                        }}
                    >
                        See features
                    </a>
                </div>
            </section>

            {/* Features */}
            <section id="features" style={{ padding: '60px 24px 100px', maxWidth: 1100, margin: '0 auto', position: 'relative', zIndex: 1 }}>
                <h2 style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-primary)', textAlign: 'center', marginBottom: 12 }}>
                    Everything you need to manage your business
                </h2>
                <p style={{ fontSize: 16, color: 'var(--text-muted)', textAlign: 'center', marginBottom: 48, maxWidth: 520, margin: '0 auto 48px' }}>
                    From daily sales to inventory and team permissions — all in one place.
                </p>
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                        gap: 24,
                    }}
                >
                    {features.map((f) => (
                        <div
                            key={f.title}
                            className="glass-card"
                            style={{
                                padding: 28,
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 16,
                                transition: 'transform 0.2s',
                            }}
                        >
                            <div
                                style={{
                                    width: 48,
                                    height: 48,
                                    borderRadius: 14,
                                    background: f.gradient,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
                                }}
                            >
                                <f.icon size={24} color="white" />
                            </div>
                            <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                                {f.title}
                            </h3>
                            <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0, flex: 1 }}>
                                {f.description}
                            </p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Create business — contact center */}
            <section style={{ padding: '0 24px 60px', position: 'relative', zIndex: 1 }}>
                <div
                    className="glass-card"
                    style={{
                        maxWidth: 640,
                        margin: '0 auto',
                        padding: 28,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 20,
                        flexWrap: 'wrap',
                        border: '1px solid rgba(139,92,246,0.2)',
                        background: 'linear-gradient(135deg, rgba(139,92,246,0.06), transparent)',
                    }}
                >
                    <div style={{ width: 52, height: 52, borderRadius: 14, background: 'var(--gradient-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Building2 size={26} color="white" />
                    </div>
                    <div style={{ flex: 1, minWidth: 260 }}>
                        <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
                            Want to create a business on BizEnhance?
                        </h3>
                        <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                            New businesses are set up by the center. Contact support to create your business and get access to the dashboard.
                        </p>
                    </div>
                    <a
                        href="mailto:support@bizenhance.com"
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 8,
                            padding: '12px 20px',
                            borderRadius: 10,
                            fontSize: 14,
                            fontWeight: 600,
                            color: 'var(--text-primary)',
                            background: 'rgba(255,255,255,0.08)',
                            border: '1px solid rgba(255,255,255,0.12)',
                            textDecoration: 'none',
                        }}
                    >
                        <Mail size={18} /> Contact center
                    </a>
                </div>
            </section>

            {/* CTA */}
            <section style={{ padding: '0 24px 100px', position: 'relative', zIndex: 1 }}>
                <div
                    className="glass-card"
                    style={{
                        maxWidth: 640,
                        margin: '0 auto',
                        padding: 48,
                        textAlign: 'center',
                        border: '1px solid rgba(6,182,212,0.15)',
                        background: 'linear-gradient(180deg, rgba(6,182,212,0.06), transparent)',
                    }}
                >
                    <h2 style={{ fontSize: 26, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16 }}>
                        Already have access?
                    </h2>
                    <p style={{ fontSize: 15, color: 'var(--text-secondary)', marginBottom: 28 }}>
                        Sign in to your account and open your dashboard.
                    </p>
                    <Link
                        href="/login"
                        className="btn-primary"
                        style={{ padding: '16px 32px', borderRadius: 12, fontSize: 16, fontWeight: 600, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 10 }}
                    >
                        Go to dashboard <ArrowRight size={18} />
                    </Link>
                </div>
            </section>

            {/* Footer */}
            <footer
                style={{
                    padding: '32px 24px',
                    borderTop: '1px solid rgba(255,255,255,0.06)',
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 16,
                    maxWidth: 1200,
                    margin: '0 auto',
                    position: 'relative',
                    zIndex: 1,
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Zap size={14} color="white" />
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)' }}>BizEnhance</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
                    <Link href="/login" style={{ fontSize: 13, color: 'var(--text-muted)', textDecoration: 'none' }}>
                        Log in
                    </Link>
                    <Link href="/forgot-password" style={{ fontSize: 13, color: 'var(--text-muted)', textDecoration: 'none' }}>
                        Forgot password
                    </Link>
                    <a href="mailto:support@bizenhance.com" style={{ fontSize: 13, color: 'var(--text-muted)', textDecoration: 'none' }}>
                        Contact center (create business)
                    </a>
                </div>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0, width: '100%', textAlign: 'center' }}>
                    © {new Date().getFullYear()} BizEnhance. Platform management system.
                </p>
            </footer>

        </div>
    );
}
