'use client';

import React, { useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';
import type { ApiResponse, PageResponse, RoleDTO, CreateRoleRequest, SystemMenuDTO } from '@/lib/types';
import {
    Shield,
    Plus,
    Search,
    Edit3,
    Trash2,
    X,
    ChevronLeft,
    ChevronRight,
    Loader2,
    AlertCircle,
    ShieldCheck,
    ShieldAlert,
    Lock as LockIcon,
    History as HistoryIcon,
} from 'lucide-react';

export default function RolesPage() {
    const [roles, setRoles] = useState<RoleDTO[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const pageSize = 10;

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [editingRole, setEditingRole] = useState<RoleDTO | null>(null);
    const [formData, setFormData] = useState<CreateRoleRequest>({
        roleName: '',
        description: '',
        status: 'ACTIVE',
    });
    const [isSaving, setIsSaving] = useState(false);
    const [formError, setFormError] = useState('');

    // Delete state
    const [deleteTarget, setDeleteTarget] = useState<RoleDTO | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [activeTab, setActiveTab] = useState<'roles' | 'history'>('roles');

    // Permission state
    const [showPermissionModal, setShowPermissionModal] = useState(false);
    const [permissionRole, setPermissionRole] = useState<RoleDTO | null>(null);
    const [allMenus, setAllMenus] = useState<SystemMenuDTO[]>([]);
    const [selectedMenus, setSelectedMenus] = useState<number[]>([]);
    const [isSavingPermissions, setIsSavingPermissions] = useState(false);
    const [isLoadingMenus, setIsLoadingMenus] = useState(false);

    const loadRoles = useCallback(async () => {
        setIsLoading(true);
        try {
            const { data } = await api.get<ApiResponse<PageResponse<RoleDTO> | RoleDTO[]>>('/api/roles');
            if (data?.payload) {
                const p = data.payload;
                const list = Array.isArray(p) ? p : (p as PageResponse<RoleDTO>).content || [];
                setRoles(list);
                setTotalElements(list.length);
                setTotalPages(Math.ceil(list.length / pageSize) || 1);
            }
        } catch (error) {
            console.error('Failed to load roles:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const loadAllMenus = async () => {
        setIsLoadingMenus(true);
        try {
            const { data } = await api.get<ApiResponse<SystemMenuDTO[]>>('/api/menus');
            if (data?.payload) {
                setAllMenus(Array.isArray(data.payload) ? data.payload : (data.payload as { content?: SystemMenuDTO[] })?.content || []);
            }
        } catch (error) {
            console.error('Failed to load menus:', error);
        } finally {
            setIsLoadingMenus(false);
        }
    };

    useEffect(() => {
        loadRoles();
        loadAllMenus();
    }, [loadRoles]);

    const openPermissionModal = async (role: RoleDTO) => {
        setPermissionRole(role);
        setSelectedMenus([]); // Reset
        setShowPermissionModal(true);

        try {
            // Load menus already assigned to this role
            const { data } = await api.get<ApiResponse<SystemMenuDTO[]>>(`/api/roles/${role.id}/menus`);
            if (data?.payload) {
                setSelectedMenus(data.payload.map(m => m.id));
            }
        } catch (error) {
            console.error('Failed to load role menus:', error);
        }
    };

    const handleSavePermissions = async () => {
        if (!permissionRole) return;
        setIsSavingPermissions(true);
        try {
            await api.post(`/api/roles/${permissionRole.id}/menus`, {
                menuIds: selectedMenus
            });
            setShowPermissionModal(false);
        } catch (error) {
            console.error('Failed to save permissions:', error);
        } finally {
            setIsSavingPermissions(false);
        }
    };

    const toggleMenu = (menuId: number) => {
        const isSelected = selectedMenus.includes(menuId);

        // Find children to toggle as well
        const getChildIds = (parentId: number): number[] => {
            const children = allMenus.filter(m => m.parentId === parentId);
            let ids = children.map(c => c.id);
            children.forEach(c => {
                ids = [...ids, ...getChildIds(c.id)];
            });
            return ids;
        };

        const childrenToToggle = getChildIds(menuId);

        if (isSelected) {
            // Unselect self and all children
            setSelectedMenus(prev => prev.filter(id => id !== menuId && !childrenToToggle.includes(id)));
        } else {
            // Select self and all children
            setSelectedMenus(prev => {
                const newSelection = [...prev, menuId];
                childrenToToggle.forEach(cid => {
                    if (!newSelection.includes(cid)) newSelection.push(cid);
                });
                return newSelection;
            });

            // If parent is not selected, we might want to select it too? 
            // Usually in RBAC, selecting a child requires parent access.
            const menu = allMenus.find(m => m.id === menuId);
            if (menu?.parentId) {
                setSelectedMenus(prev => prev.includes(menu.parentId!) ? prev : [...prev, menu.parentId!]);
            }
        }
    };

    const menuTree = React.useMemo(() => {
        const menuMap: Record<number, any> = {};
        const roots: any[] = [];

        allMenus.forEach(m => {
            menuMap[m.id] = { ...m, children: [] };
        });

        allMenus.forEach(m => {
            if (m.parentId && menuMap[m.parentId]) {
                menuMap[m.parentId].children.push(menuMap[m.id]);
            } else {
                roots.push(menuMap[m.id]);
            }
        });

        const sortItems = (items: any[]) => {
            items.sort((a, b) => (a.sorting || 0) - (b.sorting || 0));
            items.forEach(item => {
                if (item.children.length > 0) sortItems(item.children);
            });
            return items;
        };

        return sortItems(roots);
    }, [allMenus]);

    const filteredRoles = roles.filter(
        (r) =>
            r.roleName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            r.description?.toLowerCase().includes(searchQuery.toLowerCase()),
    );
    // Client-side pagination (backend returns full list from GET /api/roles)
    const displayTotal = filteredRoles.length;
    const displayTotalPages = Math.ceil(displayTotal / pageSize) || 1;
    const paginatedRoles = React.useMemo(() => {
        const start = page * pageSize;
        return filteredRoles.slice(start, start + pageSize);
    }, [filteredRoles, page, pageSize]);

    const openCreateModal = () => {
        setEditingRole(null);
        setFormData({ roleName: '', description: '', status: 'ACTIVE' });
        setFormError('');
        setShowModal(true);
    };

    const openEditModal = (role: RoleDTO) => {
        setEditingRole(role);
        setFormData({
            roleName: role.roleName || '',
            description: role.description || '',
            status: role.status || 'ACTIVE',
        });
        setFormError('');
        setShowModal(true);
    };

    const handleSave = async () => {
        if (!formData.roleName.trim()) {
            setFormError('Role name is required');
            return;
        }
        setIsSaving(true);
        setFormError('');
        try {
            if (editingRole) {
                await api.put(`/api/roles/${editingRole.id}`, formData);
            } else {
                await api.post('/api/roles', formData);
            }
            setShowModal(false);
            loadRoles();
        } catch (error: any) {
            setFormError(error?.response?.data?.message || 'Failed to save role');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        setIsDeleting(true);
        try {
            await api.delete(`/api/roles/${deleteTarget.id}`);
            setDeleteTarget(null);
            loadRoles();
        } catch (error) {
            console.error('Failed to delete:', error);
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div>
            {/* Page Header */}
            <div className="animate-fade-in-up" style={{ marginBottom: 28 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
                    <div>
                        <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4, letterSpacing: '-0.02em' }}>
                            Roles Management
                        </h1>
                        <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: 0 }}>
                            Manage user roles and system permissions ({displayTotal} total)
                        </p>
                    </div>
                    <button className="btn-primary" onClick={openCreateModal} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Plus size={18} />
                        Add Role
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: 24 }}>
                <button
                    onClick={() => setActiveTab('roles')}
                    style={{
                        padding: '12px 24px',
                        fontSize: 14,
                        fontWeight: 600,
                        color: activeTab === 'roles' ? 'var(--accent-cyan)' : 'var(--text-muted)',
                        background: 'none',
                        border: 'none',
                        borderBottom: activeTab === 'roles' ? '2px solid var(--accent-cyan)' : '2px solid transparent',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                    }}
                >
                    <Shield size={16} />
                    Current Roles
                </button>
                <button
                    onClick={() => setActiveTab('history')}
                    style={{
                        padding: '12px 24px',
                        fontSize: 14,
                        fontWeight: 600,
                        color: activeTab === 'history' ? 'var(--accent-cyan)' : 'var(--text-muted)',
                        background: 'none',
                        border: 'none',
                        borderBottom: activeTab === 'history' ? '2px solid var(--accent-cyan)' : '2px solid transparent',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                    }}
                >
                    <HistoryIcon size={16} />
                    Action History
                </button>
            </div>

            {activeTab === 'roles' ? (
                <div className="animate-fade-in-up">
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginBottom: 20,
                            gap: 16,
                            flexWrap: 'wrap',
                        }}
                    >
                        <div style={{ position: 'relative', flex: 1, maxWidth: 400 }}>
                            <Search
                                size={18}
                                style={{
                                    position: 'absolute',
                                    left: 12,
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    color: 'var(--text-muted)',
                                }}
                            />
                            <input
                                type="text"
                                placeholder="Search roles or descriptions..."
                                className="input-field"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                style={{ paddingLeft: 40, width: '100%' }}
                            />
                        </div>
                    </div>

                    <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
                        {isLoading ? (
                            <div style={{ padding: 40, textAlign: 'center' }}>
                                <Loader2 size={32} className="animate-spin-slow" style={{ color: 'var(--accent-cyan)', margin: '0 auto 16px' }} />
                                <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Loading roles...</p>
                            </div>
                        ) : paginatedRoles.length === 0 ? (
                            <div style={{ padding: 60, textAlign: 'center' }}>
                                <Shield size={48} style={{ opacity: 0.1, marginBottom: 16 }} />
                                <p style={{ color: 'var(--text-muted)' }}>No roles match your search</p>
                            </div>
                        ) : (
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Role Name</th>
                                        <th>Description</th>
                                        <th>Status</th>
                                        <th style={{ textAlign: 'right' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedRoles.map((role) => (
                                        <tr key={role.id}>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                    <div
                                                        style={{
                                                            width: 32,
                                                            height: 32,
                                                            borderRadius: 8,
                                                            background: 'rgba(6,182,212,0.1)',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            color: 'var(--accent-cyan)',
                                                        }}
                                                    >
                                                        <Shield size={16} />
                                                    </div>
                                                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{role.roleName}</span>
                                                </div>
                                            </td>
                                            <td>
                                                <div
                                                    style={{
                                                        fontSize: 13,
                                                        color: 'var(--text-secondary)',
                                                        maxWidth: 300,
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                        whiteSpace: 'nowrap',
                                                    }}
                                                >
                                                    {role.description || 'No description provided'}
                                                </div>
                                            </td>
                                            <td>
                                                <span
                                                    className={`badge ${role.status === 'ACTIVE' ? 'badge-success' : 'badge-danger'}`}
                                                    style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                                                >
                                                    {role.status === 'ACTIVE' ? <ShieldCheck size={10} /> : <ShieldAlert size={10} />}
                                                    {role.status}
                                                </span>
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
                                                    <button onClick={() => openPermissionModal(role)} className="icon-btn" title="Manage Permissions" style={{ color: 'var(--accent-cyan)' }}>
                                                        <LockIcon size={16} />
                                                    </button>
                                                    <button onClick={() => openEditModal(role)} className="icon-btn" title="Edit">
                                                        <Edit3 size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => setDeleteTarget(role)}
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
                        {displayTotalPages > 1 && (
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
                                    Showing {page * pageSize + 1}–{Math.min((page + 1) * pageSize, displayTotal)} of {displayTotal}
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
                                    {Array.from({ length: Math.min(displayTotalPages, 5) }).map((_, i) => {
                                        const p = page < 3 ? i : page - 2 + i;
                                        if (p >= displayTotalPages) return null;
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
                                        disabled={page >= displayTotalPages - 1}
                                        onClick={() => setPage(page + 1)}
                                        style={{ opacity: page >= displayTotalPages - 1 ? 0.3 : 1 }}
                                    >
                                        <ChevronRight size={16} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="animate-fade-in-up">
                    <div className="glass-card" style={{ padding: 40, textAlign: 'center' }}>
                        <HistoryIcon size={48} style={{ opacity: 0.1, marginBottom: 16, margin: '0 auto' }} />
                        <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>Action History</h3>
                        <p style={{ color: 'var(--text-muted)', maxWidth: 400, margin: '0 auto' }}>
                            View a log of all modifications made to roles and permissions. This feature is coming soon in the next update.
                        </p>
                    </div>
                </div>
            )}

            {/* Create / Edit Modal */}
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
                        style={{ width: '100%', maxWidth: 480, padding: 0 }}
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
                            <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                                {editingRole ? 'Edit Role' : 'Create Role'}
                            </h2>
                            <button className="icon-btn" onClick={() => setShowModal(false)}>
                                <X size={18} />
                            </button>
                        </div>

                        <div style={{ padding: '24px' }}>
                            {formError && (
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
                                    {formError}
                                </div>
                            )}

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                <div>
                                    <label className="input-label">Role Name *</label>
                                    <input
                                        className="input-field"
                                        placeholder="ADMIN, MANAGER, etc."
                                        value={formData.roleName}
                                        onChange={(e) => setFormData({ ...formData, roleName: e.target.value })}
                                        style={{ width: '100%' }}
                                    />
                                </div>
                                <div>
                                    <label className="input-label">Description</label>
                                    <textarea
                                        className="input-field"
                                        placeholder="Role responsibilities..."
                                        value={formData.description || ''}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        rows={3}
                                        style={{ width: '100%', resize: 'none' }}
                                    />
                                </div>
                                <div>
                                    <label className="input-label">Status</label>
                                    <select
                                        className="input-field"
                                        value={formData.status || 'ACTIVE'}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                        style={{ width: '100%' }}
                                    >
                                        <option value="ACTIVE">Active</option>
                                        <option value="INACTIVE">Inactive</option>
                                    </select>
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
                            <button className="btn-secondary" onClick={() => setShowModal(false)} disabled={isSaving}>
                                Cancel
                            </button>
                            <button
                                className="btn-primary"
                                onClick={handleSave}
                                disabled={isSaving}
                                style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                            >
                                {isSaving && <Loader2 size={16} className="animate-spin-slow" />}
                                {editingRole ? 'Update Role' : 'Create Role'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation */}
            {deleteTarget && (
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
                    onClick={() => setDeleteTarget(null)}
                >
                    <div
                        className="glass-card animate-fade-in-up"
                        style={{ width: '100%', maxWidth: 400, padding: 28, textAlign: 'center' }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div
                            style={{
                                width: 56,
                                height: 56,
                                borderRadius: 16,
                                background: 'rgba(239,68,68,0.1)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto 20px',
                            }}
                        >
                            <Trash2 size={26} color="#f87171" />
                        </div>
                        <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>
                            Delete Role
                        </h3>
                        <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 24 }}>
                            Are you sure you want to delete <strong style={{ color: 'var(--text-primary)' }}>{deleteTarget.roleName}</strong>? This may affect users assigned to this role.
                        </p>
                        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                            <button className="btn-secondary" onClick={() => setDeleteTarget(null)} disabled={isDeleting}>
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={isDeleting}
                                className="btn-primary"
                                style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)', border: 'none' }}
                            >
                                {isDeleting && <Loader2 size={16} className="animate-spin-slow" />}
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Permission Mapping Modal */}
            {showPermissionModal && (
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
                    onClick={() => setShowPermissionModal(false)}
                >
                    <div
                        className="glass-card animate-fade-in-up"
                        style={{ width: '100%', maxWidth: 640, padding: 0 }}
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
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(6,182,212,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-cyan)' }}>
                                    <LockIcon size={20} />
                                </div>
                                <div>
                                    <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                                        Role Permissions
                                    </h2>
                                    <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
                                        Mapping menus for <span style={{ color: 'var(--accent-cyan)', fontWeight: 600 }}>{permissionRole?.roleName}</span>
                                    </p>
                                </div>
                            </div>
                            <button className="icon-btn" onClick={() => setShowPermissionModal(false)}>
                                <X size={18} />
                            </button>
                        </div>

                        <div style={{ padding: '24px', maxHeight: '64vh', overflowY: 'auto' }}>
                            {isLoadingMenus ? (
                                <div style={{ padding: 40, textAlign: 'center' }}>
                                    <Loader2 size={24} className="animate-spin-slow" style={{ color: 'var(--accent-cyan)', margin: '0 auto 8px' }} />
                                    <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Loading menu list...</p>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                    {menuTree.map((menu) => (
                                        <div key={menu.id} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                            <div
                                                onClick={() => toggleMenu(menu.id)}
                                                style={{
                                                    padding: '14px 18px',
                                                    borderRadius: 14,
                                                    background: selectedMenus.includes(menu.id) ? 'rgba(6,182,212,0.1)' : 'rgba(255,255,255,0.02)',
                                                    border: '1px solid',
                                                    borderColor: selectedMenus.includes(menu.id) ? 'rgba(6,182,212,0.4)' : 'rgba(255,255,255,0.06)',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 16,
                                                    boxShadow: selectedMenus.includes(menu.id) ? '0 4px 12px rgba(6,182,212,0.1)' : 'none'
                                                }}
                                            >
                                                <div style={{
                                                    width: 20,
                                                    height: 20,
                                                    borderRadius: 6,
                                                    border: '2.5px solid',
                                                    borderColor: selectedMenus.includes(menu.id) ? 'var(--accent-cyan)' : 'var(--text-muted)',
                                                    background: selectedMenus.includes(menu.id) ? 'var(--accent-cyan)' : 'transparent',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    transition: 'all 0.2s ease',
                                                    transform: selectedMenus.includes(menu.id) ? 'scale(1.1)' : 'scale(1)'
                                                }}>
                                                    {selectedMenus.includes(menu.id) && <Plus size={14} color="#000" strokeWidth={4} style={{ transform: 'rotate(45deg)' }} />}
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ fontSize: 15, fontWeight: 700, color: selectedMenus.includes(menu.id) ? 'var(--text-primary)' : 'var(--text-secondary)', letterSpacing: '-0.01em' }}>
                                                        {menu.menuName}
                                                    </div>
                                                    <div style={{ fontSize: 12, color: 'var(--text-muted)', opacity: 0.8, marginTop: 1 }}>
                                                        {menu.description || 'Primary access to ' + menu.menuName}
                                                    </div>
                                                </div>
                                                {menu.children.length > 0 && (
                                                    <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--accent-cyan)', background: 'rgba(6,182,212,0.1)', padding: '2px 8px', borderRadius: 10 }}>
                                                        {menu.children.length} Sub-menus
                                                    </span>
                                                )}
                                            </div>

                                            {/* Children */}
                                            {menu.children.length > 0 && (
                                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10, paddingLeft: 40, marginTop: 4 }}>
                                                    {menu.children.map((child: any) => (
                                                        <div
                                                            key={child.id}
                                                            onClick={() => toggleMenu(child.id)}
                                                            style={{
                                                                padding: '10px 14px',
                                                                borderRadius: 10,
                                                                background: selectedMenus.includes(child.id) ? 'rgba(59,130,246,0.1)' : 'rgba(255,255,255,0.01)',
                                                                border: '1px solid',
                                                                borderColor: selectedMenus.includes(child.id) ? 'rgba(59,130,246,0.3)' : 'rgba(255,255,255,0.04)',
                                                                cursor: 'pointer',
                                                                transition: 'all 0.2s ease',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: 10
                                                            }}
                                                        >
                                                            <div style={{
                                                                width: 16,
                                                                height: 16,
                                                                borderRadius: 4,
                                                                border: '2px solid',
                                                                borderColor: selectedMenus.includes(child.id) ? 'var(--accent-blue)' : 'rgba(148,163,184,0.4)',
                                                                background: selectedMenus.includes(child.id) ? 'var(--accent-blue)' : 'transparent',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                transition: 'all 0.2s ease'
                                                            }}>
                                                                {selectedMenus.includes(child.id) && <Plus size={10} color="#000" strokeWidth={4} style={{ transform: 'rotate(45deg)' }} />}
                                                            </div>
                                                            <div style={{ fontSize: 13, fontWeight: 600, color: selectedMenus.includes(child.id) ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                                                                {child.menuName}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
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
                            <button className="btn-secondary" onClick={() => setShowPermissionModal(false)} disabled={isSavingPermissions}>
                                Cancel
                            </button>
                            <button
                                className="btn-primary"
                                onClick={handleSavePermissions}
                                disabled={isSavingPermissions}
                                style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                            >
                                {isSavingPermissions && <Loader2 size={16} className="animate-spin-slow" />}
                                Save Permissions
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
