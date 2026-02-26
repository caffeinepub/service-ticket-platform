import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useCreateUser } from '../hooks/useQueries';
import { UserRole } from '../backend';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { TicketIcon, Loader2, Heart } from 'lucide-react';

interface LoginPageProps {
    onLoginSuccess: () => void;
}

export function LoginPage({ onLoginSuccess }: LoginPageProps) {
    const { login } = useAuth();
    const createUser = useCreateUser();

    const [customerForm, setCustomerForm] = useState({ name: '', email: '' });
    const [providerForm, setProviderForm] = useState({ name: '', email: '' });
    const [error, setError] = useState('');

    const handleSubmit = async (role: UserRole, name: string, email: string) => {
        setError('');
        if (!name.trim() || !email.trim()) {
            setError('Please fill in all fields.');
            return;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            setError('Please enter a valid email address.');
            return;
        }

        try {
            await createUser.mutateAsync({ name: name.trim(), email: email.trim(), role });
        } catch (err: unknown) {
            // "User already exists" is fine — they're logging back in
            const msg = err instanceof Error ? err.message : String(err);
            if (!msg.includes('already exists')) {
                setError(msg || 'Something went wrong. Please try again.');
                return;
            }
        }

        login({ name: name.trim(), email: email.trim(), role });
        onLoginSuccess();
    };

    return (
        <div className="min-h-screen bg-background flex flex-col">
            {/* Header */}
            <header className="border-b border-border bg-card px-6 py-4">
                <div className="max-w-5xl mx-auto flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
                        <TicketIcon className="w-5 h-5 text-primary-foreground" />
                    </div>
                    <div>
                        <h1 className="font-bold text-xl font-display text-foreground">SupportDesk</h1>
                        <p className="text-xs text-muted-foreground">Service Ticket Platform</p>
                    </div>
                </div>
            </header>

            {/* Main */}
            <main className="flex-1 flex items-center justify-center px-4 py-12">
                <div className="w-full max-w-md">
                    <div className="text-center mb-8">
                        <img
                            src="/assets/generated/supportdesk-logo.dim_200x60.png"
                            alt="SupportDesk"
                            className="h-12 w-auto mx-auto mb-4 object-contain"
                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                        <h2 className="text-2xl font-bold font-display text-foreground">Welcome back</h2>
                        <p className="text-muted-foreground mt-1">Sign in or create your account to continue</p>
                    </div>

                    <Card className="shadow-card-hover border border-border">
                        <CardContent className="pt-6">
                            <Tabs defaultValue="customer">
                                <TabsList className="w-full mb-6">
                                    <TabsTrigger value="customer" className="flex-1">Customer</TabsTrigger>
                                    <TabsTrigger value="provider" className="flex-1">Service Provider</TabsTrigger>
                                </TabsList>

                                {/* Customer Tab */}
                                <TabsContent value="customer">
                                    <div className="space-y-4">
                                        <div>
                                            <Label htmlFor="c-name">Full Name</Label>
                                            <Input
                                                id="c-name"
                                                placeholder="John Doe"
                                                value={customerForm.name}
                                                onChange={e => setCustomerForm(f => ({ ...f, name: e.target.value }))}
                                                className="mt-1"
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="c-email">Email Address</Label>
                                            <Input
                                                id="c-email"
                                                type="email"
                                                placeholder="john@example.com"
                                                value={customerForm.email}
                                                onChange={e => setCustomerForm(f => ({ ...f, email: e.target.value }))}
                                                className="mt-1"
                                            />
                                        </div>
                                        {error && (
                                            <p className="text-sm text-destructive">{error}</p>
                                        )}
                                        <Button
                                            className="w-full"
                                            onClick={() => handleSubmit(UserRole.customer, customerForm.name, customerForm.email)}
                                            disabled={createUser.isPending}
                                        >
                                            {createUser.isPending ? (
                                                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Signing in...</>
                                            ) : 'Sign In as Customer'}
                                        </Button>
                                        <p className="text-xs text-center text-muted-foreground">
                                            New here? We'll create your account automatically.
                                        </p>
                                    </div>
                                </TabsContent>

                                {/* Provider Tab */}
                                <TabsContent value="provider">
                                    <div className="space-y-4">
                                        <div>
                                            <Label htmlFor="p-name">Full Name</Label>
                                            <Input
                                                id="p-name"
                                                placeholder="Jane Smith"
                                                value={providerForm.name}
                                                onChange={e => setProviderForm(f => ({ ...f, name: e.target.value }))}
                                                className="mt-1"
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="p-email">Email Address</Label>
                                            <Input
                                                id="p-email"
                                                type="email"
                                                placeholder="jane@company.com"
                                                value={providerForm.email}
                                                onChange={e => setProviderForm(f => ({ ...f, email: e.target.value }))}
                                                className="mt-1"
                                            />
                                        </div>
                                        {error && (
                                            <p className="text-sm text-destructive">{error}</p>
                                        )}
                                        <Button
                                            className="w-full"
                                            onClick={() => handleSubmit(UserRole.provider, providerForm.name, providerForm.email)}
                                            disabled={createUser.isPending}
                                        >
                                            {createUser.isPending ? (
                                                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Signing in...</>
                                            ) : 'Sign In as Provider'}
                                        </Button>
                                        <p className="text-xs text-center text-muted-foreground">
                                            New here? We'll create your account automatically.
                                        </p>
                                    </div>
                                </TabsContent>
                            </Tabs>
                        </CardContent>
                    </Card>
                </div>
            </main>

            {/* Footer */}
            <footer className="border-t border-border bg-card px-6 py-3">
                <p className="text-xs text-muted-foreground text-center flex items-center justify-center gap-1">
                    © {new Date().getFullYear()} SupportDesk. Built with{' '}
                    <Heart className="w-3 h-3 text-red-500 fill-red-500" />{' '}
                    using{' '}
                    <a
                        href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname || 'supportdesk')}`}
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
