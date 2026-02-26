'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';
import api from '@/lib/api';
import type {
    ApiResponse,
    PageResponse,
    SaleHeaderDTO,
    StockBalanceDTO,
    StockDTO,
    ItemDTO,
    BizDTO,
    UserDTO,
} from '@/lib/types';
import {
    DollarSign,
    ShoppingCart,
    Package,
    TrendingUp,
    ArrowUpRight,
    ArrowDownRight,
    BarChart3,
    Clock,
    Layers,
    Users,
} from 'lucide-react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
} from 'recharts';

// ──────────── Mock / fallback chart data ────────────
const fallbackSalesData = [
    { name: 'Mon', sales: 4200, orders: 24 },
    { name: 'Tue', sales: 5800, orders: 31 },
    { name: 'Wed', sales: 3900, orders: 18 },
    { name: 'Thu', sales: 7200, orders: 42 },
    { name: 'Fri', sales: 6100, orders: 35 },
    { name: 'Sat', sales: 8400, orders: 48 },
    { name: 'Sun', sales: 5600, orders: 29 },
];

const fallbackStockData = [
    { name: 'Beverages', value: 340 },
    { name: 'Snacks', value: 210 },
    { name: 'Electronics', value: 125 },
    { name: 'Stationery', value: 85 },
    { name: 'Others', value: 60 },
];

const PIE_COLORS = ['#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b'];

interface StatsCard {
    title: string;
    value: string;
    change: string;
    changeType: 'up' | 'down';
    icon: React.ReactNode;
    glowColor: string;
}

