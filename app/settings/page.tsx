import { Suspense } from "react";
import SettingsClient from "./_settings";
import LoadingSkeleton from "@/components/LoadingSkeleton";

export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="grid gap-4 md:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <LoadingSkeleton key={i} className="h-44" />
          ))}
        </div>
      }
    >
      <SettingsClient />
    </Suspense>
  );
}
