import React, { useState } from "react";
import { Layout } from "./components/Layout";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { useAllTickets, useMyTickets } from "./hooks/useQueries";
import { LoginPage } from "./pages/LoginPage";
import { ManageCustomers } from "./pages/ManageCustomers";
import { MyTickets } from "./pages/MyTickets";
import { ProviderDashboard } from "./pages/ProviderDashboard";
import { RaiseTicket } from "./pages/RaiseTicket";
import { TicketDetail } from "./pages/TicketDetail";

// ── Ticket Detail Wrappers ─────────────────────────────────────────────────

function CustomerTicketDetailWrapper({
  ticketId,
  onBack,
}: {
  ticketId: string;
  onBack: () => void;
}) {
  const { data: tickets } = useMyTickets();
  const ticket = tickets?.find((t) => t.id === ticketId);

  if (!ticket) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>Ticket not found.</p>
        <button
          type="button"
          onClick={onBack}
          className="mt-3 text-primary hover:underline text-sm"
        >
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
  const ticket = tickets?.find((t) => t.id === ticketId);

  if (!ticket) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>Ticket not found.</p>
        <button
          type="button"
          onClick={onBack}
          className="mt-3 text-primary hover:underline text-sm"
        >
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
  const [currentPage, setCurrentPage] = useState<string>("");
  const [selectedTicketId, setSelectedTicketId] = useState<string>("");

  const handleNavigate = (page: string, ticketId?: string) => {
    setCurrentPage(page);
    if (ticketId !== undefined) setSelectedTicketId(ticketId);
  };

  const handleLoginSuccess = () => {
    if (user?.role === "customer") {
      setCurrentPage("my-tickets");
    } else {
      setCurrentPage("dashboard");
    }
  };

  // After login, set default page based on role
  React.useEffect(() => {
    if (isAuthenticated && !currentPage) {
      if (user?.role === "customer") {
        setCurrentPage("my-tickets");
      } else {
        setCurrentPage("dashboard");
      }
    }
    if (!isAuthenticated) {
      setCurrentPage("");
    }
  }, [isAuthenticated, user?.role, currentPage]);

  if (!isAuthenticated) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  const renderPage = () => {
    if (user?.role === "customer") {
      if (currentPage === "raise-ticket") {
        return <RaiseTicket onNavigate={handleNavigate} />;
      }
      if (currentPage === "ticket-detail") {
        return (
          <CustomerTicketDetailWrapper
            ticketId={selectedTicketId}
            onBack={() => setCurrentPage("my-tickets")}
          />
        );
      }
      return <MyTickets onNavigate={handleNavigate} />;
    }
    // master role
    if (currentPage === "manage-customers") {
      return <ManageCustomers />;
    }
    if (currentPage === "ticket-detail") {
      return (
        <ProviderTicketDetailWrapper
          ticketId={selectedTicketId}
          onBack={() => setCurrentPage("dashboard")}
        />
      );
    }
    return <ProviderDashboard onNavigate={handleNavigate} />;
  };

  const getActivePage = () => {
    if (currentPage === "ticket-detail") {
      return user?.role === "customer" ? "my-tickets" : "dashboard";
    }
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
