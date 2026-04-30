"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { RealtimeChannel } from "@supabase/supabase-js";
import ReadingCard from "@/components/ReadingCard";
import EmptyState from "@/components/EmptyState";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import CreatePlotModal from "@/components/CreatePlotModal";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import type { Plot, Reading, Threshold } from "@/lib/types";

const HOUR_MS = 60 * 60 * 1000;

export default function DashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedPlotId = searchParams.get("plot");

  const [plotsCount, setPlotsCount] = useState<number | null>(null);
  const [readings, setReadings] = useState<Reading[] | null>(null);
  const [thresholds, setThresholds] = useState<Threshold[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/plots", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("plots"))))
      .then((data: Plot[]) => {
        if (!cancelled) setPlotsCount(data.length);
      })
      .catch(() => {
        if (!cancelled) setPlotsCount(0);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const loadData = useCallback(async (plotId: string) => {
    setReadings(null);
    setThresholds(null);
    setError(null);
    const since = new Date(Date.now() - HOUR_MS).toISOString();
    try {
      const [readingsRes, thresholdsRes] = await Promise.all([
        fetch(
          `/api/readings?plot_id=${plotId}&since=${encodeURIComponent(since)}&limit=120`,
          { cache: "no-store" },
        ),
        fetch(`/api/thresholds?plot_id=${plotId}`, { cache: "no-store" }),
      ]);
      if (!readingsRes.ok || !thresholdsRes.ok) {
        throw new Error("Request failed");
      }
      const readingsData: Reading[] = await readingsRes.json();
      const thresholdsData: Threshold[] = await thresholdsRes.json();
      const normalized = readingsData.map((r) => ({
        ...r,
        moisture: Number(r.moisture),
        temperature: Number(r.temperature),
        light: Number(r.light),
      }));
      setReadings(normalized);
      setThresholds(thresholdsData);
    } catch {
      setError("Could not load readings. Please refresh.");
    }
  }, []);

  useEffect(() => {
    if (!selectedPlotId) return;
    void loadData(selectedPlotId);
  }, [selectedPlotId, loadData]);

  useEffect(() => {
    if (!selectedPlotId) return;
    let channel: RealtimeChannel | null = null;
    try {
      const sb = getSupabaseBrowser();
      channel = sb
        .channel(`readings-${selectedPlotId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "readings",
            filter: `plot_id=eq.${selectedPlotId}`,
          },
          (payload) => {
            const row = payload.new as Reading;
            setReadings((prev) => {
              const cutoff = Date.now() - HOUR_MS;
              return [
                {
                  ...row,
                  moisture: Number(row.moisture),
                  temperature: Number(row.temperature),
                  light: Number(row.light),
                },
                ...(prev ?? []),
              ].filter((r) => new Date(r.recorded_at).getTime() >= cutoff);
            });
          },
        )
        .subscribe();
    } catch {
      // realtime not configured — fall back to the initial fetch
    }
    return () => {
      if (channel) {
        try {
          getSupabaseBrowser().removeChannel(channel);
        } catch {
          // ignore
        }
      }
    };
  }, [selectedPlotId]);

  const reload = useCallback(() => {
    if (selectedPlotId) void loadData(selectedPlotId);
  }, [selectedPlotId, loadData]);

  const thresholdFor = useCallback(
    (parameter: Threshold["parameter"]) =>
      thresholds?.find((t) => t.parameter === parameter) ?? null,
    [thresholds],
  );

  const headerText = useMemo(() => {
    if (!readings || readings.length === 0) return null;
    return `${readings.length} reading${readings.length === 1 ? "" : "s"} in the last hour`;
  }, [readings]);

  if (plotsCount === null) {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <LoadingSkeleton key={i} className="h-40" />
        ))}
      </div>
    );
  }

  if (plotsCount === 0 || !selectedPlotId) {
    return (
      <>
        <EmptyState
          title="Welcome to Agri-Lite"
          message="Create your first plot to start collecting simulated readings."
          action={
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              className="rounded-md bg-green-700 px-4 py-2 text-sm font-medium text-white hover:bg-green-800"
            >
              Create plot
            </button>
          }
        />
        {createOpen && (
          <CreatePlotModal
            onClose={() => setCreateOpen(false)}
            onCreated={(plot) => {
              const params = new URLSearchParams(searchParams.toString());
              params.set("plot", plot.id);
              setCreateOpen(false);
              setPlotsCount((c) => (c ?? 0) + 1);
              router.push(`/?${params.toString()}`);
            }}
          />
        )}
      </>
    );
  }

  if (error) {
    return (
      <EmptyState
        title="Could not load readings"
        message="Please refresh and try again."
        action={
          <button
            type="button"
            onClick={reload}
            className="rounded-md bg-green-700 px-4 py-2 text-sm font-medium text-white hover:bg-green-800"
          >
            Retry
          </button>
        }
      />
    );
  }

  if (readings === null) {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <LoadingSkeleton key={i} className="h-40" />
        ))}
      </div>
    );
  }

  if (readings.length === 0) {
    return (
      <EmptyState
        title="No readings yet"
        message="The simulator runs every minute, check back shortly."
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Live readings</h1>
        {headerText && (
          <span className="text-sm text-gray-500">{headerText}</span>
        )}
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <ReadingCard
          parameter="moisture"
          readings={readings}
          threshold={thresholdFor("moisture")}
        />
        <ReadingCard
          parameter="temperature"
          readings={readings}
          threshold={thresholdFor("temperature")}
        />
        <ReadingCard
          parameter="light"
          readings={readings}
          threshold={thresholdFor("light")}
        />
      </div>
    </div>
  );
}
