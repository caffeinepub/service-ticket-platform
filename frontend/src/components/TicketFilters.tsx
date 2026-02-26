import React from 'react';
import { TicketStatus, TicketPriority } from '../backend';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

const MODULE_NAMES = [
    'SCM',
    'FINANCE-AP',
    'FINANCE-AR',
    'FINANCE-FA',
    'FINANCE-GL',
    'PROCUREMENT',
    'REPORT ISSUE',
    'NEW REPORT REQUEST',
];

export interface FilterState {
    status: string;
    priority: string;
    moduleName: string;
}

interface TicketFiltersProps {
    filters: FilterState;
    onFilterChange: (filters: FilterState) => void;
}

export function TicketFilters({ filters, onFilterChange }: TicketFiltersProps) {
    const hasActiveFilters = filters.status !== 'all' || filters.priority !== 'all' || filters.moduleName !== 'all';

    const clearFilters = () => {
        onFilterChange({ status: 'all', priority: 'all', moduleName: 'all' });
    };

    return (
        <div className="flex flex-wrap items-center gap-3">
            <Select
                value={filters.status}
                onValueChange={(val) => onFilterChange({ ...filters, status: val })}
            >
                <SelectTrigger className="w-36 h-9 text-sm">
                    <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value={TicketStatus.open}>Open</SelectItem>
                    <SelectItem value={TicketStatus.in_progress}>In Progress</SelectItem>
                    <SelectItem value={TicketStatus.resolved}>Resolved</SelectItem>
                    <SelectItem value={TicketStatus.closed}>Closed</SelectItem>
                </SelectContent>
            </Select>

            <Select
                value={filters.priority}
                onValueChange={(val) => onFilterChange({ ...filters, priority: val })}
            >
                <SelectTrigger className="w-36 h-9 text-sm">
                    <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Priorities</SelectItem>
                    <SelectItem value={TicketPriority.low}>Low</SelectItem>
                    <SelectItem value={TicketPriority.medium}>Medium</SelectItem>
                    <SelectItem value={TicketPriority.high}>High</SelectItem>
                </SelectContent>
            </Select>

            <Select
                value={filters.moduleName}
                onValueChange={(val) => onFilterChange({ ...filters, moduleName: val })}
            >
                <SelectTrigger className="w-44 h-9 text-sm">
                    <SelectValue placeholder="Module Name" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Modules</SelectItem>
                    {MODULE_NAMES.map(mod => (
                        <SelectItem key={mod} value={mod}>{mod}</SelectItem>
                    ))}
                </SelectContent>
            </Select>

            {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="h-9 gap-1 text-muted-foreground">
                    <X className="w-3.5 h-3.5" />
                    Clear
                </Button>
            )}
        </div>
    );
}
