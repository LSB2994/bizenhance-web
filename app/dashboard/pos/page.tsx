'use client';

import Link from 'next/link';
import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';
import api from '@/lib/api';
import type {
    ApiResponse,
    PageResponse,
    ItemDTO,
    CategoryDTO,
    CreateSaleTransactionRequest,
    SaleItemRequest,
    SaleHeaderDTO
} from '@/lib/types';
import {
    ShoppingCart,
    Search,
    Plus,
    Minus,
    Trash2,
    Package,
    Tag,
    CreditCard,
    Loader2,
    AlertCircle,
    CheckCircle2,
    Layers,
    ChevronRight,
} from 'lucide-react';

interface CartItem extends ItemDTO {
    cartQuantity: number;
}

export default function POSPage() {
    const { currentUser } = useAuth();
    const [items, setItems] = useState<ItemDTO[]>([]);
    const [categories, setCategories] = useState<CategoryDTO[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [cart, setCart] = useState<CartItem[]>([]);

    // Checkout state
    const [isCheckingOut, setIsCheckingOut] = useState(false);
    const [checkoutSuccess, setCheckoutSuccess] = useState(false);
    const [lastTxId, setLastTxId] = useState<number | null>(null);
    const [error, setError] = useState('');

    const loadData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [itemsRes, catsRes] = await Promise.all([
                api.get<ApiResponse<PageResponse<ItemDTO>>>('/api/items', { params: { size: 100 } }),
                api.get<ApiResponse<CategoryDTO[]>>('/api/categories'),
            ]);

            if (itemsRes.data?.payload) setItems(itemsRes.data.payload.content || []);
            if (catsRes.data?.payload) setCategories(catsRes.data.payload || []);
        } catch (error) {
            console.error('Failed to load POS data:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const filteredItems = items.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.itemCode?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory ? item.categoryId === selectedCategory : true;
        return matchesSearch && matchesCategory;
    });

    const addToCart = (item: ItemDTO) => {
        setCart(prev => {
            const existing = prev.find(i => i.id === item.id);
            if (existing) {
                return prev.map(i => i.id === item.id ? { ...i, cartQuantity: i.cartQuantity + 1 } : i);
            }
            return [...prev, { ...item, cartQuantity: 1 }];
        });
    };

    const removeFromCart = (itemId: number) => {
        setCart(prev => prev.filter(i => i.id !== itemId));
    };

    const updateQuantity = (itemId: number, delta: number) => {
        setCart(prev => prev.map(i => {
            if (i.id === itemId) {
                const newQty = Math.max(1, i.cartQuantity + delta);
                return { ...i, cartQuantity: newQty };
            }
            return i;
        }));
    };

    const totalAmount = cart.reduce((sum, item) => sum + (item.unitPrice * item.cartQuantity), 0);

    const handleCheckout = async () => {
        if (cart.length === 0) return;
        setIsCheckingOut(true);
        setError('');

        try {
            const request: CreateSaleTransactionRequest = {
                ...(currentUser?.bizId ? { bizId: currentUser.bizId } : {}),
                items: cart.map(i => ({
                    itemId: i.id,
                    quantity: i.cartQuantity
                })),
                status: 'COMPLETED'
            };

            const { data } = await api.post<ApiResponse<SaleHeaderDTO>>('/api/sales/transactions', request);
            if (data?.payload) {
                setLastTxId(data.payload.id);
            }
            setCheckoutSuccess(true);
            setCart([]);
        } catch (err: any) {
            setError(err?.response?.data?.message || 'Checkout failed. Please try again.');
        } finally {
            setIsCheckingOut(false);
        }
    };

    return (
        <div className="animate-fade-in" style={{ height: 'calc(100vh - 140px)', display: 'grid', gridTemplateColumns: '1fr 380px', gap: 24 }}>
            {/* Left: Product Selection */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {/* Search & Categories */}
                <div className="glass-card" style={{ padding: 16 }}>
                    <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                        <div style={{ position: 'relative', flex: 1 }}>
                            <Search size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input
                                type="text"
                                className="input-field"
                                style={{ paddingLeft: 44 }}
                                placeholder="Search products by name or SKU..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
                        <button
                            onClick={() => setSelectedCategory(null)}
                            style={{
                                padding: '8px 16px',
                                borderRadius: 10,
                                fontSize: 13,
                                fontWeight: 600,
                                whiteSpace: 'nowrap',
                                transition: 'all 0.2s',
                                background: selectedCategory === null ? 'var(--accent-cyan)' : 'rgba(255,255,255,0.05)',
                                color: selectedCategory === null ? '#000' : 'var(--text-secondary)',
                                border: 'none',
                                cursor: 'pointer'
                            }}
                        >
                            All Items
                        </button>
                        {categories.map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => setSelectedCategory(cat.id)}
                                style={{
                                    padding: '8px 16px',
                                    borderRadius: 10,
                                    fontSize: 13,
                                    fontWeight: 600,
                                    whiteSpace: 'nowrap',
                                    transition: 'all 0.2s',
                                    background: selectedCategory === cat.id ? 'var(--accent-cyan)' : 'rgba(255,255,255,0.05)',
                                    color: selectedCategory === cat.id ? '#000' : 'var(--text-secondary)',
                                    border: 'none',
                                    cursor: 'pointer'
                                }}
                            >
                                {cat.name}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Product Grid */}
                <div style={{ flex: 1, overflowY: 'auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16, paddingRight: 4 }}>
                    {isLoading ? (
                        Array.from({ length: 12 }).map((_, i) => (
                            <div key={i} className="skeleton" style={{ height: 200, borderRadius: 16 }} />
                        ))
                    ) : filteredItems.length === 0 ? (
                        <div style={{ gridColumn: 'span 100%', textAlign: 'center', padding: '100px 0', color: 'var(--text-muted)' }}>
                            <Package size={48} style={{ opacity: 0.1, marginBottom: 16 }} />
                            <p>No products found in this category</p>
                        </div>
                    ) : (
                        filteredItems.map(item => (
                            <div
                                key={item.id}
                                className="glass-card"
                                style={{
                                    padding: 12,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 10,
                                    transition: 'transform 0.2s',
                                }}
                                onClick={() => addToCart(item)}
                                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
                                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                            >
                                <div style={{
                                    width: '100%',
                                    aspectRatio: '1',
                                    borderRadius: 12,
                                    background: 'rgba(255,255,255,0.02)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    overflow: 'hidden',
                                    border: '1px solid rgba(255,255,255,0.05)'
                                }}>
                                    {item.image ? (
                                        <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        <Package size={32} style={{ opacity: 0.2 }} />
                                    )}
                                </div>
                                <div>
                                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {item.name}
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                                        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--accent-cyan)' }}>
                                            ${item.unitPrice.toFixed(2)}
                                        </div>
                                        <div style={{ fontSize: 10, color: 'var(--text-muted)', background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: 4 }}>
                                            {item.categoryName}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Right: Cart & Checkout */}
            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
                        <ShoppingCart size={20} color="var(--accent-cyan)" />
                        Current Order
                    </h2>
                    <span style={{ background: 'rgba(6,182,212,0.1)', color: 'var(--accent-cyan)', fontSize: 12, fontWeight: 700, padding: '2px 10px', borderRadius: 20 }}>
                        {cart.length} items
                    </span>
                </div>

                {/* Cart Items */}
                <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {cart.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
                            <ShoppingCart size={40} style={{ opacity: 0.1, marginBottom: 12 }} />
                            <p style={{ fontSize: 14 }}>Your cart is empty.<br />Select products to start.</p>
                        </div>
                    ) : (
                        cart.map(item => (
                            <div key={item.id} className="animate-fade-in" style={{ padding: 12, borderRadius: 12, border: '1px solid rgba(255,255,255,0.04)', background: 'rgba(255,255,255,0.02)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{item.name}</span>
                                    <button onClick={() => removeFromCart(item.id)} style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', padding: 2 }}>
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(0,0,0,0.2)', padding: '4px 8px', borderRadius: 8 }}>
                                        <button onClick={() => updateQuantity(item.id, -1)} style={{ background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', padding: 0 }}><Minus size={14} /></button>
                                        <span style={{ fontSize: 14, fontWeight: 700, width: 20, textAlign: 'center' }}>{item.cartQuantity}</span>
                                        <button onClick={() => updateQuantity(item.id, 1)} style={{ background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', padding: 0 }}><Plus size={14} /></button>
                                    </div>
                                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
                                        ${(item.unitPrice * item.cartQuantity).toFixed(2)}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Totals & Checkout */}
                <div style={{ padding: 24, background: 'rgba(255,255,255,0.02)', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    {error && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderRadius: 8, background: 'rgba(239,68,68,0.1)', color: '#f87171', fontSize: 12, marginBottom: 16 }}>
                            <AlertCircle size={14} /> {error}
                        </div>
                    )}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: 'var(--text-muted)' }}>
                            <span>Subtotal</span>
                            <span>${totalAmount.toFixed(2)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, color: 'var(--text-muted)' }}>
                            <span>Tax (0%)</span>
                            <span>$0.00</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', borderTop: '1px dashed rgba(255,255,255,0.1)', paddingTop: 12 }}>
                            <span>Total</span>
                            <span style={{ color: 'var(--accent-cyan)' }}>${totalAmount.toFixed(2)}</span>
                        </div>
                    </div>

                    <button
                        className="btn-primary"
                        style={{ width: '100%', height: 56, fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, opacity: cart.length === 0 ? 0.5 : 1 }}
                        disabled={cart.length === 0 || isCheckingOut}
                        onClick={handleCheckout}
                    >
                        {isCheckingOut ? (
                            <Loader2 size={24} className="animate-spin-slow" />
                        ) : checkoutSuccess ? (
                            <>
                                <CheckCircle2 size={24} />
                                Success!
                            </>
                        ) : (
                            <>
                                <CreditCard size={20} />
                                Charge ${totalAmount.toFixed(2)}
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Success Animation Overlay */}
            {checkoutSuccess && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} className="animate-fade-in">
                    <div style={{ textAlign: 'center', maxWidth: 400, width: '100%', padding: 20 }} className="animate-fade-in-up">
                        <div style={{ width: 100, height: 100, borderRadius: 50, background: 'rgba(16,185,129,0.1)', border: '2px solid #10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 32px', color: '#10b981' }}>
                            <CheckCircle2 size={56} className="animate-scale-in" />
                        </div>
                        <h2 style={{ fontSize: 32, fontWeight: 800, color: 'white', marginBottom: 12 }}>Payment Successful!</h2>
                        <p style={{ color: 'var(--text-secondary)', fontSize: 16, marginBottom: 40 }}>The transaction has been recorded and inventory levels updated.</p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                            {lastTxId && (
                                <Link
                                    href={`/dashboard/transactions/${lastTxId}`}
                                    className="btn-primary"
                                    style={{ height: 56, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, gap: 10 }}
                                >
                                    <Plus size={20} />
                                    Print Receipt / Invoice
                                </Link>
                            )}
                            <button
                                className="btn-secondary"
                                onClick={() => { setCheckoutSuccess(false); setLastTxId(null); }}
                                style={{ height: 56, fontSize: 16 }}
                            >
                                Start New Sale
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
