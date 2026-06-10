import { Badge } from "@/components/ui/badge";
import { titleize } from "@/lib/utils";
import type {
  PackageStatus,
  ClipApprovalStatus,
  FilmingPromptStatus,
  RenderStatus,
  PostStatus,
  VideoStatus,
} from "@/lib/types";

type AnyStatus =
  | PackageStatus
  | ClipApprovalStatus
  | FilmingPromptStatus
  | RenderStatus
  | PostStatus
  | VideoStatus;

const variantByStatus: Record<string, "default" | "success" | "warning" | "danger" | "info" | "secondary"> = {
  // Package
  AI_GENERATED: "info",
  IN_REVIEW: "warning",
  NEEDS_CHANGES: "danger",
  READY_FOR_FILMING: "info",
  READY_FOR_RENDER: "info",
  DRAFT_RENDERED: "info",
  APPROVED_FOR_POSTING: "success",
  READY_FOR_TALENT: "info",
  SENT_TO_TALENT: "success",
  POSTED: "success",
  // Clip approval
  PENDING: "warning",
  APPROVED: "success",
  REJECTED: "danger",
  REPLACED: "secondary",
  // Filming prompt
  NEEDED: "warning",
  FILMED: "info",
  UPLOADED: "info",
  // Render
  QUEUED: "secondary",
  RENDERING: "info",
  READY: "success",
  FAILED: "danger",
  // Posting
  SCHEDULED: "info",
  POSTING: "info",
  CANCELLED: "secondary",
  // Video
  IMPORTED: "secondary",
  TRANSCRIBING: "info",
  TRANSCRIBED: "info",
  ANALYZED: "success",
  ARCHIVED: "secondary",
};

export function StatusBadge({ status }: { status: AnyStatus }) {
  return <Badge variant={variantByStatus[status] ?? "secondary"}>{titleize(status)}</Badge>;
}
