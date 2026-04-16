"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import type { Details } from "@/models";
import {
  getVideoMedia,
  getVideoInfo,
  type getVideoMediaResponse,
} from "@/lib/endpoints/media-controller/media-controller";
import { VideoEventsTimeline } from "@/components/video-events-timeline";

interface VideoPlayerProps {
  videoId: string | null;
  videoName?: string;
  videoDescription?: string;
  uploadDate?: string;
  className?: string;
  onClose: () => void;
}

function formatTimestampRange(from?: string, to?: string) {
  if (!from && !to) {
    return "—";
  }

  return `${from || "—"} -> ${to || "—"}`;
}

export function VideoPlayer({
  videoId,
  videoName,
  videoDescription,
  uploadDate,
  className,
  onClose,
}: VideoPlayerProps) {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [videoDetails, setVideoDetails] = useState<Details | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [durationSeconds, setDurationSeconds] = useState<number | null>(null);
  const [currentTimeSeconds, setCurrentTimeSeconds] = useState(0);

  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (!videoId) {
      setVideoUrl((previousUrl) => {
        if (previousUrl) {
          URL.revokeObjectURL(previousUrl);
        }
        return null;
      });
      return;
    }

    let isMounted = true;
    let objectUrl: string | null = null;

    setVideoUrl((previousUrl) => {
      if (previousUrl) {
        URL.revokeObjectURL(previousUrl);
      }
      return null;
    });

    const fetchVideo = async () => {
      try {
        setIsLoading(true);
        const response = await getVideoMedia(videoId);

        const responseData = response as getVideoMediaResponse;
        const blob = responseData.data;

        objectUrl = URL.createObjectURL(blob);
        if (isMounted) {
          setVideoUrl(objectUrl);
        } else {
          URL.revokeObjectURL(objectUrl);
        }
      } catch (error) {
        console.error("Failed to load video:", error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void fetchVideo();

    return () => {
      isMounted = false;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [videoId]);

  useEffect(() => {
    if (!videoId) {
      setVideoDetails(null);
      return;
    }

    let isMounted = true;

    const fetchVideoDetails = async () => {
      try {
        setDetailsLoading(true);
        const response = await getVideoInfo(videoId);

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
  }, [videoId]);

  // Reset playback telemetry whenever a new video is loaded so the timeline
  // does not show stale duration / playhead data between selections.
  useEffect(() => {
    setDurationSeconds(null);
    setCurrentTimeSeconds(0);
  }, [videoId]);

  const handleLoadedMetadata = useCallback(() => {
    const duration = videoRef.current?.duration;
    if (duration && Number.isFinite(duration) && duration > 0) {
      setDurationSeconds(duration);
    }
  }, []);

  const handleTimeUpdate = useCallback(() => {
    const time = videoRef.current?.currentTime ?? 0;
    setCurrentTimeSeconds(time);
  }, []);

  const handleSeekToEvent = useCallback((seconds: number) => {
    const video = videoRef.current;
    if (!video) {
      return;
    }
    video.currentTime = seconds;
    setCurrentTimeSeconds(seconds);
    // Auto-play on jump so clicking a marker actually plays that moment,
    // matching typical video-chapter UX. Swallow the promise — browsers may
    // reject autoplay without user gesture, but the click itself is one.
    void video.play().catch(() => {
      /* user gesture / autoplay policy — safe to ignore */
    });
  }, []);

  if (!videoId) return null;

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
          {videoName || "Recording"}
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
        <div className="aspect-video rounded-lg bg-black overflow-hidden flex items-center justify-center">
          {isLoading ? (
            <div className="text-muted-foreground">Loading video...</div>
          ) : videoUrl ? (
            <video
              ref={videoRef}
              controls
              className="w-full h-full object-contain"
              src={videoUrl}
              onLoadedMetadata={handleLoadedMetadata}
              onDurationChange={handleLoadedMetadata}
              onTimeUpdate={handleTimeUpdate}
              onSeeked={handleTimeUpdate}
            />
          ) : (
            <div className="text-muted-foreground">Failed to load video</div>
          )}
        </div>

        <VideoEventsTimeline
          events={videoDetails?.events}
          durationSeconds={durationSeconds}
          currentTimeSeconds={currentTimeSeconds}
          onSeek={handleSeekToEvent}
        />

        <div className="space-y-2 text-sm">
          <h3 className="font-semibold text-foreground">Description</h3>
          <p className="text-muted-foreground wrap-break-word">
            {videoDescription || "No description"}
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
                  <div className="text-xs text-foreground">
                    Label: {event.label}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Timestamp:{" "}
                    {formatTimestampRange(
                      event.timestamp?.from,
                      event.timestamp?.to,
                    )}
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
                    {formatTimestampRange(
                      detection.timestamp?.from,
                      detection.timestamp?.to,
                    )}
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
            Uploaded: {uploadDate || "—"}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
