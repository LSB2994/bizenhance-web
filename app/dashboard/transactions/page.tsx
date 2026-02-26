'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import type { ApiResponse, PageResponse, SaleHeaderDTO } from '@/lib/types';
import {
    BarChart3,
    Search,
    Eye,
    X,
    ChevronLeft,
    ChevronRight,
    Loader2,
    Calendar,
    Hash,
    DollarSign,
    User,
    ShoppingBag,
    ArrowRight,
    Filter,
} from 'lucide-react';

export default function TransactionsPage() {
    const [transactions, setTransactions] = useState<SaleHeaderDTO[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    // Selected transaction for details
    const [selectedTx, setSelectedTx] = useState<SaleHeaderDTO | null>(null);

    const loadTransactions = useCallback(async () => {
        setIsLoading(true);
        try {
            const { data } = await api.get<ApiResponse<SaleHeaderDTO[]>>('/api/sales/transactions');
            if (data?.payload) {
                setTransactions(data.payload || []);
            }
        } catch (error) {
            console.error('Failed to load transactions:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadTransactions();
    }, [loadTransactions]);

    const filteredTransactions = transactions.filter(tx =>
        tx.saleNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tx.createdByUserName?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="animate-fade-in">
            <div className="animate-fade-in-up" style={{ marginBottom: 28 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
                    <div>
                        <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4, letterSpacing: '-0.02em' }}>
                            Sales Transactions
                        </h1>
                        <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: 0 }}>
                            Review and manage your store sales ({transactions.length} total)
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: 12 }}>
                        <button className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Filter size={18} />
                            Filter
                        </button>
                        <button className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Calendar size={18} />
                            Date Range
                        </button>
                    </div>
                </div>
            </div>

            {/* Search Bar */}
            <div className="animate-fade-in-up delay-1" style={{ marginBottom: 20 }}>
                <div style={{ position: 'relative', maxWidth: 400 }}>
                    <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                        type="text"
                        placeholder="Search by sale number or user..."
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
                ) : filteredTransactions.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
                        <BarChart3 size={48} style={{ opacity: 0.2, marginBottom: 16 }} />
                        <p style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>No transactions found</p>
                        <p style={{ fontSize: 14 }}>Customer purchases will appear here</p>
                    </div>
                ) : (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Sale Details</th>
                                <th>Date & Time</th>
                                <th>Created By</th>
                                <th>Total Amount</th>
                                <th>Status</th>
                                <th style={{ textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredTransactions.map((tx) => (
                                <tr key={tx.id}>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(59,130,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-blue)' }}>
                                                <Hash size={18} />
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 14 }}>{tx.saleNumber}</div>
                                                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{tx.lines?.length || 0} items</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                                            {new Date(tx.saleDate).toLocaleDateString()}
                                        </div>
                                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                                            {new Date(tx.saleDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
                                            <User size={12} style={{ opacity: 0.5 }} />
                                            {tx.createdByUserName}
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ fontWeight: 700, color: 'var(--accent-cyan)' }}>
                                            ${(tx.totalAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`badge ${tx.status === 'COMPLETED' ? 'badge-success' : 'badge-warning'}`}>
                                            {tx.status}
                                        </span>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
                                            <Link href={`/dashboard/transactions/${tx.id}`} className="icon-btn" title="View & Print">
                                                <Eye size={18} />
                                            </Link>
                                            <button onClick={() => setSelectedTx(tx)} className="icon-btn" title="Quick Preview">
                                                <ArrowRight size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}


            </div>

            {/* Transaction Details Modal */}
            {selectedTx && (
                <div
                    style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
                    onClick={() => setSelectedTx(null)}
                >
                    <div
                        className="glass-card animate-fade-in-up"
                        style={{ width: '100%', maxWidth: 640, padding: 0 }}
                        onClick={e => e.stopPropagation()}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                            <div>
                                <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Transaction #{selectedTx.saleNumber}</h2>
                                <div style={{ fontSize: 13, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                                    <Calendar size={14} /> {new Date(selectedTx.saleDate).toLocaleString()}
                                </div>
                            </div>
                            <button className="icon-btn" onClick={() => setSelectedTx(null)}><X size={20} /></button>
                        </div>

                        <div style={{ padding: '24px', maxHeight: '60vh', overflowY: 'auto' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', paddingBottom: 8, borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                    <span>Item</span>
                                    <div style={{ display: 'flex', gap: 40 }}>
                                        <span style={{ width: 40, textAlign: 'center' }}>Qty</span>
                                        <span style={{ width: 80, textAlign: 'right' }}>Total</span>
                                    </div>
                                </div>

                                {selectedTx.lines?.map((line, idx) => (
                                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 4 }}>
                                        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                                            <div style={{ width: 8, height: 8, borderRadius: 4, background: 'var(--accent-cyan)' }} />
                                            <div>
                                                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{line.itemName}</div>
                                                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>${line.unitPrice.toFixed(2)} per unit</div>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: 40 }}>
                                            <span style={{ width: 40, textAlign: 'center', fontWeight: 700, color: 'var(--text-secondary)' }}>x{line.quantity}</span>
                                            <span style={{ width: 80, textAlign: 'right', fontWeight: 700, color: 'var(--text-primary)' }}>${line.totalPrice.toFixed(2)}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div style={{ padding: '24px', background: 'rgba(0,0,0,0.2)', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                        <div style={{ width: 32, height: 32, borderRadius: 16, background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <User size={16} style={{ opacity: 0.5 }} />
                                        </div>
                                        <div>
                                            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>CASHIER</div>
                                            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)' }}>{selectedTx.createdByUserName}</div>
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>TOTAL AMOUNT</div>
                                        <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--accent-cyan)' }}>${selectedTx.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: 12 }}>
                                    <Link href={`/dashboard/transactions/${selectedTx.id}`} className="btn-secondary" style={{ flex: 1, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}>
                                        Print Receipt
                                    </Link>
                                    <button className="btn-primary" style={{ flex: 1, height: 48 }} onClick={() => setSelectedTx(null)}>Close</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
