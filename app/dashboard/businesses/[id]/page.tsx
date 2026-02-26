'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import type {
    ApiResponse,
    PageResponse,
    BizDTO,
    StaffDTO,
    CreateUserWithRoleRequest,
    RoleDTO,
} from '@/lib/types';
import {
    ArrowLeft,
    Building2,
    Phone,
    MapPin,
    Calendar,
    Users,
    Plus,
    Edit3,
    Trash2,
    X,
    Loader2,
    AlertCircle,
    UserPlus,
    ShieldCheck,
    Clock,
} from 'lucide-react';

export default function BusinessDetailPage() {
    const params = useParams();
    const router = useRouter();
    const bizId = params.id as string;

    const [biz, setBiz] = useState<BizDTO | null>(null);
    const [staff, setStaff] = useState<StaffDTO[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [staffLoading, setStaffLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'details' | 'staff'>('details');

    // Staff modal
    const [showStaffModal, setShowStaffModal] = useState(false);
    const [staffForm, setStaffForm] = useState<CreateUserWithRoleRequest>({
        username: '',
        password: '',
        fullName: '',
        email: '',
        phoneNumber: '',
        status: 'ACTIVE',
    });
    const [isSavingStaff, setIsSavingStaff] = useState(false);
    const [staffError, setStaffError] = useState('');

    // Roles state
    const [roles, setRoles] = useState<RoleDTO[]>([]);
    const [selectedRoleId, setSelectedRoleId] = useState<number>(0);

    const loadRoles = useCallback(async () => {
        try {
            const { data } = await api.get<ApiResponse<PageResponse<RoleDTO> | RoleDTO[]>>('/api/roles');
            if (data?.payload) {
                const p = data.payload;
                const fetchedRoles = Array.isArray(p) ? p : (p as PageResponse<RoleDTO>).content || [];
                setRoles(fetchedRoles);
                const bizAdminRole = fetchedRoles.find(r => r.roleName === 'BIZ_ADMIN');
                if (bizAdminRole) setSelectedRoleId(bizAdminRole.id);
                else if (fetchedRoles.length > 0) setSelectedRoleId(fetchedRoles[0].id);
            }
        } catch (error) {
            console.error('Failed to load roles:', error);
        }
    }, []);

    const loadBusiness = useCallback(async () => {
        setIsLoading(true);
        try {
            const { data } = await api.get<ApiResponse<BizDTO>>(`/api/biz/${bizId}`);
            if (data?.payload) {
                setBiz(data.payload);
            }
        } catch (error) {
            console.error('Failed to load business:', error);
        } finally {
            setIsLoading(false);
        }
    }, [bizId]);

    const loadStaff = useCallback(async () => {
        setStaffLoading(true);
        try {
            const { data } = await api.get<ApiResponse<PageResponse<StaffDTO>>>(
                `/api/biz/${bizId}/users`,
                { params: { page: 0, size: 50, sort: 'desc' } },
            );
            if (data?.payload) {
                setStaff(data.payload.content || []);
            }
        } catch (error) {
            console.error('Failed to load staff:', error);
        } finally {
            setStaffLoading(false);
        }
    }, [bizId]);

    useEffect(() => {
        loadBusiness();
        loadStaff();
        loadRoles();
    }, [loadBusiness, loadStaff, loadRoles]);

    const handleAddStaff = async () => {
        if (!staffForm.username.trim() || !staffForm.password.trim()) {
            setStaffError('Username and password are required');
            return;
        }
        setIsSavingStaff(true);
        setStaffError('');
        try {
            const payload: CreateUserWithRoleRequest = {
                ...staffForm,
                roleIds: [selectedRoleId]
            };
            await api.post(`/api/biz/${bizId}/users`, payload);
            setShowStaffModal(false);
            setStaffForm({ username: '', password: '', fullName: '', email: '', phoneNumber: '', status: 'ACTIVE' });
            loadStaff();
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string } } };
            setStaffError(err?.response?.data?.message || 'Failed to add staff member');
        } finally {
            setIsSavingStaff(false);
        }
    };

    const handleRemoveStaff = async (userId: number) => {
        if (!confirm('Remove this staff member?')) return;
        try {
            await api.delete(`/api/biz/${bizId}/users/${userId}`);
            loadStaff();
        } catch (error) {
            console.error('Failed to remove staff:', error);
        }
    };

    if (isLoading) {
        return (
            <div>
                <div className="skeleton" style={{ width: 200, height: 32, marginBottom: 24 }} />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="skeleton" style={{ width: '100%', height: 80, borderRadius: 12 }} />
                    ))}
                </div>
            </div>
        );
    }

    if (!biz) {
        return (
            <div style={{ textAlign: 'center', padding: '80px 20px' }}>
                <Building2 size={56} style={{ opacity: 0.2, marginBottom: 16, color: 'var(--text-muted)' }} />
                <h2 style={{ color: 'var(--text-primary)', fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Business Not Found</h2>
                <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>The business you&apos;re looking for doesn&apos;t exist or was removed.</p>
                <button className="btn-primary" onClick={() => router.push('/dashboard/businesses')}>
                    Back to Businesses
                </button>
            </div>
        );
    }

    return (
        <div>
            {/* Back + Header */}
            <div className="animate-fade-in-up" style={{ marginBottom: 28 }}>
                <button
                    onClick={() => router.push('/dashboard/businesses')}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-muted)',
                        fontSize: 13,
                        fontWeight: 500,
                        cursor: 'pointer',
                        padding: 0,
                        marginBottom: 16,
                        fontFamily: 'inherit',
                        transition: 'color 0.2s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
                >
                    <ArrowLeft size={16} />
                    Back to Businesses
                </button>

                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div
                        style={{
                            width: 56,
                            height: 56,
                            borderRadius: 14,
                            background: 'linear-gradient(135deg, rgba(6,182,212,0.15), rgba(59,130,246,0.15))',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#06b6d4',
                            flexShrink: 0,
                        }}
                    >
                        {biz.logo ? (
                            <img
                                src={biz.logo}
                                alt=""
                                style={{ width: 36, height: 36, borderRadius: 8, objectFit: 'cover' }}
                                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                            />
                        ) : (
                            <Building2 size={26} />
                        )}
                    </div>
                    <div>
                        <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>
                            {biz.nameEng || biz.nameKh}
                        </h1>
                        {biz.nameEng && biz.nameKh && (
                            <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: '2px 0 0' }}>{biz.nameKh}</p>
                        )}
                    </div>
                    <span
                        className={`badge ${biz.status === 'ACTIVE' ? 'badge-success' : 'badge-warning'}`}
                        style={{ marginLeft: 8 }}
                    >
                        {biz.status}
                    </span>
                </div>
            </div>

            {/* Tabs */}
            <div
                className="animate-fade-in-up delay-1"
                style={{
                    display: 'flex',
                    gap: 0,
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                    marginBottom: 24,
                }}
            >
                {(['details', 'staff'] as const).map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        style={{
                            padding: '12px 20px',
                            fontSize: 14,
                            fontWeight: 600,
                            color: activeTab === tab ? 'var(--accent-cyan)' : 'var(--text-muted)',
                            background: 'none',
                            border: 'none',
                            borderBottom: activeTab === tab ? '2px solid var(--accent-cyan)' : '2px solid transparent',
                            cursor: 'pointer',
                            fontFamily: 'inherit',
                            transition: 'all 0.2s',
                            textTransform: 'capitalize',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                        }}
                    >
                        {tab === 'details' ? <Building2 size={16} /> : <Users size={16} />}
                        {tab}
                        {tab === 'staff' && (
                            <span
                                style={{
                                    background: 'rgba(6,182,212,0.1)',
                                    color: 'var(--accent-cyan)',
                                    fontSize: 11,
                                    fontWeight: 700,
                                    padding: '2px 8px',
                                    borderRadius: 20,
                                    minWidth: 20,
                                    textAlign: 'center',
                                }}
                            >
                                {staff.length}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            {activeTab === 'details' && (
                <div className="animate-fade-in-up" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
                    {/* Info Cards */}
                    {[
                        { icon: <Building2 size={18} />, label: 'Business Name (KH)', value: biz.nameKh || '—', color: '#06b6d4' },
                        { icon: <Building2 size={18} />, label: 'Business Name (EN)', value: biz.nameEng || '—', color: '#3b82f6' },
                        { icon: <Phone size={18} />, label: 'Phone', value: biz.tel || '—', color: '#8b5cf6' },
                        { icon: <MapPin size={18} />, label: 'Address', value: biz.address || '—', color: '#ec4899' },
                        { icon: <Calendar size={18} />, label: 'Created', value: biz.createdDate ? new Date(biz.createdDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '—', color: '#f59e0b' },
                        { icon: <Clock size={18} />, label: 'Last Modified', value: biz.modifiedDate ? new Date(biz.modifiedDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '—', color: '#10b981' },
                    ].map((item) => (
                        <div
                            key={item.label}
                            className="glass-card"
                            style={{
                                padding: '20px',
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: 14,
                            }}
                        >
                            <div
                                style={{
                                    width: 40,
                                    height: 40,
                                    borderRadius: 10,
                                    background: `${item.color}15`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: item.color,
                                    flexShrink: 0,
                                }}
                            >
                                {item.icon}
                            </div>
                            <div>
                                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4, letterSpacing: '0.02em' }}>
                                    {item.label}
                                </div>
                                <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', wordBreak: 'break-word' }}>
                                    {item.value}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {activeTab === 'staff' && (
                <div className="animate-fade-in-up">
                    {/* Staff Header */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                        <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: 0 }}>
                            {staff.length} team member{staff.length !== 1 ? 's' : ''}
                        </p>
                        <button
                            className="btn-primary"
                            onClick={() => {
                                setStaffError('');
                                setStaffForm({ username: '', password: '', fullName: '', email: '', phoneNumber: '', status: 'ACTIVE' });
                                setShowStaffModal(true);
                            }}
                            style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                        >
                            <UserPlus size={16} />
                            Add Staff
                        </button>
                    </div>

                    {/* Staff Grid */}
                    {staffLoading ? (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
                            {Array.from({ length: 4 }).map((_, i) => (
                                <div key={i} className="skeleton" style={{ width: '100%', height: 120, borderRadius: 12 }} />
                            ))}
                        </div>
                    ) : staff.length === 0 ? (
                        <div className="glass-card" style={{ textAlign: 'center', padding: '50px 20px' }}>
                            <Users size={48} style={{ opacity: 0.15, marginBottom: 16, color: 'var(--text-muted)' }} />
                            <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>No staff yet</p>
                            <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>Add your first team member to this business</p>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
                            {staff.map((s) => (
                                <div key={s.id} className="glass-card" style={{ padding: '20px' }}>
                                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                            <div
                                                style={{
                                                    width: 44,
                                                    height: 44,
                                                    borderRadius: 12,
                                                    background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontWeight: 700,
                                                    fontSize: 16,
                                                    color: 'white',
                                                    flexShrink: 0,
                                                }}
                                            >
                                                {(s.fullName || s.username || '?')[0].toUpperCase()}
                                            </div>
                                            <div>
                                                <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>
                                                    {s.fullName || s.username}
                                                </div>
                                                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>@{s.username}</div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleRemoveStaff(s.id)}
                                            className="icon-btn"
                                            title="Remove"
                                            style={{ color: '#f87171' }}
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>

                                    <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
                                        {s.email && (
                                            <div style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                                                📧 {s.email}
                                            </div>
                                        )}
                                        {s.phoneNumber && (
                                            <div style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                                                📱 {s.phoneNumber}
                                            </div>
                                        )}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                                            {s.roleNames?.map((role) => (
                                                <span
                                                    key={role}
                                                    style={{
                                                        fontSize: 11,
                                                        fontWeight: 600,
                                                        padding: '3px 10px',
                                                        borderRadius: 20,
                                                        background: 'rgba(139,92,246,0.1)',
                                                        color: '#a78bfa',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: 4,
                                                    }}
                                                >
                                                    <ShieldCheck size={10} />
                                                    {role}
                                                </span>
                                            ))}
                                            <span
                                                className={`badge ${s.status === 'ACTIVE' ? 'badge-success' : 'badge-warning'}`}
                                                style={{ fontSize: 11 }}
                                            >
                                                {s.status}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* ─── Add Staff Modal ─── */}
            {showStaffModal && (
                <div
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(0,0,0,0.6)',
                        backdropFilter: 'blur(4px)',
                        zIndex: 100,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: 20,
                    }}
                    onClick={() => setShowStaffModal(false)}
                >
                    <div
                        className="glass-card animate-fade-in-up"
                        style={{ width: '100%', maxWidth: 500, padding: 0 }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '20px 24px',
                                borderBottom: '1px solid rgba(255,255,255,0.06)',
                            }}
                        >
                            <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
                                <UserPlus size={20} color="#06b6d4" />
                                Add Staff Member
                            </h2>
                            <button className="icon-btn" onClick={() => setShowStaffModal(false)}>
                                <X size={18} />
                            </button>
                        </div>

                        <div style={{ padding: '24px' }}>
                            {staffError && (
                                <div
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 8,
                                        padding: '10px 14px',
                                        borderRadius: 8,
                                        background: 'rgba(239,68,68,0.1)',
                                        border: '1px solid rgba(239,68,68,0.2)',
                                        color: '#f87171',
                                        fontSize: 13,
                                        marginBottom: 20,
                                    }}
                                >
                                    <AlertCircle size={14} />
                                    {staffError}
                                </div>
                            )}

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                    <div>
                                        <label className="input-label">Username *</label>
                                        <input
                                            className="input-field"
                                            placeholder="john_doe"
                                            value={staffForm.username}
                                            onChange={(e) => setStaffForm({ ...staffForm, username: e.target.value })}
                                            style={{ width: '100%' }}
                                        />
                                    </div>
                                    <div>
                                        <label className="input-label">Password *</label>
                                        <input
                                            className="input-field"
                                            type="password"
                                            placeholder="••••••••"
                                            value={staffForm.password}
                                            onChange={(e) => setStaffForm({ ...staffForm, password: e.target.value })}
                                            style={{ width: '100%' }}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="input-label">Full Name</label>
                                    <input
                                        className="input-field"
                                        placeholder="John Doe"
                                        value={staffForm.fullName || ''}
                                        onChange={(e) => setStaffForm({ ...staffForm, fullName: e.target.value })}
                                        style={{ width: '100%' }}
                                    />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                    <div>
                                        <label className="input-label">Email</label>
                                        <input
                                            className="input-field"
                                            type="email"
                                            placeholder="john@example.com"
                                            value={staffForm.email || ''}
                                            onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })}
                                            style={{ width: '100%' }}
                                        />
                                    </div>
                                    <div>
                                        <label className="input-label">Phone</label>
                                        <input
                                            className="input-field"
                                            placeholder="012 345 678"
                                            value={staffForm.phoneNumber || ''}
                                            onChange={(e) => setStaffForm({ ...staffForm, phoneNumber: e.target.value })}
                                            style={{ width: '100%' }}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="input-label">System Role</label>
                                    <div style={{ position: 'relative' }}>
                                        <ShieldCheck size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--accent-cyan)', opacity: 0.7 }} />
                                        <select
                                            className="input-field"
                                            value={selectedRoleId}
                                            onChange={(e) => setSelectedRoleId(parseInt(e.target.value))}
                                            style={{ width: '100%', paddingLeft: 40 }}
                                        >
                                            <option value={0} disabled>Select a role...</option>
                                            {roles.map(role => (
                                                <option key={role.id} value={role.id}>{role.roleName}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'flex-end',
                                gap: 10,
                                padding: '16px 24px',
                                borderTop: '1px solid rgba(255,255,255,0.06)',
                            }}
                        >
                            <button className="btn-secondary" onClick={() => setShowStaffModal(false)} disabled={isSavingStaff}>
                                Cancel
                            </button>
                            <button
                                className="btn-primary"
                                onClick={handleAddStaff}
                                disabled={isSavingStaff}
                                style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                            >
                                {isSavingStaff && <Loader2 size={16} className="animate-spin-slow" />}
                                Add Staff
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
