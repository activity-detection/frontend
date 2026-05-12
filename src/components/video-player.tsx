"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import videojs from "video.js";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import type {
  Details,
  VideoSequence,
  VideoSequencePage,
  VideoSequencePart,
} from "@/models";
import {
  getVideoInfo,
  getVideoMedia,
  getVideoSequences,
  type getVideoMediaResponse,
} from "@/lib/endpoints/media-controller/media-controller";
import { formatSecondsAsClock, parseIsoDurationToSeconds } from "@/lib/duration";

interface VideoPlayerProps {
  videoId: string | null;
  videoName?: string;
  videoDescription?: string;
  uploadDate?: string;
  className?: string;
  onClose: () => void;
}

interface SequencePartAsset {
  part: VideoSequencePart;
  url: string;
  duration: number;
  mimeType?: string;
}

function formatTimestampRange(from?: string, to?: string) {
  if (!from && !to) {
    return "—";
  }

  return `${from || "—"} -> ${to || "—"}`;
}

function normalizeMimeType(value?: string | null): string | undefined {
  if (!value) {
    return undefined;
  }
  const normalized = value.split(";")[0]?.trim().toLowerCase();
  return normalized && normalized.startsWith("video/") ? normalized : undefined;
}

function guessMimeTypeFromName(name?: string): string | undefined {
  const normalized = name?.toLowerCase() ?? "";
  if (normalized.endsWith(".mp4")) {
    return "video/mp4";
  }
  if (normalized.endsWith(".mov")) {
    return "video/quicktime";
  }
  return undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function unwrapPayload(value: unknown): unknown {
  if (isRecord(value) && "data" in value) {
    return value.data;
  }
  return value;
}

function isVideoSequencePart(value: unknown): value is VideoSequencePart {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.id === "string" &&
    typeof value.name === "string" &&
    typeof value.upload_date === "string"
  );
}

function isVideoSequence(value: unknown): value is VideoSequence {
  if (!isRecord(value)) {
    return false;
  }

  if (
    typeof value.origin_id !== "string" ||
    typeof value.sequence_upload_date !== "string" ||
    !Array.isArray(value.parts)
  ) {
    return false;
  }

  return value.parts.every((part) => isVideoSequencePart(part));
}

function isVideoSequencePage(value: unknown): value is VideoSequencePage {
  if (
    !isRecord(value) ||
    !Array.isArray(value.content) ||
    !isRecord(value.page)
  ) {
    return false;
  }

  const page = value.page;
  if (
    typeof page.size !== "number" ||
    typeof page.number !== "number" ||
    typeof page.totalElements !== "number" ||
    typeof page.totalPages !== "number"
  ) {
    return false;
  }

  return value.content.every((sequence) => isVideoSequence(sequence));
}

async function readVideoDuration(url: string): Promise<number> {
  const duration = await new Promise<number>((resolve, reject) => {
    const probe = document.createElement("video");
    probe.preload = "metadata";
    probe.src = url;

    const handleLoadedMetadata = () => {
      const value = probe.duration;
      cleanup();
      if (Number.isFinite(value) && value > 0) {
        resolve(value);
        return;
      }
      reject(new Error("Unable to read video duration"));
    };

    const handleError = () => {
      cleanup();
      reject(new Error("Unable to load video metadata"));
    };

    const cleanup = () => {
      probe.removeEventListener("loadedmetadata", handleLoadedMetadata);
      probe.removeEventListener("error", handleError);
      probe.removeAttribute("src");
      probe.load();
    };

    probe.addEventListener("loadedmetadata", handleLoadedMetadata);
    probe.addEventListener("error", handleError);
    probe.load();
  });

  return duration;
}

async function resolveVideoSequence(videoId: string): Promise<VideoSequence | null> {
  const pageSize = 50;
  let currentPage = 0;
  let totalPages = 1;

  while (currentPage < totalPages) {
    const pageResponse = await getVideoSequences({
      page: currentPage,
      size: pageSize,
      sort: ["uploadDate,desc"],
    });

    const pagePayload = unwrapPayload(pageResponse);
    if (!isVideoSequencePage(pagePayload)) {
      throw new Error("Invalid video page payload");
    }

    const found = pagePayload.content.find(
      (sequence) =>
        sequence.origin_id === videoId ||
        sequence.parts.some((part) => part.id === videoId),
    );
    if (found) {
      return found;
    }

    totalPages = pagePayload.page.totalPages;
    currentPage += 1;
  }

  return null;
}

