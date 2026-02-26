'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';
import api from '@/lib/api';
import type {
    ApiResponse,
    PageResponse,
    StaffDTO,
    RoleDTO,
    SystemMenuDTO,
    CreateBizUserRequest,
    UpdateStaffRequest,
} from '@/lib/types';
import {
    Users,
    Search,
    Edit3,
    Trash2,
    X,
    ChevronLeft,
    ChevronRight,
    Loader2,
    AlertCircle,
    UserPlus,
    ShieldCheck,
    Mail,
    Phone,
    CheckCircle2,
} from 'lucide-react';

export default function StaffPage() {
    const { user, currentUser } = useAuth();
    const bizId = currentUser?.bizId || user?.bizId;

    const [staffList, setStaffList] = useState<StaffDTO[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    // Role state
    const [roles, setRoles] = useState<RoleDTO[]>([]);
    const [menus, setMenus] = useState<SystemMenuDTO[]>([]);
    const [showRoleModal, setShowRoleModal] = useState(false);
    const [roleTarget, setRoleTarget] = useState<StaffDTO | null>(null);
    const [selectedRoles, setSelectedRoles] = useState<number[]>([]);
    const [selectedMenus, setSelectedMenus] = useState<number[]>([]);
    const [isUpdatingRoles, setIsUpdatingRoles] = useState(false);

    // Create modal
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [createForm, setCreateForm] = useState<CreateBizUserRequest>({
        username: '',
        password: '',
        fullName: '',
        email: '',
        phoneNumber: '',
        status: 'ACTIVE',
    });
    const [isCreating, setIsCreating] = useState(false);
    const [createError, setCreateError] = useState('');

    // Edit modal
    const [editTarget, setEditTarget] = useState<StaffDTO | null>(null);
    const [editForm, setEditForm] = useState<UpdateStaffRequest & { menuIds: number[] }>({
        fullName: '',
        phoneNumber: '',
        status: '',
        bizUserStatus: '',
        roleId: undefined,
        menuIds: [],
    });
    const [isEditing, setIsEditing] = useState(false);
    const [editError, setEditError] = useState('');

    // Delete
    const [deleteTarget, setDeleteTarget] = useState<StaffDTO | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const loadStaff = useCallback(async () => {
        if (!bizId) return;
        setIsLoading(true);
        try {
            const { data } = await api.get<ApiResponse<StaffDTO[]>>(
                `/api/biz/${bizId}/users`
            );
            if (data?.payload) {
                setStaffList(data.payload || []);
            }
        } catch (error) {
            console.error('Failed to load staff:', error);
        } finally {
            setIsLoading(false);
        }
    }, [bizId]);

    const loadRolesAndMenus = useCallback(async () => {
        if (!bizId) return;
        try {
            const [rolesRes, menusRes] = await Promise.all([
                api.get<ApiResponse<PageResponse<RoleDTO>>>(`/api/biz/${bizId}/users/roles`, { params: { size: 100 } }),
                api.get<ApiResponse<SystemMenuDTO[]>>(`/api/biz/${bizId}/menus/assignable`).catch(() =>
                    api.get<ApiResponse<SystemMenuDTO[]>>('/api/menus')
                )
            ]);
            if (rolesRes.data?.payload) {
                const p = rolesRes.data.payload;
                setRoles(Array.isArray(p) ? p : (p as PageResponse<RoleDTO>).content || []);
            }
            if (menusRes.data?.payload) {
                const m = menusRes.data.payload;
                setMenus(Array.isArray(m) ? m : (m as { content?: SystemMenuDTO[] })?.content || []);
            }
        } catch (error) {
            console.error('Failed to load roles/menus:', error);
        }
    }, [bizId]);

    useEffect(() => {
        loadStaff();
        loadRolesAndMenus();
    }, [loadStaff, loadRolesAndMenus]);

    const filteredStaff = staffList.filter(
        (s) =>
            s.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.email?.toLowerCase().includes(searchQuery.toLowerCase()),
    );

    const handleCreate = async () => {
        if (!createForm.username.trim() || !createForm.password.trim()) {
            setCreateError('Username and password are required');
            return;
        }
        setIsCreating(true);
        setCreateError('');
        try {
            const payload = {
                ...createForm,
                roleIds: selectedRoles,
                menuIds: selectedMenus
            };
            await api.post(`/api/biz/${bizId}/users/with-roles`, payload);
            setShowCreateModal(false);
            setCreateForm({ username: '', password: '', fullName: '', email: '', phoneNumber: '', status: 'ACTIVE' });
            setSelectedRoles([]);
            setSelectedMenus([]);
            loadStaff();
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string } } };
            setCreateError(err?.response?.data?.message || 'Failed to add staff member');
        } finally {
            setIsCreating(false);
        }
    };

    const openEditModal = (s: StaffDTO) => {
        setEditTarget(s);
        const currentRoleId = roles.find(r => s.roleNames?.includes(r.roleName))?.id;
        setEditForm({
            fullName: s.fullName || '',
            phoneNumber: s.phoneNumber || '',
            status: s.status || 'ACTIVE',
            bizUserStatus: s.bizUserStatus || 'ACTIVE',
            roleId: currentRoleId,
            menuIds: s.menuIds ?? [],
        });
        setEditError('');
    };

    const handleEdit = async () => {
        if (!editTarget) return;
        setIsEditing(true);
        setEditError('');
        try {
            const payload: UpdateStaffRequest = {
                fullName: editForm.fullName,
                phoneNumber: editForm.phoneNumber,
                status: editForm.status,
                bizUserStatus: editForm.bizUserStatus,
            };
            if (editForm.roleId != null) {
                payload.roleId = editForm.roleId;
                if (editForm.menuIds?.length !== undefined) payload.menuIds = editForm.menuIds;
            }
            await api.put(`/api/biz/${bizId}/users/${editTarget.id}`, payload);
            setEditTarget(null);
            loadStaff();
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string } } };
            setEditError(err?.response?.data?.message || 'Failed to update staff');
        } finally {
            setIsEditing(false);
        }
    };

    const openRoleModal = (s: StaffDTO) => {
        setRoleTarget(s);
        const currentRoleIds = roles
            .filter(r => s.roleNames?.includes(r.roleName))
            .map(r => r.id);
        setSelectedRoles(currentRoleIds);
        setSelectedMenus((s as any).menuIds || []);
        setShowRoleModal(true);
    };

    const handleUpdateRoles = async () => {
        if (!roleTarget || !bizId) return;
        setIsUpdatingRoles(true);
        try {
            if (selectedRoles.length > 0) {
                await api.put(`/api/biz/${bizId}/users/${roleTarget.id}/role`, {
                    roleId: selectedRoles[0],
                    menuIds: selectedMenus
                });
            }
            setShowRoleModal(false);
            loadStaff();
        } catch (error) {
            console.error('Failed to update roles/permissions:', error);
        } finally {
            setIsUpdatingRoles(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        setIsDeleting(true);
        try {
            await api.delete(`/api/biz/${bizId}/users/${deleteTarget.id}`);
            setDeleteTarget(null);
            loadStaff();
        } catch (error) {
            console.error('Failed to remove staff:', error);
        } finally {
            setIsDeleting(false);
        }
    };

    const toggleRole = (roleId: number) => {
        setSelectedRoles([roleId]);
    };

    const toggleMenu = (menuId: number) => {
        setSelectedMenus(prev =>
            prev.includes(menuId) ? prev.filter(id => id !== menuId) : [...prev, menuId]
        );
    };

    if (!bizId) {
        return (
            <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--text-muted)' }}>
                <Users size={56} style={{ opacity: 0.2, marginBottom: 16 }} />
                <h2 style={{ color: 'var(--text-primary)', fontSize: 20, fontWeight: 700, marginBottom: 8 }}>No Business Selected</h2>
                <p style={{ fontSize: 14 }}>Your account is not associated with a business. Contact your administrator.</p>
            </div>
        );
    }

    return (
        <div>
            {/* Page Header */}
            <div className="animate-fade-in-up" style={{ marginBottom: 28 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
                    <div>
                        <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4, letterSpacing: '-0.02em' }}>
                            Staff Management
                        </h1>
                        <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: 0 }}>
                            Manage your team members and assign system roles ({staffList.length} total)
                        </p>
                    </div>
                    <button
                        className="btn-primary"
                        onClick={() => {
                            setCreateError('');
                            setCreateForm({ username: '', password: '', fullName: '', email: '', phoneNumber: '', status: 'ACTIVE' });
                            setSelectedRoles([]);
                            setSelectedMenus([]);
                            setShowCreateModal(true);
                        }}
                        style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                    >
                        <UserPlus size={18} />
                        Add Staff
                    </button>
                </div>
            </div>

            {/* Search */}
            <div className="animate-fade-in-up delay-1" style={{ marginBottom: 20 }}>
                <div style={{ position: 'relative', maxWidth: 400 }}>
                    <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                        type="text"
                        placeholder="Search staff..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="input-field"
                        style={{ paddingLeft: 40, width: '100%' }}
                    />
                </div>
            </div>

            {/* Staff Grid */}
            <div className="animate-fade-in-up delay-2">
                {isLoading ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="skeleton" style={{ width: '100%', height: 180, borderRadius: 12 }} />
                        ))}
                    </div>
                ) : filteredStaff.length === 0 ? (
                    <div className="glass-card" style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
                        <Users size={48} style={{ opacity: 0.2, marginBottom: 16 }} />
                        <p style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>No staff found</p>
                        <p style={{ fontSize: 14 }}>Try a different search or add a new team member</p>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
                        {filteredStaff.map((s) => (
                            <div key={s.id} className="glass-card item-card" style={{ padding: '24px', border: '1px solid rgba(255,255,255,0.05)', transition: 'all 0.3s ease' }}>
                                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                                        <div style={{ width: 48, height: 48, borderRadius: 14, background: 'linear-gradient(135deg, #8b5cf6, #ec4899)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 18, color: 'white', flexShrink: 0 }}>
                                            {(s.fullName || s.username || '?')[0].toUpperCase()}
                                        </div>
                                        <div>
                                            <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{s.fullName || s.username}</h3>
                                            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>@{s.username}</p>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: 4 }}>
                                        <button onClick={() => openEditModal(s)} className="icon-btn" title="Edit Info"><Edit3 size={15} /></button>
                                        <button onClick={() => openRoleModal(s)} className="icon-btn" title="Manage Roles" style={{ color: '#06b6d4' }}><ShieldCheck size={15} /></button>
                                        <button onClick={() => setDeleteTarget(s)} className="icon-btn" title="Remove" style={{ color: '#f87171' }}><Trash2 size={15} /></button>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-secondary)' }}>
                                        <Mail size={14} style={{ opacity: 0.6 }} />
                                        {s.email || 'No email set'}
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-secondary)' }}>
                                        <Phone size={14} style={{ opacity: 0.6 }} />
                                        {s.phoneNumber || 'No phone set'}
                                    </div>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                        {s.roleNames && s.roleNames.length > 0 ? (
                                            s.roleNames.map(role => (
                                                <span key={role} style={{ fontSize: 10, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: 'rgba(139,92,246,0.1)', color: '#a78bfa', display: 'flex', alignItems: 'center', gap: 4 }}>
                                                    <ShieldCheck size={10} /> {role}
                                                </span>
                                            ))
                                        ) : (
                                            <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 500 }}>No roles</span>
                                        )}
                                        {(s as any).menuNames && (s as any).menuNames.length > 0 && (
                                            <span style={{ fontSize: 10, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: 'rgba(6,182,212,0.1)', color: '#06b6d4', display: 'flex', alignItems: 'center', gap: 4 }}>
                                                {(s as any).menuNames.length} Permissions
                                            </span>
                                        )}
                                    </div>
                                    <span className={`badge ${s.status === 'ACTIVE' ? 'badge-success' : 'badge-warning'}`} style={{ fontSize: 11 }}>
                                        {s.status}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>



            {/* Create Modal */}
            {showCreateModal && (
                <div className="animate-fade-in" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setShowCreateModal(false)}>
                    <div className="glass-card animate-fade-in-up" style={{ width: '100%', maxWidth: 520, padding: 0 }} onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                            <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
                                <UserPlus size={20} color="#06b6d4" /> Add Staff Member
                            </h2>
                            <button className="icon-btn" onClick={() => setShowCreateModal(false)}><X size={18} /></button>
                        </div>
                        <div style={{ padding: '24px' }}>
                            {createError && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 8, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171', fontSize: 13, marginBottom: 20 }}>
                                    <AlertCircle size={14} /> {createError}
                                </div>
                            )}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                    <div>
                                        <label className="input-label">Username *</label>
                                        <input className="input-field" placeholder="john_doe" value={createForm.username} onChange={(e) => setCreateForm({ ...createForm, username: e.target.value })} style={{ width: '100%' }} />
                                    </div>
                                    <div>
                                        <label className="input-label">Password *</label>
                                        <input className="input-field" type="password" placeholder="••••••••" value={createForm.password} onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })} style={{ width: '100%' }} />
                                    </div>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                    <div>
                                        <label className="input-label">Full Name</label>
                                        <input className="input-field" placeholder="John Doe" value={createForm.fullName || ''} onChange={(e) => setCreateForm({ ...createForm, fullName: e.target.value })} style={{ width: '100%' }} />
                                    </div>
                                    <div>
                                        <label className="input-label">Initial Role</label>
                                        <select className="input-field" value={selectedRoles[0] || ''} onChange={(e) => setSelectedRoles([parseInt(e.target.value)])} style={{ width: '100%' }}>
                                            <option value="">Select a role...</option>
                                            {roles.map(r => <option key={r.id} value={r.id}>{r.roleName}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                    <div>
                                        <label className="input-label">Email</label>
                                        <input className="input-field" type="email" placeholder="john@example.com" value={createForm.email || ''} onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })} style={{ width: '100%' }} />
                                    </div>
                                    <div>
                                        <label className="input-label">Phone</label>
                                        <input className="input-field" placeholder="012 345 678" value={createForm.phoneNumber || ''} onChange={(e) => setCreateForm({ ...createForm, phoneNumber: e.target.value })} style={{ width: '100%' }} />
                                    </div>
                                </div>

                                <div style={{ marginTop: 8 }}>
                                    <label className="input-label" style={{ marginBottom: 10, display: 'block' }}>Initial Permissions (Optional)</label>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, maxHeight: 150, overflowY: 'auto', padding: '4px' }}>
                                        {menus.map(menu => (
                                            <div
                                                key={menu.id}
                                                onClick={() => toggleMenu(menu.id)}
                                                style={{
                                                    padding: '8px 12px',
                                                    borderRadius: 8,
                                                    background: selectedMenus.includes(menu.id) ? 'rgba(6,182,212,0.1)' : 'rgba(255,255,255,0.02)',
                                                    border: `1px solid ${selectedMenus.includes(menu.id) ? 'rgba(6,182,212,0.3)' : 'rgba(255,255,255,0.05)'}`,
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    transition: 'all 0.2s',
                                                }}
                                            >
                                                <span style={{ fontSize: 12, color: selectedMenus.includes(menu.id) ? '#06b6d4' : 'var(--text-secondary)' }}>{menu.menuName}</span>
                                                {selectedMenus.includes(menu.id) && <CheckCircle2 size={12} color="#06b6d4" />}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10, padding: '16px 24px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                            <button className="btn-secondary" onClick={() => setShowCreateModal(false)} disabled={isCreating}>Cancel</button>
                            <button className="btn-primary" onClick={handleCreate} disabled={isCreating} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                {isCreating && <Loader2 size={16} className="animate-spin-slow" />} Add Staff
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {editTarget && (
                <div className="animate-fade-in" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setEditTarget(null)}>
                    <div className="glass-card animate-fade-in-up" style={{ width: '100%', maxWidth: 480, maxHeight: '90vh', padding: 0, display: 'flex', flexDirection: 'column' }} onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                            <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
                                <Edit3 size={20} color="#f59e0b" /> Edit Staff Info
                            </h2>
                            <button className="icon-btn" onClick={() => setEditTarget(null)}><X size={18} /></button>
                        </div>
                        <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
                            {editError && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 8, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171', fontSize: 13, marginBottom: 20 }}>
                                    <AlertCircle size={14} /> {editError}
                                </div>
                            )}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                <div>
                                    <label className="input-label">Full Name</label>
                                    <input className="input-field" value={editForm.fullName || ''} onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })} style={{ width: '100%' }} />
                                </div>
                                <div>
                                    <label className="input-label">Phone</label>
                                    <input className="input-field" value={editForm.phoneNumber || ''} onChange={(e) => setEditForm({ ...editForm, phoneNumber: e.target.value })} style={{ width: '100%' }} />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                    <div>
                                        <label className="input-label">User Status</label>
                                        <select className="input-field" value={editForm.status || 'ACTIVE'} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })} style={{ width: '100%' }}>
                                            <option value="ACTIVE">Active</option>
                                            <option value="INACTIVE">Inactive</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="input-label">Biz Status</label>
                                        <select className="input-field" value={editForm.bizUserStatus || 'ACTIVE'} onChange={(e) => setEditForm({ ...editForm, bizUserStatus: e.target.value })} style={{ width: '100%' }}>
                                            <option value="ACTIVE">Active</option>
                                            <option value="INACTIVE">Inactive</option>
                                        </select>
                                    </div>
                                </div>
                                <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 16, marginTop: 8 }}>
                                    <label className="input-label" style={{ marginBottom: 8, display: 'block' }}>Role</label>
                                    <select
                                        className="input-field"
                                        value={editForm.roleId ?? ''}
                                        onChange={(e) => setEditForm({ ...editForm, roleId: e.target.value ? Number(e.target.value) : undefined })}
                                        style={{ width: '100%' }}
                                    >
                                        <option value="">— Keep current —</option>
                                        {roles.filter(r => r.roleName !== 'SYSTEM_ADMIN').map(role => (
                                            <option key={role.id} value={role.id}>{role.roleName}</option>
                                        ))}
                                    </select>
                                    {editForm.roleId != null && (
                                        <div style={{ marginTop: 12 }}>
                                            <label className="input-label" style={{ marginBottom: 8, display: 'block' }}>Menu permissions</label>
                                            <div style={{ maxHeight: 160, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
                                                {menus.map(menu => (
                                                    <label key={menu.id} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13 }}>
                                                        <input
                                                            type="checkbox"
                                                            checked={editForm.menuIds?.includes(menu.id) ?? false}
                                                            onChange={() => {
                                                                const ids = editForm.menuIds ?? [];
                                                                setEditForm({
                                                                    ...editForm,
                                                                    menuIds: ids.includes(menu.id)
                                                                        ? ids.filter(id => id !== menu.id)
                                                                        : [...ids, menu.id],
                                                                });
                                                            }}
                                                        />
                                                        <span style={{ color: 'var(--text-primary)' }}>{menu.menuName}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10, padding: '16px 24px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                            <button className="btn-secondary" onClick={() => setEditTarget(null)} disabled={isEditing}>Cancel</button>
                            <button className="btn-primary" onClick={handleEdit} disabled={isEditing} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                {isEditing && <Loader2 size={16} className="animate-spin-slow" />} Update
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Role Assignment Modal */}
            {showRoleModal && roleTarget && (
                <div className="animate-fade-in" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setShowRoleModal(false)}>
                    <div className="glass-card animate-fade-in-up" style={{ width: '100%', maxWidth: 440, padding: 0 }} onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                            <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Assign Roles</h2>
                            <button className="icon-btn" onClick={() => setShowRoleModal(false)}><X size={18} /></button>
                        </div>
                        <div style={{ padding: '24px', maxHeight: '60vh', overflowY: 'auto' }}>
                            <div style={{ marginBottom: 24 }}>
                                <label className="input-label" style={{ marginBottom: 12, display: 'block' }}>System Role</label>
                                <div style={{ display: 'grid', gap: 8 }}>
                                    {roles.filter(r => r.roleName !== 'SYSTEM_ADMIN').map(role => (
                                        <div
                                            key={role.id}
                                            onClick={() => toggleRole(role.id)}
                                            style={{
                                                padding: '12px 16px',
                                                borderRadius: 12,
                                                background: selectedRoles.includes(role.id) ? 'rgba(139,92,246,0.1)' : 'rgba(255,255,255,0.03)',
                                                border: `1px solid ${selectedRoles.includes(role.id) ? 'rgba(139,92,246,0.3)' : 'rgba(255,255,255,0.05)'}`,
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                transition: 'all 0.2s',
                                            }}
                                        >
                                            <div style={{ fontSize: 14, fontWeight: 600, color: selectedRoles.includes(role.id) ? '#a78bfa' : 'var(--text-primary)' }}>{role.roleName}</div>
                                            {selectedRoles.includes(role.id) && <CheckCircle2 size={16} color="#a78bfa" />}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="input-label" style={{ marginBottom: 12, display: 'block' }}>Menu Permissions</label>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                                    {menus.map(menu => (
                                        <div
                                            key={menu.id}
                                            onClick={() => toggleMenu(menu.id)}
                                            style={{
                                                padding: '10px 14px',
                                                borderRadius: 10,
                                                background: selectedMenus.includes(menu.id) ? 'rgba(6,182,212,0.1)' : 'rgba(255,255,255,0.02)',
                                                border: `1px solid ${selectedMenus.includes(menu.id) ? 'rgba(6,182,212,0.3)' : 'rgba(255,255,255,0.05)'}`,
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                transition: 'all 0.2s',
                                            }}
                                        >
                                            <span style={{ fontSize: 13, color: selectedMenus.includes(menu.id) ? '#06b6d4' : 'var(--text-secondary)' }}>{menu.menuName}</span>
                                            {selectedMenus.includes(menu.id) && <CheckCircle2 size={14} color="#06b6d4" />}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10, padding: '16px 24px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                            <button className="btn-secondary" onClick={() => setShowRoleModal(false)} disabled={isUpdatingRoles}>Cancel</button>
                            <button className="btn-primary" onClick={handleUpdateRoles} disabled={isUpdatingRoles} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                {isUpdatingRoles && <Loader2 size={16} className="animate-spin-slow" />} Update Roles
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation */}
            {deleteTarget && (
                <div className="animate-fade-in" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setDeleteTarget(null)}>
                    <div className="glass-card animate-fade-in-up" style={{ width: '100%', maxWidth: 420, padding: 28, textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                        <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                            <Trash2 size={26} color="#f87171" />
                        </div>
                        <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>Remove Staff</h3>
                        <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 24 }}>Are you sure you want to remove <strong style={{ color: 'var(--text-primary)' }}>{deleteTarget.fullName || deleteTarget.username}</strong> from the business?</p>
                        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                            <button className="btn-secondary" onClick={() => setDeleteTarget(null)} disabled={isDeleting}>Cancel</button>
                            <button onClick={handleDelete} disabled={isDeleting} className="btn-primary" style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)', border: 'none' }}>
                                {isDeleting && <Loader2 size={16} className="animate-spin-slow" />} Remove
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
