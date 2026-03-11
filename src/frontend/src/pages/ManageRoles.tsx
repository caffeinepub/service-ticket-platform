import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Check, Shield, User, X } from "lucide-react";
import React from "react";
import {
  ALL_PERMISSIONS,
  MASTER_ACCOUNT,
  type UserPermissions,
  getAccounts,
} from "../utils/credentialStore";

interface PermDef {
  key: keyof UserPermissions;
  label: string;
  short: string;
}

const PERM_DEFS: PermDef[] = [
  { key: "userManagement", label: "User Management", short: "Users" },
  { key: "ticketRaising", label: "Ticket Raising", short: "Raise" },
  { key: "ticketStatusUpdate", label: "Status Update", short: "Status" },
  { key: "ticketDelete", label: "Ticket Delete", short: "Delete" },
  { key: "ticketAssignment", label: "Ticket Assignment", short: "Assign" },
  { key: "ticketEdit", label: "Edit & Comments", short: "Edit" },
  { key: "csvDownload", label: "CSV Download", short: "CSV" },
  { key: "viewOtherTickets", label: "View Others", short: "View All" },
  { key: "commentOtherTickets", label: "Comment Others", short: "Cmt All" },
];

export function ManageRoles() {
  const accounts = getAccounts();

  // Hardcoded master + all accounts
  const rows = [
    {
      loginId: MASTER_ACCOUNT.loginId,
      name: MASTER_ACCOUNT.name,
      accountType: "master" as const,
      permissions: ALL_PERMISSIONS,
      isHardcoded: true,
    },
    ...accounts.map((a) => ({
      loginId: a.loginId,
      name: a.name,
      accountType: a.accountType,
      permissions: a.permissions,
      isHardcoded: false,
    })),
  ];

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-display text-foreground flex items-center gap-2">
          <Shield className="w-6 h-6 text-primary" /> Manage Roles
        </h1>
        <p className="text-muted-foreground mt-1">
          Read-only overview of all user permissions. To change permissions, use{" "}
          <span className="font-medium text-foreground">Manage Accounts</span>.
        </p>
      </div>

      <Card
        className="shadow-card border border-border"
        data-ocid="roles.table"
      >
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">
            Permission Matrix
          </CardTitle>
          <CardDescription>
            {rows.length} account{rows.length !== 1 ? "s" : ""} · 9 roles
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[160px] sticky left-0 bg-card z-10 border-r border-border">
                    Account
                  </TableHead>
                  <TableHead className="min-w-[80px] text-center">
                    Type
                  </TableHead>
                  {PERM_DEFS.map((p) => (
                    <TableHead
                      key={p.key}
                      className="min-w-[80px] text-center text-xs"
                    >
                      <span title={p.label}>{p.short}</span>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row, idx) => (
                  <TableRow
                    key={row.loginId}
                    data-ocid={`roles.row.${idx + 1}` as `roles.row.${number}`}
                    className={row.isHardcoded ? "bg-primary/5" : ""}
                  >
                    <TableCell className="sticky left-0 bg-inherit z-10 border-r border-border font-medium">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                            row.accountType === "master"
                              ? "bg-primary/20 text-primary"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {row.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold truncate">
                            {row.name}
                          </p>
                          <p className="text-xs text-muted-foreground font-mono truncate">
                            {row.loginId}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      {row.accountType === "master" ? (
                        <Badge
                          variant="default"
                          className="text-xs gap-1 bg-primary/90 hover:bg-primary/90"
                        >
                          <Shield className="w-2.5 h-2.5" /> Master
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs gap-1">
                          <User className="w-2.5 h-2.5" /> Customer
                        </Badge>
                      )}
                    </TableCell>
                    {PERM_DEFS.map((p) => (
                      <TableCell key={p.key} className="text-center">
                        {row.permissions[p.key] ? (
                          <Check
                            className="w-4 h-4 text-green-600 mx-auto"
                            aria-label="Yes"
                          />
                        ) : (
                          <X
                            className="w-4 h-4 text-muted-foreground/40 mx-auto"
                            aria-label="No"
                          />
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Legend */}
      <Card className="shadow-card border border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">
            Role Descriptions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {PERM_DEFS.map((p) => (
              <div key={p.key} className="flex items-start gap-2">
                <div className="w-5 h-5 rounded bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Shield className="w-3 h-3 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold">{p.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {getRoleDescription(p.key)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function getRoleDescription(key: keyof UserPermissions): string {
  const map: Record<keyof UserPermissions, string> = {
    userManagement: "Create, delete, and edit accounts; change passwords",
    ticketRaising: "Can raise new support tickets",
    ticketStatusUpdate: "Can update the status of any ticket",
    ticketDelete: "Can permanently delete tickets",
    ticketAssignment: "Can assign tickets to master users",
    ticketEdit: "Can edit ticket details and post comments",
    csvDownload: "Can download ticket data as CSV",
    viewOtherTickets: "Can view tickets raised by other users",
    commentOtherTickets: "Can post comments on other users' tickets",
  };
  return map[key];
}
