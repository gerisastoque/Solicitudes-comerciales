import { cn } from "@/lib/utils";
import { STATUS_META, URGENCY_META, PRIORITY_META, DEADLINE_BUCKET_META, type RequestStatus, type Urgency, type Priority, type DeadlineBucket } from "@/lib/mock-data";

export function StatusBadge({ status, className }: { status: RequestStatus; className?: string }) {
  const m = STATUS_META[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded border px-2 py-0.5 text-xs font-medium",
        m.tone,
        className
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", m.dot)} />
      {m.label}
    </span>
  );
}

export function UrgencyBadge({ urgency, className }: { urgency: Urgency; className?: string }) {
  const m = URGENCY_META[urgency];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded border px-1.5 py-0.5 text-[11px] font-medium",
        m.tone,
        className
      )}
    >
      {m.label}
    </span>
  );
}

export function PriorityBadge({ priority, className }: { priority: Priority; className?: string }) {
  const m = PRIORITY_META[priority];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[11px] font-medium",
        m.tone,
        className
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {m.label}
    </span>
  );
}

export function DeadlineBucketBadge({ bucket, className }: { bucket: DeadlineBucket; className?: string }) {
  if (!bucket) return null;
  const m = DEADLINE_BUCKET_META[bucket];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded border px-1.5 py-0.5 text-[11px] font-medium",
        m.tone,
        className
      )}
    >
      {m.label}
    </span>
  );
}
