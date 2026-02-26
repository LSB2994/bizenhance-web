'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';
import api from '@/lib/api';
import type {
    ApiResponse,
    PageResponse,
    StockDTO,
    StockBalanceDTO,
    StockPurposeDTO,
    ItemDTO,
    CreateStockRequest
} from '@/lib/types';
import {
    Warehouse,
    Plus,
    ArrowUpRight,
    ArrowDownLeft,
    Search,
    History,
    TrendingUp,
    X,
    ChevronLeft,
    ChevronRight,
    Loader2,
    AlertCircle,
    Package,
    Calendar,
    User,
    Info,
} from 'lucide-react';

export default function StockPage() {
    const { currentUser } = useAuth();
    const [stockBalances, setStockBalances] = useState<StockBalanceDTO[]>([]);
    const [stockHistory, setStockHistory] = useState<StockDTO[]>([]);
    const [items, setItems] = useState<ItemDTO[]>([]);
    const [purposes, setPurposes] = useState<StockPurposeDTO[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'balance' | 'history'>('balance');

    // Search state
    const [balanceSearch, setBalanceSearch] = useState('');
    const [historySearch, setHistorySearch] = useState('');

    // Stock Adjustment Modal state
    const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);
    const [adjustType, setAdjustType] = useState<'STOCK_IN' | 'STOCK_OUT'>('STOCK_IN');
    const [formData, setFormData] = useState<Partial<CreateStockRequest>>({
        itemId: 0,
        qty: 0,
        purposeId: 1,
        status: 'COMPLETED',
    });
    const [isSaving, setIsSaving] = useState(false);
    const [formError, setFormError] = useState('');

    const loadData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [balanceRes, historyRes, itemsRes, purposesRes] = await Promise.all([
                api.get<ApiResponse<StockBalanceDTO[]>>('/api/stock/balance'),
                api.get<ApiResponse<StockDTO[]>>('/api/stock'),
                api.get<ApiResponse<PageResponse<ItemDTO>>>('/api/items', { params: { size: 100 } }),
                api.get<ApiResponse<StockPurposeDTO[]>>('/api/stock-purposes'),
            ]);

            if (balanceRes.data?.payload) setStockBalances(balanceRes.data.payload);
            if (historyRes.data?.payload) {
                setStockHistory(historyRes.data.payload || []);
            }
            if (itemsRes.data?.payload) {
                const p = itemsRes.data.payload;
                setItems(Array.isArray(p) ? p : p.content || []);
            }
            if (purposesRes.data?.payload) {
                const p = purposesRes.data.payload;
                setPurposes(Array.isArray(p) ? p : (p as { content?: StockPurposeDTO[] })?.content ?? []);
            }
        } catch (error) {
            console.error('Failed to load stock data:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const filteredBalances = stockBalances.filter(b =>
        b.itemName.toLowerCase().includes(balanceSearch.toLowerCase())
    );

    const filteredHistory = stockHistory.filter(h =>
        h.itemName.toLowerCase().includes(historySearch.toLowerCase()) ||
        h.type.toLowerCase().includes(historySearch.toLowerCase())
    );

    const openAdjustmentModal = (type: 'STOCK_IN' | 'STOCK_OUT') => {
        setAdjustType(type);
        setFormData({
            itemId: items[0]?.id || 0,
            qty: 0,
            purposeId: (Array.isArray(purposes) ? purposes.find(p => p.type === (type === 'STOCK_IN' ? 'IN' : 'OUT')) : undefined)?.id ?? (Array.isArray(purposes) ? purposes[0]?.id : undefined) ?? 1,
            status: 'COMPLETED',
        });
        setFormError('');
        setShowAdjustmentModal(true);
    };

    const handleAdjust = async () => {
        if (!formData.itemId) return setFormError('Select an item');
        if (!formData.qty || formData.qty <= 0) return setFormError('Quantity must be greater than 0');

        setIsSaving(true);
        setFormError('');
        try {
            await api.post('/api/stock', {
                ...formData,
                type: adjustType,
                byUserId: currentUser?.id,
            });
            setShowAdjustmentModal(false);
            loadData();
        } catch (error: any) {
            setFormError(error?.response?.data?.message || 'Failed to update stock');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="animate-fade-in">
            <div className="animate-fade-in-up" style={{ marginBottom: 28 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
                    <div>
                        <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4, letterSpacing: '-0.02em' }}>
                            Stock Management
                        </h1>
                        <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: 0 }}>
                            Monitor inventory levels and track movements
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: 12 }}>
                        <button className="btn-secondary" onClick={() => openAdjustmentModal('STOCK_OUT')} style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#f87171', borderColor: 'rgba(239,68,68,0.2)' }}>
                            <ArrowDownLeft size={18} />
                            Stock Out
                        </button>
                        <button className="btn-primary" onClick={() => openAdjustmentModal('STOCK_IN')} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--gradient-success)' }}>
                            <ArrowUpRight size={18} />
                            Stock In
                        </button>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: 24 }}>
                <button
                    onClick={() => setActiveTab('balance')}
                    style={{
                        padding: '12px 24px',
                        fontSize: 14,
                        fontWeight: 600,
                        color: activeTab === 'balance' ? 'var(--accent-cyan)' : 'var(--text-muted)',
                        background: 'none',
                        border: 'none',
                        borderBottom: activeTab === 'balance' ? '2px solid var(--accent-cyan)' : '2px solid transparent',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                    }}
                >
                    <TrendingUp size={16} />
                    Current Stock
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
                    <History size={16} />
                    Movement History
                </button>
            </div>

            {activeTab === 'balance' ? (
                <div className="animate-fade-in-up">
                    <div style={{ marginBottom: 20 }}>
                        <div style={{ position: 'relative', maxWidth: 400 }}>
                            <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input
                                type="text"
                                placeholder="Search levels by item name..."
                                value={balanceSearch}
                                onChange={(e) => setBalanceSearch(e.target.value)}
                                className="input-field"
                                style={{ paddingLeft: 40, width: '100%' }}
                            />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
                        {isLoading ? (
                            Array.from({ length: 8 }).map((_, i) => (
                                <div key={i} className="skeleton" style={{ height: 120, borderRadius: 16 }} />
                            ))
                        ) : filteredBalances.length === 0 ? (
                            <div style={{ gridColumn: 'span 4', textAlign: 'center', padding: '60px 0' }}>
                                <Warehouse size={48} style={{ opacity: 0.1, marginBottom: 16 }} />
                                <p style={{ color: 'var(--text-muted)' }}>No stock records found</p>
                            </div>
                        ) : (
                            filteredBalances.map((item) => (
                                <div key={item.itemId} className="glass-card" style={{ padding: 20 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                                        <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(6,182,212,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-cyan)' }}>
                                            <Package size={20} />
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ fontSize: 24, fontWeight: 700, color: item.quantity > 10 ? 'var(--text-primary)' : 'var(--accent-orange)' }}>
                                                {item.quantity}
                                            </div>
                                            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>AVAILABLE</div>
                                        </div>
                                    </div>
                                    <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {item.itemName}
                                    </div>
                                    <div style={{ marginTop: 12, height: 4, background: 'rgba(255,255,255,0.05)', borderRadius: 2, overflow: 'hidden' }}>
                                        <div style={{
                                            height: '100%',
                                            width: `${Math.min((item.quantity / 100) * 100, 100)}%`,
                                            background: item.quantity > 10 ? 'var(--accent-cyan)' : 'var(--accent-orange)'
                                        }} />
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            ) : (
                <div className="animate-fade-in-up">
                    <div style={{ marginBottom: 20 }}>
                        <div style={{ position: 'relative', maxWidth: 400 }}>
                            <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input
                                type="text"
                                placeholder="Search history..."
                                value={historySearch}
                                onChange={(e) => setHistorySearch(e.target.value)}
                                className="input-field"
                                style={{ paddingLeft: 40, width: '100%' }}
                            />
                        </div>
                    </div>

                    <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Time / Date</th>
                                    <th>Item</th>
                                    <th>Type</th>
                                    <th>Quantity</th>
                                    <th>By User</th>
                                    <th>Purpose</th>
                                </tr>
                            </thead>
                            <tbody>
                                {isLoading ? (
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <tr key={i}>
                                            <td colSpan={6}><div className="skeleton" style={{ height: 40, width: '100%' }} /></td>
                                        </tr>
                                    ))
                                ) : filteredHistory.map((log) => (
                                    <tr key={log.id}>
                                        <td>
                                            <div style={{ fontSize: 13 }}>{new Date(log.createdDate).toLocaleDateString()}</div>
                                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{new Date(log.createdDate).toLocaleTimeString()}</div>
                                        </td>
                                        <td><span style={{ fontWeight: 600 }}>{log.itemName}</span></td>
                                        <td>
                                            <span className={`badge ${log.type === 'STOCK_IN' ? 'badge-success' : 'badge-danger'}`}>
                                                {log.type === 'STOCK_IN' ? <ArrowUpRight size={10} /> : <ArrowDownLeft size={10} />}
                                                {log.type.replace('STOCK_', '')}
                                            </span>
                                        </td>
                                        <td>
                                            <div style={{ fontWeight: 700, color: log.type === 'STOCK_IN' ? '#34d399' : '#f43f5e' }}>
                                                {log.type === 'STOCK_IN' ? '+' : '-'}{log.qty}
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
                                                <User size={12} style={{ opacity: 0.5 }} />
                                                User #{log.byUserId}
                                            </div>
                                        </td>
                                        <td><span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{log.purposeName}</span></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>


                    </div>
                </div>
            )}

            {/* Stock Adjustment Modal */}
            {showAdjustmentModal && (
                <div
                    style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
                    onClick={() => setShowAdjustmentModal(false)}
                >
                    <div className="glass-card animate-fade-in-up" style={{ width: '100%', maxWidth: 480, padding: 0 }} onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                            <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
                                {adjustType === 'STOCK_IN' ? <ArrowUpRight size={20} color="#34d399" /> : <ArrowDownLeft size={20} color="#f87171" />}
                                {adjustType === 'STOCK_IN' ? 'Restock Item' : 'Remove Stock'}
                            </h2>
                            <button className="icon-btn" onClick={() => setShowAdjustmentModal(false)}><X size={18} /></button>
                        </div>

                        <div style={{ padding: '24px' }}>
                            {formError && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 8, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171', fontSize: 13, marginBottom: 20 }}>
                                    <AlertCircle size={14} />
                                    {formError}
                                </div>
                            )}

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                                <div>
                                    <label className="input-label">Select Item</label>
                                    <select
                                        className="input-field"
                                        value={formData.itemId}
                                        onChange={(e) => setFormData({ ...formData, itemId: parseInt(e.target.value) })}
                                    >
                                        <option value={0} disabled>Choose an item...</option>
                                        {items.map(item => (
                                            <option key={item.id} value={item.id}>{item.name} ({item.itemCode || 'No SKU'})</option>
                                        ))}
                                    </select>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                    <div>
                                        <label className="input-label">Quantity</label>
                                        <input
                                            type="number"
                                            className="input-field"
                                            placeholder="Enter quantity"
                                            value={formData.qty || ''}
                                            onChange={(e) => setFormData({ ...formData, qty: parseInt(e.target.value) || 0 })}
                                        />
                                    </div>
                                    <div>
                                        <label className="input-label">Purpose</label>
                                        <select
                                            className="input-field"
                                            value={formData.purposeId}
                                            onChange={(e) => setFormData({ ...formData, purposeId: parseInt(e.target.value) })}
                                        >
                                            {purposes.map(purpose => (
                                                <option key={purpose.id} value={purpose.id}>{purpose.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div style={{ padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: 12, display: 'flex', gap: 12 }}>
                                    <Info size={18} style={{ color: 'var(--accent-cyan)', flexShrink: 0 }} />
                                    <p style={{ margin: 0, fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                                        This adjustment will {adjustType === 'STOCK_IN' ? 'increase' : 'decrease'} the total available stock for the selected item. All movements are logged for audit purposes.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 12, padding: '16px 24px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                            <button className="btn-secondary" onClick={() => setShowAdjustmentModal(false)} disabled={isSaving}>Cancel</button>
                            <button
                                className="btn-primary"
                                onClick={handleAdjust}
                                disabled={isSaving}
                                style={{ background: adjustType === 'STOCK_IN' ? 'var(--gradient-success)' : 'var(--gradient-warning)' }}
                            >
                                {isSaving && <Loader2 size={16} className="animate-spin-slow" />}
                                Confirm {adjustType === 'STOCK_IN' ? 'Increase' : 'Decrease'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
