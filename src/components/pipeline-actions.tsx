"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { useRole } from "@/lib/role-context";
import { renderPackageAction, postPackageAction } from "@/app/packages/pipeline-actions";
import { recordApproval } from "@/app/packages/approval-actions";

// Drives the back-half pipeline (render → approve → post) from the package page.
// Each action calls a server action that runs the real Phase 5/6/7 code in
// database mode. Role-gated: posting/approval require approve_for_posting.
export function PipelineActions({ packageId }: { packageId: string }) {
  const { can } = useRole();
  const [busy, setBusy] = React.useState<string | null>(null);
  const [msg, setMsg] = React.useState<string | null>(null);

  async function run(label: string, fn: () => Promise<{ ok: boolean; detail?: string; error?: string }>) {
    setBusy(label);
    setMsg(null);
    const res = await fn();
    setBusy(null);
    setMsg(res.ok ? res.detail ?? "Done." : res.error ?? "Error");
  }

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border bg-card p-4">
      <p className="text-sm font-semibold">Pipeline</p>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" disabled={!!busy} onClick={() => run("render", () => renderPackageAction(packageId))}>
          {busy === "render" ? "Rendering…" : "Render draft"}
        </Button>
        {can("approve_for_posting") && (
          <Button size="sm" variant="success" disabled={!!busy} onClick={() => run("approve", () => recordApproval(packageId, true).then((r) => ("ok" in r && r.ok ? { ok: true, detail: "Approved for posting." } : r)))}>
            {busy === "approve" ? "Approving…" : "Approve for posting"}
          </Button>
        )}
        {can("approve_for_posting") && (
          <Button size="sm" disabled={!!busy} onClick={() => run("post", () => postPackageAction(packageId))}>
            {busy === "post" ? "Posting…" : "Post / schedule"}
          </Button>
        )}
      </div>
      {msg && <p className="text-xs text-muted-foreground">{msg}</p>}
    </div>
  );
}
