'use client';

import React, { useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';
import type { ApiResponse, PageResponse, SystemMenuDTO, CreateSystemMenuRequest } from '@/lib/types';
import {
    Menu,
    Plus,
    Search,
    Edit3,
    Trash2,
    X,
    ChevronLeft,
    ChevronRight,
    Loader2,
    AlertCircle,
    LayoutPanelTop,
    MoreHorizontal,
} from 'lucide-react';

export default function MenusPage() {
    const [menus, setMenus] = useState<SystemMenuDTO[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const pageSize = 12;

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [editingMenu, setEditingMenu] = useState<SystemMenuDTO | null>(null);
    const [formData, setFormData] = useState<CreateSystemMenuRequest>({
        menuName: '',
        description: '',
        parentId: '',
        sorting: 0,
        status: 'ACTIVE',
    });
    const [isSaving, setIsSaving] = useState(false);
    const [formError, setFormError] = useState('');

    // Delete state
    const [deleteTarget, setDeleteTarget] = useState<SystemMenuDTO | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const loadMenus = useCallback(async () => {
        setIsLoading(true);
        try {
            const { data } = await api.get<ApiResponse<PageResponse<SystemMenuDTO>>>('/api/system/menus', {
                params: { page, size: pageSize, sort: 'sorting,asc' },
            });
            if (data?.payload) {
                setMenus(data.payload.content || []);
                setTotalPages(data.payload.totalPages || 0);
                setTotalElements(data.payload.totalElements || 0);
            }
        } catch (error) {
            console.error('Failed to load menus:', error);
        } finally {
            setIsLoading(false);
        }
    }, [page]);

    useEffect(() => {
        loadMenus();
    }, [loadMenus]);

    const filteredMenus = menus.filter(
        (m) =>
            m.menuName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            m.description?.toLowerCase().includes(searchQuery.toLowerCase()),
    );

    const openCreateModal = () => {
        setEditingMenu(null);
        setFormData({ menuName: '', description: '', parentId: '', sorting: 0, status: 'ACTIVE' });
        setFormError('');
        setShowModal(true);
    };

    const openEditModal = (menu: SystemMenuDTO) => {
        setEditingMenu(menu);
        setFormData({
            menuName: menu.menuName || '',
            description: menu.description || '',
            parentId: menu.parentId ? menu.parentId.toString() : '',
            sorting: menu.sorting || 0,
            status: menu.status || 'ACTIVE',
        });
        setFormError('');
        setShowModal(true);
    };

    const handleSave = async () => {
        if (!formData.menuName.trim()) {
            setFormError('Menu name is required');
            return;
        }
        setIsSaving(true);
        setFormError('');
        try {
            if (editingMenu) {
                await api.put(`/api/system/menus/${editingMenu.id}`, formData);
            } else {
                await api.post('/api/system/menus', formData);
            }
            setShowModal(false);
            loadMenus();
        } catch (error: any) {
            setFormError(error?.response?.data?.message || 'Failed to save menu');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        setIsDeleting(true);
        try {
            await api.delete(`/api/system/menus/${deleteTarget.id}`);
            setDeleteTarget(null);
            loadMenus();
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
                            Menus Management
                        </h1>
                        <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: 0 }}>
                            Configure system navigation and menu structures ({totalElements} total)
                        </p>
                    </div>
                    <button className="btn-primary" onClick={openCreateModal} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Plus size={18} />
                        Add Menu Item
                    </button>
                </div>
            </div>

            {/* Search Bar */}
            <div className="animate-fade-in-up delay-1" style={{ marginBottom: 20 }}>
                <div style={{ position: 'relative', maxWidth: 400 }}>
                    <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                        type="text"
                        placeholder="Search menus..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="input-field"
                        style={{ paddingLeft: 40, width: '100%' }}
                    />
                </div>
            </div>

            {/* Grid of Menus */}
            <div className="animate-fade-in-up delay-2">
                {isLoading ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="skeleton" style={{ width: '100%', height: 120, borderRadius: 12 }} />
                        ))}
                    </div>
                ) : filteredMenus.length === 0 ? (
                    <div className="glass-card" style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
                        <LayoutPanelTop size={48} style={{ opacity: 0.2, marginBottom: 16 }} />
                        <p style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>No menus found</p>
                        <p style={{ fontSize: 14 }}>Add your first menu item to customize navigation</p>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
                        {filteredMenus.map((menu) => (
                            <div
                                key={menu.id}
                                className="glass-card item-card"
                                style={{
                                    padding: '20px',
                                    border: '1px solid rgba(255,255,255,0.05)',
                                    transition: 'all 0.3s ease',
                                    position: 'relative',
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                                    <div
                                        style={{
                                            width: 44,
                                            height: 44,
                                            borderRadius: 12,
                                            background: 'rgba(59,130,246,0.1)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: '#3b82f6',
                                        }}
                                    >
                                        <Menu size={20} />
                                    </div>
                                    <div style={{ display: 'flex', gap: 4 }}>
                                        <button onClick={() => openEditModal(menu)} className="icon-btn" title="Edit">
                                            <Edit3 size={15} />
                                        </button>
                                        <button onClick={() => setDeleteTarget(menu)} className="icon-btn" title="Delete" style={{ color: '#f87171' }}>
                                            <Trash2 size={15} />
                                        </button>
                                    </div>
                                </div>
                                <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
                                    {menu.menuName}
                                </h3>
                                <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', minHeight: 40 }}>
                                    {menu.description || <span style={{ opacity: 0.4 }}>No description provided.</span>}
                                </p>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <span className={`badge ${menu.status === 'ACTIVE' ? 'badge-success' : 'badge-warning'}`} style={{ fontSize: 11 }}>
                                        {menu.status}
                                    </span>
                                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                                        ID: #{menu.id}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginTop: 24,
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
                        style={{ width: '100%', maxWidth: 520, padding: 0 }}
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
                                {editingMenu ? 'Edit Menu Item' : 'Create Menu Item'}
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
                                    <label className="input-label">Menu Name *</label>
                                    <input
                                        className="input-field"
                                        placeholder="e.g., Inventory, Sales, etc."
                                        value={formData.menuName}
                                        onChange={(e) => setFormData({ ...formData, menuName: e.target.value })}
                                        style={{ width: '100%' }}
                                    />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                    <div>
                                        <label className="input-label">Sort Order</label>
                                        <input
                                            type="number"
                                            className="input-field"
                                            value={formData.sorting}
                                            onChange={(e) => setFormData({ ...formData, sorting: parseInt(e.target.value) || 0 })}
                                            style={{ width: '100%' }}
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
                                <div>
                                    <label className="input-label">Parent Menu (Optional)</label>
                                    <select
                                        className="input-field"
                                        value={formData.parentId || ''}
                                        onChange={(e) => setFormData({ ...formData, parentId: e.target.value })}
                                        style={{ width: '100%' }}
                                    >
                                        <option value="">None (Top Level)</option>
                                        {menus.filter(m => !editingMenu || m.id !== editingMenu.id).map(m => (
                                            <option key={m.id} value={m.id.toString()}>{m.menuName}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="input-label">Description</label>
                                    <textarea
                                        className="input-field"
                                        placeholder="Description of this menu..."
                                        value={formData.description || ''}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        rows={2}
                                        style={{ width: '100%', resize: 'none' }}
                                    />
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
                                {editingMenu ? 'Update Menu' : 'Create Menu'}
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
                            Delete Menu Item
                        </h3>
                        <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 24 }}>
                            Are you sure you want to delete <strong style={{ color: 'var(--text-primary)' }}>{deleteTarget.menuName}</strong>? This will remove it from the system navigation.
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
        </div>
    );
}
