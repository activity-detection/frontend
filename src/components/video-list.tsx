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
        {/* Table */}
        <div className="rounded-lg border border-border/50 overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow className="hover:bg-muted/70 border-border/50">
                <TableHead className="p-4 w-12"></TableHead>
                <TableHead className="p-4 font-mono text-xs">ID</TableHead>
                <TableHead className="p-4">Description</TableHead>
                <TableHead
                  onClick={() => handleSort("uploadDate")}
                  className="cursor-pointer hover:bg-muted/90 p-4"
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
                              className="peer h-6 w-6 cursor-pointer transition-all appearance-none rounded-full bg-slate-100 shadow hover:shadow-md border border-slate-300 checked:bg-red-900 checked:border-red-900 pointer-events-auto"
                            />
                            <span className="absolute text-white opacity-0 peer-checked:opacity-100 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 20 20"
                                className="w-5.5 h-5.5"
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
