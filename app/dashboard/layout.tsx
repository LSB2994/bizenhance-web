'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import Sidebar from '@/components/sidebar';
import { Bell, Search } from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { isAuthenticated, isLoading, user } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push('/login');
        }
    }, [isLoading, isAuthenticated, router]);

    if (isLoading) {
        return (
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100vh',
                    background: 'var(--bg-primary)',
                }}
            >
                <div className="animate-pulse-soft" style={{ textAlign: 'center' }}>
                    <div
                        style={{
                            width: 48,
                            height: 48,
                            borderRadius: 12,
                            background: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
                            margin: '0 auto 16px',
                        }}
                    />
                    <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Loading...</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) return null;

    return (
        <div style={{ display: 'flex', minHeight: '100vh' }}>
            <Sidebar />

            <div
                style={{
                    flex: 1,
                    marginLeft: 280,
                    minHeight: '100vh',
                    transition: 'margin-left 0.3s',
                }}
            >
                {/* Header */}
                <header className="dashboard-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <div
                            style={{
                                position: 'relative',
                                width: 320,
                                maxWidth: '100%',
                            }}
                        >
                            <Search
                                size={16}
                                style={{
                                    position: 'absolute',
                                    left: 14,
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    color: 'var(--text-muted)',
                                }}
                            />
                            <input
                                type="text"
                                placeholder="Search anything..."
                                className="input-field"
                                style={{
                                    paddingLeft: 40,
                                    height: 42,
                                    fontSize: 14,
                                    borderRadius: 'var(--radius-xl)',
                                }}
                            />
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        {/* Notifications */}
                        <button
                            style={{
                                position: 'relative',
                                background: 'rgba(255,255,255,0.04)',
                                border: '1px solid rgba(255,255,255,0.06)',
                                borderRadius: 10,
                                width: 40,
                                height: 40,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                color: 'var(--text-secondary)',
                                transition: 'all 0.2s',
                            }}
                            aria-label="Notifications"
                        >
                            <Bell size={18} />
                            <span
                                style={{
                                    position: 'absolute',
                                    top: 8,
                                    right: 8,
                                    width: 7,
                                    height: 7,
                                    borderRadius: '50%',
                                    background: '#ef4444',
                                }}
                            />
                        </button>

                        {/* User Avatar */}
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 10,
                                padding: '6px 12px 6px 6px',
                                borderRadius: 'var(--radius-xl)',
                                background: 'rgba(255,255,255,0.04)',
                                border: '1px solid rgba(255,255,255,0.06)',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                            }}
                        >
                            <div
                                style={{
                                    width: 32,
                                    height: 32,
                                    borderRadius: '50%',
                                    background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: 13,
                                    fontWeight: 700,
                                    color: 'white',
                                }}
                            >
                                {(user?.fullName || user?.username || '?')[0].toUpperCase()}
                            </div>
                            <span
                                style={{
                                    fontSize: 13,
                                    fontWeight: 600,
                                    color: 'var(--text-primary)',
                                }}
                            >
                                {user?.fullName || user?.username}
                            </span>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main
                    style={{
                        padding: 32,
                        maxWidth: 1400,
                    }}
                >
                    {children}
                </main>
            </div>

            <style>{`
        @media (max-width: 1024px) {
          .dashboard-header {
            padding: 0 16px 0 60px !important;
          }
        }
      `}</style>
        </div>
    );
}
