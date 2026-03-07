import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  Clock,
  Download,
  Loader2,
  MessageSquare,
  Paperclip,
  RefreshCw,
  Send,
  Tag,
  User,
} from "lucide-react";
import React, { useState } from "react";
import { type Ticket, TicketStatus } from "../backend";
import { PriorityBadge } from "../components/PriorityBadge";
import { StatusBadge } from "../components/StatusBadge";
import { useAuth } from "../contexts/AuthContext";
import {
  useAddComment,
  useComments,
  useUpdateTicketStatus,
} from "../hooks/useQueries";

interface TicketDetailProps {
  ticket: Ticket;
  onBack: () => void;
}

function formatDate(nanoseconds: bigint): string {
  const ms = Number(nanoseconds / BigInt(1_000_000));
  return new Date(ms).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const STATUS_TRANSITIONS: Record<TicketStatus, TicketStatus[]> = {
  [TicketStatus.open]: [TicketStatus.in_progress, TicketStatus.closed],
  [TicketStatus.in_progress]: [TicketStatus.resolved, TicketStatus.closed],
  [TicketStatus.resolved]: [TicketStatus.closed],
  [TicketStatus.closed]: [],
};

const STATUS_LABELS: Record<TicketStatus, string> = {
  [TicketStatus.open]: "Open",
  [TicketStatus.in_progress]: "In Progress",
  [TicketStatus.resolved]: "Resolved",
  [TicketStatus.closed]: "Closed",
};

export function TicketDetail({ ticket, onBack }: TicketDetailProps) {
  const { user } = useAuth();
  const isProvider = user?.role === "master";

  const {
    data: comments,
    isLoading: commentsLoading,
    refetch: refetchComments,
  } = useComments(ticket.id);
  const addComment = useAddComment();
  const updateStatus = useUpdateTicketStatus();

  const [commentText, setCommentText] = useState("");
  const [commentError, setCommentError] = useState("");

  const handleAddComment = async () => {
    if (!commentText.trim()) {
      setCommentError("Comment cannot be empty.");
      return;
    }
    setCommentError("");
    try {
      await addComment.mutateAsync({
        ticketId: ticket.id,
        message: commentText.trim(),
      });
      setCommentText("");
    } catch {
      setCommentError("Failed to add comment. Please try again.");
    }
  };

  const handleStatusChange = async (newStatus: TicketStatus) => {
    try {
      await updateStatus.mutateAsync({
        ticketId: ticket.id,
        status: newStatus,
      });
    } catch {
      // silently fail; UI will reflect old state
    }
  };

  const availableTransitions = STATUS_TRANSITIONS[ticket.status];

  return (
    <div className="animate-fade-in">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to {isProvider ? "All Tickets" : "My Tickets"}
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-5">
          <Card className="shadow-card border border-border">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <StatusBadge status={ticket.status} />
                    <PriorityBadge priority={ticket.priority} />
                    <span className="text-xs text-muted-foreground">
                      #{ticket.id}
                    </span>
                  </div>
                  <CardTitle className="text-xl font-bold font-display leading-snug">
                    {ticket.title}
                  </CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-foreground leading-relaxed whitespace-pre-wrap">
                {ticket.description}
              </p>
            </CardContent>
          </Card>

          {/* Comments */}
          <Card className="shadow-card border border-border">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-primary" />
                  Comments
                  {comments && (
                    <span className="text-xs font-normal text-muted-foreground">
                      ({comments.length})
                    </span>
                  )}
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => refetchComments()}
                  className="h-7 w-7 p-0"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {commentsLoading && (
                <div className="space-y-3">
                  {[1, 2].map((i) => (
                    <Skeleton key={i} className="h-16 w-full rounded-lg" />
                  ))}
                </div>
              )}

              {!commentsLoading && comments && comments.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No comments yet. Be the first to add one.
                </p>
              )}

              {!commentsLoading && comments && comments.length > 0 && (
                <div className="space-y-3">
                  {[...comments]
                    .sort((a, b) => Number(a.createdAt - b.createdAt))
                    .map((comment) => (
                      <div key={comment.id} className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center flex-shrink-0 mt-0.5">
                          <User className="w-4 h-4 text-accent-foreground" />
                        </div>
                        <div className="flex-1 bg-muted rounded-lg px-4 py-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-semibold text-foreground">
                              {comment.authorId.toString().slice(0, 12)}...
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {formatDate(comment.createdAt)}
                            </span>
                          </div>
                          <p className="text-sm text-foreground">
                            {comment.message}
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              )}

              <Separator />

              {/* Add comment */}
              <div className="space-y-2">
                <Textarea
                  placeholder="Add a comment or update..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  className="resize-none min-h-[80px]"
                />
                {commentError && (
                  <p className="text-xs text-destructive">{commentError}</p>
                )}
                <Button
                  onClick={handleAddComment}
                  disabled={addComment.isPending}
                  size="sm"
                  className="gap-2"
                >
                  {addComment.isPending ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Posting...
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      Post Comment
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card className="shadow-card border border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Ticket Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Status</p>
                <StatusBadge status={ticket.status} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Priority</p>
                <PriorityBadge priority={ticket.priority} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">
                  Module Name
                </p>
                <span className="flex items-center gap-1.5 text-sm font-medium">
                  <Tag className="w-3.5 h-3.5 text-muted-foreground" />
                  {ticket.moduleName}
                </span>
              </div>

              {/* Attachment */}
              {ticket.attachment && (
                <>
                  <Separator />
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">
                      Attachment
                    </p>
                    <a
                      href={ticket.attachment.getDirectURL()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                    >
                      <Paperclip className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="truncate">View / Download</span>
                      <Download className="w-3 h-3 flex-shrink-0" />
                    </a>
                  </div>
                </>
              )}

              <Separator />
              <div>
                <p className="text-xs text-muted-foreground mb-1">Created</p>
                <span className="flex items-center gap-1.5 text-sm">
                  <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                  {formatDate(ticket.createdAt)}
                </span>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">
                  Last Updated
                </p>
                <span className="flex items-center gap-1.5 text-sm">
                  <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                  {formatDate(ticket.updatedAt)}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Provider: Status Update */}
          {isProvider && availableTransitions.length > 0 && (
            <Card className="shadow-card border border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Update Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {availableTransitions.map((status) => (
                  <Button
                    key={status}
                    variant="outline"
                    size="sm"
                    className="w-full justify-start gap-2"
                    onClick={() => handleStatusChange(status)}
                    disabled={updateStatus.isPending}
                  >
                    {updateStatus.isPending ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : null}
                    Mark as {STATUS_LABELS[status]}
                  </Button>
                ))}
              </CardContent>
            </Card>
          )}

          {isProvider && availableTransitions.length === 0 && (
            <Card className="shadow-card border border-border">
              <CardContent className="pt-4 pb-4">
                <p className="text-sm text-muted-foreground text-center">
                  This ticket is {STATUS_LABELS[ticket.status].toLowerCase()}{" "}
                  and cannot be updated further.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
