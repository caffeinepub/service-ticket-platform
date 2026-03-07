import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ExternalBlob, TicketPriority, TicketStatus } from "../backend";
import { useAuth } from "../contexts/AuthContext";
import {
  getTicketsByOwner,
  registerTicketOwner,
} from "../utils/credentialStore";
import { useActor } from "./useActor";

// ── Tickets ────────────────────────────────────────────────────────────────

export function useMyTickets() {
  const { actor, isFetching } = useActor();
  const { user } = useAuth();

  return useQuery({
    queryKey: ["my-tickets", user?.loginId],
    queryFn: async () => {
      if (!actor) return [];
      // Fetch all tickets then filter to only those owned by the current user
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
      // Register ticket ownership in localStorage
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
