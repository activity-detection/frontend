"use client";

import { useEffect } from "react";
import { VideoProvider, useVideo } from "@/contexts/video";
import { LoadingScreen } from "@/components/loading-screen";
import { VideoList } from "@/components/video-list";

function PageContent() {
  const { apiOk, checkApiHealth, loadVideosPage } = useVideo();

  useEffect(() => {
    const initialize = async () => {
      await checkApiHealth();
      await loadVideosPage(0);
    };
    void initialize();
  }, [checkApiHealth, loadVideosPage]);

  if (apiOk === null) {
    return <LoadingScreen />;
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto py-4 px-4">
        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight text-foreground md:block hidden">
            CCTV Activity Detection App
          </h1>
        </div>

        <VideoList />
      </div>
    </main>
  );
}

export default function Home() {
  return (
    <VideoProvider>
      <PageContent />
    </VideoProvider>
  );
}
