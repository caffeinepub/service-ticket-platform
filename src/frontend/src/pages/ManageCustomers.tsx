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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Separator } from "@/components/ui/separator";
import {
  CheckCircle2,
  Copy,
  Eye,
  EyeOff,
  Key,
  Mail,
  PlusCircle,
  Trash2,
  UserCog,
  Users,
} from "lucide-react";
import React, { useState, useCallback } from "react";
import { toast } from "sonner";
import {
  type CustomerAccount,
  deleteAccount,
  getAccounts,
  saveAccount,
} from "../utils/credentialStore";

interface CreatedCredentials {
  loginId: string;
  password: string;
  name: string;
  email: string;
}

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
        title="Copy to clipboard"
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

  const [form, setForm] = useState({
    loginId: "",
    password: "",
    name: "",
    email: "",
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState("");

  const refreshAccounts = useCallback(() => {
    setAccounts(getAccounts());
  }, []);

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
      const account: CustomerAccount = {
        loginId: form.loginId.trim(),
        password: form.password.trim(),
        name: form.name.trim(),
        email: form.email.trim(),
        createdAt: Date.now(),
      };
      saveAccount(account);
      refreshAccounts();
      setForm({ loginId: "", password: "", name: "", email: "" });
      setFormErrors({});
      setFormOpen(false);
      setCreatedCreds({
        loginId: account.loginId,
        password: account.password,
        name: account.name,
        email: account.email,
      });
      toast.success(`Account created for ${account.name}`);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Failed to create account.";
      setSubmitError(msg);
    }
  };

  const handleDelete = (loginId: string) => {
    deleteAccount(loginId);
    refreshAccounts();
    setDeleteTarget(null);
    toast.success("Customer account deleted.");
  };

  const toggleShowPassword = (loginId: string) => {
    setShowPasswords((prev) => ({ ...prev, [loginId]: !prev[loginId] }));
  };

  return (
    <div className="animate-fade-in space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display text-foreground flex items-center gap-2">
            <UserCog className="w-6 h-6 text-primary" />
            Manage Customers
          </h1>
          <p className="text-muted-foreground mt-1">
            Create and manage customer login accounts
          </p>
        </div>
        <Button
          onClick={() => {
            setForm({ loginId: "", password: "", name: "", email: "" });
            setFormErrors({});
            setSubmitError("");
            setFormOpen(true);
          }}
          className="gap-1.5"
          data-ocid="customers.open_modal_button"
        >
          <PlusCircle className="w-4 h-4" />
          Create Account
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                <p className="text-xs text-muted-foreground">
                  Total Customer Accounts
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Account list */}
      <Card className="shadow-card border border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" />
            Customer Accounts
          </CardTitle>
          <CardDescription>
            Share these credentials with your customers so they can log in.
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
                No customer accounts yet
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
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-primary">
                        {account.name.charAt(0).toUpperCase()}
                      </span>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <p className="font-semibold text-foreground text-sm">
                        {account.name}
                      </p>
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
                          aria-label={
                            showPasswords[account.loginId]
                              ? "Hide password"
                              : "Show password"
                          }
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
                          {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          },
                        )}
                      </p>
                    </div>

                    {/* Delete */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteTarget(account.loginId)}
                      className="flex-shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-8 w-8 p-0"
                      title="Delete account"
                      data-ocid={
                        `customers.delete_button.${index + 1}` as `customers.delete_button.${number}`
                      }
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  {index < accounts.length - 1 && <Separator />}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Account Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-md" data-ocid="customers.dialog">
          <DialogHeader>
            <DialogTitle className="font-display">
              Create Customer Account
            </DialogTitle>
            <DialogDescription>
              Set up login credentials for a new customer. Share these with them
              after creation.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Full Name */}
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

            {/* Email */}
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

            {/* Login ID */}
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

            {/* Password */}
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
              <PlusCircle className="w-4 h-4" />
              Create Account
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
              . They can log in using the Customer Login tab.
            </DialogDescription>
          </DialogHeader>

          {createdCreds && (
            <div className="space-y-2 py-2">
              <CredentialRow label="Full Name" value={createdCreds.name} />
              <CredentialRow label="Email" value={createdCreds.email} />
              <CredentialRow label="Login ID" value={createdCreds.loginId} />
              <CredentialRow label="Password" value={createdCreds.password} />
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
            <AlertDialogTitle>Delete Customer Account?</AlertDialogTitle>
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
