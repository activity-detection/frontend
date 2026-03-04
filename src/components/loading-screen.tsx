import { Skeleton } from "@/components/ui/skeleton";

export function LoadingScreen() {
  return (
    <div className="w-full h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-4xl px-8 py-8">
        <div className="space-y-6">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-5 w-48" />
          <div className="mt-12 space-y-4">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
