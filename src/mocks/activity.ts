import type { ActivityLogEntry } from "@/lib/types";

export const mockActivity: ActivityLogEntry[] = [
  { id: "act_1", action: "IMPORTED", entity: "Video", entityId: "vid_trade_react", actor: "System", createdAt: "2026-06-09T08:06:00Z" },
  { id: "act_2", action: "GENERATED", entity: "ShowPackage", entityId: "pkg_top7", actor: "AI Producer", createdAt: "2026-06-09T08:30:00Z" },
  { id: "act_3", action: "GENERATED", entity: "ShowPackage", entityId: "pkg_takes", actor: "AI Producer", createdAt: "2026-06-09T08:31:00Z" },
  { id: "act_4", action: "FLAGGED", entity: "ShowPackageClip", entityId: "pc_top7_3", actor: "AI Producer", createdAt: "2026-06-09T08:31:30Z" },
  { id: "act_5", action: "OPENED_REVIEW", entity: "ShowPackage", entityId: "pkg_top7", actor: "editor@ballknower", createdAt: "2026-06-09T09:02:00Z" },
];

export const mockUsers = [
  { id: "u_admin", name: "Avery (Admin)", email: "admin@ballknower", role: "ADMIN" as const },
  { id: "u_editor", name: "Sam (Editor)", email: "editor@ballknower", role: "EDITOR" as const },
  { id: "u_approver", name: "Riley (Approver)", email: "approver@ballknower", role: "APPROVER" as const },
  { id: "u_viewer", name: "Jordan (Viewer)", email: "viewer@ballknower", role: "VIEWER" as const },
];
