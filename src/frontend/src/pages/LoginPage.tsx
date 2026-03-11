import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Heart, Lock, Shield, User } from "lucide-react";
import type React from "react";
import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { validateCredentials } from "../utils/credentialStore";

interface LoginPageProps {
  onLoginSuccess: () => void;
}

function LoginForm({
  formId,
  onSubmit,
  error,
  isPending,
  submitLabel,
}: {
  formId: string;
  onSubmit: (loginId: string, password: string) => void;
  error: string;
  isPending: boolean;
  submitLabel: string;
}) {
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(loginId.trim(), password);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor={`${formId}-loginid`} className="text-sm font-medium">
          Login ID
        </Label>
        <div className="relative mt-1">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            id={`${formId}-loginid`}
            placeholder="Enter your login ID"
            value={loginId}
            autoComplete="username"
            onChange={(e) => setLoginId(e.target.value)}
            className="pl-9"
            data-ocid={`${formId}.input`}
          />
        </div>
      </div>
      <div>
        <Label htmlFor={`${formId}-password`} className="text-sm font-medium">
          Password
        </Label>
        <div className="relative mt-1">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            id={`${formId}-password`}
            type="password"
            placeholder="Enter your password"
            value={password}
            autoComplete="current-password"
            onChange={(e) => setPassword(e.target.value)}
            className="pl-9"
            data-ocid={`${formId}-password.input`}
          />
        </div>
      </div>
      {error && (
        <p
          className="text-sm text-destructive"
          data-ocid={`${formId}.error_state`}
        >
          {error}
        </p>
      )}
      <Button
        type="submit"
        className="w-full"
        disabled={isPending}
        data-ocid={`${formId}.submit_button`}
      >
        {submitLabel}
      </Button>
    </form>
  );
}

export function LoginPage({ onLoginSuccess }: LoginPageProps) {
  const { login } = useAuth();
  const [customerError, setCustomerError] = useState("");
  const [masterError, setMasterError] = useState("");
  const [isPending, setIsPending] = useState(false);

  const handleCustomerLogin = (loginId: string, password: string) => {
    setCustomerError("");
    if (!loginId || !password) {
      setCustomerError("Please enter your Login ID and Password.");
      return;
    }
    setIsPending(true);
    try {
      const result = validateCredentials(loginId, password);
      if (!result || result.accountType !== "customer") {
        setCustomerError("Invalid Login ID or Password.");
        setIsPending(false);
        return;
      }
      login({
        loginId,
        name: result.name,
        email: result.email,
        role: "customer",
        accountType: result.accountType,
        permissions: result.permissions,
      });
      onLoginSuccess();
    } catch {
      setCustomerError("An error occurred. Please try again.");
      setIsPending(false);
    }
  };

  const handleMasterLogin = (loginId: string, password: string) => {
    setMasterError("");
    if (!loginId || !password) {
      setMasterError("Please enter your Login ID and Password.");
      return;
    }
    setIsPending(true);
    try {
      const result = validateCredentials(loginId, password);
      if (!result || result.accountType !== "master") {
        setMasterError("Invalid Login ID or Password.");
        setIsPending(false);
        return;
      }
      login({
        loginId,
        name: result.name,
        email: result.email,
        role: "master",
        accountType: result.accountType,
        permissions: result.permissions,
      });
      onLoginSuccess();
    } catch {
      setMasterError("An error occurred. Please try again.");
      setIsPending(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-white px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center">
          <img
            src="/assets/uploads/Logo-Or-1.jpg"
            alt="Orange Consultancy Services"
            className="h-12 w-auto object-contain"
          />
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* Logo & heading */}
          <div className="text-center mb-8">
            <img
              src="/assets/uploads/Logo-Or-1.jpg"
              alt="Orange Consultancy Services"
              className="h-16 w-auto mx-auto mb-4 object-contain"
            />
            <h2 className="text-2xl font-bold font-display text-foreground">
              Welcome back
            </h2>
            <p className="text-muted-foreground mt-1">
              Sign in with your credentials to continue
            </p>
          </div>

          <Card className="shadow-card-hover border border-border">
            <CardContent className="pt-6">
              <Tabs defaultValue="customer" data-ocid="login.tab">
                <TabsList className="w-full mb-6">
                  <TabsTrigger
                    value="customer"
                    className="flex-1 gap-1.5"
                    data-ocid="login.customer.tab"
                  >
                    <User className="w-3.5 h-3.5" />
                    Customer Login
                  </TabsTrigger>
                  <TabsTrigger
                    value="master"
                    className="flex-1 gap-1.5"
                    data-ocid="login.master.tab"
                  >
                    <Shield className="w-3.5 h-3.5" />
                    Master Login
                  </TabsTrigger>
                </TabsList>

                {/* Customer Login */}
                <TabsContent value="customer">
                  <LoginForm
                    formId="customer"
                    onSubmit={handleCustomerLogin}
                    error={customerError}
                    isPending={isPending}
                    submitLabel="Sign In as Customer"
                  />
                  <p className="text-xs text-center text-muted-foreground mt-4">
                    Login credentials are provided by your service provider.
                  </p>
                </TabsContent>

                {/* Master Login */}
                <TabsContent value="master">
                  <LoginForm
                    formId="master"
                    onSubmit={handleMasterLogin}
                    error={masterError}
                    isPending={isPending}
                    submitLabel="Sign In as Master Admin"
                  />
                  <p className="text-xs text-center text-muted-foreground mt-4">
                    For service provider administrators only.
                  </p>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card px-6 py-3">
        <p className="text-xs text-muted-foreground text-center flex items-center justify-center gap-1">
          © {new Date().getFullYear()} SupportDesk. Built with{" "}
          <Heart className="w-3 h-3 text-red-500 fill-red-500" /> using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline font-medium"
          >
            caffeine.ai
          </a>
        </p>
      </footer>
    </div>
  );
}
