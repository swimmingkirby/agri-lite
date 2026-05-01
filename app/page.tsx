import type { Metadata } from "next";
import { Suspense } from "react";
import DashboardClient from "./_dashboard";
import LoadingSkeleton from "@/components/LoadingSkeleton";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Dashboard | Agri-Lite",
};

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="grid gap-4 md:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <LoadingSkeleton key={i} className="h-40" />
          ))}
        </div>
      }
    >
      <DashboardClient />
    </Suspense>
  );
}
