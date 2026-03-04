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
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

type SortConfig = {
  key: "uploadDate";
  direction: "asc" | "desc";
};

export function VideoList() {
  const {
    loading,
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

  return (
    <Card className="border-border/50 shadow-sm">
      <CardContent className="p-8 pt-0">
        {/* Table */}
        <div className="rounded-lg border border-border/50 overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow className="hover:bg-muted/70 border-border/50">
                <TableHead className="p-4 font-mono text-xs">ID</TableHead>
                <TableHead className="p-4">Name</TableHead>
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
                if (loading) {
                  return Array.from({ length: 10 }).map((_, index) => (
                    <TableRow
                      key={`skeleton-${index}`}
                      className="border-border/50"
                    >
                      <TableCell className="p-4">
                        <Skeleton className="h-5 w-20" />
                      </TableCell>
                      <TableCell className="p-4">
                        <Skeleton className="h-5 w-32" />
                      </TableCell>
                      <TableCell className="p-4">
                        <Skeleton className="h-5 w-48" />
                      </TableCell>
                      <TableCell className="p-4">
                        <Skeleton className="h-5s w-24" />
                      </TableCell>
                    </TableRow>
                  ));
                }
                
                if (videos.length === 0) {
                  return (
                    <TableRow className="hover:bg-muted/30">
                      <TableCell
                        colSpan={4}
                        className="text-center text-muted-foreground py-8"
                      >
                        No recordings found
                      </TableCell>
                    </TableRow>
                  );
                }
                
                // Render actual videos + empty placeholder rows to maintain 10 rows total
                const totalRows = 10;
                const emptyRowsCount = Math.max(0, totalRows - videos.length);
                
                return (
                  <>
                    {videos.map((video) => (
                      <TableRow
                        key={video.id}
                        className="hover:bg-muted/20 border-border/50"
                      >
                        <TableCell className="font-mono text-xs p-4 truncate max-w-40">
                          {video.id.slice(0, 8)}...
                        </TableCell>
                        <TableCell className="font-medium p-4 truncate">
                          {video.name}
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
                        className="border-border/50"
                      >
                        <TableCell className="p-4">&nbsp;</TableCell>
                        <TableCell className="p-4">&nbsp;</TableCell>
                        <TableCell className="p-4">&nbsp;</TableCell>
                        <TableCell className="p-4">&nbsp;</TableCell>
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
              disabled={loading || pageNumber === 0}
              className="min-h-9.5 min-w-9.5 py-2 px-2.5 inline-flex justify-center items-center gap-x-2 text-sm rounded-lg text-gray-800 dark:text-neutral-200 hover:bg-gray-100 dark:hover:bg-neutral-700 focus:outline-hidden focus:bg-gray-100 dark:focus:bg-neutral-700 disabled:opacity-50 disabled:pointer-events-none"
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
              disabled={loading || pageNumber >= totalPages - 1}
              className="min-h-9.5 min-w-9.5 py-2 px-2.5 inline-flex justify-center items-center gap-x-2 text-sm rounded-lg text-gray-800 dark:text-neutral-200 hover:bg-gray-100 dark:hover:bg-neutral-700 focus:outline-hidden focus:bg-gray-100 dark:focus:bg-neutral-700 disabled:opacity-50 disabled:pointer-events-none"
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
    </Card>
  );
}
