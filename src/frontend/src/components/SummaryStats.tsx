import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, CheckCircle, Clock, XCircle } from "lucide-react";
import React from "react";
import { type Ticket, TicketStatus } from "../backend";

interface SummaryStatsProps {
  tickets: Ticket[];
}

export function SummaryStats({ tickets }: SummaryStatsProps) {
  const counts = {
    [TicketStatus.open]: tickets.filter((t) => t.status === TicketStatus.open)
      .length,
    [TicketStatus.in_progress]: tickets.filter(
      (t) => t.status === TicketStatus.in_progress,
    ).length,
    [TicketStatus.resolved]: tickets.filter(
      (t) => t.status === TicketStatus.resolved,
    ).length,
    [TicketStatus.closed]: tickets.filter(
      (t) => t.status === TicketStatus.closed,
    ).length,
  };

  const stats = [
    {
      label: "Open",
      count: counts[TicketStatus.open],
      icon: <AlertCircle className="w-5 h-5" />,
      colorClass: "text-amber-600",
      bgClass: "bg-amber-50",
      borderClass: "border-amber-200",
    },
    {
      label: "In Progress",
      count: counts[TicketStatus.in_progress],
      icon: <Clock className="w-5 h-5" />,
      colorClass: "text-blue-600",
      bgClass: "bg-blue-50",
      borderClass: "border-blue-200",
    },
    {
      label: "Resolved",
      count: counts[TicketStatus.resolved],
      icon: <CheckCircle className="w-5 h-5" />,
      colorClass: "text-emerald-600",
      bgClass: "bg-emerald-50",
      borderClass: "border-emerald-200",
    },
    {
      label: "Closed",
      count: counts[TicketStatus.closed],
      icon: <XCircle className="w-5 h-5" />,
      colorClass: "text-slate-500",
      bgClass: "bg-slate-50",
      borderClass: "border-slate-200",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <Card
          key={stat.label}
          className={`border ${stat.borderClass} shadow-card`}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-muted-foreground">
                {stat.label}
              </span>
              <span
                className={`${stat.colorClass} ${stat.bgClass} p-1.5 rounded-md`}
              >
                {stat.icon}
              </span>
            </div>
            <p className={`text-3xl font-bold font-display ${stat.colorClass}`}>
              {stat.count}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
