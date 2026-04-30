"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import EmptyState from "@/components/EmptyState";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import ThresholdCard from "@/components/ThresholdForm";
import NotesPanel from "@/components/NotesPanel";
import type { Parameter, Threshold } from "@/lib/types";

const PARAMETERS: Parameter[] = ["moisture", "temperature", "light"];

export default function SettingsPage() {
  const searchParams = useSearchParams();
  const selectedPlotId = searchParams.get("plot");

  const [thresholds, setThresholds] = useState<Threshold[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (plotId: string) => {
    setThresholds(null);
    setError(null);
    try {
      const res = await fetch(`/api/thresholds?plot_id=${plotId}`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error("Failed");
      const data: Threshold[] = await res.json();
      setThresholds(data);
    } catch {
      setError("Could not load thresholds.");
    }
  }, []);

  useEffect(() => {
    if (!selectedPlotId) return;
    void load(selectedPlotId);
  }, [selectedPlotId, load]);

  if (!selectedPlotId) {
    return (
      <EmptyState
        title="No plot selected"
        message="Create a plot from the sidebar to configure thresholds and notes."
      />
    );
  }

  const findThreshold = (parameter: Parameter) =>
    thresholds?.find((t) => t.parameter === parameter) ?? null;

  const upsertLocal = (next: Threshold) => {
    setThresholds((prev) => {
      const base = prev ?? [];
      const others = base.filter(
        (t) => t.parameter !== next.parameter,
      );
      return [...others, next];
    });
  };

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-gray-900">Settings</h1>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
          Thresholds
        </h2>
        {error ? (
          <EmptyState
            title="Could not load thresholds"
            action={
              <button
                type="button"
                onClick={() => void load(selectedPlotId)}
                className="rounded-md bg-green-700 px-4 py-2 text-sm font-medium text-white hover:bg-green-800"
              >
                Retry
              </button>
            }
          />
        ) : thresholds === null ? (
          <div className="grid gap-4 md:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <LoadingSkeleton key={i} className="h-44" />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            {PARAMETERS.map((p) => (
              <ThresholdCard
                key={p}
                plotId={selectedPlotId}
                parameter={p}
                initial={findThreshold(p)}
                onSaved={upsertLocal}
              />
            ))}
          </div>
        )}
      </section>

      <section>
        <NotesPanel plotId={selectedPlotId} />
      </section>
    </div>
  );
}
