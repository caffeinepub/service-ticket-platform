import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertTriangle,
  ArrowLeft,
  Clock,
  Download,
  Eye,
  FileText,
  Loader2,
  MessageSquare,
  Paperclip,
  Pencil,
  RefreshCw,
  Send,
  Tag,
  Trash2,
  User,
  UserCheck,
  X,
} from "lucide-react";
import type React from "react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import {
  ExternalBlob,
  type Ticket,
  type TicketPriority,
  TicketStatus,
} from "../backend";
import { PriorityBadge } from "../components/PriorityBadge";
import { StatusBadge } from "../components/StatusBadge";
import { useAuth } from "../contexts/AuthContext";
import {
  useAddComment,
  useComments,
  useDeleteTicket,
  useUpdateTicket,
  useUpdateTicketStatus,
} from "../hooks/useQueries";
import {
  MASTER_ACCOUNT,
  getAccounts,
  getTicketAssignment,
  getTicketOwner,
  removeTicketAssignment,
  setTicketAssignment,
} from "../utils/credentialStore";

interface TicketDetailProps {
  ticket: Ticket;
  onBack: () => void;
}

const MAX_FILE_SIZE = 2 * 1024 * 1024;
const COMMENT_ATTACHMENTS_KEY = "comment_attachments";

const MODULE_OPTIONS = [
  "Oracle",
  "SAP",
  "MS Dynamics",
  "Salesforce",
  "Custom Application",
  "Infrastructure",
  "Network",
  "Security",
  "Other",
];

interface CommentAttachmentEntry {
  url: string;
  name: string;
  size: number;
}

function getCommentAttachments(): Record<string, CommentAttachmentEntry> {
  try {
    const stored = localStorage.getItem(COMMENT_ATTACHMENTS_KEY);
    return stored
      ? (JSON.parse(stored) as Record<string, CommentAttachmentEntry>)
      : {};
  } catch {
    return {};
  }
}

