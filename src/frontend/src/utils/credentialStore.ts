// Credential Store — localStorage-based user management (no backend dependency)

export interface CustomerAccount {
  loginId: string;
  password: string;
  name: string;
  email: string;
  createdAt: number; // Date.now()
}

const ACCOUNTS_KEY = "sp_accounts";
const TICKET_OWNERS_KEY = "sp_ticket_owners";

// Master account — hardcoded, never stored in localStorage
export const MASTER_ACCOUNT = {
  loginId: "master",
  password: "master123",
  name: "Master Admin",
  email: "master@support.com",
  role: "master" as const,
};

// ── Account Management ─────────────────────────────────────────────────────

export function getAccounts(): CustomerAccount[] {
  try {
    const stored = localStorage.getItem(ACCOUNTS_KEY);
    return stored ? (JSON.parse(stored) as CustomerAccount[]) : [];
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

export function deleteAccount(loginId: string): void {
  const accounts = getAccounts().filter((a) => a.loginId !== loginId);
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
}

export function validateCredentials(
  loginId: string,
  password: string,
): { role: "master" | "customer"; name: string; email: string } | null {
  // Check master first
  if (
    loginId === MASTER_ACCOUNT.loginId &&
    password === MASTER_ACCOUNT.password
  ) {
    return {
      role: MASTER_ACCOUNT.role,
      name: MASTER_ACCOUNT.name,
      email: MASTER_ACCOUNT.email,
    };
  }

  // Check customer accounts
  const accounts = getAccounts();
  const match = accounts.find(
    (a) => a.loginId === loginId && a.password === password,
  );
  if (match) {
    return { role: "customer", name: match.name, email: match.email };
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
  // Avoid duplicate entries
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
