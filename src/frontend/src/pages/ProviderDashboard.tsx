import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { RefreshCw, TicketIcon } from "lucide-react";
import React, { useState, useMemo } from "react";
import { TicketPriority, TicketStatus } from "../backend";
import { SummaryStats } from "../components/SummaryStats";
import { TicketCard } from "../components/TicketCard";
import { type FilterState, TicketFilters } from "../components/TicketFilters";
import { useAllTickets } from "../hooks/useQueries";

interface ProviderDashboardProps {
  onNavigate: (page: string, ticketId?: string) => void;
}

export function ProviderDashboard({ onNavigate }: ProviderDashboardProps) {
  const { data: tickets, isLoading, isError, refetch } = useAllTickets();
  const [filters, setFilters] = useState<FilterState>({
    status: "all",
    priority: "all",
    moduleName: "all",
  });

  const filteredTickets = useMemo(() => {
    if (!tickets) return [];
    return tickets
      .filter((ticket) => {
        if (filters.status !== "all" && ticket.status !== filters.status)
          return false;
        if (filters.priority !== "all" && ticket.priority !== filters.priority)
          return false;
        if (
          filters.moduleName !== "all" &&
          ticket.moduleName !== filters.moduleName
        )
          return false;
        return true;
      })
      .sort((a, b) => Number(b.createdAt - a.createdAt));
  }, [tickets, filters]);

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display text-foreground">
            Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Overview of all support tickets
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          className="gap-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </Button>
      </div>

      {/* Summary Stats */}
      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
      ) : (
        <SummaryStats tickets={tickets || []} />
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-foreground">
          All Tickets
          {!isLoading && tickets && (
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              ({filteredTickets.length} of {tickets.length})
            </span>
          )}
        </h2>
        <TicketFilters filters={filters} onFilterChange={setFilters} />
      </div>

      {/* Ticket List */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28 w-full rounded-lg" />
          ))}
        </div>
      )}

      {isError && (
        <div className="text-center py-12">
          <p className="text-destructive mb-3">Failed to load tickets.</p>
          <Button variant="outline" onClick={() => refetch()}>
            Try Again
          </Button>
        </div>
      )}

      {!isLoading && !isError && filteredTickets.length === 0 && (
        <div className="text-center py-16">
          <TicketIcon className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-muted-foreground font-medium">No tickets found</p>
          <p className="text-sm text-muted-foreground/70 mt-1">
            {tickets && tickets.length > 0
              ? "Try adjusting your filters."
              : "No tickets have been submitted yet."}
          </p>
        </div>
      )}

      {!isLoading && !isError && filteredTickets.length > 0 && (
        <div className="space-y-3">
          {filteredTickets.map((ticket) => (
            <TicketCard
              key={ticket.id}
              ticket={ticket}
              onClick={() => onNavigate("ticket-detail", ticket.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
