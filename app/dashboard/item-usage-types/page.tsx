'use client';

import React, { useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';
import type { ApiResponse, ItemUsageTypeDTO } from '@/lib/types';
import {
    Package,
    Plus,
    Search,
    Edit3,
    Trash2,
    X,
    Loader2,
    AlertCircle,
} from 'lucide-react';

export default function ItemUsageTypesPage() {
    const [list, setList] = useState<ItemUsageTypeDTO[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    const [showModal, setShowModal] = useState(false);
    const [editingType, setEditingType] = useState<ItemUsageTypeDTO | null>(null);
    const [formData, setFormData] = useState({ name: '', description: '', status: 'ACTIVE' });
    const [isSaving, setIsSaving] = useState(false);
    const [formError, setFormError] = useState('');

    const [deleteTarget, setDeleteTarget] = useState<ItemUsageTypeDTO | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const loadList = useCallback(async () => {
        setIsLoading(true);
        try {
            const { data } = await api.get<ApiResponse<ItemUsageTypeDTO[]>>('/api/item-usage-types');
            if (data?.payload) {
                setList(data.payload || []);
            }
        } catch (error) {
            console.error('Failed to load item usage types', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadList();
    }, [loadList]);

    const filteredList = list.filter(
        (t) =>
            t.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const openCreateModal = () => {
        setEditingType(null);
        setFormData({ name: '', description: '', status: 'ACTIVE' });
        setFormError('');
        setShowModal(true);
    };

    const openEditModal = (row: ItemUsageTypeDTO) => {
        setEditingType(row);
        setFormData({
            name: row.name || '',
            description: row.description || '',
            status: row.status || 'ACTIVE',
        });
        setFormError('');
        setShowModal(true);
    };

    const handleSave = async () => {
        if (!formData.name.trim()) {
            setFormError('Name is required');
            return;
        }
        setIsSaving(true);
        setFormError('');
        try {
            if (editingType) {
                await api.put(`/api/item-usage-types/${editingType.id}`, formData);
            } else {
                await api.post('/api/item-usage-types', formData);
            }
            setShowModal(false);
            loadList();
        } catch (error: any) {
            setFormError(error?.response?.data?.message || 'Failed to save');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        setIsDeleting(true);
        try {
            await api.delete(`/api/item-usage-types/${deleteTarget.id}`);
            setDeleteTarget(null);
            loadList();
        } catch (error) {
            console.error('Failed to delete', error);
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="animate-fade-in">
            <div className="animate-fade-in-up" style={{ marginBottom: 28 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
                    <div>
                        <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4, letterSpacing: '-0.02em' }}>
                            Item usage types
                        </h1>
                        <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: 0 }}>
                            Define how items are used in your business (e.g. Consumable, Non-Consumable) ({list.length} total)
                        </p>
                    </div>
                    <button className="btn-primary" onClick={openCreateModal} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Plus size={18} />
                        Add usage type
                    </button>
                </div>
            </div>

            <div className="animate-fade-in-up delay-1" style={{ marginBottom: 20 }}>
                <div style={{ position: 'relative', maxWidth: 400 }}>
                    <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                        type="text"
                        placeholder="Search usage types..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="input-field"
                        style={{ paddingLeft: 40, width: '100%' }}
                    />
                </div>
            </div>

            <div className="glass-card animate-fade-in-up delay-2" style={{ padding: 0, overflow: 'hidden' }}>
                {isLoading ? (
                    <div style={{ padding: 32 }}>
                        {Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="skeleton" style={{ width: '100%', height: 56, marginBottom: 8, borderRadius: 8 }} />
                        ))}
                    </div>
                ) : filteredList.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
                        <Package size={48} style={{ opacity: 0.2, marginBottom: 16 }} />
                        <p style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>No usage types yet</p>
                        <p style={{ fontSize: 14 }}>Create usage types (e.g. Consumable, Non-Consumable) to use when adding items</p>
                    </div>
                ) : (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Description</th>
                                <th>Status</th>
                                <th>Created</th>
                                <th style={{ textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredList.map((row) => (
                                <tr key={row.id}>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                            <div
                                                style={{
                                                    width: 36,
                                                    height: 36,
                                                    borderRadius: 10,
                                                    background: 'rgba(139,92,246,0.1)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    color: 'var(--accent-purple)',
                                                    flexShrink: 0,
                                                }}
                                            >
                                                <Package size={18} />
                                            </div>
                                            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{row.name}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ fontSize: 13, color: 'var(--text-secondary)', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {row.description || '—'}
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`badge ${row.status === 'ACTIVE' ? 'badge-success' : 'badge-warning'}`}>
                                            {row.status}
                                        </span>
                                    </td>
                                    <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                                        {row.createdDate ? new Date(row.createdDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
                                            <button onClick={() => openEditModal(row)} className="icon-btn" title="Edit">
                                                <Edit3 size={16} />
                                            </button>
                                            <button
                                                onClick={() => setDeleteTarget(row)}
                                                className="icon-btn"
                                                title="Delete"
                                                style={{ color: 'var(--accent-red)' }}
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
            </div>

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
                    <div className="glass-card animate-fade-in-up" style={{ width: '100%', maxWidth: 480, padding: 0 }} onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                            <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                                {editingType ? 'Edit usage type' : 'Create usage type'}
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
                                    <label className="input-label">Name *</label>
                                    <input
                                        className="input-field"
                                        placeholder="e.g. Consumable, Non-Consumable"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="input-label">Description</label>
                                    <textarea
                                        className="input-field"
                                        placeholder="Optional description"
                                        value={formData.description || ''}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        rows={3}
                                        style={{ resize: 'none' }}
                                    />
                                </div>
                                <div>
                                    <label className="input-label">Status</label>
                                    <select
                                        className="input-field"
                                        value={formData.status || 'ACTIVE'}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                    >
                                        <option value="ACTIVE">Active</option>
                                        <option value="INACTIVE">Inactive</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '16px 24px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                            <button className="btn-secondary" onClick={() => setShowModal(false)} disabled={isSaving}>
                                Cancel
                            </button>
                            <button className="btn-primary" onClick={handleSave} disabled={isSaving} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                {isSaving && <Loader2 size={16} className="animate-spin-slow" />}
                                {editingType ? 'Update' : 'Create'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete confirmation */}
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
                    <div className="glass-card animate-fade-in-up" style={{ maxWidth: 400, padding: 24 }} onClick={(e) => e.stopPropagation()}>
                        <p style={{ marginBottom: 20, color: 'var(--text-secondary)' }}>
                            Delete usage type &quot;{deleteTarget.name}&quot;? Items using it may be affected.
                        </p>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                            <button className="btn-secondary" onClick={() => setDeleteTarget(null)} disabled={isDeleting}>
                                Cancel
                            </button>
                            <button
                                className="btn-primary"
                                onClick={handleDelete}
                                disabled={isDeleting}
                                style={{ background: 'var(--accent-red)', display: 'flex', alignItems: 'center', gap: 8 }}
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
