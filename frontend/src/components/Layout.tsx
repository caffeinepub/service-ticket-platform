import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../backend';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
    TicketIcon,
    PlusCircle,
    LayoutDashboard,
    LogOut,
    Menu,
    X,
    User,
    Heart,
} from 'lucide-react';

interface LayoutProps {
    children: React.ReactNode;
    currentPage: string;
    onNavigate: (page: string) => void;
}

export function Layout({ children, currentPage, onNavigate }: LayoutProps) {
    const { user, logout } = useAuth();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const customerNav = [
        { id: 'my-tickets', label: 'My Tickets', icon: <TicketIcon className="w-4 h-4" /> },
        { id: 'raise-ticket', label: 'Raise Ticket', icon: <PlusCircle className="w-4 h-4" /> },
    ];

    const providerNav = [
        { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
        { id: 'all-tickets', label: 'All Tickets', icon: <TicketIcon className="w-4 h-4" /> },
    ];

    const navItems = user?.role === UserRole.customer ? customerNav : providerNav;

    const SidebarContent = () => (
        <div className="flex flex-col h-full">
            {/* Logo */}
            <div className="px-4 py-5 border-b border-sidebar-border">
                <img
                    src="/assets/generated/supportdesk-logo.dim_200x60.png"
                    alt="SupportDesk"
                    className="h-8 w-auto object-contain brightness-0 invert"
                    onError={(e) => {
                        const target = e.currentTarget;
                        target.style.display = 'none';
                        const fallback = target.nextElementSibling as HTMLElement;
                        if (fallback) fallback.style.display = 'flex';
                    }}
                />
                <div className="hidden items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
                        <TicketIcon className="w-4 h-4 text-primary-foreground" />
                    </div>
                    <span className="font-bold text-sidebar-foreground font-display text-lg">SupportDesk</span>
                </div>
            </div>

            {/* Role badge */}
            <div className="px-4 py-3">
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                    user?.role === UserRole.customer
                        ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                        : 'bg-primary/20 text-primary'
                }`}>
                    {user?.role === UserRole.customer ? 'Customer' : 'Service Provider'}
                </span>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 py-2 space-y-1">
                {navItems.map(item => (
                    <button
                        key={item.id}
                        onClick={() => {
                            onNavigate(item.id);
                            setSidebarOpen(false);
                        }}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                            currentPage === item.id
                                ? 'bg-primary text-primary-foreground'
                                : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                        }`}
                    >
                        {item.icon}
                        {item.label}
                    </button>
                ))}
            </nav>

            <Separator className="bg-sidebar-border" />

            {/* User info & logout */}
            <div className="p-4 space-y-3">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                        <User className="w-4 h-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-sm font-semibold text-sidebar-foreground truncate">{user?.name}</p>
                        <p className="text-xs text-sidebar-foreground/60 truncate">{user?.email}</p>
                    </div>
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={logout}
                    className="w-full justify-start gap-2 text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                </Button>
            </div>
        </div>
    );

    return (
        <div className="flex h-screen bg-background overflow-hidden">
            {/* Desktop Sidebar */}
            <aside className="hidden md:flex flex-col w-60 bg-sidebar flex-shrink-0">
                <SidebarContent />
            </aside>

            {/* Mobile Sidebar Overlay */}
            {sidebarOpen && (
                <div className="fixed inset-0 z-50 md:hidden">
                    <div
                        className="absolute inset-0 bg-black/50"
                        onClick={() => setSidebarOpen(false)}
                    />
                    <aside className="absolute left-0 top-0 bottom-0 w-64 bg-sidebar flex flex-col">
                        <SidebarContent />
                    </aside>
                </div>
            )}

            {/* Main content */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Mobile header */}
                <header className="md:hidden flex items-center justify-between px-4 py-3 bg-card border-b border-border">
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="p-2 rounded-lg hover:bg-accent transition-colors"
                    >
                        <Menu className="w-5 h-5" />
                    </button>
                    <div className="flex items-center gap-2">
                        <TicketIcon className="w-5 h-5 text-primary" />
                        <span className="font-bold font-display">SupportDesk</span>
                    </div>
                    <div className="w-9" />
                </header>

                {/* Page content */}
                <main className="flex-1 overflow-y-auto">
                    <div className="max-w-5xl mx-auto px-4 md:px-8 py-6">
                        {children}
                    </div>
                </main>

                {/* Footer */}
                <footer className="border-t border-border bg-card px-6 py-3">
                    <p className="text-xs text-muted-foreground text-center flex items-center justify-center gap-1">
                        © {new Date().getFullYear()} SupportDesk. Built with{' '}
                        <Heart className="w-3 h-3 text-red-500 fill-red-500" />{' '}
                        using{' '}
                        <a
                            href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname || 'supportdesk')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline font-medium"
                        >
                            caffeine.ai
                        </a>
                    </p>
                </footer>
            </div>
        </div>
    );
}
