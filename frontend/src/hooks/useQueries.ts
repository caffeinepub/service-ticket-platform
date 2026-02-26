import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { TicketPriority, TicketStatus, UserRole, ExternalBlob } from '../backend';

// ── Users ──────────────────────────────────────────────────────────────────

export function useCreateUser() {
    const { actor } = useActor();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ name, email, role }: { name: string; email: string; role: UserRole }) => {
            if (!actor) throw new Error('Actor not ready');
            return actor.createUser(name, email, role);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['user'] });
        },
    });
}

// ── Tickets ────────────────────────────────────────────────────────────────

export function useMyTickets() {
    const { actor, isFetching } = useActor();

    return useQuery({
        queryKey: ['my-tickets'],
        queryFn: async () => {
            if (!actor) return [];
            return actor.getTicketsByCustomer();
        },
        enabled: !!actor && !isFetching,
    });
}

export function useAllTickets() {
    const { actor, isFetching } = useActor();

    return useQuery({
        queryKey: ['all-tickets'],
        queryFn: async () => {
            if (!actor) return [];
            return actor.getAllTickets();
        },
        enabled: !!actor && !isFetching,
    });
}

export function useCreateTicket() {
    const { actor } = useActor();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            title,
            description,
            moduleName,
            priority,
            attachment,
        }: {
            title: string;
            description: string;
            moduleName: string;
            priority: TicketPriority;
            attachment: ExternalBlob | null;
        }) => {
            if (!actor) throw new Error('Actor not ready');
            return actor.createTicket(title, description, moduleName, priority, attachment);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['my-tickets'] });
            queryClient.invalidateQueries({ queryKey: ['all-tickets'] });
        },
    });
}

export function useUpdateTicketStatus() {
    const { actor } = useActor();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ ticketId, status }: { ticketId: string; status: TicketStatus }) => {
            if (!actor) throw new Error('Actor not ready');
            return actor.updateTicketStatus(ticketId, status);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['all-tickets'] });
            queryClient.invalidateQueries({ queryKey: ['my-tickets'] });
        },
    });
}

// ── Comments ───────────────────────────────────────────────────────────────

export function useComments(ticketId: string) {
    const { actor, isFetching } = useActor();

    return useQuery({
        queryKey: ['comments', ticketId],
        queryFn: async () => {
            if (!actor) return [];
            return actor.getCommentsByTicket(ticketId);
        },
        enabled: !!actor && !isFetching && !!ticketId,
    });
}

export function useAddComment() {
    const { actor } = useActor();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ ticketId, message }: { ticketId: string; message: string }) => {
            if (!actor) throw new Error('Actor not ready');
            return actor.addComment(ticketId, message);
        },
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['comments', variables.ticketId] });
        },
    });
}
