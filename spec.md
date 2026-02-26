# Specification

## Summary
**Goal:** Replace the "Category" field with a "Module Name" dropdown across the SupportDesk app, and add an optional file attachment to the Raise Ticket form for customers.

**Planned changes:**
- Rename `category` field to `moduleName` (type: Text) in the backend Ticket record and update all related backend functions (`createTicket`, `getAllTickets`, `getTicketsByCustomer`, filters)
- Add an optional `attachment` field (base64 Text) to the backend Ticket record and update `createTicket` to accept and persist it
- In `RaiseTicket.tsx`, replace the "Category" dropdown with a "Module Name" dropdown containing exactly 8 options: SCM, FINANCE-AP, FINANCE-AR, FINANCE-FA, FINANCE-GL, PROCUREMENT, REPORT ISSUE, NEW REPORT REQUEST
- Add a single optional file upload input ("Attachment (optional)") to the Raise Ticket form, accepting PDF, PNG, JPG, and DOCX; show filename preview with a remove option; encode file as base64 before submission
- Update `TicketCard.tsx`, `TicketDetail.tsx`, `TicketFilters.tsx`, and `ProviderDashboard.tsx` to display "Module Name" (from `moduleName`) instead of "Category"
- Update the filter dropdown in `TicketFilters` to list the 8 Module Name options
- Display a download/view link for the attachment in `TicketDetail` if one exists

**User-visible outcome:** Customers can raise tickets by selecting a module name from the predefined list and optionally attaching a file. All ticket views and filters across the app reflect "Module Name" instead of "Category".
