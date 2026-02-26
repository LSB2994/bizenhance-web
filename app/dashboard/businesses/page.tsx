'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import api from '@/lib/api';
import type { ApiResponse, PageResponse, BizDTO, CreateBizRequest, RoleDTO, CreateUserWithRoleRequest } from '@/lib/types';
import {
    Store,
    Plus,
    Search,
    Edit3,
    Trash2,
    X,
    ChevronLeft,
    ChevronRight,
    Eye,
    Building2,
    Phone,
    MapPin,
    Loader2,
    AlertCircle,
    UserPlus,
    ShieldCheck,
    Lock,
    User,
} from 'lucide-react';

export default function BusinessesPage() {
    const router = useRouter();
    const { currentUser } = useAuth();
    const isBizAdmin = !!currentUser?.bizId;

    const [businesses, setBusinesses] = useState<BizDTO[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const pageSize = 10;

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [editingBiz, setEditingBiz] = useState<BizDTO | null>(null);
    const [formData, setFormData] = useState<CreateBizRequest>({
        nameKh: '',
        nameEng: '',
        tel: '',
        address: '',
        logo: '',
        status: 'ACTIVE',
    });
    const [isSaving, setIsSaving] = useState(false);
    const [formError, setFormError] = useState('');

    // Delete state
    const [deleteTarget, setDeleteTarget] = useState<BizDTO | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Admin creation state (only for new biz)
    const [createAdmin, setCreateAdmin] = useState(true);
    const [roles, setRoles] = useState<RoleDTO[]>([]);
    const [adminData, setAdminData] = useState({
        username: '',
        password: '',
        fullName: '',
        roleId: 0
    });

    const loadRoles = useCallback(async () => {
        try {
            const { data } = await api.get<ApiResponse<PageResponse<RoleDTO> | RoleDTO[]>>('/api/roles');
            if (data?.payload) {
                const p = data.payload;
                const fetchedRoles = Array.isArray(p) ? p : (p as PageResponse<RoleDTO>).content || [];
                setRoles(fetchedRoles);
                const bizAdminRole = fetchedRoles.find(r => r.roleName === 'BIZ_ADMIN');
                if (bizAdminRole) {
                    setAdminData(prev => ({ ...prev, roleId: bizAdminRole.id }));
                } else if (fetchedRoles.length > 0) {
                    setAdminData(prev => ({ ...prev, roleId: fetchedRoles[0].id }));
                }
            }
        } catch (error) {
            console.error('Failed to load roles:', error);
        }
    }, []);

    const loadBusinesses = useCallback(async () => {
        if (isBizAdmin) return;
        setIsLoading(true);
        try {
            const { data } = await api.get<ApiResponse<PageResponse<BizDTO>>>('/api/biz', {
                params: { page, size: pageSize, sort: 'desc' },
            });
            if (data?.payload) {
                setBusinesses(data.payload.content || []);
                setTotalPages(data.payload.totalPages || 0);
                setTotalElements(data.payload.totalElements || 0);
            }
        } catch (error) {
            console.error('Failed to load businesses:', error);
        } finally {
            setIsLoading(false);
        }
    }, [page, isBizAdmin]);

    useEffect(() => {
        if (!isBizAdmin) {
            loadBusinesses();
            loadRoles();
        }
    }, [loadBusinesses, loadRoles, isBizAdmin]);

    const filteredBusinesses = businesses.filter(
        (b) =>
            b.nameKh?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            b.nameEng?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            b.tel?.toLowerCase().includes(searchQuery.toLowerCase()),
    );

    const openCreateModal = () => {
        setEditingBiz(null);
        setFormData({ nameKh: '', nameEng: '', tel: '', address: '', logo: '', status: 'ACTIVE' });
        setAdminData({
            username: '',
            password: '',
            fullName: '',
            roleId: roles.find(r => r.roleName === 'BIZ_ADMIN')?.id || (roles[0]?.id || 0)
        });
        setCreateAdmin(true);
        setFormError('');
        setShowModal(true);
    };

    const openEditModal = (biz: BizDTO) => {
        setEditingBiz(biz);
        setFormData({
            nameKh: biz.nameKh || '',
            nameEng: biz.nameEng || '',
            tel: biz.tel || '',
            address: biz.address || '',
            logo: biz.logo || '',
            status: biz.status || 'ACTIVE',
        });
        setFormError('');
        setShowModal(true);
    };

    const handleSave = async () => {
        if (!formData.nameKh.trim()) {
            setFormError('Business name (KH) is required');
            return;
        }
        setIsSaving(true);
        setFormError('');
        try {
            if (editingBiz) {
                await api.put(`/api/biz/${editingBiz.id}`, formData);
            } else {
                const { data: biData } = await api.post<ApiResponse<BizDTO>>('/api/biz', formData);
                if (createAdmin && biData?.payload?.id && adminData.username && adminData.password) {
                    const userPayload: CreateUserWithRoleRequest = {
                        username: adminData.username,
                        password: adminData.password,
                        fullName: adminData.fullName,
                        roleIds: [adminData.roleId],
                        status: 'ACTIVE'
                    };
                    await api.post(`/api/biz/${biData.payload.id}/users`, userPayload);
                }
            }
            setShowModal(false);
            loadBusinesses();
        } catch (error: any) {
            setFormError(error?.response?.data?.message || 'Failed to save business');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        setIsDeleting(true);
        try {
            await api.delete(`/api/biz/${deleteTarget.id}`);
            setDeleteTarget(null);
            loadBusinesses();
        } catch (error) {
            console.error('Failed to delete:', error);
        } finally {
            setIsDeleting(false);
        }
    };

    if (isBizAdmin) {
        return (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', textAlign: 'center' }}>
                <div style={{ width: 64, height: 64, borderRadius: 20, background: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                    <AlertCircle size={32} color="var(--accent-red)" />
                </div>
                <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>Access Denied</h1>
                <p style={{ color: 'var(--text-muted)', maxWidth: 400, marginBottom: 24 }}>
                    You do not have permission to manage other businesses. Business Administrators can only manage their own business operations.
                </p>
                <button className="btn-primary" onClick={() => router.push('/dashboard')}>
                    Back to Dashboard
                </button>
            </div>
        );
    }

    return (
        <div className="animate-fade-in">
            {/* Page Header */}
            <div className="animate-fade-in-up" style={{ marginBottom: 28 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
                    <div>
                        <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4, letterSpacing: '-0.02em' }}>
                            Businesses
                        </h1>
                        <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: 0 }}>
                            Manage your business profiles ({totalElements} total)
                        </p>
                    </div>
                    <button className="btn-primary" onClick={openCreateModal} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Plus size={18} />
                        Add Business
                    </button>
                </div>
            </div>

            {/* Search Bar */}
            <div className="animate-fade-in-up delay-1" style={{ marginBottom: 20 }}>
                <div style={{ position: 'relative', maxWidth: 400 }}>
                    <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                        type="text"
                        placeholder="Search businesses..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="input-field"
                        style={{ paddingLeft: 40, width: '100%' }}
                    />
                </div>
            </div>

            {/* Table */}
            <div className="glass-card animate-fade-in-up delay-2" style={{ padding: 0, overflow: 'hidden' }}>
                {isLoading ? (
                    <div style={{ padding: 32 }}>
                        {Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="skeleton" style={{ width: '100%', height: 56, marginBottom: 8, borderRadius: 8 }} />
                        ))}
                    </div>
                ) : filteredBusinesses.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
                        <Store size={48} style={{ opacity: 0.2, marginBottom: 16 }} />
                        <p style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>No businesses found</p>
                        <p style={{ fontSize: 14 }}>Create your first business to get started</p>
                    </div>
                ) : (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Business</th>
                                <th>Contact</th>
                                <th>Address</th>
                                <th>Status</th>
                                <th>Created</th>
                                <th style={{ textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredBusinesses.map((biz) => (
                                <tr key={biz.id}>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                            <div
                                                style={{
                                                    width: 40,
                                                    height: 40,
                                                    borderRadius: 10,
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
                                                        style={{ width: 28, height: 28, borderRadius: 6, objectFit: 'cover' }}
                                                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                                    />
                                                ) : (
                                                    <Building2 size={18} />
                                                )}
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 14 }}>
                                                    {biz.nameEng || biz.nameKh}
                                                </div>
                                                {biz.nameEng && biz.nameKh && (
                                                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{biz.nameKh}</div>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
                                            <Phone size={12} style={{ opacity: 0.5 }} />
                                            {biz.tel || '—'}
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            <MapPin size={12} style={{ opacity: 0.5, flexShrink: 0 }} />
                                            {biz.address || '—'}
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`badge ${biz.status === 'ACTIVE' ? 'badge-success' : 'badge-warning'}`}>
                                            {biz.status}
                                        </span>
                                    </td>
                                    <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                                        {biz.createdDate ? new Date(biz.createdDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
                                            <button
                                                onClick={() => router.push(`/dashboard/businesses/${biz.id}`)}
                                                className="icon-btn"
                                                title="View details"
                                            >
                                                <Eye size={16} />
                                            </button>
                                            <button onClick={() => openEditModal(biz)} className="icon-btn" title="Edit">
                                                <Edit3 size={16} />
                                            </button>
                                            <button
                                                onClick={() => setDeleteTarget(biz)}
                                                className="icon-btn"
                                                title="Delete"
                                                style={{ color: '#f87171' }}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '16px 24px',
                            borderTop: '1px solid rgba(255,255,255,0.04)',
                            fontSize: 13,
                            color: 'var(--text-muted)',
                        }}
                    >
                        <span>
                            Showing {page * pageSize + 1}–{Math.min((page + 1) * pageSize, totalElements)} of {totalElements}
                        </span>
                        <div style={{ display: 'flex', gap: 6 }}>
                            <button
                                className="icon-btn"
                                disabled={page === 0}
                                onClick={() => setPage(page - 1)}
                                style={{ opacity: page === 0 ? 0.3 : 1 }}
                            >
                                <ChevronLeft size={16} />
                            </button>
                            {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
                                const p = page < 3 ? i : page - 2 + i;
                                if (p >= totalPages) return null;
                                return (
                                    <button
                                        key={p}
                                        className="icon-btn"
                                        onClick={() => setPage(p)}
                                        style={{
                                            background: p === page ? 'var(--accent-cyan)' : undefined,
                                            color: p === page ? '#000' : undefined,
                                            fontWeight: p === page ? 700 : 500,
                                            minWidth: 32,
                                        }}
                                    >
                                        {p + 1}
                                    </button>
                                );
                            })}
                            <button
                                className="icon-btn"
                                disabled={page >= totalPages - 1}
                                onClick={() => setPage(page + 1)}
                                style={{ opacity: page >= totalPages - 1 ? 0.3 : 1 }}
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal */}
            {showModal && (
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
                    onClick={() => setShowModal(false)}
                >
                    <div
                        className="glass-card animate-fade-in-up"
                        style={{ width: '100%', maxWidth: 560, padding: 0 }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                            <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                                {editingBiz ? 'Edit Business' : 'Create Business'}
                            </h2>
                            <button className="icon-btn" onClick={() => setShowModal(false)}>
                                <X size={18} />
                            </button>
                        </div>

                        <div style={{ padding: '24px', maxHeight: '70vh', overflowY: 'auto' }}>
                            {formError && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 8, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171', fontSize: 13, marginBottom: 20 }}>
                                    <AlertCircle size={14} />
                                    {formError}
                                </div>
                            )}

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                <div>
                                    <label className="input-label">Business Name (KH) *</label>
                                    <input className="input-field" value={formData.nameKh} onChange={(e) => setFormData({ ...formData, nameKh: e.target.value })} style={{ width: '100%' }} />
                                </div>
                                <div>
                                    <label className="input-label">Business Name (EN)</label>
                                    <input className="input-field" value={formData.nameEng || ''} onChange={(e) => setFormData({ ...formData, nameEng: e.target.value })} style={{ width: '100%' }} />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                    <div>
                                        <label className="input-label">Phone</label>
                                        <input className="input-field" value={formData.tel || ''} onChange={(e) => setFormData({ ...formData, tel: e.target.value })} style={{ width: '100%' }} />
                                    </div>
                                    <div>
                                        <label className="input-label">Status</label>
                                        <select className="input-field" value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} style={{ width: '100%' }}>
                                            <option value="ACTIVE">Active</option>
                                            <option value="INACTIVE">Inactive</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="input-label">Address</label>
                                    <textarea className="input-field" rows={2} value={formData.address || ''} onChange={(e) => setFormData({ ...formData, address: e.target.value })} style={{ width: '100%', resize: 'none' }} />
                                </div>

                                {!editingBiz && (
                                    <div style={{ marginTop: 8, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                                        <div
                                            onClick={() => setCreateAdmin(!createAdmin)}
                                            style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', marginBottom: 16 }}
                                        >
                                            <div style={{ width: 18, height: 18, borderRadius: 4, border: '2px solid', borderColor: createAdmin ? 'var(--accent-cyan)' : 'var(--text-muted)', background: createAdmin ? 'var(--accent-cyan)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                {createAdmin && <Plus size={12} color="#000" />}
                                            </div>
                                            <span style={{ fontSize: 14, fontWeight: 600 }}>Create Administrator Account</span>
                                        </div>

                                        {createAdmin && (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: 16, background: 'rgba(255,255,255,0.02)', borderRadius: 12 }}>
                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                                    <div>
                                                        <label className="input-label" style={{ fontSize: 11 }}>Username *</label>
                                                        <input className="input-field" value={adminData.username} onChange={(e) => setAdminData({ ...adminData, username: e.target.value })} style={{ width: '100%' }} />
                                                    </div>
                                                    <div>
                                                        <label className="input-label" style={{ fontSize: 11 }}>Password *</label>
                                                        <input className="input-field" type="password" value={adminData.password} onChange={(e) => setAdminData({ ...adminData, password: e.target.value })} style={{ width: '100%' }} />
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="input-label" style={{ fontSize: 11 }}>Full Name</label>
                                                    <input className="input-field" value={adminData.fullName} onChange={(e) => setAdminData({ ...adminData, fullName: e.target.value })} style={{ width: '100%' }} />
                                                </div>
                                                <div>
                                                    <label className="input-label" style={{ fontSize: 11 }}>Role</label>
                                                    <select className="input-field" value={adminData.roleId} onChange={(e) => setAdminData({ ...adminData, roleId: parseInt(e.target.value) })} style={{ width: '100%' }}>
                                                        {roles.map(r => <option key={r.id} value={r.id}>{r.roleName}</option>)}
                                                    </select>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, padding: '16px 24px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                            <button className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                            <button className="btn-primary" onClick={handleSave} disabled={isSaving}>
                                {isSaving && <Loader2 size={16} className="animate-spin-slow" />}
                                {editingBiz ? 'Update Business' : 'Create Business'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Modal */}
            {deleteTarget && (
                <div
                    style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    onClick={() => setDeleteTarget(null)}
                >
                    <div className="glass-card" style={{ width: '100%', maxWidth: 400, padding: 24, textAlign: 'center' }} onClick={e => e.stopPropagation()}>
                        <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                            <Trash2 size={24} color="var(--accent-red)" />
                        </div>
                        <h3 style={{ marginBottom: 8 }}>Delete Business?</h3>
                        <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>Are you sure you want to delete <strong>{deleteTarget.nameEng || deleteTarget.nameKh}</strong>?</p>
                        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                            <button className="btn-secondary" onClick={() => setDeleteTarget(null)}>Cancel</button>
                            <button className="btn-primary" style={{ background: 'var(--accent-red)' }} onClick={handleDelete} disabled={isDeleting}>
                                {isDeleting ? 'Deleting...' : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
