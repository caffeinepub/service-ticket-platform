import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export class ExternalBlob {
    getBytes(): Promise<Uint8Array<ArrayBuffer>>;
    getDirectURL(): string;
    static fromURL(url: string): ExternalBlob;
    static fromBytes(blob: Uint8Array<ArrayBuffer>): ExternalBlob;
    withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob;
}
export type Time = bigint;
export interface User {
    id: Principal;
    name: string;
    createdAt: Time;
    role: UserRole;
    email: string;
}
export interface TicketComment {
    id: string;
    authorId: Principal;
    createdAt: Time;
    ticketId: string;
    message: string;
}
export interface Ticket {
    id: string;
    status: TicketStatus;
    title: string;
    moduleName: string;
    createdAt: Time;
    description: string;
    updatedAt: Time;
    customerId: Principal;
    priority: TicketPriority;
    attachment?: ExternalBlob;
}
export enum TicketPriority {
    low = "low",
    high = "high",
    medium = "medium"
}
export enum TicketStatus {
    resolved = "resolved",
    closed = "closed",
    in_progress = "in_progress",
    open = "open"
}
export enum UserRole {
    provider = "provider",
    customer = "customer"
}
export interface backendInterface {
    addComment(ticketId: string, message: string): Promise<void>;
    createTicket(title: string, description: string, moduleName: string, priority: TicketPriority, attachment: ExternalBlob | null): Promise<string>;
    createUser(name: string, email: string, role: UserRole): Promise<void>;
    getAllTickets(): Promise<Array<Ticket>>;
    getCommentsByTicket(ticketId: string): Promise<Array<TicketComment>>;
    getTicketsByCustomer(): Promise<Array<Ticket>>;
    getUser(userId: Principal): Promise<User>;
    updateTicketStatus(ticketId: string, newStatus: TicketStatus): Promise<void>;
}
