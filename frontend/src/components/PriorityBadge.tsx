import React from 'react';
import { TicketPriority } from '../backend';
import { ArrowDown, ArrowRight, ArrowUp } from 'lucide-react';

interface PriorityBadgeProps {
    priority: TicketPriority;
    className?: string;
}

const priorityConfig: Record<TicketPriority, { label: string; icon: React.ReactNode; className: string }> = {
    [TicketPriority.low]: {
        label: 'Low',
        icon: <ArrowDown className="w-3 h-3" />,
        className: 'text-emerald-600 bg-emerald-50',
    },
    [TicketPriority.medium]: {
        label: 'Medium',
        icon: <ArrowRight className="w-3 h-3" />,
        className: 'text-amber-600 bg-amber-50',
    },
    [TicketPriority.high]: {
        label: 'High',
        icon: <ArrowUp className="w-3 h-3" />,
        className: 'text-red-600 bg-red-50',
    },
};

export function PriorityBadge({ priority, className = '' }: PriorityBadgeProps) {
    const config = priorityConfig[priority];
    return (
        <span
            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${config.className} ${className}`}
        >
            {config.icon}
            {config.label}
        </span>
    );
}
