'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { bizGet, bizPost, bizPut, bizDelete } from '@/lib/biz-api';
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
} from 'lucide-react';

export default function BizRolesPage() {
    const { user, currentUser } = useAuth();
    const bizId = currentUser?.bizId ?? user?.bizId;

    const [roles, setRoles] = useState<RoleDTO[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const pageSize = 10;

    const [showModal, setShowModal] = useState(false);
    const [editingRole, setEditingRole] = useState<RoleDTO | null>(null);
    const [formData, setFormData] = useState<CreateRoleRequest>({
        roleName: '',
        description: '',
        status: 'ACTIVE',
    });
    const [isSaving, setIsSaving] = useState(false);
    const [formError, setFormError] = useState('');

    const [deleteTarget, setDeleteTarget] = useState<RoleDTO | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const [showPermissionModal, setShowPermissionModal] = useState(false);
    const [permissionRole, setPermissionRole] = useState<RoleDTO | null>(null);
    const [allMenus, setAllMenus] = useState<SystemMenuDTO[]>([]);
    const [selectedMenus, setSelectedMenus] = useState<number[]>([]);
    const [isSavingPermissions, setIsSavingPermissions] = useState(false);
    const [isLoadingMenus, setIsLoadingMenus] = useState(false);

    const loadRoles = useCallback(async () => {
        if (!bizId) return;
        setIsLoading(true);
        try {
            const { data } = await bizGet<ApiResponse<PageResponse<RoleDTO>>>(
                bizId,
                '/roles',
                '/api/roles',
                { params: { page, size: pageSize, sort: 'id,desc' } }
            );
            if (data?.payload) {
                const p = data.payload;
                const content = p.content ?? (Array.isArray(p) ? p : []);
                const total = 'totalElements' in p ? p.totalElements : content.length;
                const totalP = 'totalPages' in p ? p.totalPages : Math.ceil(total / pageSize) || 1;
                setRoles(content);
                setTotalPages(totalP);
                setTotalElements(total);
            }
        } catch (error) {
            console.error('Failed to load roles:', error);
        } finally {
            setIsLoading(false);
        }
    }, [bizId, page]);

    const loadAllMenus = useCallback(async () => {
        if (!bizId) return;
        try {
            const { data } = await bizGet<ApiResponse<SystemMenuDTO[]>>(
                bizId,
                '/menus/assignable',
                '/api/menus'
            );
            if (data?.payload) {
                setAllMenus(Array.isArray(data.payload) ? data.payload : (data.payload as { content?: SystemMenuDTO[] })?.content || []);
            }
        } catch (error) {
            console.error('Failed to load menus:', error);
        } finally {
            setIsLoadingMenus(false);
        }
    }, [bizId]);

    useEffect(() => {
        if (bizId) {
            loadRoles();
            setIsLoadingMenus(true);
            loadAllMenus();
        }
    }, [bizId, loadRoles, loadAllMenus]);

    const openPermissionModal = async (role: RoleDTO) => {
        setPermissionRole(role);
        setSelectedMenus([]);
        setShowPermissionModal(true);
        if (!bizId) return;
        try {
            const { data } = await bizGet<ApiResponse<SystemMenuDTO[]>>(
                bizId,
                `/roles/${role.id}/menus`,
                `/api/roles/${role.id}/menus`
            );
            if (data?.payload) {
                const menus = Array.isArray(data.payload) ? data.payload : (data.payload as { content?: SystemMenuDTO[] })?.content || [];
                setSelectedMenus(menus.map((m: SystemMenuDTO) => m.id));
            }
        } catch (error) {
            console.error('Failed to load role menus:', error);
        }
    };

    const handleSavePermissions = async () => {
        if (!permissionRole || !bizId) return;
        setIsSavingPermissions(true);
        try {
            await bizPost(
                bizId,
                `/roles/${permissionRole.id}/menus`,
                `/api/roles/${permissionRole.id}/menus`,
                { menuIds: selectedMenus }
            );
            setShowPermissionModal(false);
        } catch (error) {
            console.error('Failed to save permissions:', error);
        } finally {
            setIsSavingPermissions(false);
        }
    };

    const toggleMenu = (menuId: number) => {
        const isSelected = selectedMenus.includes(menuId);
        const getChildIds = (parentId: number): number[] => {
            const children = allMenus.filter(m => m.parentId === parentId);
            let ids = children.map(c => c.id);
            children.forEach(c => { ids = [...ids, ...getChildIds(c.id)]; });
            return ids;
        };
        const childrenToToggle = getChildIds(menuId);
        if (isSelected) {
            setSelectedMenus(prev => prev.filter(id => id !== menuId && !childrenToToggle.includes(id)));
        } else {
            setSelectedMenus(prev => {
                const newSelection = [...prev, menuId];
                childrenToToggle.forEach(cid => { if (!newSelection.includes(cid)) newSelection.push(cid); });
                return newSelection;
            });
            const menu = allMenus.find(m => m.id === menuId);
            if (menu?.parentId && !selectedMenus.includes(menu.parentId)) {
                setSelectedMenus(prev => [...prev, menu.parentId!]);
            }
        }
    };

    const menuTree = React.useMemo(() => {
        const menuMap: Record<number, any> = {};
        const roots: any[] = [];
        allMenus.forEach(m => { menuMap[m.id] = { ...m, children: [] }; });
        allMenus.forEach(m => {
            if (m.parentId && menuMap[m.parentId]) menuMap[m.parentId].children.push(menuMap[m.id]);
            else roots.push(menuMap[m.id]);
        });
        const sortItems = (items: any[]) => {
            items.sort((a, b) => (a.sorting || 0) - (b.sorting || 0));
            items.forEach(item => { if (item.children?.length) sortItems(item.children); });
            return items;
        };
        return sortItems(roots);
    }, [allMenus]);

    const filteredRoles = roles.filter(
        r => r.roleName?.toLowerCase().includes(searchQuery.toLowerCase()) || r.description?.toLowerCase().includes(searchQuery.toLowerCase()),
    );

    const openCreateModal = () => {
        setEditingRole(null);
        setFormData({ roleName: '', description: '', status: 'ACTIVE' });
        setFormError('');
        setShowModal(true);
    };

    const openEditModal = (role: RoleDTO) => {
        setEditingRole(role);
        setFormData({ roleName: role.roleName || '', description: role.description || '', status: role.status || 'ACTIVE' });
        setFormError('');
        setShowModal(true);
    };

    const handleSave = async () => {
        if (!formData.roleName.trim()) { setFormError('Role name is required'); return; }
        if (!bizId) return;
        setIsSaving(true);
        setFormError('');
        try {
            if (editingRole) {
                await bizPut(bizId, `/roles/${editingRole.id}`, `/api/roles/${editingRole.id}`, formData);
            } else {
                await bizPost(bizId, '/roles', '/api/roles', formData);
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
        if (!deleteTarget || !bizId) return;
        setIsDeleting(true);
        try {
            await bizDelete(bizId, `/roles/${deleteTarget.id}`, `/api/roles/${deleteTarget.id}`);
            setDeleteTarget(null);
            loadRoles();
        } catch (error) {
            console.error('Failed to delete:', error);
        } finally {
            setIsDeleting(false);
        }
    };

    if (!bizId) {
        return (
            <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--text-muted)' }}>
                <Shield size={56} style={{ opacity: 0.2, marginBottom: 16 }} />
                <h2 style={{ color: 'var(--text-primary)', fontSize: 20, fontWeight: 700, marginBottom: 8 }}>No Business Selected</h2>
                <p style={{ fontSize: 14 }}>Your account is not associated with a business. Contact your administrator.</p>
            </div>
        );
    }

    return (
        <div>
            <div className="animate-fade-in-up" style={{ marginBottom: 28 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
                    <div>
                        <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4, letterSpacing: '-0.02em' }}>
                            Business Roles
                        </h1>
                        <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: 0 }}>
                            Create and manage roles for your business, then set permissions and assign to staff ({totalElements} total)
                        </p>
                    </div>
                    <button className="btn-primary" onClick={openCreateModal} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Plus size={18} />
                        Add Role
                    </button>
                </div>
            </div>

            <div style={{ marginBottom: 20 }}>
                <div style={{ position: 'relative', flex: 1, maxWidth: 400 }}>
                    <Search size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
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
                ) : filteredRoles.length === 0 ? (
                    <div style={{ padding: 60, textAlign: 'center' }}>
                        <Shield size={48} style={{ opacity: 0.1, marginBottom: 16 }} />
                        <p style={{ color: 'var(--text-muted)' }}>No roles match your search. Create a role to assign to staff.</p>
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
                            {filteredRoles.map((role) => (
                                <tr key={role.id}>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(6,182,212,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-cyan)' }}>
                                                <Shield size={16} />
                                            </div>
                                            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{role.roleName}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ fontSize: 13, color: 'var(--text-secondary)', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {role.description || '—'}
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`badge ${role.status === 'ACTIVE' ? 'badge-success' : 'badge-danger'}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                            {role.status === 'ACTIVE' ? <ShieldCheck size={10} /> : <ShieldAlert size={10} />}
                                            {role.status}
                                        </span>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
                                            <button onClick={() => openPermissionModal(role)} className="icon-btn" title="Manage Permissions" style={{ color: 'var(--accent-cyan)' }}>
                                                <LockIcon size={16} />
                                            </button>
                                            <button onClick={() => openEditModal(role)} className="icon-btn" title="Edit"><Edit3 size={16} /></button>
                                            <button onClick={() => setDeleteTarget(role)} className="icon-btn" title="Delete" style={{ color: '#f87171' }}><Trash2 size={16} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}

                {totalPages > 1 && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderTop: '1px solid rgba(255,255,255,0.04)', fontSize: 13, color: 'var(--text-muted)' }}>
                        <span>Showing {page * pageSize + 1}–{Math.min((page + 1) * pageSize, totalElements)} of {totalElements}</span>
                        <div style={{ display: 'flex', gap: 6 }}>
                            <button className="icon-btn" disabled={page === 0} onClick={() => setPage(p => p - 1)} style={{ opacity: page === 0 ? 0.3 : 1 }}><ChevronLeft size={16} /></button>
                            {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
                                const p = page < 3 ? i : page - 2 + i;
                                if (p >= totalPages) return null;
                                return (
                                    <button key={p} className="icon-btn" onClick={() => setPage(p)} style={{ background: p === page ? 'var(--accent-cyan)' : undefined, color: p === page ? '#000' : undefined, fontWeight: p === page ? 700 : 500, minWidth: 32 }}>{p + 1}</button>
                                );
                            })}
                            <button className="icon-btn" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)} style={{ opacity: page >= totalPages - 1 ? 0.3 : 1 }}><ChevronRight size={16} /></button>
                        </div>
                    </div>
                )}
            </div>

            {/* Create / Edit Modal */}
            {showModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setShowModal(false)}>
                    <div className="glass-card animate-fade-in-up" style={{ width: '100%', maxWidth: 480, padding: 0 }} onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                            <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{editingRole ? 'Edit Role' : 'Create Role'}</h2>
                            <button className="icon-btn" onClick={() => setShowModal(false)}><X size={18} /></button>
                        </div>
                        <div style={{ padding: '24px' }}>
                            {formError && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 8, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171', fontSize: 13, marginBottom: 20 }}>
                                    <AlertCircle size={14} />{formError}
                                </div>
                            )}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                <div>
                                    <label className="input-label">Role Name *</label>
                                    <input className="input-field" placeholder="e.g. MANAGER, CASHIER" value={formData.roleName} onChange={(e) => setFormData({ ...formData, roleName: e.target.value })} style={{ width: '100%' }} />
                                </div>
                                <div>
                                    <label className="input-label">Description</label>
                                    <textarea className="input-field" placeholder="Role responsibilities..." value={formData.description || ''} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} style={{ width: '100%', resize: 'none' }} />
                                </div>
                                <div>
                                    <label className="input-label">Status</label>
                                    <select className="input-field" value={formData.status || 'ACTIVE'} onChange={(e) => setFormData({ ...formData, status: e.target.value })} style={{ width: '100%' }}>
                                        <option value="ACTIVE">Active</option>
                                        <option value="INACTIVE">Inactive</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10, padding: '16px 24px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                            <button className="btn-secondary" onClick={() => setShowModal(false)} disabled={isSaving}>Cancel</button>
                            <button className="btn-primary" onClick={handleSave} disabled={isSaving} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>{isSaving && <Loader2 size={16} className="animate-spin-slow" />}{editingRole ? 'Update Role' : 'Create Role'}</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete confirmation */}
            {deleteTarget && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setDeleteTarget(null)}>
                    <div className="glass-card animate-fade-in-up" style={{ width: '100%', maxWidth: 400, padding: 28, textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                        <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}><Trash2 size={26} color="#f87171" /></div>
                        <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>Delete Role</h3>
                        <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 24 }}>Are you sure you want to delete <strong style={{ color: 'var(--text-primary)' }}>{deleteTarget.roleName}</strong>?</p>
                        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                            <button className="btn-secondary" onClick={() => setDeleteTarget(null)} disabled={isDeleting}>Cancel</button>
                            <button onClick={handleDelete} disabled={isDeleting} className="btn-primary" style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)', border: 'none' }}>{isDeleting && <Loader2 size={16} className="animate-spin-slow" />}Delete</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Permission modal */}
            {showPermissionModal && permissionRole && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setShowPermissionModal(false)}>
                    <div className="glass-card animate-fade-in-up" style={{ width: '100%', maxWidth: 640, padding: 0 }} onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                            <div>
                                <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Role Permissions</h2>
                                <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>Menus for <span style={{ color: 'var(--accent-cyan)', fontWeight: 600 }}>{permissionRole.roleName}</span></p>
                            </div>
                            <button className="icon-btn" onClick={() => setShowPermissionModal(false)}><X size={18} /></button>
                        </div>
                        <div style={{ padding: '24px', maxHeight: '64vh', overflowY: 'auto' }}>
                            {isLoadingMenus ? (
                                <div style={{ padding: 40, textAlign: 'center' }}><Loader2 size={24} className="animate-spin-slow" style={{ color: 'var(--accent-cyan)' }} /><p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Loading menus...</p></div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                    {menuTree.map((menu: any) => (
                                        <div key={menu.id}>
                                            <div
                                                onClick={() => toggleMenu(menu.id)}
                                                style={{
                                                    padding: '14px 18px',
                                                    borderRadius: 14,
                                                    background: selectedMenus.includes(menu.id) ? 'rgba(6,182,212,0.1)' : 'rgba(255,255,255,0.02)',
                                                    border: '1px solid',
                                                    borderColor: selectedMenus.includes(menu.id) ? 'rgba(6,182,212,0.4)' : 'rgba(255,255,255,0.06)',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 16,
                                                }}
                                            >
                                                <div style={{ width: 20, height: 20, borderRadius: 6, border: '2.5px solid', borderColor: selectedMenus.includes(menu.id) ? 'var(--accent-cyan)' : 'var(--text-muted)', background: selectedMenus.includes(menu.id) ? 'var(--accent-cyan)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    {selectedMenus.includes(menu.id) && <Plus size={14} color="#000" strokeWidth={4} style={{ transform: 'rotate(45deg)' }} />}
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>{menu.menuName}</div>
                                                    {menu.description && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{menu.description}</div>}
                                                </div>
                                            </div>
                                            {menu.children?.length > 0 && (
                                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10, paddingLeft: 24, marginTop: 8 }}>
                                                    {menu.children.map((child: any) => (
                                                        <div key={child.id} onClick={() => toggleMenu(child.id)} style={{ padding: '10px 14px', borderRadius: 10, background: selectedMenus.includes(child.id) ? 'rgba(59,130,246,0.1)' : 'rgba(255,255,255,0.01)', border: `1px solid ${selectedMenus.includes(child.id) ? 'rgba(59,130,246,0.3)' : 'rgba(255,255,255,0.04)'}`, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}>
                                                            <div style={{ width: 16, height: 16, borderRadius: 4, border: '2px solid', borderColor: selectedMenus.includes(child.id) ? 'var(--accent-blue)' : 'rgba(148,163,184,0.4)', background: selectedMenus.includes(child.id) ? 'var(--accent-blue)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                                {selectedMenus.includes(child.id) && <Plus size={10} color="#000" strokeWidth={4} style={{ transform: 'rotate(45deg)' }} />}
                                                            </div>
                                                            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{child.menuName}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10, padding: '16px 24px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                            <button className="btn-secondary" onClick={() => setShowPermissionModal(false)} disabled={isSavingPermissions}>Cancel</button>
                            <button className="btn-primary" onClick={handleSavePermissions} disabled={isSavingPermissions} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>{isSavingPermissions && <Loader2 size={16} className="animate-spin-slow" />}Save Permissions</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
