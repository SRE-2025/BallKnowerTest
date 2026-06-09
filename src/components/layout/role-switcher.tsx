"use client";

import { useRole } from "@/lib/role-context";
import type { Role } from "@/lib/types";

const ROLES: Role[] = ["ADMIN", "EDITOR", "APPROVER", "VIEWER"];

export function RoleSwitcher() {
  const { role, setRole } = useRole();
  return (
    <label className="flex items-center gap-2 text-xs text-muted-foreground">
      <span className="hidden sm:inline">Viewing as</span>
      <select
        value={role}
        onChange={(e) => setRole(e.target.value as Role)}
        className="rounded-md border border-border bg-secondary px-2.5 py-1.5 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
      >
        {ROLES.map((r) => (
          <option key={r} value={r}>
            {r.charAt(0) + r.slice(1).toLowerCase()}
          </option>
        ))}
      </select>
    </label>
  );
}
