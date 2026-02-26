'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import api from '@/lib/api';
import type { ApiResponse, BizDTO, CurrentUserDTO, ChangePasswordRequest } from '@/lib/types';
import {
    Settings,
    User,
    Building2,
    Shield,
    Bell,
    Moon,
    Sun,
    Save,
    Loader2,
    CheckCircle2,
    AlertCircle,
    Smartphone,
    Mail,
    Lock,
    Globe,
    CreditCard,
} from 'lucide-react';

export default function SettingsPage() {
    const { user, currentUser, refreshCurrentUser } = useAuth();
    const [activeTab, setActiveTab] = useState<'profile' | 'business' | 'security' | 'notifications'>('profile');

    // Form States
    const [profileForm, setProfileForm] = useState({
        username: '',
        fullName: '',
        email: '',
        phoneNumber: '',
    });
    const [bizForm, setBizForm] = useState<Partial<BizDTO>>({});
    const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [passwordError, setPasswordError] = useState('');

    // UI States
    const [isSaving, setIsSaving] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    useEffect(() => {
        if (currentUser) {
            setProfileForm({
                username: currentUser.username || '',
                fullName: currentUser.fullName || '',
                email: currentUser.email || '',
                phoneNumber: currentUser.phoneNumber || '',
            });
        }
    }, [currentUser]);

    useEffect(() => {
        const loadBiz = async () => {
            if (currentUser?.bizId) {
                try {
                    const { data } = await api.get<ApiResponse<BizDTO>>(`/api/biz/${currentUser.bizId}`);
                    if (data?.payload) {
                        setBizForm(data.payload);
                    }
                } catch (err) {
                    console.error('Failed to load business info');
                }
            }
        };
        loadBiz();
    }, [currentUser]);

    const handleProfileSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setStatus(null);
        try {
            await api.put(`/api/users/${currentUser?.id}`, profileForm);
            await refreshCurrentUser();
            setStatus({ type: 'success', message: 'Profile updated successfully' });
        } catch (err: any) {
            setStatus({ type: 'error', message: err?.response?.data?.message || 'Failed to update profile' });
        } finally {
            setIsSaving(false);
        }
    };

    const handleBizSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser?.bizId) return;
        setIsSaving(true);
        setStatus(null);
        try {
            await api.put(`/api/biz/${currentUser.bizId}`, bizForm);
            setStatus({ type: 'success', message: 'Business settings updated' });
        } catch (err: any) {
            setStatus({ type: 'error', message: err?.response?.data?.message || 'Failed to update business settings' });
        } finally {
            setIsSaving(false);
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordError('');
        if (passwordForm.newPassword.length < 4) {
            setPasswordError('New password must be at least 4 characters');
            return;
        }
        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            setPasswordError('New password and confirmation do not match');
            return;
        }
        setIsChangingPassword(true);
        setStatus(null);
        try {
            const payload: ChangePasswordRequest = {
                currentPassword: passwordForm.currentPassword,
                newPassword: passwordForm.newPassword,
            };
            await api.post('/api/auth/change-password', payload);
            setStatus({ type: 'success', message: 'Password changed successfully' });
            setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (err: any) {
            const msg = err?.response?.data?.message || 'Failed to change password';
            setPasswordError(msg);
            setStatus({ type: 'error', message: msg });
        } finally {
            setIsChangingPassword(false);
        }
    };

    const tabs = [
        { id: 'profile', label: 'My Profile', icon: <User size={18} /> },
        { id: 'business', label: 'Business', icon: <Building2 size={18} /> },
        { id: 'security', label: 'Security', icon: <Shield size={18} /> },
        { id: 'notifications', label: 'Notifications', icon: <Bell size={18} /> },
    ];

    return (
        <div className="animate-fade-in">
            {/* Header */}
            <div style={{ marginBottom: 32 }}>
                <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
                    Account Settings
                </h1>
                <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>
                    Manage your personal info and business configurations.
                </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 32, alignItems: 'start' }}>
                {/* Sidebar Tabs */}
                <div className="glass-card" style={{ padding: 8 }}>
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => { setActiveTab(tab.id as any); setStatus(null); }}
                            style={{
                                width: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 12,
                                padding: '12px 16px',
                                borderRadius: 10,
                                border: 'none',
                                background: activeTab === tab.id ? 'rgba(6,182,212,0.1)' : 'transparent',
                                color: activeTab === tab.id ? '#06b6d4' : 'var(--text-secondary)',
                                fontSize: 14,
                                fontWeight: 600,
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                textAlign: 'left',
                            }}
                        >
                            {tab.icon}
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Content Area */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                    {status && (
                        <div
                            className="animate-fade-in"
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 10,
                                padding: '14px 20px',
                                borderRadius: 12,
                                background: status.type === 'success' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                                border: `1px solid ${status.type === 'success' ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`,
                                color: status.type === 'success' ? '#10b981' : '#f87171',
                                fontSize: 14,
                                fontWeight: 500,
                            }}
                        >
                            {status.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                            {status.message}
                        </div>
                    )}

                    {activeTab === 'profile' && (
                        <form onSubmit={handleProfileSave} className="glass-card animate-fade-in-up" style={{ padding: 28 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28 }}>
                                <div style={{ width: 64, height: 64, borderRadius: 20, background: 'linear-gradient(135deg, #8b5cf6, #ec4899)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 24, fontWeight: 700 }}>
                                    {(currentUser?.fullName || currentUser?.username || '?')[0].toUpperCase()}
                                </div>
                                <div>
                                    <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>{currentUser?.fullName}</h3>
                                    <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>@{currentUser?.username} • {currentUser?.roleName}</p>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 28 }}>
                                <div>
                                    <label className="input-label">Full Name</label>
                                    <div style={{ position: 'relative' }}>
                                        <User size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                        <input
                                            className="input-field"
                                            style={{ paddingLeft: 44, width: '100%' }}
                                            value={profileForm.fullName}
                                            onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="input-label">Username</label>
                                    <input className="input-field" style={{ width: '100%', opacity: 0.6 }} value={currentUser?.username || ''} disabled />
                                </div>
                                <div>
                                    <label className="input-label">Email Address</label>
                                    <div style={{ position: 'relative' }}>
                                        <Mail size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                        <input
                                            className="input-field"
                                            type="email"
                                            style={{ paddingLeft: 44, width: '100%' }}
                                            value={profileForm.email}
                                            onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="input-label">Phone Number</label>
                                    <div style={{ position: 'relative' }}>
                                        <Smartphone size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                        <input
                                            className="input-field"
                                            style={{ paddingLeft: 44, width: '100%' }}
                                            value={profileForm.phoneNumber}
                                            onChange={(e) => setProfileForm({ ...profileForm, phoneNumber: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            <button className="btn-primary" type="submit" disabled={isSaving} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 24px' }}>
                                {isSaving ? <Loader2 size={18} className="animate-spin-slow" /> : <Save size={18} />}
                                Save Changes
                            </button>
                        </form>
                    )}

                    {activeTab === 'business' && (
                        <form onSubmit={handleBizSave} className="glass-card animate-fade-in-up" style={{ padding: 28 }}>
                            <div style={{ marginBottom: 28 }}>
                                <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>Business Details</h3>
                                <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Configure your store identity and contact information.</p>
                            </div>

                            <div style={{ display: 'grid', gap: 20, marginBottom: 28 }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                                    <div>
                                        <label className="input-label">Business Name (EN)</label>
                                        <input
                                            className="input-field"
                                            style={{ width: '100%' }}
                                            value={bizForm.nameEng || ''}
                                            onChange={(e) => setBizForm({ ...bizForm, nameEng: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="input-label">Business Name (KH)</label>
                                        <input
                                            className="input-field"
                                            style={{ width: '100%' }}
                                            value={bizForm.nameKh || ''}
                                            onChange={(e) => setBizForm({ ...bizForm, nameKh: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="input-label">Phone Number</label>
                                    <input
                                        className="input-field"
                                        style={{ width: '100%' }}
                                        value={bizForm.tel || ''}
                                        onChange={(e) => setBizForm({ ...bizForm, tel: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="input-label">Address</label>
                                    <textarea
                                        className="input-field"
                                        rows={3}
                                        style={{ width: '100%', resize: 'none' }}
                                        value={bizForm.address || ''}
                                        onChange={(e) => setBizForm({ ...bizForm, address: e.target.value })}
                                    />
                                </div>
                            </div>

                            <button className="btn-primary" type="submit" disabled={isSaving} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 24px' }}>
                                {isSaving ? <Loader2 size={18} className="animate-spin-slow" /> : <Save size={18} />}
                                Update Business
                            </button>
                        </form>
                    )}

                    {activeTab === 'security' && (
                        <div className="glass-card animate-fade-in-up" style={{ padding: 28 }}>
                            <div style={{ marginBottom: 28 }}>
                                <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>Security & Privacy</h3>
                                <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Protect your account and manage sessions.</p>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                <form onSubmit={handleChangePassword} style={{ padding: '20px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
                                        <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(139,92,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8b5cf6' }}>
                                            <Lock size={18} />
                                        </div>
                                        <div>
                                            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>Change password</div>
                                            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Enter your current password and choose a new one.</div>
                                        </div>
                                    </div>
                                    {passwordError && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 8, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171', fontSize: 13, marginBottom: 16 }}>
                                            <AlertCircle size={14} /> {passwordError}
                                        </div>
                                    )}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                                        <div>
                                            <label className="input-label">Current password</label>
                                            <input
                                                type="password"
                                                className="input-field"
                                                style={{ width: '100%' }}
                                                value={passwordForm.currentPassword}
                                                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                                                placeholder="Enter current password"
                                                autoComplete="current-password"
                                            />
                                        </div>
                                        <div>
                                            <label className="input-label">New password</label>
                                            <input
                                                type="password"
                                                className="input-field"
                                                style={{ width: '100%' }}
                                                value={passwordForm.newPassword}
                                                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                                                placeholder="At least 4 characters"
                                                autoComplete="new-password"
                                            />
                                        </div>
                                        <div>
                                            <label className="input-label">Confirm new password</label>
                                            <input
                                                type="password"
                                                className="input-field"
                                                style={{ width: '100%' }}
                                                value={passwordForm.confirmPassword}
                                                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                                                placeholder="Re-enter new password"
                                                autoComplete="new-password"
                                            />
                                        </div>
                                        <button type="submit" className="btn-primary" disabled={isChangingPassword} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 24px', marginTop: 8 }}>
                                            {isChangingPassword ? <Loader2 size={18} className="animate-spin-slow" /> : <Lock size={18} />}
                                            Change password
                                        </button>
                                    </div>
                                </form>

                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                                        <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
                                            <Shield size={18} />
                                        </div>
                                        <div>
                                            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>Two-Factor Auth</div>
                                            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Not enabled</div>
                                        </div>
                                    </div>
                                    <button className="btn-secondary" style={{ padding: '8px 16px', fontSize: 13 }}>Enable</button>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'notifications' && (
                        <div className="glass-card animate-fade-in-up" style={{ padding: 28 }}>
                            <div style={{ marginBottom: 28 }}>
                                <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>Notification Preferences</h3>
                                <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>How and when you want to be notified.</p>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <div>
                                        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>Email Notifications</div>
                                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Receive weekly reports and system alerts.</div>
                                    </div>
                                    <input type="checkbox" defaultChecked />
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <div>
                                        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>Sales Alerts</div>
                                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Get notified for every new successful sale.</div>
                                    </div>
                                    <input type="checkbox" defaultChecked />
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <div>
                                        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>Stock Warnings</div>
                                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Alert when items go below threshold.</div>
                                    </div>
                                    <input type="checkbox" defaultChecked />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