function saveCommentAttachment(
  commentId: string,
  entry: CommentAttachmentEntry,
): void {
  const all = getCommentAttachments();
  all[commentId] = entry;
  localStorage.setItem(COMMENT_ATTACHMENTS_KEY, JSON.stringify(all));
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
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
  const isMaster = user?.loginId === "master" || user?.accountType === "master";
  const isProvider = user?.accountType === "master";

  // Permission helpers (master always has all)
  const perm = user?.permissions;
  const canViewTicket = isMaster || !!perm;
  const canComment = isMaster || !!perm?.ticketEdit;
  const canStatusUpdate = isMaster || !!perm?.ticketStatusUpdate;
  const canAssign = isMaster || !!perm?.ticketAssignment;
  const canDeleteTicket = isMaster || !!perm?.ticketDelete;
  const canEditTicket = isMaster || !!perm?.ticketEdit;

  // For customers viewing OTHER users' tickets, check commentOtherTickets
  const ticketOwner = getTicketOwner(ticket.id);
  const isOwnTicket = !isProvider ? ticketOwner === user?.loginId : true;
  const canCommentFinal =
    canComment && (isProvider || isOwnTicket || !!perm?.commentOtherTickets);

  const {
    data: comments,
    isLoading: commentsLoading,
    refetch: refetchComments,
  } = useComments(ticket.id);
  const addComment = useAddComment();
  const updateStatus = useUpdateTicketStatus();
  const deleteTicket = useDeleteTicket();
  const updateTicket = useUpdateTicket();

  const [commentText, setCommentText] = useState("");
  const [commentError, setCommentError] = useState("");

  // File attachment state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  // Delete dialog
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Edit ticket dialog
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editForm, setEditForm] = useState({
    title: ticket.title,
    description: ticket.description,
    moduleName: ticket.moduleName,
    priority: ticket.priority as string,
  });
  const [editError, setEditError] = useState("");

  // Assignment state
  const masterAccounts = getAccounts().filter(
    (a) => a.accountType === "master",
  );
  const allMasters = [
    { loginId: MASTER_ACCOUNT.loginId, name: MASTER_ACCOUNT.name },
    ...masterAccounts.map((a) => ({ loginId: a.loginId, name: a.name })),
  ];
  const [assignedTo, setAssignedTo] = useState<string>(
    getTicketAssignment(ticket.id) ?? "unassigned",
  );

  const commentAttachments = getCommentAttachments();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setFileError("");
    if (!file) {
      setAttachedFile(null);
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setFileError("File size must not exceed 2 MB.");
      setAttachedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    setAttachedFile(file);
  };

  const handleRemoveFile = () => {
    setAttachedFile(null);
    setFileError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleAddComment = async () => {
    if (!commentText.trim()) {
      setCommentError("Comment cannot be empty.");
      return;
    }
    setCommentError("");
    setIsUploading(true);
    try {
      let attachmentUrl: string | null = null;
      let attachmentName: string | null = null;
      let attachmentSize: number | null = null;
      if (attachedFile) {
        const bytes = new Uint8Array(await attachedFile.arrayBuffer());
        const blob = ExternalBlob.fromBytes(bytes);
        attachmentUrl = blob.getDirectURL();
        attachmentName = attachedFile.name;
        attachmentSize = attachedFile.size;
      }
      await addComment.mutateAsync({
        ticketId: ticket.id,
        message: commentText.trim(),
      });
      if (attachmentUrl && attachmentName && attachmentSize !== null) {
        const tempKey = `${ticket.id}::${commentText.trim()}::${Date.now()}`;
        saveCommentAttachment(tempKey, {
          url: attachmentUrl,
          name: attachmentName,
          size: attachmentSize,
        });
      }
      setCommentText("");
      setAttachedFile(null);
      setFileError("");
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch {
      setCommentError("Failed to add comment. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleStatusChange = async (newStatus: TicketStatus) => {
    try {
      await updateStatus.mutateAsync({
        ticketId: ticket.id,
        status: newStatus,
      });
    } catch {
      // silently fail
    }
  };

  const handleAssignmentChange = (value: string) => {
    setAssignedTo(value);
    if (value === "unassigned") {
      removeTicketAssignment(ticket.id);
      toast.success("Ticket unassigned.");
    } else {
      setTicketAssignment(ticket.id, value);
      const master = allMasters.find((m) => m.loginId === value);
      toast.success(`Ticket assigned to ${master?.name ?? value}.`);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteTicket.mutateAsync(ticket.id);
      toast.success("Ticket deleted.");
      onBack();
    } catch {
      toast.error("Failed to delete ticket.");
    }
    setShowDeleteDialog(false);
  };

  const handleEditSave = async () => {
    if (!editForm.title.trim()) {
      setEditError("Title is required.");
      return;
    }
    if (!editForm.description.trim()) {
      setEditError("Description is required.");
      return;
    }
    if (!editForm.moduleName) {
      setEditError("Module is required.");
      return;
    }
    setEditError("");
    try {
      await updateTicket.mutateAsync({
        ticketId: ticket.id,
        title: editForm.title.trim(),
        description: editForm.description.trim(),
        moduleName: editForm.moduleName,
        priority: editForm.priority as TicketPriority,
      });
      toast.success("Ticket updated.");
      setShowEditDialog(false);
    } catch {
      setEditError("Failed to update ticket. Please try again.");
    }
  };

  const availableTransitions = STATUS_TRANSITIONS[ticket.status];

  if (!canViewTicket) {
    return (
      <div className="animate-fade-in">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Go back
        </button>
        <Card className="shadow-card border border-border max-w-md mx-auto mt-12">
          <CardContent className="pt-8 pb-8 flex flex-col items-center text-center gap-4">
            <div className="w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="w-7 h-7 text-destructive" />
            </div>
            <div>
              <h2 className="text-lg font-bold font-display text-foreground mb-1">
                Access Denied
              </h2>
              <p className="text-sm text-muted-foreground">
                You don't have permission to view this ticket.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

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
                {/* Edit & Delete actions */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  {canEditTicket && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditForm({
                          title: ticket.title,
                          description: ticket.description,
                          moduleName: ticket.moduleName,
                          priority: ticket.priority,
                        });
                        setEditError("");
                        setShowEditDialog(true);
                      }}
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-primary"
                      title="Edit ticket"
                      data-ocid="ticket.edit_button"
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                  )}
                  {canDeleteTicket && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowDeleteDialog(true)}
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                      title="Delete ticket"
                      data-ocid="ticket.delete_button"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
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
                  No comments yet.
                </p>
              )}

              {!commentsLoading && comments && comments.length > 0 && (
                <div className="space-y-3">
                  {[...comments]
                    .sort((a, b) => Number(a.createdAt - b.createdAt))
                    .map((comment) => {
                      const attachment = commentAttachments[comment.id];
                      return (
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
                            {attachment && (
                              <a
                                href={attachment.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-2 flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
                              >
                                <FileText className="w-3 h-3 flex-shrink-0" />
                                <span className="truncate max-w-[180px]">
                                  {attachment.name}
                                </span>
                                <span className="text-muted-foreground font-normal">
                                  ({formatFileSize(attachment.size)})
                                </span>
                                <Download className="w-3 h-3 flex-shrink-0" />
                              </a>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}

              <Separator />

              {canCommentFinal ? (
                <div className="space-y-2">
                  <Textarea
                    placeholder="Add a comment or update..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    className="resize-none min-h-[80px]"
                    data-ocid="comment.textarea"
                  />
                  <div className="space-y-1.5">
                    {attachedFile ? (
                      <div className="flex items-center gap-2 p-2.5 bg-muted border border-border rounded-lg">
                        <FileText className="w-4 h-4 text-primary flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-foreground truncate">
                            {attachedFile.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatFileSize(attachedFile.size)}
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={handleRemoveFile}
                          className="h-6 w-6 p-0 flex-shrink-0 text-muted-foreground hover:text-destructive"
                          data-ocid="comment.attachment.delete_button"
                        >
                          <X className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    ) : (
                      <div>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".pdf,.png,.jpg,.jpeg,.docx"
                          onChange={handleFileChange}
                          className="hidden"
                          id="comment-attachment-input"
                        />
                        <label
                          htmlFor="comment-attachment-input"
                          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground cursor-pointer py-1.5 px-2.5 rounded-md border border-dashed border-border hover:border-primary/50 hover:bg-muted/50 transition-colors"
                          data-ocid="comment.upload_button"
                        >
                          <Paperclip className="w-3.5 h-3.5" />
                          Attach file (PDF, PNG, JPG, DOCX · max 2 MB)
                        </label>
                      </div>
                    )}
                    {fileError && (
                      <p
                        className="text-xs text-destructive"
                        data-ocid="comment.attachment.error_state"
                      >
                        {fileError}
                      </p>
                    )}
                  </div>
                  {commentError && (
                    <p
                      className="text-xs text-destructive"
                      data-ocid="comment.error_state"
                    >
                      {commentError}
                    </p>
                  )}
                  <Button
                    onClick={handleAddComment}
                    disabled={addComment.isPending || isUploading}
                    size="sm"
                    className="gap-2"
                    data-ocid="comment.submit_button"
                  >
                    {addComment.isPending || isUploading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        {isUploading ? "Uploading..." : "Posting..."}
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        Post Comment
                      </>
                    )}
                  </Button>
                </div>
              ) : (
                <div
                  className="flex items-center gap-2 p-3 rounded-lg bg-muted/60 border border-border text-sm text-muted-foreground"
                  data-ocid="comment.view_only.panel"
                >
                  <Eye className="w-4 h-4 flex-shrink-0" />
                  You have view-only access. Posting comments is not available
                  for your account.
                </div>
              )}
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

              {/* Ticket Attachment */}
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

          {/* Assignment (for users with ticketAssignment role) */}
          {canAssign && (
            <Card className="shadow-card border border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5" />
                  Assigned To
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Select
                  value={assignedTo}
                  onValueChange={handleAssignmentChange}
                >
                  <SelectTrigger
                    className="text-sm"
                    data-ocid="ticket.assignment.select"
                  >
                    <SelectValue placeholder="Select master..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {allMasters.map((m) => (
                      <SelectItem key={m.loginId} value={m.loginId}>
                        {m.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {assignedTo !== "unassigned" && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Assigned to:{" "}
                    <span className="font-medium text-foreground">
                      {allMasters.find((m) => m.loginId === assignedTo)?.name ??
                        assignedTo}
                    </span>
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Status Update */}
          {canStatusUpdate && availableTransitions.length > 0 && (
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
                    data-ocid="ticket.status.button"
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

          {isProvider && !canStatusUpdate && (
            <Card className="shadow-card border border-border">
              <CardContent className="pt-4 pb-4 flex items-center gap-2 text-sm text-muted-foreground">
                <Eye className="w-4 h-4 flex-shrink-0" />
                You have view-only access to this ticket.
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Edit Ticket Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-lg" data-ocid="ticket.edit.dialog">
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2">
              <Pencil className="w-4 h-4" /> Edit Ticket
            </DialogTitle>
            <DialogDescription>Update ticket details below.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="edit-title">
                Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="edit-title"
                value={editForm.title}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, title: e.target.value }))
                }
                className="mt-1"
                data-ocid="ticket.edit.title.input"
              />
            </div>
            <div>
              <Label htmlFor="edit-description">
                Description <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="edit-description"
                value={editForm.description}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, description: e.target.value }))
                }
                className="mt-1 resize-none min-h-[100px]"
                data-ocid="ticket.edit.description.textarea"
              />
            </div>
            <div>
              <Label>
                Module Name <span className="text-destructive">*</span>
              </Label>
              <Select
                value={editForm.moduleName}
                onValueChange={(v) =>
                  setEditForm((f) => ({ ...f, moduleName: v }))
                }
              >
                <SelectTrigger
                  className="mt-1"
                  data-ocid="ticket.edit.module.select"
                >
                  <SelectValue placeholder="Select module..." />
                </SelectTrigger>
                <SelectContent>
                  {MODULE_OPTIONS.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>
                Priority <span className="text-destructive">*</span>
              </Label>
              <Select
                value={editForm.priority}
                onValueChange={(v) =>
                  setEditForm((f) => ({ ...f, priority: v }))
                }
              >
                <SelectTrigger
                  className="mt-1"
                  data-ocid="ticket.edit.priority.select"
                >
                  <SelectValue placeholder="Select priority..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {editError && (
              <p
                className="text-sm text-destructive"
                data-ocid="ticket.edit.error_state"
              >
                {editError}
              </p>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowEditDialog(false)}
              data-ocid="ticket.edit.cancel_button"
            >
              Cancel
            </Button>
            <Button
              onClick={handleEditSave}
              disabled={updateTicket.isPending}
              className="gap-1.5"
              data-ocid="ticket.edit.save_button"
            >
              {updateTicket.isPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Pencil className="w-3.5 h-3.5" />
              )}
              {updateTicket.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent data-ocid="ticket.delete.dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Ticket?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete ticket <strong>#{ticket.id}</strong>:
              &quot;{ticket.title}&quot;. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-ocid="ticket.delete.cancel_button">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-ocid="ticket.delete.confirm_button"
            >
              {deleteTicket.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              Delete Ticket
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
