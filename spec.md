# Service Ticket Platform

## Current State
- Role-based access: Master (sees all tickets) and Customer (sees own tickets)
- Permissions: simple `{ view: boolean; edit: boolean }` on each account
- Ticket fields: id, title, description, moduleName, status, priority, createdAt, updatedAt, customerId, attachment
- Backend methods: createTicket, getAllTickets, getTicketsByCustomer, updateTicketStatus, addComment, getCommentsByTicket, createUser, getUser
- Accounts stored in localStorage via credentialStore
- Master can create/delete/edit-permissions for accounts
- CSV download on provider dashboard and my tickets
- Comment attachments (2 MB limit)

## Requested Changes (Diff)

### Add
- **Ticket Assignment**: Tickets can be assigned to any master user. Assignment stored in localStorage (ticketId → masterLoginId). Visible as an "Assigned To" field on ticket detail and ticket cards.
- **Ticket Delete**: Master users with `ticketDelete` role can delete tickets. Requires new backend `deleteTicket` method.
- **Ticket Edit/Update**: Users with `ticketEdit` role can edit ticket title, description, module, and priority via an Edit dialog on ticket detail. Requires new backend `updateTicket` method.
- **Password Change**: In ManageCustomers, each account row has a Change Password action (opens dialog to set new password). Master can also change their own password via a Profile/Settings link.
- **Granular Roles** (replaces `{ view, edit }` permissions): 9 boolean role flags:
  - `userManagement` – Create/delete/edit accounts and change passwords
  - `ticketRaising` – Can raise new tickets (customers)
  - `ticketStatusUpdate` – Can update ticket status
  - `ticketDelete` – Can delete tickets
  - `ticketAssignment` – Can assign tickets to master users
  - `ticketEdit` – Can edit ticket details (title/desc/module/priority) and add comments
  - `csvDownload` – Can download CSV exports
  - `viewOtherTickets` – Can view tickets of other users (customer sees all customers' tickets)
  - `commentOtherTickets` – Can comment on tickets raised by other users
- **Roles Management Page**: New page "Manage Roles" accessible from master sidebar showing role descriptions and which users have each role.
- **View Other User Tickets for Customers**: Customers with `viewOtherTickets` flag can navigate to a new "All Tickets" tab to see all tickets.

### Modify
- `CustomerAccount.permissions` expanded to new granular roles object; legacy `{ view, edit }` migrated: `view=true → ticketRaising+viewOtherTickets`, `edit=true → ticketStatusUpdate+ticketEdit+ticketAssignment+csvDownload`.
- ManageCustomers account creation/edit dialog: replace view/edit checkboxes with full role checkboxes grid.
- TicketDetail sidebar: add Assign section for users with `ticketAssignment` role (dropdown of master users).
- TicketDetail: add Edit Ticket button (pencil icon) for users with `ticketEdit` role.
- TicketDetail: add Delete button for users with `ticketDelete` role.
- ProviderDashboard TicketCard: show assigned-to badge if ticket is assigned.
- Layout sidebar: add "Manage Roles" nav item for master.
- AuthContext: update `AuthUser.permissions` type to new granular roles.
- Master default account always has all roles enabled.

### Remove
- Old `{ view: boolean; edit: boolean }` permission structure (replaced by granular roles, with migration).

## Implementation Plan
1. Regenerate backend to add `deleteTicket(ticketId)` and `updateTicket(ticketId, title, description, moduleName, priority)` methods.
2. Update `credentialStore.ts`: new permissions type, migration for legacy accounts, add `changePassword`, add ticket assignment store (localStorage).
3. Update `AuthContext.tsx`: new permissions type.
4. Update `ManageCustomers.tsx`: role checkboxes, change password dialog, remove legacy view/edit checkboxes.
5. Create `ManageRoles.tsx` page: shows role matrix per user.
6. Update `TicketDetail.tsx`: assignment dropdown, edit dialog, delete button, enforce granular permissions.
7. Update `ProviderDashboard.tsx` / `TicketCard`: show assigned-to badge, CSV gated by role.
8. Update `MyTickets.tsx`: view-other-tickets tab if customer has `viewOtherTickets`.
9. Update `Layout.tsx`: add Manage Roles nav item.
10. Update `App.tsx`: route to ManageRoles page.
11. Update `useQueries.ts`: add `useDeleteTicket` and `useUpdateTicket` mutations.
