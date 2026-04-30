import { Suspense } from "react";
import HistoryClient from "./_history";
import LoadingSkeleton from "@/components/LoadingSkeleton";

export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="space-y-4">
          {[0, 1, 2].map((i) => (
            <LoadingSkeleton key={i} className="h-64" />
          ))}
        </div>
      }
    >
      <HistoryClient />
    </Suspense>
  );
}
