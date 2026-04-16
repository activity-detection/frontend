"use client";

import { useMemo } from "react";
import type { EventDetection } from "@/models";
import { cn } from "@/lib/utils";
import {
  formatSecondsAsClock,
  parseIsoDurationToSeconds,
} from "@/lib/duration";

interface VideoEventsTimelineProps {
  events: EventDetection[] | undefined;
  durationSeconds: number | null;
  currentTimeSeconds: number;
  onSeek: (seconds: number) => void;
  className?: string;
}

interface TimelineSegment {
  key: string;
  label: string;
  fromSeconds: number;
  toSeconds: number;
  leftPercent: number;
  widthPercent: number;
  colorIndex: number;
}

// Tailwind class tuples keyed by label hash — keeps each label visually
// consistent while still visually distinguishable from neighboring labels.
const LABEL_COLOR_CLASSES: Array<{ base: string; hover: string }> = [
  { base: "bg-sky-500/70", hover: "hover:bg-sky-500" },
  { base: "bg-emerald-500/70", hover: "hover:bg-emerald-500" },
  { base: "bg-amber-500/70", hover: "hover:bg-amber-500" },
  { base: "bg-violet-500/70", hover: "hover:bg-violet-500" },
  { base: "bg-rose-500/70", hover: "hover:bg-rose-500" },
  { base: "bg-cyan-500/70", hover: "hover:bg-cyan-500" },
];

// Smallest slice of the bar a segment may occupy, so very short events remain
// clickable even on narrow viewports.
const MIN_SEGMENT_WIDTH_PERCENT = 1.5;

function hashLabelToColorIndex(label: string): number {
  let hash = 0;
  for (let i = 0; i < label.length; i += 1) {
    hash = (hash * 31 + label.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) % LABEL_COLOR_CLASSES.length;
}

function buildSegments(
  events: EventDetection[] | undefined,
  durationSeconds: number | null,
): TimelineSegment[] {
  if (!events?.length || !durationSeconds || durationSeconds <= 0) {
    return [];
  }

  const segments: TimelineSegment[] = [];

  events.forEach((event, index) => {
    const fromSeconds = parseIsoDurationToSeconds(event.timestamp?.from);
    const toSeconds = parseIsoDurationToSeconds(event.timestamp?.to);

    if (
      fromSeconds === null ||
      toSeconds === null ||
      !Number.isFinite(fromSeconds) ||
      !Number.isFinite(toSeconds)
    ) {
      return;
    }

    const clampedFrom = Math.max(0, Math.min(fromSeconds, durationSeconds));
    const clampedTo = Math.max(
      clampedFrom,
      Math.min(toSeconds, durationSeconds),
    );

    const leftPercent = (clampedFrom / durationSeconds) * 100;
    const rawWidthPercent = ((clampedTo - clampedFrom) / durationSeconds) * 100;
    const widthPercent = Math.max(rawWidthPercent, MIN_SEGMENT_WIDTH_PERCENT);

    segments.push({
      key: `event-${event.label}-${event.timestamp?.from ?? ""}-${event.timestamp?.to ?? ""}-${index}`,
      label: event.label,
      fromSeconds: clampedFrom,
      toSeconds: clampedTo,
      leftPercent,
      widthPercent,
      colorIndex: hashLabelToColorIndex(event.label),
    });
  });

  return segments;
}

export function VideoEventsTimeline({
  events,
  durationSeconds,
  currentTimeSeconds,
  onSeek,
  className,
}: VideoEventsTimelineProps) {
  const segments = useMemo(
    () => buildSegments(events, durationSeconds),
    [events, durationSeconds],
  );

  const playheadPercent = useMemo(() => {
    if (!durationSeconds || durationSeconds <= 0) {
      return null;
    }
    const clamped = Math.max(0, Math.min(currentTimeSeconds, durationSeconds));
    return (clamped / durationSeconds) * 100;
  }, [currentTimeSeconds, durationSeconds]);

  if (!durationSeconds || durationSeconds <= 0) {
    return (
      <div
        className={cn(
          "rounded-md border border-dashed border-border/50 bg-muted/20 p-3 text-xs text-muted-foreground",
          className,
        )}
      >
        Events timeline will appear once the video is ready.
      </div>
    );
  }

  if (!segments.length) {
    return (
      <div
        className={cn(
          "rounded-md border border-dashed border-border/50 bg-muted/20 p-3 text-xs text-muted-foreground",
          className,
        )}
      >
        No events detected for this video.
      </div>
    );
  }

  return (
    <div
      className={cn("space-y-1", className)}
      aria-label="Events timeline"
      role="group"
    >
      <div className="relative h-6 w-full overflow-hidden rounded-md border border-border/50 bg-muted/30">
        {segments.map((segment) => {
          const colors = LABEL_COLOR_CLASSES[segment.colorIndex];
          const tooltip = `${segment.label} — ${formatSecondsAsClock(
            segment.fromSeconds,
          )} → ${formatSecondsAsClock(segment.toSeconds)}`;

          return (
            <button
              key={segment.key}
              type="button"
              onClick={() => onSeek(segment.fromSeconds)}
              title={tooltip}
              aria-label={tooltip}
              className={cn(
                "absolute top-0 h-full cursor-pointer rounded-sm transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1",
                colors.base,
                colors.hover,
              )}
              style={{
                left: `${segment.leftPercent}%`,
                width: `${segment.widthPercent}%`,
              }}
            />
          );
        })}
        {playheadPercent !== null ? (
          <div
            aria-hidden
            className="pointer-events-none absolute top-0 h-full w-0.5 bg-foreground/80"
            style={{ left: `${playheadPercent}%` }}
          />
        ) : null}
      </div>
      <div className="flex justify-between text-[10px] text-muted-foreground">
        <span>{formatSecondsAsClock(0)}</span>
        <span>{formatSecondsAsClock(durationSeconds)}</span>
      </div>
    </div>
  );
}
