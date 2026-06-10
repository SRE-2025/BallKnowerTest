"use client";

import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/status-badge";
import { PageHeader } from "@/components/page-header";
import { useRole } from "@/lib/role-context";
import { VideoPlayer } from "@/components/video-player";
import { formatTimeRange, titleize } from "@/lib/utils";
import type {
  ShowPackageClip,
  FilmingPrompt,
  RenderInfo,
  PostingInfo,
  PackageFormat,
  PackageStatus,
  ClipApprovalStatus,
} from "@/lib/types";

export interface BuilderClip extends ShowPackageClip {
  sourceName: string;
  sourceAttribution?: string;
  videoTitle: string;
  youTubeId?: string;
  thumbnailUrl?: string;
  watchUrl?: string;
  startSec: number;
  endSec: number;
  transcriptExcerpt?: string;
}

interface Props {
  packageId: string;
  title: string;
  format: PackageFormat;
  summary?: string;
  initialStatus: PackageStatus;
  initialClips: BuilderClip[];
  filmingPrompts: FilmingPrompt[];
  render: RenderInfo;
  posting: PostingInfo[];
}

export function ShowBuilder(props: Props) {
  const { can } = useRole();
  const [status, setStatus] = React.useState<PackageStatus>(props.initialStatus);
  const [clips, setClips] = React.useState<BuilderClip[]>(props.initialClips);

  const canEdit = can("edit_copy");
  const canReorder = can("reorder_clips");
  const canApprovePosting = can("approve_for_posting");

  function setApproval(id: string, approvalStatus: ClipApprovalStatus) {
    setClips((prev) => prev.map((c) => (c.id === id ? { ...c, approvalStatus } : c)));
  }

  function move(id: string, dir: -1 | 1) {
    setClips((prev) => {
      const idx = prev.findIndex((c) => c.id === id);
      const swap = idx + dir;
      if (idx < 0 || swap < 0 || swap >= prev.length) return prev;
      const next = prev.slice();
      [next[idx], next[swap]] = [next[swap], next[idx]];
      return next.map((c, i) => ({ ...c, rank: i + 1 }));
    });
  }

  function updateField(id: string, field: keyof BuilderClip, value: string) {
    setClips((prev) => prev.map((c) => (c.id === id ? { ...c, [field]: value } : c)));
  }

  const approvedCount = clips.filter((c) => c.approvalStatus === "APPROVED").length;
  const allDecided = clips.every((c) => c.approvalStatus !== "PENDING");

  return (
    <div>
      <PageHeader title={props.title} description={props.summary}>
        <Badge variant="secondary">{titleize(props.format)}</Badge>
        <StatusBadge status={status} />
      </PageHeader>

      {/* Workflow rail */}
      <Card className="mb-6">
        <CardContent className="flex flex-wrap items-center gap-4 p-5">
          <WorkflowStep label="Clips reviewed" done={allDecided} hint={`${approvedCount}/${clips.length} approved`} />
          <WorkflowStep label="Ready for filming" done={status === "READY_FOR_FILMING" || laterThan(status, "READY_FOR_FILMING")} />
          <WorkflowStep label="Ready for render" done={laterThan(status, "READY_FOR_FILMING")} />
          <WorkflowStep label="Draft rendered" done={laterThan(status, "READY_FOR_RENDER")} hint={`Render: ${titleize(props.render.status)}`} />
          <WorkflowStep label="Approved for posting" done={status === "APPROVED_FOR_POSTING" || status === "POSTED"} />
          <div className="ml-auto flex items-center gap-2">
            {canEdit && allDecided && status === "IN_REVIEW" && (
              <Button size="sm" onClick={() => setStatus("READY_FOR_FILMING")}>
                Mark ready for filming
              </Button>
            )}
            {canApprovePosting && status !== "APPROVED_FOR_POSTING" && status !== "POSTED" && (
              <Button size="sm" variant="success" onClick={() => setStatus("APPROVED_FOR_POSTING")}>
                Approve for posting
              </Button>
            )}
            {!canApprovePosting && !canEdit && (
              <Badge variant="outline">Read-only for your role</Badge>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Clips */}
        <div className="space-y-4 lg:col-span-2">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Selected clips ({clips.length})
          </h2>
          {clips.map((clip, i) => (
            <ClipCard
              key={clip.id}
              clip={clip}
              isFirst={i === 0}
              isLast={i === clips.length - 1}
              canEdit={canEdit}
              canReorder={canReorder}
              onApprove={() => setApproval(clip.id, "APPROVED")}
              onReject={() => setApproval(clip.id, "REJECTED")}
              onMoveUp={() => move(clip.id, -1)}
              onMoveDown={() => move(clip.id, 1)}
              onField={(f, v) => updateField(clip.id, f, v)}
            />
          ))}
        </div>

        {/* Side rail: filming + render + posting */}
        <div className="space-y-6">
          <div>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Filming prompts
            </h2>
            <Card>
              <CardContent className="space-y-2 p-4">
                {props.filmingPrompts
                  .slice()
                  .sort((a, b) => a.order - b.order)
                  .map((fp) => (
                    <div key={fp.id} className="flex items-start gap-2 text-sm">
                      <Badge variant="outline" className="mt-0.5 shrink-0">
                        {titleize(fp.slot)}
                      </Badge>
                      <span className="text-muted-foreground">{fp.prompt}</span>
                    </div>
                  ))}
              </CardContent>
            </Card>
          </div>

          <div>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Render &amp; posting
            </h2>
            <Card>
              <CardContent className="space-y-3 p-4 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Render status</span>
                  <StatusBadge status={props.render.status} />
                </div>
                {props.render.notes && (
                  <p className="text-xs text-muted-foreground">{props.render.notes}</p>
                )}
                <div className="border-t border-border pt-3">
                  <p className="mb-2 text-muted-foreground">Posting targets</p>
                  <div className="space-y-1.5">
                    {props.posting.map((p) => (
                      <div key={p.platform} className="flex items-center justify-between">
                        <span>{titleize(p.platform)}</span>
                        <StatusBadge status={p.status} />
                      </div>
                    ))}
                  </div>
                </div>
                <p className="rounded-md bg-secondary/60 px-3 py-2 text-xs text-muted-foreground">
                  Nothing posts automatically. Rendering and posting are mocked in Phase 1 and gated
                  behind human approval.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

function ClipCard({
  clip,
  isFirst,
  isLast,
  canEdit,
  canReorder,
  onApprove,
  onReject,
  onMoveUp,
  onMoveDown,
  onField,
}: {
  clip: BuilderClip;
  isFirst: boolean;
  isLast: boolean;
  canEdit: boolean;
  canReorder: boolean;
  onApprove: () => void;
  onReject: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onField: (field: keyof BuilderClip, value: string) => void;
}) {
  const rejected = clip.approvalStatus === "REJECTED";
  return (
    <Card className={rejected ? "opacity-60" : undefined}>
      <CardContent className="p-5">
        <div className="flex gap-4">
          {/* Rank + real video preview */}
          <div className="flex w-64 shrink-0 flex-col items-center gap-2">
            <div className="flex w-full items-center justify-between">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/15 text-base font-bold text-primary">
                {clip.rank}
              </div>
              {canReorder && (
                <div className="flex gap-1">
                  <Button size="icon" variant="outline" onClick={onMoveUp} disabled={isFirst}>
                    ↑
                  </Button>
                  <Button size="icon" variant="outline" onClick={onMoveDown} disabled={isLast}>
                    ↓
                  </Button>
                </div>
              )}
            </div>
            <ClipPreview clip={clip} />
          </div>

          <div className="min-w-0 flex-1 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={clip.approvalStatus} />
              {clip.needsReview && <Badge variant="warning">Needs review</Badge>}
              <span className="text-xs tabular-nums text-muted-foreground">
                {formatTimeRange(clip.startSec, clip.endSec)}
              </span>
              <span className="text-xs text-muted-foreground">· {clip.sourceName}</span>
            </div>

            <p className="text-sm font-medium">{clip.videoTitle}</p>

            {clip.transcriptExcerpt && (
              <blockquote className="border-l-2 border-primary/40 pl-3 text-sm italic text-muted-foreground">
                “{clip.transcriptExcerpt}”
              </blockquote>
            )}

            {clip.selectionReason && (
              <p className="rounded-md bg-secondary/60 px-3 py-2 text-xs text-muted-foreground">
                <span className="font-medium text-foreground">Why Claude picked it: </span>
                {clip.selectionReason}
              </p>
            )}

            {clip.reviewFlags.length > 0 && (
              <ul className="space-y-1">
                {clip.reviewFlags.map((flag) => (
                  <li key={flag} className="flex items-start gap-1.5 text-xs text-amber-400">
                    <span>⚠</span>
                    <span>{flag}</span>
                  </li>
                ))}
              </ul>
            )}

            {/* Editable AI copy */}
            <div className="grid gap-3 sm:grid-cols-2">
              <EditableField
                label="Title"
                value={clip.suggestedTitle ?? ""}
                editable={canEdit}
                onChange={(v) => onField("suggestedTitle", v)}
              />
              <EditableField
                label="Lower third"
                value={clip.suggestedLowerThird ?? ""}
                editable={canEdit}
                onChange={(v) => onField("suggestedLowerThird", v)}
              />
            </div>
            <EditableField
              label="Caption"
              value={clip.suggestedCaption ?? ""}
              editable={canEdit}
              textarea
              onChange={(v) => onField("suggestedCaption", v)}
            />

            <div className="flex flex-wrap gap-1.5">
              {clip.suggestedHashtags.map((h) => (
                <Badge key={h} variant="secondary">
                  {h}
                </Badge>
              ))}
            </div>

            {clip.sourceAttribution && (
              <p className="text-xs text-muted-foreground">
                Attribution: <span className="italic">{clip.sourceAttribution}</span>
              </p>
            )}

            {/* Approve / reject */}
            <div className="flex gap-2 pt-1">
              <Button
                size="sm"
                variant={clip.approvalStatus === "APPROVED" ? "success" : "outline"}
                onClick={onApprove}
                disabled={!canEdit}
              >
                Approve
              </Button>
              <Button
                size="sm"
                variant={rejected ? "danger" : "outline"}
                onClick={onReject}
                disabled={!canEdit}
              >
                Reject
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Real in-app preview: thumbnail-first player (tap to play), trimmed to the
// clip start. Falls back to a thumbnail link when no embeddable id is present.
function ClipPreview({ clip }: { clip: BuilderClip }) {
  return (
    <div className="w-full space-y-1">
      <VideoPlayer
        youTubeId={clip.youTubeId}
        thumbnailUrl={clip.thumbnailUrl}
        watchUrl={clip.watchUrl}
        title={clip.videoTitle}
        startSec={clip.startSec}
      />
      <p className="text-[11px] text-muted-foreground">
        Plays {formatTimeRange(clip.startSec, clip.endSec)}
      </p>
    </div>
  );
}

function EditableField({
  label,
  value,
  editable,
  textarea,
  onChange,
}: {
  label: string;
  value: string;
  editable: boolean;
  textarea?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      {textarea ? (
        <textarea
          value={value}
          readOnly={!editable}
          onChange={(e) => onChange(e.target.value)}
          rows={2}
          className="mt-1 w-full resize-none rounded-md border border-border bg-secondary/40 px-3 py-2 text-sm read-only:opacity-80 focus:outline-none focus:ring-2 focus:ring-ring"
        />
      ) : (
        <input
          value={value}
          readOnly={!editable}
          onChange={(e) => onChange(e.target.value)}
          className="mt-1 w-full rounded-md border border-border bg-secondary/40 px-3 py-2 text-sm read-only:opacity-80 focus:outline-none focus:ring-2 focus:ring-ring"
        />
      )}
    </label>
  );
}

function WorkflowStep({ label, done, hint }: { label: string; done: boolean; hint?: string }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className={
          "flex h-5 w-5 items-center justify-center rounded-full text-xs " +
          (done ? "bg-emerald-600 text-white" : "bg-secondary text-muted-foreground")
        }
      >
        {done ? "✓" : "•"}
      </span>
      <div className="leading-tight">
        <p className="text-sm">{label}</p>
        {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
      </div>
    </div>
  );
}

// Ordering of package statuses for the workflow rail.
const ORDER: PackageStatus[] = [
  "AI_GENERATED",
  "IN_REVIEW",
  "NEEDS_CHANGES",
  "READY_FOR_FILMING",
  "READY_FOR_RENDER",
  "DRAFT_RENDERED",
  "APPROVED_FOR_POSTING",
  "POSTED",
];
function laterThan(status: PackageStatus, ref: PackageStatus) {
  return ORDER.indexOf(status) > ORDER.indexOf(ref);
}
