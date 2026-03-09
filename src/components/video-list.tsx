"use client";

import { useState } from "react";
import { useVideo } from "@/contexts/video";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { VideoOverlay } from "./video-overlay";

type SortConfig = {
  key: "uploadDate";
  direction: "asc" | "desc";
};

export function VideoList() {
  const {
    videosLoading,
    videos,
    pageNumber,
    totalPages,
    totalElements,
    loadVideosPage,
  } = useVideo();

  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: "uploadDate",
    direction: "desc",
  });

  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);

  const handleSort = (key: SortConfig["key"]) => {
    const newDirection =
      sortConfig.key === key && sortConfig.direction === "asc" ? "desc" : "asc";
    setSortConfig({ key, direction: newDirection });
    void loadVideosPage(0, [`${key},${newDirection}`]);
  };

  const handlePrevious = () => {
    if (pageNumber > 0) {
      void loadVideosPage(pageNumber - 1, [
        `${sortConfig.key},${sortConfig.direction}`,
      ]);
    }
  };

  const handleNext = () => {
    if (pageNumber + 1 < totalPages) {
      void loadVideosPage(pageNumber + 1, [
        `${sortConfig.key},${sortConfig.direction}`,
      ]);
    }
  };

  const renderSortIcon = (key: SortConfig["key"]) => {
    if (sortConfig.key !== key) return " ↕";
    return sortConfig.direction === "asc" ? " ↑" : " ↓";
  };

  const selectedVideo = videos.find((v) => v.id === selectedVideoId);

  return (
    <Card className="border-border/50 shadow-sm">
      <CardContent className="p-8 pt-0">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-muted px-4 text-sm text-muted-foreground"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="opacity-80"
              >
                <path d="M8 2v4" />
                <path d="M16 2v4" />
                <rect width="18" height="18" x="3" y="4" rx="2" />
                <path d="M3 10h18" />
              </svg>
              Select start date
            </button>

            <span className="px-1 text-sm text-muted-foreground">to</span>

            <button
              type="button"
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-muted px-4 text-sm text-muted-foreground"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="opacity-80"
              >
                <path d="M8 2v4" />
                <path d="M16 2v4" />
                <rect width="18" height="18" x="3" y="4" rx="2" />
                <path d="M3 10h18" />
              </svg>
              Select end date
            </button>
          </div>

          <div className="flex gap-2">
            <button
            type="button"
            className="inline-flex h-10 items-center rounded-lg border border-border bg-red-900/50 hover:bg-red-900/70 ease-in duration-200 px-4 text-sm text-muted-foreground gap-1 cursor-pointer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path fill="none" d="m14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21q.512.078 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48 48 0 0 0-3.478-.397m-12 .562q.51-.088 1.022-.165m0 0a48 48 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a52 52 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a49 49 0 0 0-7.5 0"/></svg>
            Delete video
          </button>
        
          <button
            type="button"
            className="inline-flex h-10 items-center rounded-lg border border-border bg-muted px-4 text-sm text-muted-foreground gap-1 cursor-pointer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93c.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 0 1 1.45.12l.773.774c.39.389.44 1.002.12 1.45l-.527.737c-.25.35-.272.806-.107 1.204s.505.71.93.78l.893.15c.543.09.94.559.94 1.109v1.094c0 .55-.397 1.02-.94 1.11l-.894.149c-.424.07-.764.383-.929.78c-.165.398-.143.854.107 1.204l.527.738c.32.447.269 1.06-.12 1.45l-.774.773a1.125 1.125 0 0 1-1.449.12l-.738-.527c-.35-.25-.806-.272-1.203-.107c-.398.165-.71.505-.781.929l-.149.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.148-.894c-.071-.424-.384-.764-.781-.93c-.398-.164-.854-.142-1.204.108l-.738.527c-.447.32-1.06.269-1.45-.12l-.773-.774a1.125 1.125 0 0 1-.12-1.45l.527-.737c.25-.35.272-.806.108-1.204s-.506-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.109v-1.094c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.765-.383.93-.78c.165-.398.143-.854-.108-1.204l-.526-.738a1.125 1.125 0 0 1 .12-1.45l.773-.773a1.125 1.125 0 0 1 1.45-.12l.737.527c.35.25.807.272 1.204.107s.71-.505.78-.929z"/><path d="M15 12a3 3 0 1 1-6 0a3 3 0 0 1 6 0"/></svg>
            Settings
          </button>
          </div>
        </div>

        {/* Table */}
        <div className="rounded-lg border border-border/50 overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow className="hover:bg-muted/70 border-border/50">
                <TableHead className="p-4 w-12"></TableHead>
                <TableHead className="p-4 font-mono text-xs font-bold">ID</TableHead>
                <TableHead className="p-4 font-bold">Description</TableHead>
                <TableHead
                  onClick={() => handleSort("uploadDate")}
                  className="cursor-pointer hover:bg-muted/90 p-4 font-bold"
                >
                  Uploaded{renderSortIcon("uploadDate")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(() => {
                const totalRows = 10;

                if (videosLoading) {
                  return Array.from({ length: totalRows }).map((_, index) => (
                    <TableRow
                      key={`skeleton-${index}`}
                      className="border-border/50 h-14.25"
                    >
                      <TableCell className="p-4">
                        <Skeleton className="h-4 w-4 rounded-sm" />
                      </TableCell>
                      <TableCell className="p-4">
                        <Skeleton className="h-5 w-20" />
                      </TableCell>
                      <TableCell className="p-4">
                        <Skeleton className="h-5 w-48" />
                      </TableCell>
                      <TableCell className="p-4">
                        <Skeleton className="h-5 w-24" />
                      </TableCell>
                    </TableRow>
                  ));
                }

                if (videos.length === 0) {
                  return (
                    <>
                      <TableRow className="hover:bg-muted/30 border-border/50 h-14.25">
                        <TableCell
                          colSpan={4}
                          className="text-center text-muted-foreground"
                        >
                          No recordings found
                        </TableCell>
                      </TableRow>
                      {Array.from({ length: totalRows - 1 }).map((_, index) => (
                        <TableRow
                          key={`empty-no-data-${index}`}
                          className="border-border/50 h-14.25"
                        >
                          <TableCell className="p-4"></TableCell>
                          <TableCell className="p-4"></TableCell>
                          <TableCell className="p-4"></TableCell>
                          <TableCell className="p-4"></TableCell>
                        </TableRow>
                      ))}
                    </>
                  );
                }

                const emptyRowsCount = Math.max(0, totalRows - videos.length);

                return (
                  <>
                    {videos.map((video) => (
                      <TableRow
                        key={video.id}
                        className="hover:bg-muted/20 border-border/50 cursor-pointer"
                        onClick={() => setSelectedVideoId(video.id)}
                      >
                        <TableCell className="p-4">
                          <label className="flex items-center cursor-pointer relative pointer-events-none">
                            <input
                              type="checkbox"
                              onClick={(e) => e.stopPropagation()}
                              className="peer h-6 w-6 cursor-pointer transition-all appearance-none rounded bg-muted-100 shadow hover:shadow-md border border-muted-300 checked:bg-red-900 checked:border-red-900 pointer-events-auto"
                            />
                            <span className="absolute text-white opacity-0 peer-checked:opacity-100 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 20 20"
                                className="w-6 h-6"
                                fill="currentColor"
                              >
                                <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94z" />
                              </svg>
                            </span>
                          </label>
                        </TableCell>
                        <TableCell className="font-mono text-xs p-4 truncate max-w-40">
                          {video.id.slice(0, 8)}...
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground p-4 truncate max-w-xs">
                          {video.description || "—"}
                        </TableCell>
                        <TableCell className="text-sm p-4">
                          {video.upload_date
                            ? new Date(video.upload_date).toLocaleDateString(
                                "en-US",
                                {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                },
                              )
                            : "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                    {Array.from({ length: emptyRowsCount }).map((_, index) => (
                      <TableRow
                        key={`empty-${index}`}
                        className="border-border/50 h-14.25"
                      >
                        <TableCell className="p-4"></TableCell>
                        <TableCell className="p-4"></TableCell>
                        <TableCell className="p-4"></TableCell>
                        <TableCell className="p-4"></TableCell>
                      </TableRow>
                    ))}
                  </>
                );
              })()}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="mt-6 flex justify-between items-center">
          <div className="text-sm text-muted-foreground">
            Showing {videos.length} of {totalElements} recordings
          </div>

          <nav className="flex items-center gap-x-1" aria-label="Pagination">
            <button
              type="button"
              onClick={handlePrevious}
              disabled={videosLoading || pageNumber === 0}
              className="cursor-pointer min-h-9.5 min-w-9.5 py-2 px-2.5 inline-flex justify-center items-center gap-x-2 text-sm rounded-lg text-gray-800 dark:text-neutral-200 hover:bg-gray-100 dark:hover:bg-neutral-700 focus:outline-hidden focus:bg-gray-100 dark:focus:bg-neutral-700 disabled:opacity-50 disabled:pointer-events-none"
              aria-label="Previous"
            >
              <svg
                className="shrink-0 size-3.5"
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m15 18-6-6 6-6" />
              </svg>
              <span className="sr-only">Previous</span>
            </button>
            <div className="flex items-center gap-x-1">
              <span className="min-h-9.5 min-w-9.5 flex justify-center items-center border border-gray-200 dark:border-neutral-700 text-gray-800 dark:text-neutral-200 py-2 px-3 text-sm rounded-lg focus:outline-hidden disabled:opacity-50 disabled:pointer-events-none">
                {pageNumber + 1}
              </span>
              <span className="min-h-9.5 flex justify-center items-center text-gray-500 dark:text-neutral-400 py-2 px-1.5 text-sm">
                of
              </span>
              <span className="min-h-9.5 flex justify-center items-center text-gray-500 dark:text-neutral-400 py-2 px-1.5 text-sm">
                {totalPages}
              </span>
            </div>
            <button
              type="button"
              onClick={handleNext}
              disabled={videosLoading || pageNumber >= totalPages - 1}
              className="cursor-pointer min-h-9.5 min-w-9.5 py-2 px-2.5 inline-flex justify-center items-center gap-x-2 text-sm rounded-lg text-gray-800 dark:text-neutral-200 hover:bg-gray-100 dark:hover:bg-neutral-700 focus:outline-hidden focus:bg-gray-100 dark:focus:bg-neutral-700 disabled:opacity-50 disabled:pointer-events-none"
              aria-label="Next"
            >
              <span className="sr-only">Next</span>
              <svg
                className="shrink-0 size-3.5"
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m9 18 6-6-6-6" />
              </svg>
            </button>
          </nav>
        </div>
      </CardContent>

      <VideoOverlay
        videoId={selectedVideoId}
        videoName={selectedVideo?.name}
        onClose={() => setSelectedVideoId(null)}
      />
    </Card>
  );
}
