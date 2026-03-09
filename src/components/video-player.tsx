"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import {
  getVideoMedia,
  type getVideoMediaResponse,
} from "@/lib/endpoints/media-controller/media-controller";

interface VideoPlayerProps {
  videoId: string | null;
  videoName?: string;
  videoDescription?: string;
  uploadDate?: string;
  className?: string;
  onClose: () => void;
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
              controls
              className="w-full h-full object-contain"
              src={videoUrl}
            />
          ) : (
            <div className="text-muted-foreground">Failed to load video</div>
          )}
        </div>

        <div className="space-y-2 text-sm">
          <h3 className="font-semibold text-foreground">Description</h3>
          <p className="text-muted-foreground wrap-break-word">
            {videoDescription || "No description"}
          </p>

          <div className="pt-2 text-xs text-muted-foreground">
            Uploaded: {uploadDate || "—"}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
