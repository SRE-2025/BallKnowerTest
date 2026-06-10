"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "Daily Dashboard", group: "Produce" },
  { href: "/schedule", label: "Run-of-Show", group: "Produce" },
  { href: "/packages", label: "Show Packages", group: "Produce" },
  { href: "/approvals", label: "Approvals", group: "Produce" },
  { href: "/bets", label: "Best Bets (12p)", group: "Shows" },
  { href: "/takes", label: "Wild Takes (6p)", group: "Shows" },
  { href: "/storylines", label: "Storylines (6:45p)", group: "Shows" },
  { href: "/filming", label: "Filming Prompts", group: "Shows" },
  { href: "/sources", label: "Source Library", group: "Library" },
  { href: "/videos", label: "Videos", group: "Library" },
  { href: "/clips", label: "Candidate Clips", group: "Library" },
  { href: "/analytics", label: "Analytics", group: "Insights" },
];

export function Sidebar() {
  const pathname = usePathname();
  const groups = Array.from(new Set(NAV.map((n) => n.group)));

  return (
    <aside className="hidden w-60 shrink-0 border-r border-border bg-card/40 md:block">
      <div className="flex h-14 items-center gap-2 border-b border-border px-5">
        <span className="text-base font-bold tracking-tight">
          Ball<span className="text-primary">Knower</span>
        </span>
      </div>
      <nav className="space-y-6 p-4">
        {groups.map((group) => (
          <div key={group}>
            <p className="px-2 pb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {group}
            </p>
            <ul className="space-y-1">
              {NAV.filter((n) => n.group === group).map((item) => {
                const active =
                  item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "block rounded-md px-3 py-2 text-sm transition-colors",
                        active
                          ? "bg-primary/15 font-medium text-primary"
                          : "text-muted-foreground hover:bg-accent hover:text-foreground"
                      )}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}
