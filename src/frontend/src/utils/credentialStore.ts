// Credential Store — localStorage-based user management (no backend dependency)

export interface UserPermissions {
  userManagement: boolean; // Create/delete/edit accounts + password change
  ticketRaising: boolean; // Can raise new tickets
  ticketStatusUpdate: boolean; // Can update ticket status
  ticketDelete: boolean; // Can delete tickets
  ticketAssignment: boolean; // Can assign tickets to master users
  ticketEdit: boolean; // Can edit ticket details + add comments
  csvDownload: boolean; // Can download CSV
  viewOtherTickets: boolean; // Can view other users' tickets
  commentOtherTickets: boolean; // Can comment on other users' tickets
}

export const ALL_PERMISSIONS: UserPermissions = {
  userManagement: true,
  ticketRaising: true,
  ticketStatusUpdate: true,
  ticketDelete: true,
  ticketAssignment: true,
  ticketEdit: true,
  csvDownload: true,
  viewOtherTickets: true,
  commentOtherTickets: true,
};

export const DEFAULT_PERMISSIONS: UserPermissions = {
  userManagement: false,
  ticketRaising: false,
  ticketStatusUpdate: false,
  ticketDelete: false,
  ticketAssignment: false,
  ticketEdit: false,
  csvDownload: false,
  viewOtherTickets: false,
  commentOtherTickets: false,
};

export function migratePermissions(p: any): UserPermissions {
  if (!p) return DEFAULT_PERMISSIONS;
  // New format — has userManagement field
  if (p.userManagement !== undefined) {
    return { ...DEFAULT_PERMISSIONS, ...p };
  }
  // Legacy { view, edit } format
  const view = !!p.view;
  const edit = !!p.edit;
  return {
    userManagement: false,
    ticketRaising: view,
    ticketStatusUpdate: edit,
    ticketDelete: false,
    ticketAssignment: edit,
    ticketEdit: edit,
    csvDownload: edit,
    viewOtherTickets: view,
    commentOtherTickets: false,
  };
}

export interface CustomerAccount {
  loginId: string;
  password: string;
  name: string;
  email: string;
  createdAt: number;
  accountType: "customer" | "master";
  permissions: UserPermissions;
}

const ACCOUNTS_KEY = "sp_accounts";
const TICKET_OWNERS_KEY = "sp_ticket_owners";
const TICKET_ASSIGNMENTS_KEY = "sp_ticket_assignments";

// Master account — hardcoded, never stored in localStorage
export const MASTER_ACCOUNT = {
  loginId: "master",
  password: "master123",
  name: "Master Admin",
  email: "master@support.com",
  role: "master" as const,
  accountType: "master" as const,
  permissions: ALL_PERMISSIONS,
};

// ── Account Management ─────────────────────────────────────────────────────

export function getAccounts(): CustomerAccount[] {
  try {
    const stored = localStorage.getItem(ACCOUNTS_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored) as any[];
    return parsed.map((a) => ({
      ...a,
      accountType: a.accountType ?? ("customer" as const),
      permissions:
        a.accountType === "master"
          ? ALL_PERMISSIONS
          : migratePermissions(a.permissions),
    }));
  } catch {
    return [];
  }
}

export function saveAccount(account: CustomerAccount): void {
  const accounts = getAccounts();
  const exists = accounts.some((a) => a.loginId === account.loginId);
  if (exists) {
    throw new Error(`Login ID "${account.loginId}" is already taken.`);
  }
  accounts.push(account);
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
}

export function updateAccount(
  loginId: string,
  updates: Partial<Pick<CustomerAccount, "accountType" | "permissions">>,
): void {
  const accounts = getAccounts();
  const idx = accounts.findIndex((a) => a.loginId === loginId);
  if (idx === -1) throw new Error(`Account "${loginId}" not found.`);
  accounts[idx] = { ...accounts[idx], ...updates };
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
}

export function changeAccountPassword(
  loginId: string,
  newPassword: string,
): void {
  const stored = localStorage.getItem(ACCOUNTS_KEY);
  if (!stored) throw new Error(`Account "${loginId}" not found.`);
  const accounts = JSON.parse(stored) as any[];
  const idx = accounts.findIndex((a: any) => a.loginId === loginId);
  if (idx === -1) throw new Error(`Account "${loginId}" not found.`);
  accounts[idx].password = newPassword;
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
}

export function deleteAccount(loginId: string): void {
  const accounts = getAccounts().filter((a) => a.loginId !== loginId);
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
}

export function validateCredentials(
  loginId: string,
  password: string,
): {
  role: "master" | "customer";
  name: string;
  email: string;
  accountType: "customer" | "master";
  permissions: UserPermissions;
} | null {
  // Check master first
  if (
    loginId === MASTER_ACCOUNT.loginId &&
    password === MASTER_ACCOUNT.password
  ) {
    return {
      role: MASTER_ACCOUNT.role,
      name: MASTER_ACCOUNT.name,
      email: MASTER_ACCOUNT.email,
      accountType: MASTER_ACCOUNT.accountType,
      permissions: ALL_PERMISSIONS,
    };
  }

  // Check customer accounts
  const accounts = getAccounts();
  const match = accounts.find(
    (a) => a.loginId === loginId && a.password === password,
  );
  if (match) {
    return {
      role: match.accountType === "master" ? "master" : "customer",
      name: match.name,
      email: match.email,
      accountType: match.accountType,
      permissions:
        match.accountType === "master"
          ? ALL_PERMISSIONS
          : migratePermissions(match.permissions),
    };
  }

  return null;
}

// ── Ticket Ownership ───────────────────────────────────────────────────────

interface TicketOwnerEntry {
  ticketId: string;
  loginId: string;
}

function getTicketOwners(): TicketOwnerEntry[] {
  try {
    const stored = localStorage.getItem(TICKET_OWNERS_KEY);
    return stored ? (JSON.parse(stored) as TicketOwnerEntry[]) : [];
  } catch {
    return [];
  }
}

export function registerTicketOwner(ticketId: string, loginId: string): void {
  const owners = getTicketOwners();
  if (!owners.some((o) => o.ticketId === ticketId)) {
    owners.push({ ticketId, loginId });
    localStorage.setItem(TICKET_OWNERS_KEY, JSON.stringify(owners));
  }
}

export function getTicketOwner(ticketId: string): string | null {
  const owners = getTicketOwners();
  return owners.find((o) => o.ticketId === ticketId)?.loginId ?? null;
}

export function getTicketsByOwner(loginId: string): string[] {
  return getTicketOwners()
    .filter((o) => o.loginId === loginId)
    .map((o) => o.ticketId);
}

// ── Ticket Assignments ─────────────────────────────────────────────────────

function getAssignmentsMap(): Record<string, string> {
  try {
    const stored = localStorage.getItem(TICKET_ASSIGNMENTS_KEY);
    return stored ? (JSON.parse(stored) as Record<string, string>) : {};
  } catch {
    return {};
  }
}

export function setTicketAssignment(
  ticketId: string,
  masterLoginId: string,
): void {
  const map = getAssignmentsMap();
  map[ticketId] = masterLoginId;
  localStorage.setItem(TICKET_ASSIGNMENTS_KEY, JSON.stringify(map));
}

export function getTicketAssignment(ticketId: string): string | null {
  const map = getAssignmentsMap();
  return map[ticketId] ?? null;
}

export function removeTicketAssignment(ticketId: string): void {
  const map = getAssignmentsMap();
  delete map[ticketId];
  localStorage.setItem(TICKET_ASSIGNMENTS_KEY, JSON.stringify(map));
}
