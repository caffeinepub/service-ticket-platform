import React, { useState, useRef } from 'react';
import { useCreateTicket } from '../hooks/useQueries';
import { TicketPriority } from '../backend';
import { ExternalBlob } from '../backend';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Loader2, PlusCircle, CheckCircle2, Paperclip, X, Upload } from 'lucide-react';

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

const ACCEPTED_FILE_TYPES = '.pdf,.png,.jpg,.jpeg,.docx';

interface RaiseTicketProps {
    onNavigate: (page: string) => void;
}

export function RaiseTicket({ onNavigate }: RaiseTicketProps) {
    const createTicket = useCreateTicket();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [form, setForm] = useState({
        title: '',
        description: '',
        moduleName: '',
        priority: '' as TicketPriority | '',
    });
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [uploadProgress, setUploadProgress] = useState<number>(0);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [submitted, setSubmitted] = useState(false);
    const [ticketId, setTicketId] = useState('');

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!form.title.trim()) newErrors.title = 'Title is required.';
        if (!form.description.trim()) newErrors.description = 'Description is required.';
        if (!form.moduleName) newErrors.moduleName = 'Please select a module name.';
        if (!form.priority) newErrors.priority = 'Please select a priority.';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] ?? null;
        setSelectedFile(file);
        setUploadProgress(0);
    };

    const handleRemoveFile = () => {
        setSelectedFile(null);
        setUploadProgress(0);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        let attachment: ExternalBlob | null = null;

        if (selectedFile) {
            const bytes = new Uint8Array(await selectedFile.arrayBuffer());
            attachment = ExternalBlob.fromBytes(bytes).withUploadProgress((pct) => {
                setUploadProgress(pct);
            });
        }

        try {
            const id = await createTicket.mutateAsync({
                title: form.title.trim(),
                description: form.description.trim(),
                moduleName: form.moduleName,
                priority: form.priority as TicketPriority,
                attachment,
            });
            setTicketId(id);
            setSubmitted(true);
        } catch (err) {
            setErrors({ submit: 'Failed to create ticket. Please try again.' });
        }
    };

    const handleReset = () => {
        setSubmitted(false);
        setForm({ title: '', description: '', moduleName: '', priority: '' });
        setSelectedFile(null);
        setUploadProgress(0);
        setTicketId('');
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    if (submitted) {
        return (
            <div className="animate-fade-in">
                <Card className="max-w-lg mx-auto shadow-card border border-border">
                    <CardContent className="pt-8 pb-8 text-center">
                        <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
                            <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                        </div>
                        <h2 className="text-xl font-bold font-display text-foreground mb-2">Ticket Submitted!</h2>
                        <p className="text-muted-foreground mb-1">Your ticket has been created successfully.</p>
                        <p className="text-sm text-muted-foreground mb-6">
                            Ticket ID: <span className="font-semibold text-foreground">#{ticketId}</span>
                        </p>
                        <div className="flex gap-3 justify-center">
                            <Button variant="outline" onClick={handleReset}>
                                Raise Another
                            </Button>
                            <Button onClick={() => onNavigate('my-tickets')}>
                                View My Tickets
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="animate-fade-in">
            <div className="mb-6">
                <h1 className="text-2xl font-bold font-display text-foreground">Raise a Ticket</h1>
                <p className="text-muted-foreground mt-1">Describe your issue and we'll get back to you shortly.</p>
            </div>

            <Card className="max-w-2xl shadow-card border border-border">
                <CardHeader className="pb-4">
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                        <PlusCircle className="w-4 h-4 text-primary" />
                        New Support Ticket
                    </CardTitle>
                    <CardDescription>Fill in the details below to submit your request.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Title */}
                        <div>
                            <Label htmlFor="title">
                                Title <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="title"
                                placeholder="Brief summary of your issue"
                                value={form.title}
                                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                                className={`mt-1 ${errors.title ? 'border-destructive' : ''}`}
                            />
                            {errors.title && <p className="text-xs text-destructive mt-1">{errors.title}</p>}
                        </div>

                        {/* Description */}
                        <div>
                            <Label htmlFor="description">
                                Description <span className="text-destructive">*</span>
                            </Label>
                            <Textarea
                                id="description"
                                placeholder="Provide a detailed description of your issue..."
                                value={form.description}
                                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                                className={`mt-1 min-h-[120px] resize-none ${errors.description ? 'border-destructive' : ''}`}
                            />
                            {errors.description && <p className="text-xs text-destructive mt-1">{errors.description}</p>}
                        </div>

                        {/* Module Name + Priority */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="moduleName">
                                    Module Name <span className="text-destructive">*</span>
                                </Label>
                                <Select
                                    value={form.moduleName}
                                    onValueChange={val => setForm(f => ({ ...f, moduleName: val }))}
                                >
                                    <SelectTrigger id="moduleName" className={`mt-1 ${errors.moduleName ? 'border-destructive' : ''}`}>
                                        <SelectValue placeholder="Select module" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {MODULE_NAMES.map(mod => (
                                            <SelectItem key={mod} value={mod}>{mod}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.moduleName && <p className="text-xs text-destructive mt-1">{errors.moduleName}</p>}
                            </div>

                            <div>
                                <Label htmlFor="priority">
                                    Priority <span className="text-destructive">*</span>
                                </Label>
                                <Select
                                    value={form.priority}
                                    onValueChange={val => setForm(f => ({ ...f, priority: val as TicketPriority }))}
                                >
                                    <SelectTrigger id="priority" className={`mt-1 ${errors.priority ? 'border-destructive' : ''}`}>
                                        <SelectValue placeholder="Select priority" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value={TicketPriority.low}>🟢 Low</SelectItem>
                                        <SelectItem value={TicketPriority.medium}>🟡 Medium</SelectItem>
                                        <SelectItem value={TicketPriority.high}>🔴 High</SelectItem>
                                    </SelectContent>
                                </Select>
                                {errors.priority && <p className="text-xs text-destructive mt-1">{errors.priority}</p>}
                            </div>
                        </div>

                        {/* Attachment */}
                        <div>
                            <Label>Attachment <span className="text-muted-foreground text-xs font-normal">(optional)</span></Label>
                            <div className="mt-1">
                                {!selectedFile ? (
                                    <label
                                        htmlFor="attachment"
                                        className="flex items-center gap-2 cursor-pointer border border-dashed border-border rounded-lg px-4 py-3 text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                                    >
                                        <Upload className="w-4 h-4 flex-shrink-0" />
                                        <span>Click to attach a file (PDF, PNG, JPG, DOCX)</span>
                                        <input
                                            id="attachment"
                                            ref={fileInputRef}
                                            type="file"
                                            accept={ACCEPTED_FILE_TYPES}
                                            className="sr-only"
                                            onChange={handleFileChange}
                                        />
                                    </label>
                                ) : (
                                    <div className="border border-border rounded-lg px-4 py-3 space-y-2">
                                        <div className="flex items-center justify-between gap-2">
                                            <div className="flex items-center gap-2 min-w-0">
                                                <Paperclip className="w-4 h-4 text-primary flex-shrink-0" />
                                                <span className="text-sm font-medium text-foreground truncate">
                                                    {selectedFile.name}
                                                </span>
                                                <span className="text-xs text-muted-foreground flex-shrink-0">
                                                    ({(selectedFile.size / 1024).toFixed(1)} KB)
                                                </span>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={handleRemoveFile}
                                                className="text-muted-foreground hover:text-destructive transition-colors flex-shrink-0"
                                                aria-label="Remove attachment"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                        {createTicket.isPending && uploadProgress > 0 && (
                                            <div className="space-y-1">
                                                <Progress value={uploadProgress} className="h-1.5" />
                                                <p className="text-xs text-muted-foreground">Uploading… {uploadProgress}%</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {errors.submit && (
                            <p className="text-sm text-destructive">{errors.submit}</p>
                        )}

                        <div className="flex gap-3 pt-2">
                            <Button type="submit" disabled={createTicket.isPending} className="gap-2">
                                {createTicket.isPending ? (
                                    <><Loader2 className="w-4 h-4 animate-spin" />Submitting...</>
                                ) : (
                                    <><PlusCircle className="w-4 h-4" />Submit Ticket</>
                                )}
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleReset}
                            >
                                Clear
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
