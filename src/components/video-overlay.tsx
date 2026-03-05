"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  getVideoMedia,
  type getVideoMediaResponse,
} from "@/lib/endpoints/media-controller/media-controller";

interface VideoOverlayProps {
  videoId: string | null;
  videoName?: string;
  onClose: () => void;
}

export function VideoOverlay({
  videoId,
  videoName,
  onClose,
}: VideoOverlayProps) {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!videoId) {
      setVideoUrl(null);
      return;
    }

    let isMounted = true;

    const fetchVideo = async () => {
      try {
        setIsLoading(true);
        const response = await getVideoMedia(videoId);

        const responseData = response as getVideoMediaResponse;
        const blob = responseData.data;

        const url = URL.createObjectURL(blob);
        if (isMounted) {
          setVideoUrl(url);
        } else {
          URL.revokeObjectURL(url);
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
      if (videoUrl) {
        URL.revokeObjectURL(videoUrl);
      }
    };
  }, [videoId]);

  if (!videoId) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full h-full max-h-screen bg-background border-border/50 shadow-lg rounded-lg flex flex-col">
        <div className="flex justify-between items-center p-6 border-b border-border/50">
          <h2 className="text-2xl font-bold text-foreground">
            {videoName || "Recording"}
          </h2>
          <button
            onClick={onClose}
            className="cursor-pointer text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Close"
          >
            <svg
              className="w-6 h-6"
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
        <CardContent className="flex-1 p-6 overflow-auto flex items-center justify-center">
          {isLoading ? (
            <div className="text-muted-foreground">Loading video...</div>
          ) : videoUrl ? (
            <video
              controls
              className="w-full h-full max-w-full max-h-full object-contain rounded-lg bg-black"
              src={videoUrl}
            />
          ) : (
            <div className="text-muted-foreground">Failed to load video</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
