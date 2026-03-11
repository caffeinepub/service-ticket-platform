import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  ExternalBlob,
  TicketPriority,
  TicketStatus,
  backendInterface,
} from "../backend";
import { useAuth } from "../contexts/AuthContext";
import {
  getTicketsByOwner,
  registerTicketOwner,
} from "../utils/credentialStore";
import { useActor } from "./useActor";

// Extended interface that adds new backend methods not yet in auto-generated backend.ts
interface ExtendedBackend extends backendInterface {
  deleteTicket(ticketId: string): Promise<void>;
  updateTicket(
    ticketId: string,
    title: string,
    description: string,
    moduleName: string,
    priority: TicketPriority,
  ): Promise<void>;
}

// ── Tickets ────────────────────────────────────────────────────────────────

export function useMyTickets() {
  const { actor, isFetching } = useActor();
  const { user } = useAuth();

  return useQuery({
    queryKey: ["my-tickets", user?.loginId],
    queryFn: async () => {
      if (!actor) return [];
      const allTickets = await actor.getAllTickets();
      const ownedIds = user?.loginId ? getTicketsByOwner(user.loginId) : [];
      return allTickets.filter((t) => ownedIds.includes(t.id));
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAllTickets() {
  const { actor, isFetching } = useActor();

  return useQuery({
    queryKey: ["all-tickets"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllTickets();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateTicket() {
  const { actor } = useActor();
  const { user } = useAuth();
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
      if (!actor) throw new Error("Actor not ready");
      const ticketId = await actor.createTicket(
        title,
        description,
        moduleName,
        priority,
        attachment,
      );
      if (user?.loginId) {
        registerTicketOwner(ticketId, user.loginId);
      }
      return ticketId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-tickets"] });
      queryClient.invalidateQueries({ queryKey: ["all-tickets"] });
    },
  });
}

export function useUpdateTicketStatus() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      ticketId,
      status,
    }: { ticketId: string; status: TicketStatus }) => {
      if (!actor) throw new Error("Actor not ready");
      return actor.updateTicketStatus(ticketId, status);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-tickets"] });
      queryClient.invalidateQueries({ queryKey: ["my-tickets"] });
    },
  });
}

export function useDeleteTicket() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ticketId: string) => {
      if (!actor) throw new Error("Actor not ready");
      return (actor as ExtendedBackend).deleteTicket(ticketId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-tickets"] });
      queryClient.invalidateQueries({ queryKey: ["my-tickets"] });
    },
  });
}

export function useUpdateTicket() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      ticketId,
      title,
      description,
      moduleName,
      priority,
    }: {
      ticketId: string;
      title: string;
      description: string;
      moduleName: string;
      priority: TicketPriority;
    }) => {
      if (!actor) throw new Error("Actor not ready");
      return (actor as ExtendedBackend).updateTicket(
        ticketId,
        title,
        description,
        moduleName,
        priority,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-tickets"] });
      queryClient.invalidateQueries({ queryKey: ["my-tickets"] });
    },
  });
}

// ── Comments ───────────────────────────────────────────────────────────────

export function useComments(ticketId: string) {
  const { actor, isFetching } = useActor();

  return useQuery({
    queryKey: ["comments", ticketId],
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
    mutationFn: async ({
      ticketId,
      message,
    }: { ticketId: string; message: string }) => {
      if (!actor) throw new Error("Actor not ready");
      return actor.addComment(ticketId, message);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["comments", variables.ticketId],
      });
    },
  });
}
