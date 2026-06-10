"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { generatePackageAction } from "@/app/packages/actions";
import type { PackageFormat } from "@/lib/types";

const FORMATS: { value: PackageFormat; label: string }[] = [
  { value: "TOP_7_PLAYS", label: "Top 7 Plays" },
  { value: "BEST_TAKES", label: "Best Takes" },
  { value: "BREAKING_NEWS", label: "Breaking News" },
  { value: "DAILY_RUNDOWN", label: "Daily Rundown" },
];

export function GenerateButton() {
  const [format, setFormat] = React.useState<PackageFormat>("TOP_7_PLAYS");
  const [pending, setPending] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);

  async function onGenerate() {
    setPending(true);
    setMessage(null);
    const res = await generatePackageAction(format);
    setPending(false);
    setMessage(
      res.ok ? `Generated ${res.packageId} via ${res.usedModel}.` : res.error
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-2">
        <select
          value={format}
          onChange={(e) => setFormat(e.target.value as PackageFormat)}
          className="rounded-md border border-border bg-secondary px-2.5 py-1.5 text-xs font-medium"
        >
          {FORMATS.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>
        <Button size="sm" onClick={onGenerate} disabled={pending}>
          {pending ? "Generating…" : "Generate with AI producer"}
        </Button>
      </div>
      {message && <p className="max-w-md text-right text-xs text-muted-foreground">{message}</p>}
    </div>
  );
}
