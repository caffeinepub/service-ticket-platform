import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import {
  ALL_PERMISSIONS,
  type UserPermissions,
  migratePermissions,
} from "../utils/credentialStore";

export type UserRoleType = "master" | "customer";

export interface AuthUser {
  loginId: string;
  name: string;
  email: string;
  role: UserRoleType;
  accountType: "customer" | "master";
  permissions: UserPermissions;
}

interface AuthContextType {
  user: AuthUser | null;
  login: (user: AuthUser) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const stored = sessionStorage.getItem("auth_user");
      if (!stored) return null;
      const parsed = JSON.parse(stored) as any;
      const accountType =
        parsed.accountType ??
        (parsed.role === "master" ? "master" : "customer");
      return {
        ...parsed,
        accountType,
        permissions:
          accountType === "master"
            ? ALL_PERMISSIONS
            : migratePermissions(parsed.permissions),
      } as AuthUser;
    } catch {
      return null;
    }
  });

  const login = useCallback((authUser: AuthUser) => {
    setUser(authUser);
    sessionStorage.setItem("auth_user", JSON.stringify(authUser));
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    sessionStorage.removeItem("auth_user");
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, login, logout, isAuthenticated: !!user }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
