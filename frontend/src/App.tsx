import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { UserRole, Ticket } from './backend';
import { Layout } from './components/Layout';
import { LoginPage } from './pages/LoginPage';
import { RaiseTicket } from './pages/RaiseTicket';
import { MyTickets } from './pages/MyTickets';
import { TicketDetail } from './pages/TicketDetail';
import { ProviderDashboard } from './pages/ProviderDashboard';
import { useMyTickets, useAllTickets } from './hooks/useQueries';

// ── Ticket Detail Wrapper ──────────────────────────────────────────────────

function CustomerTicketDetailWrapper({
    ticketId,
    onBack,
}: {
    ticketId: string;
    onBack: () => void;
}) {
    const { data: tickets } = useMyTickets();
    const ticket = tickets?.find(t => t.id === ticketId);

    if (!ticket) {
        return (
            <div className="text-center py-12 text-muted-foreground">
                <p>Ticket not found.</p>
                <button onClick={onBack} className="mt-3 text-primary hover:underline text-sm">
                    Go back
                </button>
            </div>
        );
    }

    return <TicketDetail ticket={ticket} onBack={onBack} />;
}

function ProviderTicketDetailWrapper({
    ticketId,
    onBack,
}: {
    ticketId: string;
    onBack: () => void;
}) {
    const { data: tickets } = useAllTickets();
    const ticket = tickets?.find(t => t.id === ticketId);

    if (!ticket) {
        return (
            <div className="text-center py-12 text-muted-foreground">
                <p>Ticket not found.</p>
                <button onClick={onBack} className="mt-3 text-primary hover:underline text-sm">
                    Go back
                </button>
            </div>
        );
    }

    return <TicketDetail ticket={ticket} onBack={onBack} />;
}

// ── Main App Inner ─────────────────────────────────────────────────────────

function AppInner() {
    const { user, isAuthenticated } = useAuth();
    const [currentPage, setCurrentPage] = useState<string>('');
    const [selectedTicketId, setSelectedTicketId] = useState<string>('');

    const handleNavigate = (page: string, ticketId?: string) => {
        setCurrentPage(page);
        if (ticketId !== undefined) setSelectedTicketId(ticketId);
    };

    const handleLoginSuccess = () => {
        if (user?.role === UserRole.customer) {
            setCurrentPage('my-tickets');
        } else {
            setCurrentPage('dashboard');
        }
    };

    // After login, set default page based on role
    React.useEffect(() => {
        if (isAuthenticated && !currentPage) {
            if (user?.role === UserRole.customer) {
                setCurrentPage('my-tickets');
            } else {
                setCurrentPage('dashboard');
            }
        }
        if (!isAuthenticated) {
            setCurrentPage('');
        }
    }, [isAuthenticated, user?.role]);

    if (!isAuthenticated) {
        return <LoginPage onLoginSuccess={handleLoginSuccess} />;
    }

    const renderPage = () => {
        if (user?.role === UserRole.customer) {
            switch (currentPage) {
                case 'raise-ticket':
                    return <RaiseTicket onNavigate={handleNavigate} />;
                case 'ticket-detail':
                    return (
                        <CustomerTicketDetailWrapper
                            ticketId={selectedTicketId}
                            onBack={() => setCurrentPage('my-tickets')}
                        />
                    );
                case 'my-tickets':
                default:
                    return <MyTickets onNavigate={handleNavigate} />;
            }
        } else {
            switch (currentPage) {
                case 'all-tickets':
                    return <ProviderDashboard onNavigate={handleNavigate} />;
                case 'provider-ticket-detail':
                    return (
                        <ProviderTicketDetailWrapper
                            ticketId={selectedTicketId}
                            onBack={() => setCurrentPage('dashboard')}
                        />
                    );
                case 'dashboard':
                default:
                    return <ProviderDashboard onNavigate={handleNavigate} />;
            }
        }
    };

    const getActivePage = () => {
        if (currentPage === 'provider-ticket-detail') return 'all-tickets';
        if (currentPage === 'ticket-detail') return 'my-tickets';
        return currentPage;
    };

    return (
        <Layout currentPage={getActivePage()} onNavigate={handleNavigate}>
            {renderPage()}
        </Layout>
    );
}

// ── Root App ───────────────────────────────────────────────────────────────

export default function App() {
    return (
        <AuthProvider>
            <AppInner />
        </AuthProvider>
    );
}
