import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Download, RefreshCw, TicketIcon, UserCheck } from "lucide-react";
import React, { useState, useMemo, useCallback } from "react";
import type { Ticket } from "../backend";
import { SummaryStats } from "../components/SummaryStats";
import { TicketCard } from "../components/TicketCard";
import { type FilterState, TicketFilters } from "../components/TicketFilters";
import { useAuth } from "../contexts/AuthContext";
import { useAllTickets } from "../hooks/useQueries";
import {
  MASTER_ACCOUNT,
  getAccounts,
  getTicketAssignment,
} from "../utils/credentialStore";

interface ProviderDashboardProps {
  onNavigate: (page: string, ticketId?: string) => void;
}

function downloadTicketsCSV(tickets: Ticket[]) {
  const headers = [
    "Ticket ID",
    "Title",
    "Module",
    "Status",
    "Priority",
    "Created At",
    "Updated At",
    "Description",
    "Assigned To",
  ];
  const csvEscape = (val: string) => `"${val.replace(/"/g, '""')}"`;

  // Build assignment lookup
  const masterAccounts = getAccounts().filter(
    (a) => a.accountType === "master",
  );
  const allMasters = [
    { loginId: MASTER_ACCOUNT.loginId, name: MASTER_ACCOUNT.name },
    ...masterAccounts.map((a) => ({ loginId: a.loginId, name: a.name })),
  ];
  const getMasterName = (loginId: string | null) => {
    if (!loginId) return "Unassigned";
    return allMasters.find((m) => m.loginId === loginId)?.name ?? loginId;
  };

  const rows = tickets.map((t) => [
    csvEscape(t.id),
    csvEscape(t.title),
    csvEscape(t.moduleName),
    csvEscape(t.status),
    csvEscape(t.priority),
    csvEscape(new Date(Number(t.createdAt) / 1_000_000).toLocaleString()),
    csvEscape(new Date(Number(t.updatedAt) / 1_000_000).toLocaleString()),
    csvEscape(t.description),
    csvEscape(getMasterName(getTicketAssignment(t.id))),
  ]);
  const csv = [
    headers.map(csvEscape).join(","),
    ...rows.map((r) => r.join(",")),
  ].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `tickets-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function ProviderDashboard({ onNavigate }: ProviderDashboardProps) {
  const { data: tickets, isLoading, isError, refetch } = useAllTickets();
  const { user } = useAuth();
  const [filters, setFilters] = useState<FilterState>({
    status: "all",
    priority: "all",
    moduleName: "all",
  });

  const isMaster = user?.loginId === "master" || user?.accountType === "master";
  const canDownloadCSV = isMaster || !!user?.permissions?.csvDownload;

  // Build master name lookup for assignment display
  const masterAccounts = getAccounts().filter(
    (a) => a.accountType === "master",
  );
  const allMasters = useMemo(
    () => [
      { loginId: MASTER_ACCOUNT.loginId, name: MASTER_ACCOUNT.name },
      ...masterAccounts.map((a) => ({ loginId: a.loginId, name: a.name })),
    ],
    [masterAccounts],
  );

  const getMasterName = useCallback(
    (loginId: string | null) => {
      if (!loginId) return null;
      return allMasters.find((m) => m.loginId === loginId)?.name ?? loginId;
    },
    [allMasters],
  );

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

  const handleDownloadCSV = useCallback(() => {
    downloadTicketsCSV(filteredTickets);
  }, [filteredTickets]);

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
        <div className="flex gap-2">
          {canDownloadCSV && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadCSV}
              disabled={isLoading || filteredTickets.length === 0}
              className="gap-1.5"
              data-ocid="dashboard.download_csv.button"
            >
              <Download className="w-3.5 h-3.5" /> Download CSV
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
      ) : (
        <SummaryStats tickets={tickets || []} />
      )}

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
        <div className="text-center py-16" data-ocid="dashboard.empty_state">
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
          {filteredTickets.map((ticket) => {
            const assignedLoginId = getTicketAssignment(ticket.id);
            const assignedName = getMasterName(assignedLoginId);
            return (
              <div key={ticket.id}>
                <TicketCard
                  ticket={ticket}
                  onClick={() => onNavigate("ticket-detail", ticket.id)}
                />
                {assignedName && (
                  <div className="flex items-center gap-1.5 px-5 pb-2 -mt-1 text-xs text-muted-foreground">
                    <UserCheck className="w-3 h-3 text-primary" />
                    <span>
                      Assigned to:{" "}
                      <span className="font-medium text-foreground">
                        {assignedName}
                      </span>
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
