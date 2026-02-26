import React from 'react';
import { Ticket } from '../backend';
import { StatusBadge } from './StatusBadge';
import { PriorityBadge } from './PriorityBadge';
import { Card, CardContent } from '@/components/ui/card';
import { Tag, Clock, ChevronRight } from 'lucide-react';

interface TicketCardProps {
    ticket: Ticket;
    onClick?: () => void;
}

function formatDate(nanoseconds: bigint): string {
    const ms = Number(nanoseconds / BigInt(1_000_000));
    return new Date(ms).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
}

export function TicketCard({ ticket, onClick }: TicketCardProps) {
    return (
        <Card
            className="cursor-pointer transition-all duration-200 hover:shadow-card-hover hover:-translate-y-0.5 border border-border shadow-card"
            onClick={onClick}
        >
            <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <StatusBadge status={ticket.status} />
                            <PriorityBadge priority={ticket.priority} />
                        </div>
                        <h3 className="font-semibold text-foreground text-base leading-snug mb-1 truncate font-display">
                            {ticket.title}
                        </h3>
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                            {ticket.description}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                                <Tag className="w-3 h-3" />
                                {ticket.moduleName}
                            </span>
                            <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {formatDate(ticket.createdAt)}
                            </span>
                            <span className="text-muted-foreground/60">#{ticket.id}</span>
                        </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-1" />
                </div>
            </CardContent>
        </Card>
    );
}
