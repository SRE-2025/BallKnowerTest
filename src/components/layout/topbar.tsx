import { RoleSwitcher } from "./role-switcher";
import { Badge } from "@/components/ui/badge";

export function Topbar() {
  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-card/40 px-5">
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium md:hidden">
          Ball<span className="text-primary">Knower</span>
        </span>
        <Badge variant="outline">Phase 1 · Mock Data</Badge>
        <span className="hidden text-xs text-muted-foreground sm:inline">
          Show date: June 9, 2026
        </span>
      </div>
      <RoleSwitcher />
    </header>
  );
}
