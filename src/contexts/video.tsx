"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  getVideos,
  getVideoMedia,
} from "@/lib/endpoints/media-controller/media-controller";
import type { GetVideosParams } from "@/models";

type VideoItem = {
  id: string;
  name: string;
  description?: string;
  upload_date?: string;
};

type VideosPage = {
  content: VideoItem[];
  page: {
    size: number;
    number: number;
    totalElements: number;
    totalPages: number;
  };
};

type VideoContextValue = {
  apiOk: boolean | null;
  loading: boolean;
  error: string | null;
  videos: VideoItem[];
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  totalElements: number;
  checkApiHealth: () => Promise<void>;
  loadVideosPage: (page: number, sort?: string[]) => Promise<void>;
};

const VideoContext = createContext<VideoContextValue | undefined>(undefined);

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ||
  "http://localhost:8080";

export function VideoProvider({ children }: { children: ReactNode }) {
  const [apiOk, setApiOk] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [pageNumber, setPageNumber] = useState(0);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const checkApiHealth = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/v3/api-docs`, {
        method: "GET",
        cache: "no-store",
      });
      setApiOk(response.ok);
      if (!response.ok) {
        setError(`API health check failed with status ${response.status}`);
      }
    } catch {
      setApiOk(false);
      setError("Failed to connect to backend API");
    }
  }, []);

  const loadVideosPage = useCallback(
    async (page: number, sort: string[] = ["uploadDate,desc"]) => {
      try {
        setLoading(true);
        setError(null);

        // Min delay to show skeleton loading state
        const [response] = await Promise.all([
          getVideos({
            page,
            size: pageSize,
            sort,
          }),
          new Promise((resolve) => setTimeout(resolve, 100)),
        ]);

        if (!response || typeof response !== "object") {
          throw new Error("Invalid response from API");
        }

        const data = response as unknown as VideosPage;
        setVideos(data.content ?? []);
        setPageNumber(data.page?.number ?? page);
        setTotalPages(data.page?.totalPages ?? 0);
        setTotalElements(data.page?.totalElements ?? 0);
      } catch (err) {
        setVideos([]);
        setError(err instanceof Error ? err.message : "Error loading videos");
      } finally {
        setLoading(false);
      }
    },
    [pageSize],
  );

  const value = useMemo<VideoContextValue>(
    () => ({
      apiOk,
      loading,
      error,
      videos,
      pageNumber,
      pageSize,
      totalPages,
      totalElements,
      checkApiHealth,
      loadVideosPage,
    }),
    [
      apiOk,
      loading,
      error,
      videos,
      pageNumber,
      pageSize,
      totalPages,
      totalElements,
      checkApiHealth,
      loadVideosPage,
    ],
  );

  return (
    <VideoContext.Provider value={value}>{children}</VideoContext.Provider>
  );
}

export function useVideo() {
  const context = useContext(VideoContext);
  if (!context) {
    throw new Error("useVideo must be used within VideoProvider");
  }
  return context;
}
