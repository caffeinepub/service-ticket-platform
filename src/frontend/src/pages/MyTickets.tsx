import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PlusCircle, RefreshCw, TicketIcon } from "lucide-react";
import React from "react";
import { TicketCard } from "../components/TicketCard";
import { useMyTickets } from "../hooks/useQueries";

interface MyTicketsProps {
  onNavigate: (page: string, ticketId?: string) => void;
}

export function MyTickets({ onNavigate }: MyTicketsProps) {
  const { data: tickets, isLoading, isError, refetch } = useMyTickets();

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold font-display text-foreground">
            My Tickets
          </h1>
          <p className="text-muted-foreground mt-1">
            {tickets
              ? `${tickets.length} ticket${tickets.length !== 1 ? "s" : ""} submitted`
              : "Loading..."}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </Button>
          <Button
            size="sm"
            onClick={() => onNavigate("raise-ticket")}
            className="gap-1.5"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            New Ticket
          </Button>
        </div>
      </div>

      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
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

      {!isLoading && !isError && tickets && tickets.length === 0 && (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <TicketIcon className="w-7 h-7 text-muted-foreground" />
          </div>
          <h3 className="font-semibold text-foreground mb-1 font-display">
            No tickets yet
          </h3>
          <p className="text-muted-foreground text-sm mb-4">
            Raise your first support ticket to get started.
          </p>
          <Button onClick={() => onNavigate("raise-ticket")} className="gap-2">
            <PlusCircle className="w-4 h-4" />
            Raise a Ticket
          </Button>
        </div>
      )}

      {!isLoading && !isError && tickets && tickets.length > 0 && (
        <div className="space-y-3">
          {[...tickets]
            .sort((a, b) => Number(b.createdAt - a.createdAt))
            .map((ticket) => (
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