export function VideoPlayer({
  videoId,
  videoName,
  videoDescription,
  uploadDate,
  className,
  onClose,
}: VideoPlayerProps) {
  const [partAssets, setPartAssets] = useState<SequencePartAsset[]>([]);
  const [sequenceLoading, setSequenceLoading] = useState(false);
  const [sequenceError, setSequenceError] = useState<string | null>(null);
  const [currentPartIndex, setCurrentPartIndex] = useState(0);
  const [videoDetails, setVideoDetails] = useState<Details | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [currentPartTimeSeconds, setCurrentPartTimeSeconds] = useState(0);

  const playerHostRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<ReturnType<typeof videojs> | null>(null);
  const allObjectUrlsRef = useRef<string[]>([]);
  const partAssetsRef = useRef<SequencePartAsset[]>([]);
  const currentPartIndexRef = useRef(0);
  const applyPendingSeekAndAutoplayRef = useRef<() => void>(() => undefined);
  const applyCurrentSourceRef = useRef<() => void>(() => undefined);
  const renderDetectionMarkersRef = useRef<() => void>(() => undefined);
  const markerRenderRetryCountRef = useRef(0);
  const pendingSeekLocalSecondsRef = useRef<number | null>(null);
  const shouldAutoPlayRef = useRef(false);

  useEffect(() => {
    if (!videoId) {
      setPartAssets([]);
      setSequenceError(null);
      setCurrentPartIndex(0);
      setCurrentPartTimeSeconds(0);
      return;
    }

    let isMounted = true;

    setSequenceLoading(true);
    setSequenceError(null);
    setPartAssets([]);
    setCurrentPartIndex(0);
    setCurrentPartTimeSeconds(0);

    const loadSequence = async () => {
      try {
        const resolvedSequence = await resolveVideoSequence(videoId);
        const parts =
          resolvedSequence?.parts.length && resolvedSequence.parts
            ? resolvedSequence.parts
            : [
                {
                  id: videoId,
                  name: "Video",
                  description: null,
                  upload_date: "",
                  continuation_of: null,
                } satisfies VideoSequencePart,
              ];

        const loadedAssets: SequencePartAsset[] = [];
        for (const part of parts) {
          const response = await getVideoMedia(part.id, {
            headers: {
              Range: "bytes=0-",
            },
          });
          const responseData = response as getVideoMediaResponse;
          const blob = responseData.data;
          const mimeType =
            normalizeMimeType(responseData.headers.get("content-type")) ||
            normalizeMimeType(blob.type) ||
            guessMimeTypeFromName(part.name);
          const url = URL.createObjectURL(blob);
          allObjectUrlsRef.current.push(url);

          const duration = await readVideoDuration(url);
          loadedAssets.push({
            part,
            url,
            duration,
            mimeType,
          });
        }

        if (!isMounted) {
          return;
        }

        const selectedIndex = Math.max(
          0,
          loadedAssets.findIndex((asset) => asset.part.id === videoId),
        );
        setPartAssets(loadedAssets);
        setCurrentPartIndex(selectedIndex);
      } catch {
        if (!isMounted) {
          return;
        }
        try {
          const fallbackResponse = await getVideoMedia(videoId, {
            headers: {
              Range: "bytes=0-",
            },
          });
          const fallbackResponseData = fallbackResponse as getVideoMediaResponse;
          const fallbackBlob = fallbackResponseData.data;
          const fallbackMimeType =
            normalizeMimeType(
              fallbackResponseData.headers.get("content-type"),
            ) ||
            normalizeMimeType(fallbackBlob.type) ||
            guessMimeTypeFromName(videoName);
          const fallbackUrl = URL.createObjectURL(fallbackBlob);
          allObjectUrlsRef.current.push(fallbackUrl);
          const fallbackDuration = await readVideoDuration(fallbackUrl);

          if (!isMounted) {
            return;
          }

          setPartAssets([
            {
              part: {
                id: videoId,
                name: "Video",
                description: null,
                upload_date: "",
                continuation_of: null,
              },
              url: fallbackUrl,
              duration: fallbackDuration,
              mimeType: fallbackMimeType,
            },
          ]);
          setCurrentPartIndex(0);
          setSequenceError(null);
        } catch (fallbackError) {
          setSequenceError(
            fallbackError instanceof Error
              ? fallbackError.message
              : "Failed to load video",
          );
        }
      } finally {
        if (isMounted) {
          setSequenceLoading(false);
        }
      }
    };

    void loadSequence();

    return () => {
      isMounted = false;
      allObjectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      allObjectUrlsRef.current = [];
    };
  }, [videoId, videoName]);

  useEffect(() => {
    partAssetsRef.current = partAssets;
    setCurrentPartIndex((previousIndex) => {
      if (partAssets.length === 0) {
        return 0;
      }
      return Math.min(previousIndex, partAssets.length - 1);
    });
  }, [partAssets]);

  useEffect(() => {
    currentPartIndexRef.current = currentPartIndex;
  }, [currentPartIndex]);

  const currentAsset = partAssets[currentPartIndex] ?? null;
  const currentPartId = currentAsset?.part.id ?? null;

  useEffect(() => {
    if (!currentPartId) {
      setVideoDetails(null);
      return;
    }

    let isMounted = true;

    const fetchVideoDetails = async () => {
      try {
        setDetailsLoading(true);
        const response = await getVideoInfo(currentPartId);

        if (!isMounted) {
          return;
        }

        setVideoDetails((response as unknown as Details) ?? null);
      } catch (error) {
        console.error("Failed to load video details:", error);
        if (isMounted) {
          setVideoDetails(null);
        }
      } finally {
        if (isMounted) {
          setDetailsLoading(false);
        }
      }
    };

    void fetchVideoDetails();

    return () => {
      isMounted = false;
    };
  }, [currentPartId]);

  const partOffsets = useMemo(() => {
    let cumulative = 0;
    return partAssets.map((asset) => {
      const start = cumulative;
      cumulative += asset.duration;
      return start;
    });
  }, [partAssets]);

  const totalDurationSeconds = useMemo(
    () => partAssets.reduce((sum, asset) => sum + asset.duration, 0),
    [partAssets],
  );

  const globalCurrentTimeSeconds =
    currentAsset && partOffsets[currentPartIndex] !== undefined
      ? partOffsets[currentPartIndex] + currentPartTimeSeconds
      : 0;

  const applyPendingSeekAndAutoplay = useCallback(() => {
    const player = playerRef.current;
    if (!player || player.isDisposed()) {
      return;
    }

    if (pendingSeekLocalSecondsRef.current !== null) {
      player.currentTime(pendingSeekLocalSecondsRef.current);
      setCurrentPartTimeSeconds(pendingSeekLocalSecondsRef.current);
      pendingSeekLocalSecondsRef.current = null;
    }

    if (shouldAutoPlayRef.current) {
      shouldAutoPlayRef.current = false;
      const playPromise = player.play();
      if (playPromise) {
        void playPromise.catch(() => {
          /* autoplay policy may still block playback */
        });
      }
    }
  }, []);

  const handlePartEnded = useCallback(() => {
    const nextIndex = currentPartIndexRef.current + 1;
    if (!partAssetsRef.current[nextIndex]) {
      pendingSeekLocalSecondsRef.current = null;
      shouldAutoPlayRef.current = false;
      const player = playerRef.current;
      if (player && !player.isDisposed()) {
        player.pause();
      }
      return;
    }

    setCurrentPartTimeSeconds(0);
    pendingSeekLocalSecondsRef.current = 0;
    shouldAutoPlayRef.current = true;
    setCurrentPartIndex(nextIndex);
  }, []);

  const detectionMarkers = useMemo(() => {
    if (!videoDetails?.detections?.length) {
      return [];
    }

    return videoDetails.detections
      .map((detection, index) => {
        const fromSeconds = parseIsoDurationToSeconds(detection.timestamp?.from);
        const toSeconds = parseIsoDurationToSeconds(detection.timestamp?.to);
        if (
          fromSeconds === null ||
          !Number.isFinite(fromSeconds) ||
          fromSeconds < 0
        ) {
          return null;
        }

        const label =
          detection.objects
            .map((object) => `${object.name} (${object.count ?? 1})`)
            .join(", ") || "Detection";

        return {
          key: `detection-${index}-${detection.timestamp?.from ?? ""}`,
          fromSeconds,
          toSeconds:
            toSeconds !== null &&
            Number.isFinite(toSeconds) &&
            toSeconds >= fromSeconds
              ? toSeconds
              : null,
          label,
        };
      })
      .filter(
        (
          marker,
        ): marker is {
          key: string;
          fromSeconds: number;
          toSeconds: number | null;
          label: string;
        } => marker !== null,
      );
  }, [videoDetails?.detections]);

  const renderDetectionMarkers = useCallback(() => {
    const player = playerRef.current;
    if (!player || player.isDisposed()) {
      return;
    }

    const root = player.el();
    if (!root) {
      return;
    }

    const progressHolder = root.querySelector(
      ".vjs-progress-holder",
    ) as HTMLElement | null;
    if (!progressHolder) {
      if (markerRenderRetryCountRef.current < 5) {
        markerRenderRetryCountRef.current += 1;
        window.setTimeout(() => {
          renderDetectionMarkersRef.current();
        }, 50);
      }
      return;
    }
    markerRenderRetryCountRef.current = 0;

    progressHolder
      .querySelectorAll(".vjs-detection-marker, .vjs-detection-marker-range")
      .forEach((marker) => {
        marker.remove();
      });

    const duration = player.duration();
    if (typeof duration !== "number" || !Number.isFinite(duration) || duration <= 0) {
      return;
    }

    detectionMarkers.forEach((marker) => {
      const clampedFrom = Math.max(0, Math.min(marker.fromSeconds, duration));
      const clampedTo =
        marker.toSeconds !== null
          ? Math.max(clampedFrom, Math.min(marker.toSeconds, duration))
          : clampedFrom;
      const leftPercent = (clampedFrom / duration) * 100;
      const rangeWidthPercent = ((clampedTo - clampedFrom) / duration) * 100;
      const hasRange = rangeWidthPercent > 0.2;
      const element = document.createElement("button");
      element.type = "button";
      element.className = hasRange
        ? "vjs-detection-marker-range"
        : "vjs-detection-marker";
      const tooltip = hasRange
        ? `${formatSecondsAsClock(clampedFrom)} -> ${formatSecondsAsClock(clampedTo)} — ${marker.label}`
        : `${formatSecondsAsClock(clampedFrom)} — ${marker.label}`;
      element.title = tooltip;
      element.setAttribute("aria-label", tooltip);
      element.style.left = `${leftPercent}%`;
      if (hasRange) {
        element.style.width = `${Math.max(rangeWidthPercent, 0.8)}%`;
      }
      element.onclick = (event) => {
        event.preventDefault();
        event.stopPropagation();
        player.currentTime(clampedFrom);
        const playPromise = player.play();
        if (playPromise) {
          void playPromise.catch(() => {
            /* autoplay policy */
          });
        }
      };

      progressHolder.appendChild(element);
    });
  }, [detectionMarkers]);

  useEffect(() => {
    applyPendingSeekAndAutoplayRef.current = applyPendingSeekAndAutoplay;
  }, [applyPendingSeekAndAutoplay]);

  useEffect(() => {
    renderDetectionMarkersRef.current = renderDetectionMarkers;
  }, [renderDetectionMarkers]);

  const applyCurrentSource = useCallback(() => {
    const player = playerRef.current;
    if (!player || player.isDisposed() || !currentAsset) {
      return;
    }

    player.ready(() => {
      if (player.isDisposed()) {
        return;
      }
      player.pause();
      player.src([
        currentAsset.mimeType
          ? { src: currentAsset.url, type: currentAsset.mimeType }
          : { src: currentAsset.url },
      ]);
      player.load();
      setSequenceError(null);
      setCurrentPartTimeSeconds(0);
    });
  }, [currentAsset]);

  useEffect(() => {
    applyCurrentSourceRef.current = applyCurrentSource;
  }, [applyCurrentSource]);

  useEffect(() => {
    const host = playerHostRef.current;
    if (!host || !host.isConnected || playerRef.current) {
      return;
    }

    const videoElement = document.createElement("video-js");
    videoElement.className = "video-js vjs-big-play-centered w-full h-full";
    host.innerHTML = "";
    host.appendChild(videoElement);

    const player = videojs(videoElement, {
      controls: true,
      preload: "auto",
      fluid: true,
      responsive: true,
      aspectRatio: "16:9",
    });
    playerRef.current = player;

    const onTimeUpdate = () => {
      setCurrentPartTimeSeconds(player.currentTime() ?? 0);
    };
    const onLoadedMetadata = () => {
      applyPendingSeekAndAutoplayRef.current();
      window.requestAnimationFrame(() => {
        renderDetectionMarkersRef.current();
      });
    };
    const onError = () => {
      setSequenceError("Failed to play video source");
    };

    player.on("timeupdate", onTimeUpdate);
    player.on("loadedmetadata", onLoadedMetadata);
    player.on("durationchange", onLoadedMetadata);
    player.on("ended", handlePartEnded);
    player.on("error", onError);
    player.ready(() => {
      if (player.isDisposed()) {
        return;
      }
      applyCurrentSourceRef.current();
    });

    return () => {
      player.off("timeupdate", onTimeUpdate);
      player.off("loadedmetadata", onLoadedMetadata);
      player.off("durationchange", onLoadedMetadata);
      player.off("ended", handlePartEnded);
      player.off("error", onError);
      player.dispose();
      playerRef.current = null;
      host.innerHTML = "";
    };
  }, [handlePartEnded]);

  useEffect(() => {
    applyCurrentSource();
  }, [applyCurrentSource]);

  useEffect(() => {
    renderDetectionMarkers();
  }, [renderDetectionMarkers]);

  const chapters = useMemo(
    () =>
      partAssets.map((asset, index) => ({
        key: `${asset.part.id}-${index}`,
        label: asset.part.name || `Part ${index + 1}`,
        startSeconds: partOffsets[index] ?? 0,
      })),
    [partAssets, partOffsets],
  );

  const handleSeekToChapter = useCallback(
    (globalSeconds: number) => {
      if (!partAssets.length || totalDurationSeconds <= 0) {
        return;
      }

      const clamped = Math.max(0, Math.min(globalSeconds, totalDurationSeconds));

      let targetIndex = partAssets.length - 1;
      for (let index = 0; index < partAssets.length; index += 1) {
        const start = partOffsets[index] ?? 0;
        const end = start + partAssets[index].duration;
        if (clamped >= start && clamped < end) {
          targetIndex = index;
          break;
        }
      }

      const targetLocal = clamped - (partOffsets[targetIndex] ?? 0);
      const player = playerRef.current;

      if (targetIndex === currentPartIndex && player) {
        player.currentTime(targetLocal);
        setCurrentPartTimeSeconds(targetLocal);
        const playPromise = player.play();
        if (playPromise) {
          void playPromise.catch(() => {
            /* user gesture / autoplay policy */
          });
        }
        return;
      }

      pendingSeekLocalSecondsRef.current = targetLocal;
      shouldAutoPlayRef.current = true;
      setCurrentPartTimeSeconds(0);
      setCurrentPartIndex(targetIndex);
    },
    [currentPartIndex, partAssets, partOffsets, totalDurationSeconds],
  );

  if (!videoId) return null;

  const currentPartName = currentAsset?.part.name || videoName || "Video";
  const currentPartDescription =
    currentAsset?.part.description ?? videoDescription ?? "No description";
  const currentPartUploadDate = currentAsset?.part.upload_date || uploadDate || "—";
  const hasSequence = partAssets.length > 1;

  return (
    <Card
      className={cn(
        "h-full border-border/50 shadow-sm bg-background flex flex-col",
        className,
      )}
    >
      <div className="flex justify-between items-center p-4 pt-0 border-b border-border/50 gap-3">
        <h2 className="text-lg font-semibold text-foreground truncate">
          <span className="sr-only">Selected video:</span>
          {currentPartName}
        </h2>
        <button
          onClick={onClose}
          className="cursor-pointer text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Close preview"
        >
          <svg
            className="w-5 h-5"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
      <CardContent className="p-4 space-y-4">
        <div className="aspect-video rounded-lg bg-black overflow-hidden relative">
          <div ref={playerHostRef} data-vjs-player className="w-full h-full" />
          {sequenceLoading ? (
            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground bg-black/60">
              Loading video...
            </div>
          ) : sequenceError ? (
            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground bg-black/60">
              Failed to load video
            </div>
          ) : !currentAsset ? (
            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground bg-black/60">
              Failed to load video
            </div>
          ) : null}
        </div>

        {chapters.length ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <h3 className="font-semibold text-foreground">Video chapters</h3>
              {hasSequence ? (
                <span className="text-xs text-muted-foreground">
                  {partAssets.length} parts · {formatSecondsAsClock(totalDurationSeconds)}
                </span>
              ) : null}
            </div>
            <div className="space-y-1">
              {chapters.map((chapter, index) => (
                <button
                  key={chapter.key}
                  type="button"
                  onClick={() => handleSeekToChapter(chapter.startSeconds)}
                  className={cn(
                    "w-full rounded-md border border-border/50 px-3 py-2 text-left text-sm transition-colors cursor-pointer",
                    index === currentPartIndex
                      ? "bg-muted/60"
                      : "bg-muted/20 hover:bg-muted/40",
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-foreground">{chapter.label}</span>
                    <span className="shrink-0 font-mono text-xs text-muted-foreground">
                      {formatSecondsAsClock(chapter.startSeconds)}
                    </span>
                  </div>
                </button>
              ))}
            </div>
            {hasSequence ? (
              <div className="text-xs text-muted-foreground">
                Global playhead: {formatSecondsAsClock(globalCurrentTimeSeconds)}
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="space-y-2 text-sm">
          <h3 className="font-semibold text-foreground">Description</h3>
          <p className="text-muted-foreground wrap-break-word">
            {currentPartDescription}
          </p>

          <h3 className="font-semibold text-foreground">Events</h3>
          {detailsLoading ? (
            <p className="text-muted-foreground">Loading details...</p>
          ) : videoDetails?.events?.length ? (
            <div className="space-y-2">
              {videoDetails.events.map((event, index) => (
                <div
                  key={`event-${event.label}-${event.timestamp?.from ?? ""}-${index}`}
                  className="rounded-md border border-border/50 bg-muted/30 p-3"
                >
                  <div className="text-xs text-foreground">Label: {event.label}</div>
                  <div className="text-xs text-muted-foreground">
                    Timestamp:{" "}
                    {formatTimestampRange(event.timestamp?.from, event.timestamp?.to)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No events</p>
          )}

          <h3 className="font-semibold text-foreground">Detections</h3>
          {detailsLoading ? (
            <p className="text-muted-foreground">Loading details...</p>
          ) : videoDetails?.detections?.length ? (
            <div className="space-y-2">
              {videoDetails.detections.map((detection, index) => (
                <div
                  key={`detection-${detection.timestamp?.from ?? ""}-${index}`}
                  className="rounded-md border border-border/50 bg-muted/30 p-3"
                >
                  <div className="text-xs text-muted-foreground">
                    Timestamp:{" "}
                    {formatTimestampRange(detection.timestamp?.from, detection.timestamp?.to)}
                  </div>
                  <div className="mt-1 text-xs text-foreground wrap-break-word">
                    Objects:{" "}
                    {detection.objects
                      .map((object) => `${object.name} (${object.count ?? 1})`)
                      .join(", ") || "—"}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No detections</p>
          )}

          <div className="pt-2 text-xs text-muted-foreground">
            Uploaded: {currentPartUploadDate}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
