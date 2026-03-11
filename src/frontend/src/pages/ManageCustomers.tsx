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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import {
  CheckCircle2,
  Copy,
  Eye,
  EyeOff,
  Key,
  KeyRound,
  Loader2,
  Mail,
  PlusCircle,
  Shield,
  Trash2,
  User,
  UserCog,
  Users,
} from "lucide-react";
import React, { useState, useCallback } from "react";
import { toast } from "sonner";
import {
  ALL_PERMISSIONS,
  type CustomerAccount,
  DEFAULT_PERMISSIONS,
  type UserPermissions,
  changeAccountPassword,
  deleteAccount,
  getAccounts,
  saveAccount,
  updateAccount,
} from "../utils/credentialStore";

// ── Permission definitions ───────────────────────────────────────────────────

interface PermDef {
  key: keyof UserPermissions;
  label: string;
  description: string;
}

const PERM_DEFS: PermDef[] = [
  {
    key: "userManagement",
    label: "User Management",
    description: "Create/delete/edit accounts & password changes",
  },
  {
    key: "ticketRaising",
    label: "Ticket Raising",
    description: "Can raise new support tickets",
  },
  {
    key: "ticketStatusUpdate",
    label: "Status Update",
    description: "Can update ticket status",
  },
  {
    key: "ticketDelete",
    label: "Ticket Delete",
    description: "Can permanently delete tickets",
  },
  {
    key: "ticketAssignment",
    label: "Ticket Assignment",
    description: "Can assign tickets to master users",
  },
  {
    key: "ticketEdit",
    label: "Ticket Edit & Comments",
    description: "Can edit ticket details and post comments",
  },
  {
    key: "csvDownload",
    label: "CSV Download",
    description: "Can download tickets as CSV",
  },
  {
    key: "viewOtherTickets",
    label: "View Other Tickets",
    description: "Can view other users' tickets",
  },
  {
    key: "commentOtherTickets",
    label: "Comment Others' Tickets",
    description: "Can comment on other users' tickets",
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────

function CredentialRow({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <div className="flex items-center justify-between gap-3 py-2.5 px-3 bg-muted rounded-lg">
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground font-medium mb-0.5">
          {label}
        </p>
        <p className="text-sm font-mono font-semibold text-foreground truncate">
          {value}
        </p>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={handleCopy}
        className="flex-shrink-0 h-7 w-7 p-0"
      >
        {copied ? (
          <CheckCircle2 className="w-4 h-4 text-green-600" />
        ) : (
          <Copy className="w-4 h-4 text-muted-foreground" />
        )}
      </Button>
    </div>
  );
}

function AccountTypeBadge({
  accountType,
}: { accountType: "customer" | "master" }) {
  if (accountType === "master") {
    return (
      <Badge
        variant="default"
        className="text-xs gap-1 bg-primary/90 hover:bg-primary/90"
      >
        <Shield className="w-2.5 h-2.5" /> Master
      </Badge>
    );
  }
  return (
    <Badge variant="secondary" className="text-xs gap-1">
      <User className="w-2.5 h-2.5" /> Customer
    </Badge>
  );
}

function PermissionBadges({
  permissions,
  accountType,
}: { permissions: UserPermissions; accountType: "customer" | "master" }) {
  if (accountType === "master") {
    return (
      <span className="inline-flex items-center gap-1 text-xs bg-primary/10 text-primary border border-primary/20 rounded px-1.5 py-0.5 font-medium">
        <Shield className="w-2.5 h-2.5" /> All Permissions
      </span>
    );
  }
  const active = PERM_DEFS.filter((p) => permissions[p.key]);
  if (active.length === 0)
    return (
      <span className="text-xs text-muted-foreground">No permissions</span>
    );
  return (
    <div className="flex flex-wrap gap-1">
      {active.map((p) => (
        <span
          key={p.key}
          className="inline-flex text-xs bg-blue-50 text-blue-700 border border-blue-200 rounded px-1.5 py-0.5 font-medium"
        >
          {p.label}
        </span>
      ))}
    </div>
  );
}

function PermissionGrid({
  permissions,
  onChange,
  disabled,
}: {
  permissions: UserPermissions;
  onChange?: (key: keyof UserPermissions, value: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      {PERM_DEFS.map((def) => (
        <div
          key={def.key}
          className={`flex items-start gap-3 p-3 rounded-lg border border-border ${
            disabled ? "opacity-60" : "hover:bg-muted/50"
          } transition-colors`}
        >
          <Checkbox
            id={`perm-${def.key}`}
            checked={permissions[def.key]}
            onCheckedChange={(checked) => onChange?.(def.key, checked === true)}
            disabled={disabled}
            className="mt-0.5"
          />
          <div>
            <Label
              htmlFor={`perm-${def.key}`}
              className={`font-semibold text-sm leading-tight ${disabled ? "cursor-default" : "cursor-pointer"}`}
            >
              {def.label}
            </Label>
            <p className="text-xs text-muted-foreground mt-0.5">
              {def.description}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

interface CreatedCredentials {
  loginId: string;
  password: string;
  name: string;
  email: string;
  accountType: "customer" | "master";
  permissions: UserPermissions;
}

export function ManageCustomers() {
  const [accounts, setAccounts] = useState<CustomerAccount[]>(() =>
    getAccounts(),
  );
  const [formOpen, setFormOpen] = useState(false);
  const [createdCreds, setCreatedCreds] = useState<CreatedCredentials | null>(
    null,
  );
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>(
    {},
  );

  // Edit access state
  const [editTarget, setEditTarget] = useState<CustomerAccount | null>(null);
  const [editForm, setEditForm] = useState<{
    accountType: "customer" | "master";
    permissions: UserPermissions;
  }>({
    accountType: "customer",
    permissions: { ...DEFAULT_PERMISSIONS },
  });
  const [editError, setEditError] = useState("");

  // Change password state
  const [pwTarget, setPwTarget] = useState<CustomerAccount | null>(null);
  const [pwForm, setPwForm] = useState({
    newPassword: "",
    confirmPassword: "",
  });
  const [pwErrors, setPwErrors] = useState<Record<string, string>>({});
  const [pwLoading, setPwLoading] = useState(false);

  // Create form
  const [form, setForm] = useState({
    loginId: "",
    password: "",
    name: "",
    email: "",
    accountType: "customer" as "customer" | "master",
    permissions: {
      ...DEFAULT_PERMISSIONS,
      ticketRaising: true,
    } as UserPermissions,
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState("");

  const refreshAccounts = useCallback(() => setAccounts(getAccounts()), []);

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!form.loginId.trim()) errors.loginId = "Login ID is required.";
    else if (!/^[a-zA-Z0-9._-]{3,30}$/.test(form.loginId.trim()))
      errors.loginId = "Login ID must be 3–30 chars: letters, numbers, . _ -";
    if (!form.password.trim()) errors.password = "Password is required.";
    else if (form.password.trim().length < 6)
      errors.password = "Password must be at least 6 characters.";
    if (!form.name.trim()) errors.name = "Full Name is required.";
    if (!form.email.trim()) errors.email = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()))
      errors.email = "Please enter a valid email address.";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreate = () => {
    setSubmitError("");
    if (!validateForm()) return;
    try {
      const perms =
        form.accountType === "master" ? ALL_PERMISSIONS : form.permissions;
      const account: CustomerAccount = {
        loginId: form.loginId.trim(),
        password: form.password.trim(),
        name: form.name.trim(),
        email: form.email.trim(),
        createdAt: Date.now(),
        accountType: form.accountType,
        permissions: perms,
      };
      saveAccount(account);
      refreshAccounts();
      setForm({
        loginId: "",
        password: "",
        name: "",
        email: "",
        accountType: "customer",
        permissions: { ...DEFAULT_PERMISSIONS, ticketRaising: true },
      });
      setFormErrors({});
      setFormOpen(false);
      setCreatedCreds({
        loginId: account.loginId,
        password: account.password,
        name: account.name,
        email: account.email,
        accountType: account.accountType,
        permissions: account.permissions,
      });
      toast.success(`Account created for ${account.name}`);
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Failed to create account.",
      );
    }
  };

  const handleDelete = (loginId: string) => {
    deleteAccount(loginId);
    refreshAccounts();
    setDeleteTarget(null);
    toast.success("Account deleted.");
  };

  const openEditDialog = (account: CustomerAccount) => {
    setEditTarget(account);
    setEditForm({
      accountType: account.accountType,
      permissions: { ...account.permissions },
    });
    setEditError("");
  };

  const handleEditSave = () => {
    if (!editTarget) return;
    try {
      const perms =
        editForm.accountType === "master"
          ? ALL_PERMISSIONS
          : editForm.permissions;
      updateAccount(editTarget.loginId, {
        accountType: editForm.accountType,
        permissions: perms,
      });
      refreshAccounts();
      setEditTarget(null);
      toast.success(`Access updated for ${editTarget.name}`);
    } catch (err) {
      setEditError(err instanceof Error ? err.message : "Failed to update.");
    }
  };

  const handlePasswordChange = () => {
    const errors: Record<string, string> = {};
    if (!pwForm.newPassword) errors.newPassword = "New password is required.";
    else if (pwForm.newPassword.length < 6)
      errors.newPassword = "Password must be at least 6 characters.";
    if (!pwForm.confirmPassword)
      errors.confirmPassword = "Please confirm password.";
    else if (pwForm.newPassword !== pwForm.confirmPassword)
      errors.confirmPassword = "Passwords do not match.";
    setPwErrors(errors);
    if (Object.keys(errors).length > 0) return;
    setPwLoading(true);
    try {
      changeAccountPassword(pwTarget!.loginId, pwForm.newPassword);
      refreshAccounts();
      setPwTarget(null);
      setPwForm({ newPassword: "", confirmPassword: "" });
      toast.success(`Password changed for ${pwTarget!.name}`);
    } catch (err) {
      setPwErrors({
        newPassword:
          err instanceof Error ? err.message : "Failed to change password.",
      });
    } finally {
      setPwLoading(false);
    }
  };

  const toggleShowPassword = (loginId: string) => {
    setShowPasswords((prev) => ({ ...prev, [loginId]: !prev[loginId] }));
  };

  const masterCount = accounts.filter((a) => a.accountType === "master").length;
  const customerCount = accounts.filter(
    (a) => a.accountType === "customer",
  ).length;

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display text-foreground flex items-center gap-2">
            <UserCog className="w-6 h-6 text-primary" /> Manage Accounts
          </h1>
          <p className="text-muted-foreground mt-1">
            Create and manage customer and master login accounts with granular
            permissions
          </p>
        </div>
        <Button
          onClick={() => {
            setForm({
              loginId: "",
              password: "",
              name: "",
              email: "",
              accountType: "customer",
              permissions: { ...DEFAULT_PERMISSIONS, ticketRaising: true },
            });
            setFormErrors({});
            setSubmitError("");
            setFormOpen(true);
          }}
          className="gap-1.5"
          data-ocid="customers.open_modal_button"
        >
          <PlusCircle className="w-4 h-4" /> Create Account
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="shadow-card border border-border">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {accounts.length}
                </p>
                <p className="text-xs text-muted-foreground">Total Accounts</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-card border border-border">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <User className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {customerCount}
                </p>
                <p className="text-xs text-muted-foreground">
                  Customer Accounts
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-card border border-border">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {masterCount}
                </p>
                <p className="text-xs text-muted-foreground">Master Accounts</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Account list */}
      <Card className="shadow-card border border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" /> All Accounts
          </CardTitle>
          <CardDescription>
            Share credentials with users. Master accounts see all tickets;
            customer accounts see only their own.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {accounts.length === 0 ? (
            <div
              className="text-center py-12"
              data-ocid="customers.empty_state"
            >
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                <Users className="w-6 h-6 text-muted-foreground" />
              </div>
              <p className="font-semibold text-foreground font-display mb-1">
                No accounts yet
              </p>
              <p className="text-sm text-muted-foreground">
                Create an account to get started.
              </p>
            </div>
          ) : (
            <div className="space-y-0" data-ocid="customers.table">
              {accounts.map((account, index) => (
                <div key={account.loginId}>
                  <div
                    className="flex items-start gap-4 py-4"
                    data-ocid={
                      `customers.row.${index + 1}` as `customers.row.${number}`
                    }
                  >
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-primary">
                        {account.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-foreground text-sm">
                          {account.name}
                        </p>
                        <AccountTypeBadge
                          accountType={account.accountType ?? "customer"}
                        />
                      </div>
                      <PermissionBadges
                        permissions={account.permissions}
                        accountType={account.accountType}
                      />
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-0.5">
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Key className="w-3 h-3" />
                          Login ID:{" "}
                          <span className="font-mono font-medium text-foreground ml-0.5">
                            {account.loginId}
                          </span>
                        </span>
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Mail className="w-3 h-3" />
                          {account.email}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="text-xs text-muted-foreground">
                          Password:
                        </span>
                        <span className="text-xs font-mono text-foreground">
                          {showPasswords[account.loginId]
                            ? account.password
                            : "••••••••"}
                        </span>
                        <button
                          type="button"
                          onClick={() => toggleShowPassword(account.loginId)}
                          className="text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {showPasswords[account.loginId] ? (
                            <EyeOff className="w-3.5 h-3.5" />
                          ) : (
                            <Eye className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                      <p className="text-xs text-muted-foreground/60">
                        Created{" "}
                        {new Date(account.createdAt).toLocaleDateString(
                          "en-US",
                          { month: "short", day: "numeric", year: "numeric" },
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setPwTarget(account);
                          setPwForm({ newPassword: "", confirmPassword: "" });
                          setPwErrors({});
                        }}
                        className="text-muted-foreground hover:text-amber-600 hover:bg-amber-50 h-8 w-8 p-0"
                        title="Change password"
                        data-ocid={
                          `customers.password.button.${index + 1}` as `customers.password.button.${number}`
                        }
                      >
                        <KeyRound className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(account)}
                        className="text-muted-foreground hover:text-primary hover:bg-primary/10 h-8 w-8 p-0"
                        title="Edit access & permissions"
                        data-ocid={
                          `customers.edit_button.${index + 1}` as `customers.edit_button.${number}`
                        }
                      >
                        <UserCog className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteTarget(account.loginId)}
                        className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-8 w-8 p-0"
                        title="Delete account"
                        data-ocid={
                          `customers.delete_button.${index + 1}` as `customers.delete_button.${number}`
                        }
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  {index < accounts.length - 1 && <Separator />}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Change Password Dialog */}
      <Dialog
        open={!!pwTarget}
        onOpenChange={(open) => {
          if (!open) setPwTarget(null);
        }}
      >
        <DialogContent
          className="sm:max-w-sm"
          data-ocid="customers.password.dialog"
        >
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2">
              <KeyRound className="w-4 h-4" /> Change Password
            </DialogTitle>
            <DialogDescription>
              Set a new password for <strong>{pwTarget?.name}</strong> (
              <span className="font-mono text-xs">{pwTarget?.loginId}</span>)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="pw-new">
                New Password <span className="text-destructive">*</span>
              </Label>
              <Input
                id="pw-new"
                type="password"
                placeholder="Minimum 6 characters"
                value={pwForm.newPassword}
                onChange={(e) =>
                  setPwForm((f) => ({ ...f, newPassword: e.target.value }))
                }
                className={`mt-1 font-mono ${pwErrors.newPassword ? "border-destructive" : ""}`}
                data-ocid="customers.password.new.input"
              />
              {pwErrors.newPassword && (
                <p className="text-xs text-destructive mt-1">
                  {pwErrors.newPassword}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="pw-confirm">
                Confirm Password <span className="text-destructive">*</span>
              </Label>
              <Input
                id="pw-confirm"
                type="password"
                placeholder="Repeat new password"
                value={pwForm.confirmPassword}
                onChange={(e) =>
                  setPwForm((f) => ({ ...f, confirmPassword: e.target.value }))
                }
                className={`mt-1 font-mono ${pwErrors.confirmPassword ? "border-destructive" : ""}`}
                data-ocid="customers.password.confirm.input"
              />
              {pwErrors.confirmPassword && (
                <p className="text-xs text-destructive mt-1">
                  {pwErrors.confirmPassword}
                </p>
              )}
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setPwTarget(null)}
              data-ocid="customers.password.cancel_button"
            >
              Cancel
            </Button>
            <Button
              onClick={handlePasswordChange}
              disabled={pwLoading}
              className="gap-1.5"
              data-ocid="customers.password.save_button"
            >
              {pwLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <KeyRound className="w-4 h-4" />
              )}
              Save Password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Access Dialog */}
      <Dialog
        open={!!editTarget}
        onOpenChange={(open) => {
          if (!open) setEditTarget(null);
        }}
      >
        <DialogContent
          className="sm:max-w-2xl"
          data-ocid="customers.edit.dialog"
        >
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2">
              <UserCog className="w-4 h-4" /> Edit Access
            </DialogTitle>
            <DialogDescription>
              Change account type and permissions for{" "}
              <strong>{editTarget?.name}</strong> (
              <span className="font-mono text-xs">{editTarget?.loginId}</span>)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-5 py-2">
            <div>
              <Label className="text-sm font-medium">Account Type</Label>
              <RadioGroup
                value={editForm.accountType}
                onValueChange={(v) =>
                  setEditForm((f) => ({
                    ...f,
                    accountType: v as "customer" | "master",
                    permissions:
                      v === "master"
                        ? ALL_PERMISSIONS
                        : { ...DEFAULT_PERMISSIONS },
                  }))
                }
                className="mt-2 grid grid-cols-2 gap-2"
                data-ocid="customers.edit.accounttype.radio"
              >
                <div className="flex items-start gap-3 p-3 rounded-lg border border-border cursor-pointer hover:bg-muted/50 transition-colors">
                  <RadioGroupItem
                    value="customer"
                    id="edit-type-customer"
                    className="mt-0.5"
                  />
                  <div>
                    <Label
                      htmlFor="edit-type-customer"
                      className="font-semibold cursor-pointer flex items-center gap-1.5"
                    >
                      <User className="w-3.5 h-3.5" /> Customer Account
                    </Label>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Sees only their own tickets
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg border border-border cursor-pointer hover:bg-muted/50 transition-colors">
                  <RadioGroupItem
                    value="master"
                    id="edit-type-master"
                    className="mt-0.5"
                  />
                  <div>
                    <Label
                      htmlFor="edit-type-master"
                      className="font-semibold cursor-pointer flex items-center gap-1.5"
                    >
                      <Shield className="w-3.5 h-3.5" /> Master Account
                    </Label>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      All permissions enabled
                    </p>
                  </div>
                </div>
              </RadioGroup>
            </div>
            <div>
              <Label className="text-sm font-medium mb-2 block">
                Permissions
                {editForm.accountType === "master" && (
                  <span className="ml-2 text-xs font-normal text-muted-foreground">
                    (all locked for master accounts)
                  </span>
                )}
              </Label>
              <PermissionGrid
                permissions={
                  editForm.accountType === "master"
                    ? ALL_PERMISSIONS
                    : editForm.permissions
                }
                onChange={(key, value) =>
                  setEditForm((f) => ({
                    ...f,
                    permissions: { ...f.permissions, [key]: value },
                  }))
                }
                disabled={editForm.accountType === "master"}
              />
            </div>
            {editError && (
              <p
                className="text-xs text-destructive"
                data-ocid="customers.edit.error_state"
              >
                {editError}
              </p>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setEditTarget(null)}
              data-ocid="customers.edit.cancel_button"
            >
              Cancel
            </Button>
            <Button
              onClick={handleEditSave}
              className="gap-1.5"
              data-ocid="customers.edit.save_button"
            >
              <CheckCircle2 className="w-4 h-4" /> Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Account Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-2xl" data-ocid="customers.dialog">
          <DialogHeader>
            <DialogTitle className="font-display">Create Account</DialogTitle>
            <DialogDescription>
              Set up login credentials. Choose the account type and assign
              granular permissions.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-5 py-2 max-h-[70vh] overflow-y-auto pr-1">
            {/* Account Type */}
            <div>
              <Label className="text-sm font-medium">
                Account Type <span className="text-destructive">*</span>
              </Label>
              <RadioGroup
                value={form.accountType}
                onValueChange={(v) =>
                  setForm((f) => ({
                    ...f,
                    accountType: v as "customer" | "master",
                    permissions:
                      v === "master"
                        ? ALL_PERMISSIONS
                        : { ...DEFAULT_PERMISSIONS, ticketRaising: true },
                  }))
                }
                className="mt-2 grid grid-cols-2 gap-2"
                data-ocid="customers.create.accounttype.radio"
              >
                <div className="flex items-start gap-3 p-3 rounded-lg border border-border cursor-pointer hover:bg-muted/50 transition-colors">
                  <RadioGroupItem
                    value="customer"
                    id="type-customer"
                    className="mt-0.5"
                  />
                  <div>
                    <Label
                      htmlFor="type-customer"
                      className="font-semibold cursor-pointer flex items-center gap-1.5"
                    >
                      <User className="w-3.5 h-3.5" /> Customer Account
                    </Label>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Can raise and view own tickets
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg border border-border cursor-pointer hover:bg-muted/50 transition-colors">
                  <RadioGroupItem
                    value="master"
                    id="type-master"
                    className="mt-0.5"
                  />
                  <div>
                    <Label
                      htmlFor="type-master"
                      className="font-semibold cursor-pointer flex items-center gap-1.5"
                    >
                      <Shield className="w-3.5 h-3.5" /> Master Account
                    </Label>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      All permissions enabled
                    </p>
                  </div>
                </div>
              </RadioGroup>
            </div>

            {/* Permissions grid */}
            <div>
              <Label className="text-sm font-medium mb-2 block">
                Permissions
                {form.accountType === "master" && (
                  <span className="ml-2 text-xs font-normal text-muted-foreground">
                    (all locked for master accounts)
                  </span>
                )}
              </Label>
              <PermissionGrid
                permissions={
                  form.accountType === "master"
                    ? ALL_PERMISSIONS
                    : form.permissions
                }
                onChange={(key, value) =>
                  setForm((f) => ({
                    ...f,
                    permissions: { ...f.permissions, [key]: value },
                  }))
                }
                disabled={form.accountType === "master"}
              />
            </div>

            <Separator />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="create-name">
                  Full Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="create-name"
                  placeholder="e.g. John Doe"
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  className={`mt-1 ${formErrors.name ? "border-destructive" : ""}`}
                  data-ocid="customers.create.name.input"
                />
                {formErrors.name && (
                  <p className="text-xs text-destructive mt-1">
                    {formErrors.name}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="create-email">
                  Email Address <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="create-email"
                  type="email"
                  placeholder="john@example.com"
                  value={form.email}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, email: e.target.value }))
                  }
                  className={`mt-1 ${formErrors.email ? "border-destructive" : ""}`}
                  data-ocid="customers.create.email.input"
                />
                {formErrors.email && (
                  <p className="text-xs text-destructive mt-1">
                    {formErrors.email}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="create-loginid">
                  Login ID <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="create-loginid"
                  placeholder="e.g. john.doe or jdoe123"
                  value={form.loginId}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, loginId: e.target.value }))
                  }
                  className={`mt-1 font-mono ${formErrors.loginId ? "border-destructive" : ""}`}
                  data-ocid="customers.create.loginid.input"
                />
                {formErrors.loginId && (
                  <p className="text-xs text-destructive mt-1">
                    {formErrors.loginId}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="create-password">
                  Password <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="create-password"
                  placeholder="Minimum 6 characters"
                  value={form.password}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, password: e.target.value }))
                  }
                  className={`mt-1 font-mono ${formErrors.password ? "border-destructive" : ""}`}
                  data-ocid="customers.create.password.input"
                />
                {formErrors.password && (
                  <p className="text-xs text-destructive mt-1">
                    {formErrors.password}
                  </p>
                )}
              </div>
            </div>

            {submitError && (
              <p
                className="text-sm text-destructive"
                data-ocid="customers.create.error_state"
              >
                {submitError}
              </p>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setFormOpen(false)}
              data-ocid="customers.create.cancel_button"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              className="gap-1.5"
              data-ocid="customers.create.submit_button"
            >
              <PlusCircle className="w-4 h-4" /> Create Account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Credentials Display Dialog */}
      <Dialog
        open={!!createdCreds}
        onOpenChange={(open) => {
          if (!open) setCreatedCreds(null);
        }}
      >
        <DialogContent
          className="sm:max-w-md"
          data-ocid="customers.credentials.dialog"
        >
          <DialogHeader>
            <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-2">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
            </div>
            <DialogTitle className="font-display text-center">
              Account Created!
            </DialogTitle>
            <DialogDescription className="text-center">
              Share these credentials with <strong>{createdCreds?.name}</strong>
              .{" "}
              {createdCreds?.accountType === "master"
                ? "They can log in using the Master Login tab."
                : "They can log in using the Customer Login tab."}
            </DialogDescription>
          </DialogHeader>
          {createdCreds && (
            <div className="space-y-2 py-2">
              <CredentialRow label="Full Name" value={createdCreds.name} />
              <CredentialRow label="Email" value={createdCreds.email} />
              <CredentialRow label="Login ID" value={createdCreds.loginId} />
              <CredentialRow label="Password" value={createdCreds.password} />
              <div className="pt-1">
                <AccountTypeBadge accountType={createdCreds.accountType} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              className="w-full"
              onClick={() => setCreatedCreds(null)}
              data-ocid="customers.credentials.close_button"
            >
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent data-ocid="customers.delete.dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Account?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the account for{" "}
              <strong>{deleteTarget}</strong>. They will no longer be able to
              log in.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-ocid="customers.delete.cancel_button">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && handleDelete(deleteTarget)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-ocid="customers.delete.confirm_button"
            >
              Delete Account
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
