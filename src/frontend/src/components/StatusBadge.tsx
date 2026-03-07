import React from "react";
import { TicketStatus } from "../backend";

interface StatusBadgeProps {
  status: TicketStatus;
  className?: string;
}

const statusConfig: Record<TicketStatus, { label: string; className: string }> =
  {
    [TicketStatus.open]: {
      label: "Open",
      className: "status-open",
    },
    [TicketStatus.in_progress]: {
      label: "In Progress",
      className: "status-in-progress",
    },
    [TicketStatus.resolved]: {
      label: "Resolved",
      className: "status-resolved",
    },
    [TicketStatus.closed]: {
      label: "Closed",
      className: "status-closed",
    },
  };

export function StatusBadge({ status, className = "" }: StatusBadgeProps) {
  const config = statusConfig[status];
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide ${config.className} ${className}`}
    >
      {config.label}
    </span>
  );
}
