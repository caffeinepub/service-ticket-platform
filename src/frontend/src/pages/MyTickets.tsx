import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, PlusCircle, RefreshCw, TicketIcon } from "lucide-react";
import React, { useCallback } from "react";
import type { Ticket } from "../backend";
import { TicketCard } from "../components/TicketCard";
import { useAuth } from "../contexts/AuthContext";
import { useAllTickets, useMyTickets } from "../hooks/useQueries";

interface MyTicketsProps {
  onNavigate: (page: string, ticketId?: string) => void;
}

function downloadTicketsCSV(tickets: Ticket[], filename: string) {
  const headers = [
    "Ticket ID",
    "Title",
    "Module",
    "Status",
    "Priority",
    "Created At",
    "Description",
  ];
  const csvEscape = (val: string) => `"${val.replace(/"/g, '""')}"`;
  const rows = tickets.map((t) => [
    csvEscape(t.id),
    csvEscape(t.title),
    csvEscape(t.moduleName),
    csvEscape(t.status),
    csvEscape(t.priority),
    csvEscape(new Date(Number(t.createdAt) / 1_000_000).toLocaleString()),
    csvEscape(t.description),
  ]);
  const csv = [
    headers.map(csvEscape).join(","),
    ...rows.map((r) => r.join(",")),
  ].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function TicketList({
  tickets,
  isLoading,
  isError,
  onRefetch,
  onNavigate,
  onRaiseTicket,
  emptyTitle,
  emptyDesc,
  showRaiseButton,
}: {
  tickets: Ticket[] | undefined;
  isLoading: boolean;
  isError: boolean;
  onRefetch: () => void;
  onNavigate: (page: string, ticketId?: string) => void;
  onRaiseTicket?: () => void;
  emptyTitle: string;
  emptyDesc: string;
  showRaiseButton?: boolean;
}) {
  const sorted = tickets
    ? [...tickets].sort((a, b) => Number(b.createdAt - a.createdAt))
    : [];
  return (
    <div>
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
          <Button variant="outline" onClick={onRefetch}>
            Try Again
          </Button>
        </div>
      )}
      {!isLoading && !isError && sorted.length === 0 && (
        <div className="text-center py-16" data-ocid="mytickets.empty_state">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <TicketIcon className="w-7 h-7 text-muted-foreground" />
          </div>
          <h3 className="font-semibold text-foreground mb-1 font-display">
            {emptyTitle}
          </h3>
          <p className="text-muted-foreground text-sm mb-4">{emptyDesc}</p>
          {showRaiseButton && onRaiseTicket && (
            <Button onClick={onRaiseTicket} className="gap-2">
              <PlusCircle className="w-4 h-4" /> Raise a Ticket
            </Button>
          )}
        </div>
      )}
      {!isLoading && !isError && sorted.length > 0 && (
        <div className="space-y-3">
          {sorted.map((ticket) => (
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

export function MyTickets({ onNavigate }: MyTicketsProps) {
  const {
    data: myTickets,
    isLoading: myLoading,
    isError: myError,
    refetch: myRefetch,
  } = useMyTickets();
  const { user } = useAuth();

  const isMaster = user?.loginId === "master" || user?.accountType === "master";
  const canViewOthers = isMaster || !!user?.permissions?.viewOtherTickets;
  const canDownloadCSV = isMaster || !!user?.permissions?.csvDownload;
  const canRaiseTicket = isMaster || !!user?.permissions?.ticketRaising;

  const {
    data: allTickets,
    isLoading: allLoading,
    isError: allError,
    refetch: allRefetch,
  } = useAllTickets();

  const handleDownloadMyCSV = useCallback(() => {
    if (myTickets && myTickets.length > 0)
      downloadTicketsCSV(
        myTickets,
        `my-tickets-${new Date().toISOString().slice(0, 10)}.csv`,
      );
  }, [myTickets]);

  const handleDownloadAllCSV = useCallback(() => {
    if (allTickets && allTickets.length > 0)
      downloadTicketsCSV(
        allTickets,
        `all-tickets-${new Date().toISOString().slice(0, 10)}.csv`,
      );
  }, [allTickets]);

  if (!canViewOthers) {
    // Simple view — just my tickets
    return (
      <div className="animate-fade-in">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold font-display text-foreground">
              My Tickets
            </h1>
            <p className="text-muted-foreground mt-1">
              {myTickets
                ? `${myTickets.length} ticket${myTickets.length !== 1 ? "s" : ""} submitted`
                : "Loading..."}
            </p>
          </div>
          <div className="flex gap-2">
            {canDownloadCSV && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadMyCSV}
                disabled={myLoading || !myTickets || myTickets.length === 0}
                className="gap-1.5"
                data-ocid="mytickets.download_csv.button"
              >
                <Download className="w-3.5 h-3.5" /> Download CSV
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => myRefetch()}
              className="gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </Button>
            {canRaiseTicket && (
              <Button
                size="sm"
                onClick={() => onNavigate("raise-ticket")}
                className="gap-1.5"
                data-ocid="mytickets.raise_ticket.button"
              >
                <PlusCircle className="w-3.5 h-3.5" /> New Ticket
              </Button>
            )}
          </div>
        </div>
        <TicketList
          tickets={myTickets}
          isLoading={myLoading}
          isError={myError}
          onRefetch={myRefetch}
          onNavigate={onNavigate}
          onRaiseTicket={() => onNavigate("raise-ticket")}
          emptyTitle="No tickets yet"
          emptyDesc="Raise your first support ticket to get started."
          showRaiseButton={canRaiseTicket}
        />
      </div>
    );
  }

  // Tabbed view — My Tickets + All Tickets
  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold font-display text-foreground">
            Tickets
          </h1>
          <p className="text-muted-foreground mt-1">
            View and manage support tickets
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              myRefetch();
              allRefetch();
            }}
            className="gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </Button>
          {canRaiseTicket && (
            <Button
              size="sm"
              onClick={() => onNavigate("raise-ticket")}
              className="gap-1.5"
              data-ocid="mytickets.raise_ticket.button"
            >
              <PlusCircle className="w-3.5 h-3.5" /> New Ticket
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="my-tickets">
        <div className="flex items-center justify-between mb-4">
          <TabsList data-ocid="mytickets.tab">
            <TabsTrigger value="my-tickets" data-ocid="mytickets.my.tab">
              My Tickets
            </TabsTrigger>
            <TabsTrigger value="all-tickets" data-ocid="mytickets.all.tab">
              All Tickets
            </TabsTrigger>
          </TabsList>
          {canDownloadCSV && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadMyCSV}
                disabled={myLoading || !myTickets || myTickets.length === 0}
                className="gap-1.5"
                data-ocid="mytickets.download_csv.button"
              >
                <Download className="w-3.5 h-3.5" /> My CSV
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadAllCSV}
                disabled={allLoading || !allTickets || allTickets.length === 0}
                className="gap-1.5"
                data-ocid="mytickets.download_all_csv.button"
              >
                <Download className="w-3.5 h-3.5" /> All CSV
              </Button>
            </div>
          )}
        </div>
        <TabsContent value="my-tickets">
          <TicketList
            tickets={myTickets}
            isLoading={myLoading}
            isError={myError}
            onRefetch={myRefetch}
            onNavigate={onNavigate}
            onRaiseTicket={() => onNavigate("raise-ticket")}
            emptyTitle="No tickets yet"
            emptyDesc="Raise your first support ticket to get started."
            showRaiseButton={canRaiseTicket}
          />
        </TabsContent>
        <TabsContent value="all-tickets">
          <TicketList
            tickets={allTickets}
            isLoading={allLoading}
            isError={allError}
            onRefetch={allRefetch}
            onNavigate={onNavigate}
            emptyTitle="No tickets found"
            emptyDesc="No tickets have been submitted yet."
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
