'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import {
    LayoutDashboard,
    Store,
    Package,
    Tags,
    BarChart3,
    TrendingUp,
    Warehouse,
    ShoppingCart,
    Users,
    Shield,
    Menu as MenuIcon,
    Layers,
    FileText,
    Settings,
    LogOut,
    Zap,
    ChevronDown,
} from 'lucide-react';

interface NavItem {
    label: string;
    href: string;
    icon: React.ReactNode;
    children?: { label: string; href: string }[];
}

const navSections: { title: string; items: NavItem[] }[] = [
    {
        title: 'Overview',
        items: [
            { label: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard size={20} /> },
        ],
    },
    {
        title: 'Business',
        items: [
            { label: 'Businesses', href: '/dashboard/businesses', icon: <Store size={20} /> },
            { label: 'Staff', href: '/dashboard/staff', icon: <Users size={20} /> },
        ],
    },
    {
        title: 'Inventory',
        items: [
            { label: 'Items', href: '/dashboard/items', icon: <Package size={20} /> },
            { label: 'Categories', href: '/dashboard/categories', icon: <Tags size={20} /> },
            { label: 'Usage types', href: '/dashboard/item-usage-types', icon: <Layers size={20} /> },
            { label: 'Stock', href: '/dashboard/stock', icon: <Warehouse size={20} /> },
        ],
    },
    {
        title: 'Sales',
        items: [
            { label: 'POS', href: '/dashboard/pos', icon: <ShoppingCart size={20} /> },
            { label: 'Transactions', href: '/dashboard/transactions', icon: <BarChart3 size={20} /> },
            { label: 'Reports', href: '/dashboard/sales/reports', icon: <TrendingUp size={20} /> },
            { label: 'Invoices', href: '/dashboard/invoices', icon: <FileText size={20} /> },
        ],
    },
    {
        title: 'System',
        items: [
            { label: 'Roles', href: '/dashboard/roles', icon: <Shield size={20} /> },
            { label: 'Menus', href: '/dashboard/menus', icon: <MenuIcon size={20} /> },
            { label: 'Settings', href: '/dashboard/settings', icon: <Settings size={20} /> },
        ],
    },
];

