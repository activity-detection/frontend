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
} from "@/lib/endpoints/media-controller/media-controller";

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
  apiLoading: boolean;
  videosLoading: boolean;
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
  const [apiLoading, setApiLoading] = useState(true);
  const [videosLoading, setVideosLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [pageNumber, setPageNumber] = useState(0);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const checkApiHealth = useCallback(async () => {
    setApiLoading(true);
    const maxAttempts = 3;
    let lastError: string | null = null;

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      try {
        const response = await fetch(`${API_BASE_URL}/v3/api-docs`, {
          method: "GET",
          cache: "no-store",
        });

        if (response.ok) {
          setApiOk(true);
          setError(null);
          setApiLoading(false);
          return;
        }

        lastError = `API health check failed with status ${response.status}`;
      } catch {
        lastError = "Failed to connect to backend API";
      }

      if (attempt < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, attempt * 300));
      }
    }

    setApiOk(false);
    setError(lastError ?? "Failed to connect to backend API");
    setApiLoading(false);
  }, []);

  const loadVideosPage = useCallback(
    async (page: number, sort: string[] = ["uploadDate,desc"]) => {
      try {
        setVideosLoading(true);
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
        setVideosLoading(false);
      }
    },
    [pageSize],
  );

  const value = useMemo<VideoContextValue>(
    () => ({
      apiOk,
      apiLoading,
      videosLoading,
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
      apiLoading,
      videosLoading,
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
