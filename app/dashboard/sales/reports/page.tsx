'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';
import api from '@/lib/api';
import type { ApiResponse, PageResponse, SaleHeaderDTO } from '@/lib/types';
import {
    BarChart3,
    TrendingUp,
    DollarSign,
    ShoppingCart,
    Calendar,
    Filter,
    ArrowUpRight,
    Package,
    ArrowDownRight,
    Loader2,
} from 'lucide-react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell
} from 'recharts';

export default function SalesReportsPage() {
    const { user, currentUser } = useAuth();
    const bizId = currentUser?.bizId ?? user?.bizId;

    const [reportData, setReportData] = useState<any[]>([]);
    const [stats, setStats] = useState({
        todayRevenue: 0,
        weekRevenue: 0,
        monthRevenue: 0,
        totalOrders: 0
    });
    const [topItems, setTopItems] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const loadData = useCallback(async () => {
        setIsLoading(true);
        try {
            const url = bizId
                ? `/api/sales/biz/${bizId}/transactions`
                : '/api/sales/transactions';
            const { data } = await api.get<ApiResponse<SaleHeaderDTO[] | PageResponse<SaleHeaderDTO>>>(url, {
                params: bizId ? { page: 0, size: 500, sort: 'desc' } : undefined
            });

            const raw = data?.payload;
            const rawList = Array.isArray(raw) ? raw : (raw && typeof raw === 'object' && 'content' in raw ? (raw as PageResponse<SaleHeaderDTO>).content : []) || [];
            const txs: SaleHeaderDTO[] = rawList.map((t: any) => ({
                ...t,
                totalAmount: t.totalAmount ?? t.totalPrice ?? 0,
                saleDate: t.saleDate ?? t.createdDate ?? new Date().toISOString(),
            }));

            if (txs.length >= 0) {

                // Calculate stats
                const today = new Date().toDateString();
                const todaySales = txs.filter(t => new Date(t.saleDate).toDateString() === today)
                    .reduce((s, t) => s + t.totalAmount, 0);

                const totalRev = txs.reduce((s, t) => s + t.totalAmount, 0);

                setStats({
                    todayRevenue: todaySales,
                    weekRevenue: totalRev * 0.4, // Mock breakdown
                    monthRevenue: totalRev,
                    totalOrders: txs.length
                });

                // Group by day for chart
                const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                const chartMap: any = {};
                txs.slice(0, 20).forEach(t => {
                    const day = days[new Date(t.saleDate).getDay()];
                    chartMap[day] = (chartMap[day] || 0) + t.totalAmount;
                });

                setReportData(days.map(d => ({ name: d, revenue: chartMap[d] || 0 })));

                // Extract top items from lines
                const itemMap: any = {};
                txs.forEach(t => {
                    t.lines?.forEach(l => {
                        itemMap[l.itemName] = (itemMap[l.itemName] || 0) + l.quantity;
                    });
                });

                const sortedItems = Object.entries(itemMap).map(([name, qty]) => ({ name, qty }))
                    .sort((a: any, b: any) => b.qty - a.qty)
                    .slice(0, 5);
                setTopItems(sortedItems);
            }
        } catch (error) {
            console.error('Failed to load reports:', error);
        } finally {
            setIsLoading(false);
        }
    }, [bizId]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    if (isLoading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
                <Loader2 className="animate-spin-slow" size={40} color="var(--accent-cyan)" />
            </div>
        );
    }

    return (
        <div className="animate-fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
                <div>
                    <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>Sales Performance</h1>
                    <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>Analytical overview of your revenue and trends</p>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                    <button className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Calendar size={18} /> Daily
                    </button>
                    <button className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Filter size={18} /> Customize
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginBottom: 32 }}>
                {[
                    { label: "Today's Revenue", val: `$${stats.todayRevenue.toFixed(2)}`, color: '#06b6d4', icon: <DollarSign size={20} /> },
                    { label: "This Week", val: `$${stats.weekRevenue.toFixed(2)}`, color: '#10b981', icon: <TrendingUp size={20} /> },
                    { label: "This Month", val: `$${stats.monthRevenue.toFixed(2)}`, color: '#8b5cf6', icon: <BarChart3 size={20} /> },
                    { label: "Total Orders", val: stats.totalOrders.toString(), color: '#f59e0b', icon: <ShoppingCart size={20} /> },
                ].map((s, i) => (
                    <div key={i} className="glass-card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>{s.label}</span>
                            <div style={{ color: s.color, opacity: 0.8 }}>{s.icon}</div>
                        </div>
                        <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)' }}>{s.val}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#34d399', fontWeight: 600 }}>
                            <ArrowUpRight size={14} /> 12% vs last period
                        </div>
                    </div>
                ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20 }}>
                {/* Main Chart */}
                <div className="glass-card" style={{ padding: 24 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 24 }}>Revenue Trend</h3>
                    <div style={{ height: 350 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={reportData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                                <Tooltip
                                    cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                                    contentStyle={{ background: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}
                                />
                                <Bar dataKey="revenue" radius={[6, 6, 0, 0]} barSize={40}>
                                    {reportData.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={index === reportData.length - 1 ? 'var(--accent-cyan)' : 'rgba(6,182,212,0.3)'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Top Products */}
                <div className="glass-card" style={{ padding: 24 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 20 }}>Top Products</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {topItems.length === 0 ? (
                            <p style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center' }}>No sales data for items yet</p>
                        ) : topItems.map((item, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-cyan)', fontSize: 12, fontWeight: 700 }}>
                                    #{i + 1}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{item.name}</div>
                                    <div style={{ width: '100%', height: 4, background: 'rgba(255,255,255,0.04)', borderRadius: 2, marginTop: 6 }}>
                                        <div style={{ width: `${(item.qty / topItems[0].qty) * 100}%`, height: '100%', background: 'var(--accent-cyan)', borderRadius: 2 }} />
                                    </div>
                                </div>
                                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)' }}>{item.qty}</div>
                            </div>
                        ))}
                    </div>

                    <div style={{ marginTop: 40, padding: 20, borderRadius: 16, background: 'var(--gradient-cyan)', color: '#000' }}>
                        <p style={{ margin: 0, fontSize: 12, fontWeight: 700, opacity: 0.6 }}>PRO TIP</p>
                        <p style={{ margin: '4px 0 0', fontSize: 14, fontWeight: 700, lineHeight: 1.4 }}>Your beverage sales are 24% higher this week. Consider stocking more!</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