export default function Sidebar() {
    const pathname = usePathname();
    const { user, logout } = useAuth();
    const [collapsed, setCollapsed] = React.useState(false);
    const [mobileOpen, setMobileOpen] = React.useState(false);

    const isActive = (href: string) => {
        if (href === '/dashboard') return pathname === '/dashboard';
        return pathname.startsWith(href);
    };

    return (
        <>
            {/* Mobile overlay */}
            {mobileOpen && (
                <div
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(0,0,0,0.6)',
                        zIndex: 45,
                    }}
                    onClick={() => setMobileOpen(false)}
                />
            )}

            {/* Mobile toggle */}
            <button
                onClick={() => setMobileOpen(!mobileOpen)}
                style={{
                    position: 'fixed',
                    top: 18,
                    left: 16,
                    zIndex: 55,
                    background: 'rgba(17,24,39,0.9)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 10,
                    color: 'var(--text-primary)',
                    padding: 10,
                    cursor: 'pointer',
                    display: 'none',
                }}
                className="mobile-menu-btn"
                aria-label="Toggle menu"
            >
                <MenuIcon size={20} />
            </button>

            <style>{`
        @media (max-width: 1024px) {
          .mobile-menu-btn { display: flex !important; }
          .sidebar-wrapper {
            transform: ${mobileOpen ? 'translateX(0)' : 'translateX(-100%)'} !important;
          }
        }
      `}</style>

            <aside
                className="sidebar sidebar-wrapper"
                style={{ width: collapsed ? 80 : 280 }}
            >
                {/* Brand */}
                <div
                    style={{
                        padding: '24px 20px 20px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 14,
                        borderBottom: '1px solid rgba(255,255,255,0.04)',
                        marginBottom: 8,
                    }}
                >
                    <div
                        style={{
                            width: 40,
                            height: 40,
                            borderRadius: 10,
                            background: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                        }}
                    >
                        <Zap size={20} color="white" />
                    </div>
                    {!collapsed && (
                        <div className="animate-fade-in">
                            <h2
                                style={{
                                    fontSize: 17,
                                    fontWeight: 700,
                                    color: 'var(--text-primary)',
                                    margin: 0,
                                    letterSpacing: '-0.01em',
                                }}
                            >
                                BizEnhance
                            </h2>
                            <span
                                style={{
                                    fontSize: 11,
                                    color: 'var(--text-muted)',
                                    fontWeight: 500,
                                }}
                            >
                                Business Management
                            </span>
                        </div>
                    )}
                </div>

                {/* Nav */}
                <nav
                    style={{
                        flex: 1,
                        overflowY: 'auto',
                        padding: '8px 0',
                    }}
                >
                    {(() => {
                        const isBizAdmin = !!user?.bizId;
                        // Build sections: biz admins get Roles & Menus under Business; system admins under System
                        const sectionsToRender = navSections.map((section) => {
                            if (section.title === 'Business' && isBizAdmin) {
                                return {
                                    ...section,
                                    items: [
                                        ...section.items.filter((item) => item.label !== 'Businesses'),
                                        { label: 'Roles', href: '/dashboard/biz/roles', icon: <Shield size={20} /> },
                                        { label: 'Menus', href: '/dashboard/biz/menus', icon: <MenuIcon size={20} /> },
                                    ],
                                };
                            }
                            if (section.title === 'System') {
                                const items = isBizAdmin
                                    ? section.items.filter((item) => item.label !== 'Roles' && item.label !== 'Menus')
                                    : section.items;
                                return { ...section, items };
                            }
                            const filteredItems = section.items.filter((item) => {
                                if (isBizAdmin && item.label === 'Businesses') return false;
                                return true;
                            });
                            return { ...section, items: filteredItems };
                        });
                        return sectionsToRender;
                    })().map((section) => {
                        const filteredItems = section.items;

                        if (filteredItems.length === 0) return null;

                        return (
                            <div key={section.title} style={{ marginBottom: 8 }}>
                                {!collapsed && (
                                    <div
                                        style={{
                                            padding: '8px 24px 6px',
                                            fontSize: 11,
                                            fontWeight: 600,
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.08em',
                                            color: 'var(--text-muted)',
                                        }}
                                    >
                                        {section.title}
                                    </div>
                                )}
                                {filteredItems.map((item) => (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={`sidebar-link ${isActive(item.href) ? 'active' : ''}`}
                                        onClick={() => setMobileOpen(false)}
                                        style={collapsed ? { justifyContent: 'center', padding: '12px' } : {}}
                                        title={collapsed ? item.label : undefined}
                                    >
                                        {item.icon}
                                        {!collapsed && <span>{item.label}</span>}
                                        {!collapsed && (item as NavItem).children && (
                                            <ChevronDown size={14} style={{ marginLeft: 'auto', opacity: 0.5 }} />
                                        )}
                                    </Link>
                                ))}
                            </div>
                        );
                    })}
                </nav>

                {/* User area */}
                <div
                    style={{
                        padding: '16px 12px',
                        borderTop: '1px solid rgba(255,255,255,0.04)',
                    }}
                >
                    {!collapsed && user && (
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 12,
                                padding: '10px 12px',
                                borderRadius: 'var(--radius-md)',
                                background: 'rgba(255,255,255,0.03)',
                                marginBottom: 8,
                            }}
                        >
                            <div
                                style={{
                                    width: 36,
                                    height: 36,
                                    borderRadius: '50%',
                                    background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: 14,
                                    fontWeight: 700,
                                    color: 'white',
                                    flexShrink: 0,
                                }}
                            >
                                {(user.fullName || user.username || '?')[0].toUpperCase()}
                            </div>
                            <div style={{ minWidth: 0 }}>
                                <div
                                    style={{
                                        fontSize: 13,
                                        fontWeight: 600,
                                        color: 'var(--text-primary)',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                    }}
                                >
                                    {user.fullName || user.username}
                                </div>
                                <div
                                    style={{
                                        fontSize: 11,
                                        color: 'var(--text-muted)',
                                    }}
                                >
                                    {user.roleName}
                                </div>
                            </div>
                        </div>
                    )}

                    <button
                        onClick={logout}
                        className="sidebar-link"
                        style={{
                            width: '100%',
                            border: 'none',
                            background: 'none',
                            cursor: 'pointer',
                            fontFamily: 'inherit',
                            ...(collapsed ? { justifyContent: 'center', padding: '12px' } : {}),
                        }}
                    >
                        <LogOut size={20} />
                        {!collapsed && <span>Sign Out</span>}
                    </button>

                    {/* Collapse toggle – desktop only */}
                    <button
                        onClick={() => setCollapsed(!collapsed)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '100%',
                            padding: '8px',
                            marginTop: 4,
                            borderRadius: 'var(--radius-sm)',
                            border: 'none',
                            background: 'transparent',
                            color: 'var(--text-muted)',
                            cursor: 'pointer',
                            fontSize: 12,
                            fontFamily: 'inherit',
                            transition: 'color 0.2s',
                        }}
                        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                    >
                        <ChevronDown
                            size={16}
                            style={{
                                transform: collapsed ? 'rotate(-90deg)' : 'rotate(90deg)',
                                transition: 'transform 0.3s',
                            }}
                        />
                        {!collapsed && <span style={{ marginLeft: 6 }}>Collapse</span>}
                    </button>
                </div>
            </aside>
        </>
    );
}
