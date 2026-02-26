'use client';

import React, { useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';
import type { ApiResponse, PageResponse, CategoryDTO, CreateCategoryMeRequest } from '@/lib/types';
import {
    Tags,
    Plus,
    Search,
    Edit3,
    Trash2,
    X,
    ChevronLeft,
    ChevronRight,
    Loader2,
    AlertCircle,
    FileText,
} from 'lucide-react';

export default function CategoriesPage() {
    const [categories, setCategories] = useState<CategoryDTO[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [editingCategory, setEditingCategory] = useState<CategoryDTO | null>(null);
    const [formData, setFormData] = useState<CreateCategoryMeRequest>({
        categoryName: '',
        description: '',
        status: 'ACTIVE',
    });
    const [isSaving, setIsSaving] = useState(false);
    const [formError, setFormError] = useState('');

    // Delete state
    const [deleteTarget, setDeleteTarget] = useState<CategoryDTO | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const loadCategories = useCallback(async () => {
        setIsLoading(true);
        try {
            const { data } = await api.get<ApiResponse<CategoryDTO[]>>('/api/categories');
            if (data?.payload) {
                setCategories(data.payload || []);
            }
        } catch (error) {
            console.error('Failed to load categories:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadCategories();
    }, [loadCategories]);

    const filteredCategories = categories.filter(
        (c) =>
            c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const openCreateModal = () => {
        setEditingCategory(null);
        setFormData({ categoryName: '', description: '', status: 'ACTIVE' });
        setFormError('');
        setShowModal(true);
    };

    const openEditModal = (category: CategoryDTO) => {
        setEditingCategory(category);
        setFormData({
            categoryName: category.name || '',
            description: category.description || '',
            status: category.status || 'ACTIVE',
        });
        setFormError('');
        setShowModal(true);
    };

    const handleSave = async () => {
        if (!formData.categoryName.trim()) {
            setFormError('Category name is required');
            return;
        }
        setIsSaving(true);
        setFormError('');
        try {
            if (editingCategory) {
                await api.put(`/api/categories/${editingCategory.id}`, formData);
            } else {
                await api.post('/api/categories', formData);
            }
            setShowModal(false);
            loadCategories();
        } catch (error: any) {
            setFormError(error?.response?.data?.message || 'Failed to save category');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        setIsDeleting(true);
        try {
            await api.delete(`/api/categories/${deleteTarget.id}`);
            setDeleteTarget(null);
            loadCategories();
        } catch (error) {
            console.error('Failed to delete category:', error);
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="animate-fade-in">
            {/* Page Header */}
            <div className="animate-fade-in-up" style={{ marginBottom: 28 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
                    <div>
                        <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4, letterSpacing: '-0.02em' }}>
                            Categories
                        </h1>
                        <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: 0 }}>
                            Group your items for better organization ({categories.length} total)
                        </p>
                    </div>
                    <button className="btn-primary" onClick={openCreateModal} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Plus size={18} />
                        Add Category
                    </button>
                </div>
            </div>

            {/* Search Bar */}
            <div className="animate-fade-in-up delay-1" style={{ marginBottom: 20 }}>
                <div style={{ position: 'relative', maxWidth: 400 }}>
                    <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                        type="text"
                        placeholder="Search categories..."
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
                ) : filteredCategories.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
                        <Tags size={48} style={{ opacity: 0.2, marginBottom: 16 }} />
                        <p style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>No categories found</p>
                        <p style={{ fontSize: 14 }}>Create categories to start organizing your inventory</p>
                    </div>
                ) : (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Category Name</th>
                                <th>Description</th>
                                <th>Status</th>
                                <th>Created Date</th>
                                <th style={{ textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredCategories.map((category) => (
                                <tr key={category.id}>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                            <div
                                                style={{
                                                    width: 36,
                                                    height: 36,
                                                    borderRadius: 10,
                                                    background: 'rgba(6,182,212,0.1)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    color: 'var(--accent-cyan)',
                                                    flexShrink: 0,
                                                }}
                                            >
                                                <Tags size={18} />
                                            </div>
                                            <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{category.name}</div>
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ fontSize: 13, color: 'var(--text-secondary)', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {category.description || '—'}
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`badge ${category.status === 'ACTIVE' ? 'badge-success' : 'badge-warning'}`}>
                                            {category.status}
                                        </span>
                                    </td>
                                    <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                                        {new Date(category.createdDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
                                            <button onClick={() => openEditModal(category)} className="icon-btn" title="Edit">
                                                <Edit3 size={16} />
                                            </button>
                                            <button
                                                onClick={() => setDeleteTarget(category)}
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
                                {editingCategory ? 'Edit Category' : 'Create Category'}
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
                                    <label className="input-label">Category Name *</label>
                                    <input
                                        className="input-field"
                                        placeholder="Electronics, Groceries, etc."
                                        value={formData.categoryName}
                                        onChange={(e) => setFormData({ ...formData, categoryName: e.target.value })}
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
                            <button className="btn-primary" onClick={handleSave} disabled={isSaving}>
                                {isSaving && <Loader2 size={16} className="animate-spin-slow" />}
                                {editingCategory ? 'Update' : 'Create'}
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
                            <Trash2 size={26} color="var(--accent-red)" />
                        </div>
                        <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>
                            Delete Category
                        </h3>
                        <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 24 }}>
                            Are you sure you want to delete <strong style={{ color: 'var(--text-primary)' }}>{deleteTarget.name}</strong>?
                            Items in this category will need to be reassigned.
                        </p>
                        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                            <button className="btn-secondary" onClick={() => setDeleteTarget(null)} disabled={isDeleting}>
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={isDeleting}
                                className="btn-primary"
                                style={{ background: 'var(--accent-red)', boxShadow: 'none' }}
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
