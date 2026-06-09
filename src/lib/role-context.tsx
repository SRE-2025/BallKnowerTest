"use client";

import * as React from "react";
import type { Role } from "@/lib/types";

interface RoleContextValue {
  role: Role;
  setRole: (role: Role) => void;
  can: (capability: Capability) => boolean;
}

// Capability map per role. Mirrors the role design in the spec so Phase 1 can
// demo how each role sees the app. Real enforcement (server-side) lands with
// auth in a later phase.
export type Capability =
  | "edit_clips"
  | "edit_copy"
  | "reorder_clips"
  | "upload_commentary"
  | "approve_for_posting"
  | "manage_sources"
  | "manage_users";

const CAPABILITIES: Record<Role, Capability[]> = {
  ADMIN: [
    "edit_clips",
    "edit_copy",
    "reorder_clips",
    "upload_commentary",
    "approve_for_posting",
    "manage_sources",
    "manage_users",
  ],
  EDITOR: ["edit_clips", "edit_copy", "reorder_clips", "upload_commentary"],
  APPROVER: ["approve_for_posting"],
  VIEWER: [],
};

const RoleContext = React.createContext<RoleContextValue | null>(null);

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [role, setRoleState] = React.useState<Role>("ADMIN");

  React.useEffect(() => {
    const stored = window.localStorage.getItem("bk_role") as Role | null;
    if (stored) setRoleState(stored);
  }, []);

  const setRole = React.useCallback((next: Role) => {
    setRoleState(next);
    window.localStorage.setItem("bk_role", next);
  }, []);

  const can = React.useCallback(
    (capability: Capability) => CAPABILITIES[role].includes(capability),
    [role]
  );

  return (
    <RoleContext.Provider value={{ role, setRole, can }}>{children}</RoleContext.Provider>
  );
}

export function useRole() {
  const ctx = React.useContext(RoleContext);
  if (!ctx) throw new Error("useRole must be used within RoleProvider");
  return ctx;
}