export default function DashboardPage() {
    const { user, currentUser } = useAuth();
    const [isLoading, setIsLoading] = useState(true);
    const [stats, setStats] = useState<StatsCard[]>([]);
    const [recentTransactions, setRecentTransactions] = useState<SaleHeaderDTO[]>([]);
    const [stockBalances, setStockBalances] = useState<StockBalanceDTO[]>([]);
    const [salesChartData, setSalesChartData] = useState(fallbackSalesData);
    const [stockChartData, setStockChartData] = useState(fallbackStockData);

    const bizId = currentUser?.bizId || user?.bizId;

    const loadDashboard = useCallback(async () => {
        setIsLoading(true);
        try {
            // For System Admin (no bizId), we fetch platform-wide stats
            const results = await Promise.allSettled([
                bizId
                    ? api.get<ApiResponse<PageResponse<SaleHeaderDTO>>>(
                        `/api/sales/biz/${bizId}/transactions`,
                        { params: { page: 0, size: 5, sort: 'desc' } },
                    )
                    : api.get<ApiResponse<PageResponse<SaleHeaderDTO>>>(
                        '/api/sales',
                        { params: { page: 0, size: 5, sort: 'desc' } },
                    ),
                bizId
                    ? api.get<ApiResponse<StockBalanceDTO[]>>(
                        `/api/stock/biz/${bizId}/balances`,
                    )
                    : api.get<ApiResponse<StockDTO[]>>('/api/stock').then((res) => {
                        // Aggregate stock movements (IN/OUT) into balances by item for system admin
                        const list = res.data?.payload || [];
                        const byItem = new Map<number, { itemId: number; itemName: string; quantity: number }>();
                        list.forEach((s: StockDTO) => {
                            const prev = byItem.get(s.itemId);
                            const delta = s.type === 'OUT' ? -(s.qty ?? 0) : (s.qty ?? 0);
                            const qty = (prev?.quantity ?? 0) + delta;
                            byItem.set(s.itemId, {
                                itemId: s.itemId,
                                itemName: s.itemName ?? prev?.itemName ?? '',
                                quantity: qty,
                            });
                        });
                        return { data: { ...res.data, payload: Array.from(byItem.values()) } };
                    }),
                bizId
                    ? api.get<ApiResponse<PageResponse<ItemDTO>>>(`/api/items/biz/${bizId}`, {
                        params: { page: 0, size: 1, sort: 'desc' },
                    })
                    : api.get<ApiResponse<PageResponse<ItemDTO>>>('/api/items', {
                        params: { page: 0, size: 1, sort: 'desc' },
                    }),
                api.get<ApiResponse<PageResponse<BizDTO>>>('/api/biz', {
                    params: { page: 0, size: 1, sort: 'desc' },
                }),
                // Add global user count for system admins
                !bizId
                    ? api.get<ApiResponse<UserDTO[]>>('/api/users')
                    : Promise.resolve(null),
            ]);

            // Parse transactions
            let totalSales = 0;
            let orderCount = 0;
            if (results[0].status === 'fulfilled' && results[0].value) {
                const txData = (results[0].value as { data: ApiResponse<PageResponse<any>> }).data;
                if (txData?.payload) {
                    const content = txData.payload.content || [];
                    if (!bizId) {
                        // Normalize SalesDTO to SaleHeaderDTO
                        const normalized = content.map((s: any) => ({
                            id: s.id,
                            saleNumber: `SALE-${s.id}`,
                            totalAmount: s.totalPrice || 0,
                            status: s.status,
                            saleDate: s.createdDate,
                        }));
                        setRecentTransactions(normalized as SaleHeaderDTO[]);
                        totalSales = content.reduce((sum, s) => sum + (s.totalPrice || 0), 0);
                    } else {
                        setRecentTransactions(content as SaleHeaderDTO[]);
                        totalSales = content.reduce((s, t) => s + (t.totalAmount || 0), 0);
                    }
                    orderCount = txData.payload.totalElements || 0;
                }
            }

            // Parse stock (backend returns List, not PageResponse)
            let stockItems = 0;
            if (results[1].status === 'fulfilled' && results[1].value) {
                const stData = (results[1].value as { data: ApiResponse<StockBalanceDTO[] | { content?: StockBalanceDTO[] }> }).data;
                if (stData?.payload) {
                    const content = Array.isArray(stData.payload) ? stData.payload : (stData.payload.content || []);
                    setStockBalances(content as StockBalanceDTO[]);
                    setStockChartData(
                        content.slice(0, 5).map((sb: any) => ({
                            name: sb.itemName?.length > 12 ? sb.itemName.slice(0, 12) + '…' : sb.itemName,
                            value: sb.quantity ?? 0,
                        })),
                    );
                    stockItems = content.length;
                }
            }

            // Parse items count
            let itemTotal = 0;
            if (results[2].status === 'fulfilled') {
                const itData = (results[2].value as { data: ApiResponse<PageResponse<ItemDTO>> }).data;
                itemTotal = itData?.payload?.totalElements || 0;
            }

            // Parse biz count
            let bizCount = 0;
            if (results[3].status === 'fulfilled') {
                const bzData = (results[3].value as { data: ApiResponse<PageResponse<BizDTO>> }).data;
                bizCount = bzData?.payload?.totalElements || 0;
            }

            // Parse user count (System Admin only)
            let userCount = 0;
            if (results[4]?.status === 'fulfilled' && results[4].value) {
                const userData = (results[4].value as { data: ApiResponse<UserDTO[]> }).data;
                userCount = userData?.payload?.length || 0;
            }

            const newStats: StatsCard[] = [
                {
                    title: bizId ? 'Total Revenue' : 'Global Revenue',
                    value: `$${totalSales.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                    change: '+12.5%',
                    changeType: 'up',
                    icon: <DollarSign size={22} />,
                    glowColor: '#10b981',
                },
                {
                    title: bizId ? 'Total Orders' : 'Platform Orders',
                    value: orderCount.toLocaleString(),
                    change: '+8.2%',
                    changeType: 'up',
                    icon: <ShoppingCart size={22} />,
                    glowColor: '#06b6d4',
                },
            ];

            if (!bizId) {
                // System Admin stats
                newStats.push({
                    title: 'Platform Users',
                    value: userCount.toLocaleString(),
                    change: 'Total',
                    changeType: 'up',
                    icon: <Users size={22} />,
                    glowColor: '#8b5cf6',
                });
                newStats.push({
                    title: 'Businesses',
                    value: bizCount.toLocaleString(),
                    change: 'Active',
                    changeType: 'up',
                    icon: <Layers size={22} />,
                    glowColor: '#f59e0b',
                });
            } else {
                // Business Admin stats
                newStats.push({
                    title: 'Products',
                    value: itemTotal.toLocaleString(),
                    change: `${stockItems} in stock`,
                    changeType: 'up',
                    icon: <Package size={22} />,
                    glowColor: '#8b5cf6',
                });
                newStats.push({
                    title: 'Businesses',
                    value: bizCount.toLocaleString(),
                    change: 'Active',
                    changeType: 'up',
                    icon: <Layers size={22} />,
                    glowColor: '#f59e0b',
                });
            }

            setStats(newStats);
        } catch (error) {
            console.error('Dashboard load error:', error);
            // Set fallback stats
            setStats([
                {
                    title: 'Total Revenue',
                    value: '$0.00',
                    change: '--',
                    changeType: 'up',
                    icon: <DollarSign size={22} />,
                    glowColor: '#10b981',
                },
                {
                    title: 'Total Orders',
                    value: '0',
                    change: '--',
                    changeType: 'up',
                    icon: <ShoppingCart size={22} />,
                    glowColor: '#06b6d4',
                },
                {
                    title: 'Products',
                    value: '0',
                    change: '--',
                    changeType: 'up',
                    icon: <Package size={22} />,
                    glowColor: '#8b5cf6',
                },
                {
                    title: 'Businesses',
                    value: '0',
                    change: '--',
                    changeType: 'up',
                    icon: <Layers size={22} />,
                    glowColor: '#f59e0b',
                },
            ]);
        } finally {
            setIsLoading(false);
        }
    }, [bizId]);

    useEffect(() => {
        loadDashboard();
    }, [loadDashboard]);

    const greeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 17) return 'Good afternoon';
        return 'Good evening';
    };

    return (
        <div>
            {/* Page Title */}
            <div className="animate-fade-in-up" style={{ marginBottom: 32 }}>
                <h1
                    style={{
                        fontSize: 28,
                        fontWeight: 700,
                        color: 'var(--text-primary)',
                        marginBottom: 6,
                        letterSpacing: '-0.02em',
                    }}
                >
                    {greeting()}, {currentUser?.fullName || user?.fullName || user?.username || 'there'} 👋
                </h1>
                <p
                    style={{
                        fontSize: 15,
                        color: 'var(--text-muted)',
                        margin: 0,
                    }}
                >
                    {!bizId
                        ? "Here's what's happening across the platform today."
                        : "Here's what's happening with your business today."
                    }
                </p>
            </div>

            {/* Stats Grid */}
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                    gap: 20,
                    marginBottom: 32,
                }}
            >
                {isLoading
                    ? Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="stat-card" style={{ height: 140 }}>
                            <div className="skeleton" style={{ width: 100, height: 14, marginBottom: 16 }} />
                            <div className="skeleton" style={{ width: 150, height: 32, marginBottom: 12 }} />
                            <div className="skeleton" style={{ width: 80, height: 12 }} />
                        </div>
                    ))
                    : stats.map((stat, i) => (
                        <div
                            key={stat.title}
                            className={`stat-card animate-fade-in-up delay-${i + 1}`}
                        >
                            <div className="stat-glow" style={{ background: stat.glowColor }} />

                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    marginBottom: 16,
                                }}
                            >
                                <span
                                    style={{
                                        fontSize: 13,
                                        fontWeight: 600,
                                        color: 'var(--text-muted)',
                                        letterSpacing: '0.02em',
                                    }}
                                >
                                    {stat.title}
                                </span>
                                <div
                                    style={{
                                        width: 40,
                                        height: 40,
                                        borderRadius: 10,
                                        background: `${stat.glowColor}15`,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: stat.glowColor,
                                    }}
                                >
                                    {stat.icon}
                                </div>
                            </div>

                            <div
                                style={{
                                    fontSize: 30,
                                    fontWeight: 700,
                                    color: 'var(--text-primary)',
                                    marginBottom: 8,
                                    letterSpacing: '-0.02em',
                                    lineHeight: 1,
                                }}
                            >
                                {stat.value}
                            </div>

                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 4,
                                    fontSize: 13,
                                    fontWeight: 600,
                                    color:
                                        stat.change === '--'
                                            ? 'var(--text-muted)'
                                            : stat.changeType === 'up'
                                                ? '#34d399'
                                                : '#f87171',
                                }}
                            >
                                {stat.change !== '--' && stat.changeType === 'up' && <ArrowUpRight size={14} />}
                                {stat.change !== '--' && stat.changeType === 'down' && <ArrowDownRight size={14} />}
                                {stat.change}
                            </div>
                        </div>
                    ))}
            </div>

            {/* Charts Row */}
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 380px',
                    gap: 20,
                    marginBottom: 32,
                }}
            >
                {/* Sales Chart */}
                <div className="chart-container animate-fade-in-up delay-5">
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginBottom: 24,
                        }}
                    >
                        <div>
                            <h3
                                style={{
                                    fontSize: 16,
                                    fontWeight: 600,
                                    color: 'var(--text-primary)',
                                    margin: '0 0 4px',
                                }}
                            >
                                Sales Overview
                            </h3>
                            <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
                                Revenue & orders this week
                            </p>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <TrendingUp size={16} color="#10b981" />
                            <span style={{ fontSize: 13, fontWeight: 600, color: '#34d399' }}>+12.5%</span>
                        </div>
                    </div>

                    <ResponsiveContainer width="100%" height={280}>
                        <AreaChart data={salesChartData}>
                            <defs>
                                <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.3} />
                                    <stop offset="100%" stopColor="#06b6d4" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                            <XAxis
                                dataKey="name"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#64748b', fontSize: 12 }}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#64748b', fontSize: 12 }}
                                tickFormatter={(v) => `$${v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v}`}
                            />
                            <Tooltip
                                contentStyle={{
                                    background: 'rgba(17,24,39,0.95)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: 10,
                                    boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                                    padding: '12px 16px',
                                }}
                                labelStyle={{ color: '#94a3b8', fontSize: 12, marginBottom: 6 }}
                                itemStyle={{ color: '#f1f5f9', fontSize: 13 }}
                                formatter={(value: number | undefined) => [`$${(value ?? 0).toLocaleString()}`, 'Revenue']}
                            />
                            <Area
                                type="monotone"
                                dataKey="sales"
                                stroke="#06b6d4"
                                strokeWidth={2.5}
                                fill="url(#salesGrad)"
                                dot={false}
                                activeDot={{ r: 5, fill: '#06b6d4', stroke: '#0b0f1a', strokeWidth: 2 }}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                {/* Stock Distribution */}
                <div className="chart-container animate-fade-in-up delay-6">
                    <div style={{ marginBottom: 24 }}>
                        <h3
                            style={{
                                fontSize: 16,
                                fontWeight: 600,
                                color: 'var(--text-primary)',
                                margin: '0 0 4px',
                            }}
                        >
                            Stock Distribution
                        </h3>
                        <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
                            Inventory by category
                        </p>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                        <ResponsiveContainer width="100%" height={200}>
                            <PieChart>
                                <Pie
                                    data={stockChartData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={55}
                                    outerRadius={85}
                                    paddingAngle={3}
                                    dataKey="value"
                                    strokeWidth={0}
                                >
                                    {stockChartData.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{
                                        background: 'rgba(17,24,39,0.95)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: 10,
                                        padding: '8px 14px',
                                    }}
                                    itemStyle={{ color: '#f1f5f9', fontSize: 13 }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Legend */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
                        {stockChartData.map((item, i) => (
                            <div
                                key={item.name}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    fontSize: 13,
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <div
                                        style={{
                                            width: 8,
                                            height: 8,
                                            borderRadius: '50%',
                                            background: PIE_COLORS[i % PIE_COLORS.length],
                                        }}
                                    />
                                    <span style={{ color: 'var(--text-secondary)' }}>{item.name}</span>
                                </div>
                                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                                    {item.value}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Bottom Row: Recent Transactions + Top Stock Items */}
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 20,
                }}
            >
                {/* Recent Transactions */}
                <div className="chart-container animate-fade-in-up delay-3">
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginBottom: 20,
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div
                                style={{
                                    width: 36,
                                    height: 36,
                                    borderRadius: 8,
                                    background: 'rgba(6,182,212,0.1)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: '#06b6d4',
                                }}
                            >
                                <BarChart3 size={18} />
                            </div>
                            <h3
                                style={{
                                    fontSize: 16,
                                    fontWeight: 600,
                                    color: 'var(--text-primary)',
                                    margin: 0,
                                }}
                            >
                                Recent Transactions
                            </h3>
                        </div>
                    </div>

                    {isLoading ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            {Array.from({ length: 4 }).map((_, i) => (
                                <div key={i} className="skeleton" style={{ width: '100%', height: 48 }} />
                            ))}
                        </div>
                    ) : recentTransactions.length === 0 ? (
                        <div
                            style={{
                                textAlign: 'center',
                                padding: '40px 0',
                                color: 'var(--text-muted)',
                                fontSize: 14,
                            }}
                        >
                            <ShoppingCart size={32} style={{ opacity: 0.3, marginBottom: 8 }} />
                            <p>No transactions yet</p>
                        </div>
                    ) : (
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Sale #</th>
                                    <th>Amount</th>
                                    <th>Status</th>
                                    <th>Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentTransactions.map((tx) => (
                                    <tr key={tx.id}>
                                        <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                                            {tx.saleNumber || `#${tx.id}`}
                                        </td>
                                        <td style={{ fontWeight: 600, color: '#34d399' }}>
                                            ${(tx.totalAmount || 0).toFixed(2)}
                                        </td>
                                        <td>
                                            <span
                                                className={`badge ${tx.status === 'COMPLETED'
                                                    ? 'badge-success'
                                                    : tx.status === 'PENDING'
                                                        ? 'badge-warning'
                                                        : 'badge-info'
                                                    }`}
                                            >
                                                {tx.status || 'N/A'}
                                            </span>
                                        </td>
                                        <td style={{ fontSize: 13 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                <Clock size={12} style={{ opacity: 0.5 }} />
                                                {tx.saleDate
                                                    ? new Date(tx.saleDate).toLocaleDateString('en-US', {
                                                        month: 'short',
                                                        day: 'numeric',
                                                    })
                                                    : '--'}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Stock Balances */}
                <div className="chart-container animate-fade-in-up delay-4">
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginBottom: 20,
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div
                                style={{
                                    width: 36,
                                    height: 36,
                                    borderRadius: 8,
                                    background: 'rgba(139,92,246,0.1)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: '#8b5cf6',
                                }}
                            >
                                <Package size={18} />
                            </div>
                            <h3
                                style={{
                                    fontSize: 16,
                                    fontWeight: 600,
                                    color: 'var(--text-primary)',
                                    margin: 0,
                                }}
                            >
                                Top Stock Items
                            </h3>
                        </div>
                    </div>

                    {isLoading ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            {Array.from({ length: 5 }).map((_, i) => (
                                <div key={i} className="skeleton" style={{ width: '100%', height: 40 }} />
                            ))}
                        </div>
                    ) : stockBalances.length === 0 ? (
                        <div
                            style={{
                                textAlign: 'center',
                                padding: '40px 0',
                                color: 'var(--text-muted)',
                                fontSize: 14,
                            }}
                        >
                            <Package size={32} style={{ opacity: 0.3, marginBottom: 8 }} />
                            <p>No stock data available</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            {stockBalances.slice(0, 8).map((item, i) => {
                                const maxQty = Math.max(...stockBalances.map((s) => s.quantity), 1);
                                const pct = Math.round((item.quantity / maxQty) * 100);
                                return (
                                    <div
                                        key={item.itemId}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 14,
                                            padding: '10px 12px',
                                            borderRadius: 8,
                                            transition: 'background 0.2s',
                                        }}
                                    >
                                        <span
                                            style={{
                                                width: 24,
                                                fontSize: 12,
                                                fontWeight: 600,
                                                color: 'var(--text-muted)',
                                                textAlign: 'center',
                                            }}
                                        >
                                            {i + 1}
                                        </span>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div
                                                style={{
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    marginBottom: 6,
                                                }}
                                            >
                                                <span
                                                    style={{
                                                        fontSize: 13,
                                                        fontWeight: 600,
                                                        color: 'var(--text-primary)',
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                        whiteSpace: 'nowrap',
                                                    }}
                                                >
                                                    {item.itemName}
                                                </span>
                                                <span
                                                    style={{
                                                        fontSize: 13,
                                                        fontWeight: 700,
                                                        color: 'var(--accent-cyan)',
                                                        flexShrink: 0,
                                                        marginLeft: 8,
                                                    }}
                                                >
                                                    {item.quantity}
                                                </span>
                                            </div>
                                            <div
                                                style={{
                                                    height: 4,
                                                    borderRadius: 100,
                                                    background: 'rgba(255,255,255,0.06)',
                                                    overflow: 'hidden',
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        height: '100%',
                                                        width: `${pct}%`,
                                                        borderRadius: 100,
                                                        background: `linear-gradient(90deg, ${PIE_COLORS[i % PIE_COLORS.length]}, ${PIE_COLORS[(i + 1) % PIE_COLORS.length]})`,
                                                        transition: 'width 0.6s cubic-bezier(0.4,0,0.2,1)',
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Responsive overrides */}
            <style>{`
        @media (max-width: 1200px) {
          div[style*="gridTemplateColumns: '1fr 380px'"] {
            grid-template-columns: 1fr !important;
          }
        }
        @media (max-width: 900px) {
          div[style*="gridTemplateColumns: '1fr 1fr'"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
        </div>
    );
}
