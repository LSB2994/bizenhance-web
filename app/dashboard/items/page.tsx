'use client';

import React, { useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';
import type {
    ApiResponse,
    PageResponse,
    ItemDTO,
    CreateItemRequest,
    CategoryDTO,
    ItemUsageTypeDTO
} from '@/lib/types';
import {
    Package,
    Plus,
    Search,
    Edit3,
    Trash2,
    X,
    ChevronLeft,
    ChevronRight,
    Loader2,
    AlertCircle,
    Image as ImageIcon,
    Tag,
    Hash,
    DollarSign,
    Activity,
    Layers,
    Upload,
} from 'lucide-react';

export default function ItemsPage() {
    const [items, setItems] = useState<ItemDTO[]>([]);
    const [categories, setCategories] = useState<CategoryDTO[]>([]);
    const [usageTypes, setUsageTypes] = useState<ItemUsageTypeDTO[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const pageSize = 10;

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [editingItem, setEditingItem] = useState<ItemDTO | null>(null);
    const [formData, setFormData] = useState<Partial<CreateItemRequest>>({
        name: '',
        itemCode: '',
        description: '',
        image: '',
        price: 0,
        categoryId: 0,
        itemUsageTypeId: 0,
        status: 'ACTIVE',
    });
    const [isSaving, setIsSaving] = useState(false);
    const [formError, setFormError] = useState('');
    const [imageUploading, setImageUploading] = useState(false);

    // Delete state
    const [deleteTarget, setDeleteTarget] = useState<ItemDTO | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const loadData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [itemsRes, catsRes, typesRes] = await Promise.all([
                api.get<ApiResponse<PageResponse<ItemDTO>>>('/api/items', {
                    params: { page, size: pageSize, sort: 'desc' },
                }),
                api.get<ApiResponse<CategoryDTO[]>>('/api/categories'),
                api.get<ApiResponse<ItemUsageTypeDTO[]>>('/api/item-usage-types'),
            ]);

            if (itemsRes.data?.payload) {
                setItems(itemsRes.data.payload.content || []);
                setTotalPages(itemsRes.data.payload.totalPages || 0);
                setTotalElements(itemsRes.data.payload.totalElements || 0);
            }
            if (catsRes.data?.payload) {
                setCategories(catsRes.data.payload || []);
            }
            if (typesRes.data?.payload) {
                setUsageTypes(typesRes.data.payload);
            }
        } catch (error) {
            console.error('Failed to load data:', error);
        } finally {
            setIsLoading(false);
        }
    }, [page]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const filteredItems = items.filter(
        (item) =>
            item.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.itemCode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.categoryName?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const openCreateModal = () => {
        setEditingItem(null);
        setFormData({
            name: '',
            itemCode: '',
            description: '',
            image: '',
            price: 0,
            categoryId: categories[0]?.id || 0,
            itemUsageTypeId: usageTypes[0]?.id || 0,
            status: 'ACTIVE',
        });
        setFormError('');
        setShowModal(true);
    };

    const openEditModal = (item: ItemDTO) => {
        setEditingItem(item);
        setFormData({
            name: item.name || '',
            itemCode: item.itemCode || '',
            description: item.description || '',
            image: item.image || '',
            price: item.unitPrice || 0,
            categoryId: item.categoryId,
            itemUsageTypeId: item.itemUsageTypeId,
            status: item.status || 'ACTIVE',
        });
        setFormError('');
        setShowModal(true);
    };

    const handleSave = async () => {
        if (!formData.name?.trim()) {
            setFormError('Item name is required');
            return;
        }
        if (!formData.categoryId) {
            setFormError('Please select a category');
            return;
        }
        if (!formData.itemUsageTypeId) {
            setFormError('Please select a usage type');
            return;
        }

        setIsSaving(true);
        setFormError('');
        try {
            if (editingItem) {
                await api.put(`/api/items/${editingItem.id}`, formData);
            } else {
                await api.post('/api/items', formData);
            }
            setShowModal(false);
            loadData();
        } catch (error: any) {
            setFormError(error?.response?.data?.message || 'Failed to save item');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        setIsDeleting(true);
        try {
            await api.delete(`/api/items/${deleteTarget.id}`);
            setDeleteTarget(null);
            loadData();
        } catch (error) {
            console.error('Failed to delete item:', error);
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
                            Inventory Items
                        </h1>
                        <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: 0 }}>
                            Manage your products and services ({totalElements} total)
                        </p>
                    </div>
                    <button className="btn-primary" onClick={openCreateModal} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Plus size={18} />
                        Add Item
                    </button>
                </div>
            </div>

            {/* Search Bar */}
            <div className="animate-fade-in-up delay-1" style={{ marginBottom: 20 }}>
                <div style={{ position: 'relative', maxWidth: 400 }}>
                    <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                        type="text"
                        placeholder="Search by name, code, category..."
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
                            <div key={i} className="skeleton" style={{ width: '100%', height: 60, marginBottom: 8, borderRadius: 8 }} />
                        ))}
                    </div>
                ) : filteredItems.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
                        <Package size={48} style={{ opacity: 0.2, marginBottom: 16 }} />
                        <p style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>No items found</p>
                        <p style={{ fontSize: 14 }}>Add items to your inventory to start making sales</p>
                    </div>
                ) : (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Item Details</th>
                                <th>Category</th>
                                <th>Usage Type</th>
                                <th>Price</th>
                                <th>Status</th>
                                <th style={{ textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredItems.map((item) => (
                                <tr key={item.id}>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                            <div
                                                style={{
                                                    width: 44,
                                                    height: 44,
                                                    borderRadius: 10,
                                                    background: 'rgba(255,255,255,0.03)',
                                                    border: '1px solid rgba(255,255,255,0.06)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    overflow: 'hidden',
                                                    flexShrink: 0,
                                                }}
                                            >
                                                {item.image ? (
                                                    <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                ) : (
                                                    <Package size={20} style={{ opacity: 0.3 }} />
                                                )}
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 14 }}>{item.name}</div>
                                                <div style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{item.itemCode || 'No Code'}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                            <Tag size={12} style={{ color: 'var(--accent-cyan)' }} />
                                            <span style={{ fontSize: 13 }}>{item.categoryName}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <span style={{ fontSize: 12, color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: 4 }}>
                                            {item.itemUsageTypeName}
                                        </span>
                                    </td>
                                    <td>
                                        <div style={{ fontWeight: 600, color: 'var(--accent-cyan)' }}>
                                            ${(item.unitPrice || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`badge ${item.status === 'ACTIVE' ? 'badge-success' : 'badge-warning'}`}>
                                            {item.status}
                                        </span>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
                                            <button onClick={() => openEditModal(item)} className="icon-btn" title="Edit">
                                                <Edit3 size={16} />
                                            </button>
                                            <button
                                                onClick={() => setDeleteTarget(item)}
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

                {/* Pagination omitted for brevity, same as categories */}
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
                        <span>Showing {page * pageSize + 1}–{Math.min((page + 1) * pageSize, totalElements)} of {totalElements}</span>
                        <div style={{ display: 'flex', gap: 6 }}>
                            <button className="icon-btn" disabled={page === 0} onClick={() => setPage(page - 1)}><ChevronLeft size={16} /></button>
                            <button className="icon-btn" disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}><ChevronRight size={16} /></button>
                        </div>
                    </div>
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
                            <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
                                {editingItem ? <Edit3 size={18} /> : <Plus size={18} />}
                                {editingItem ? 'Edit Item' : 'Add New Item'}
                            </h2>
                            <button className="icon-btn" onClick={() => setShowModal(false)}>
                                <X size={18} />
                            </button>
                        </div>

                        <div style={{ padding: '24px', maxHeight: '75vh', overflowY: 'auto' }}>
                            {formError && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 8, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171', fontSize: 13, marginBottom: 20 }}>
                                    <AlertCircle size={14} />
                                    {formError}
                                </div>
                            )}

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                                <div style={{ gridColumn: 'span 2' }}>
                                    <label className="input-label">Item Name *</label>
                                    <input
                                        className="input-field"
                                        placeholder="Product or service name"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>

                                <div>
                                    <label className="input-label">Item Code / SKU</label>
                                    <div style={{ position: 'relative' }}>
                                        <Hash size={14} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                        <input
                                            className="input-field"
                                            style={{ paddingLeft: 36 }}
                                            placeholder="e.g. PROD-001"
                                            value={formData.itemCode}
                                            onChange={(e) => setFormData({ ...formData, itemCode: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="input-label">Price ($) *</label>
                                    <div style={{ position: 'relative' }}>
                                        <DollarSign size={14} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                        <input
                                            className="input-field"
                                            style={{ paddingLeft: 36 }}
                                            type="number"
                                            step="0.01"
                                            placeholder="0.00"
                                            value={formData.price}
                                            onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="input-label">Category *</label>
                                    <div style={{ position: 'relative' }}>
                                        <Layers size={14} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                        <select
                                            className="input-field"
                                            style={{ paddingLeft: 36 }}
                                            value={formData.categoryId}
                                            onChange={(e) => setFormData({ ...formData, categoryId: parseInt(e.target.value) })}
                                        >
                                            <option value={0} disabled>Select Category</option>
                                            {categories.map(cat => (
                                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="input-label">Usage Type *</label>
                                    <div style={{ position: 'relative' }}>
                                        <Activity size={14} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                        <select
                                            className="input-field"
                                            style={{ paddingLeft: 36 }}
                                            value={formData.itemUsageTypeId}
                                            onChange={(e) => setFormData({ ...formData, itemUsageTypeId: parseInt(e.target.value) })}
                                        >
                                            <option value={0} disabled>Select Type</option>
                                            {usageTypes.map(type => (
                                                <option key={type.id} value={type.id}>{type.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="input-label">Image</label>
                                    <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>
                                        Upload an image file (path saved after upload). No URL.
                                    </p>
                                    {formData.image ? (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                                            <img
                                                src={formData.image}
                                                alt="Item"
                                                style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)' }}
                                                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                            />
                                            <div>
                                                <button
                                                    type="button"
                                                    className="btn-secondary"
                                                    style={{ fontSize: 13, padding: '6px 12px' }}
                                                    onClick={() => setFormData({ ...formData, image: '' })}
                                                >
                                                    Remove image
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <label
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 10,
                                                padding: '14px 18px',
                                                borderRadius: 10,
                                                border: '1px dashed rgba(255,255,255,0.2)',
                                                background: 'rgba(255,255,255,0.03)',
                                                cursor: imageUploading ? 'wait' : 'pointer',
                                                color: 'var(--text-secondary)',
                                                fontSize: 14,
                                            }}
                                        >
                                            <input
                                                type="file"
                                                accept="image/*"
                                                style={{ display: 'none' }}
                                                disabled={imageUploading}
                                                onChange={async (e) => {
                                                    const file = e.target.files?.[0];
                                                    if (!file) return;
                                                    setImageUploading(true);
                                                    try {
                                                        const fd = new FormData();
                                                        fd.append('file', file);
                                                        const { data } = await api.post<ApiResponse<{ fileUrl: string; filePath: string }>>('/api/files/upload', fd);
                                                        const url = data?.payload?.fileUrl || (data?.payload as any)?.filePath;
                                                        if (url) setFormData((prev) => ({ ...prev, image: url }));
                                                    } catch (err) {
                                                        console.error('Image upload failed', err);
                                                    } finally {
                                                        setImageUploading(false);
                                                        e.target.value = '';
                                                    }
                                                }}
                                            />
                                            {imageUploading ? <Loader2 size={18} className="animate-spin-slow" /> : <Upload size={18} />}
                                            {imageUploading ? 'Uploading...' : 'Choose image file'}
                                        </label>
                                    )}
                                </div>

                                <div>
                                    <label className="input-label">Status</label>
                                    <select
                                        className="input-field"
                                        value={formData.status}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                    >
                                        <option value="ACTIVE">Active</option>
                                        <option value="INACTIVE">Inactive</option>
                                    </select>
                                </div>

                                <div style={{ gridColumn: 'span 2' }}>
                                    <label className="input-label">Description</label>
                                    <textarea
                                        className="input-field"
                                        placeholder="Provide details about this item..."
                                        value={formData.description || ''}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        rows={3}
                                        style={{ resize: 'none' }}
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
                            <button className="btn-primary" onClick={handleSave} disabled={isSaving}>
                                {isSaving && <Loader2 size={16} className="animate-spin-slow" />}
                                {editingItem ? 'Update Item' : 'Create Item'}
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
                            Delete Item
                        </h3>
                        <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 24 }}>
                            Are you sure you want to delete <strong style={{ color: 'var(--text-primary)' }}>{deleteTarget.name}</strong>?
                            This will remove the item from all sales records.
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
