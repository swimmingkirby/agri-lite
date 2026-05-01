"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import EmptyState from "@/components/EmptyState";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import HistoryChart from "@/components/HistoryChart";
import ChartErrorBoundary from "@/components/ChartErrorBoundary";
import TimeRangeSelector, {
  rangeToLimit,
  rangeToSinceMs,
  type TimeRange,
} from "@/components/TimeRangeSelector";
import type { Note, Reading } from "@/lib/types";
import { formatLocalDateTime } from "@/lib/format";

export default function HistoryPage() {
  const searchParams = useSearchParams();
  const selectedPlotId = searchParams.get("plot");
  const [range, setRange] = useState<TimeRange>("24h");
  const [readings, setReadings] = useState<Reading[] | null>(null);
  const [notes, setNotes] = useState<Note[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (plotId: string, r: TimeRange) => {
      setReadings(null);
      setNotes(null);
      setError(null);
      const since = new Date(Date.now() - rangeToSinceMs(r)).toISOString();
      try {
        const [readingsRes, notesRes] = await Promise.all([
          fetch(
            `/api/readings?plot_id=${plotId}&since=${encodeURIComponent(since)}&limit=${rangeToLimit(r)}`,
            { cache: "no-store" },
          ),
          fetch(`/api/notes?plot_id=${plotId}`, { cache: "no-store" }),
        ]);
        if (!readingsRes.ok || !notesRes.ok) throw new Error("Request failed");
        const readingsData: Reading[] = await readingsRes.json();
        const notesData: Note[] = await notesRes.json();
        setReadings(
          readingsData.map((r) => ({
            ...r,
            moisture: Number(r.moisture),
            temperature: Number(r.temperature),
            light: Number(r.light),
          })),
        );
        const cutoff = Date.now() - rangeToSinceMs(r);
        setNotes(
          notesData.filter(
            (n) => new Date(n.recorded_at).getTime() >= cutoff,
          ),
        );
      } catch {
        setError("Could not load history. Please refresh.");
      }
    },
    [],
  );

  useEffect(() => {
    if (!selectedPlotId) return;
    void load(selectedPlotId, range);
  }, [selectedPlotId, range, load]);

  if (!selectedPlotId) {
    return (
      <EmptyState
        title="No plot selected"
        message="Create a plot from the sidebar to see historical trends."
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-gray-900">History</h1>
        <TimeRangeSelector value={range} onChange={setRange} />
      </div>

      {error ? (
        <EmptyState
          title="Could not load history"
          action={
            <button
              type="button"
              onClick={() => selectedPlotId && load(selectedPlotId, range)}
              className="rounded-md bg-green-700 px-4 py-2 text-sm font-medium text-white hover:bg-green-800"
            >
              Retry
            </button>
          }
        />
      ) : readings === null || notes === null ? (
        <div className="space-y-4">
          {[0, 1, 2].map((i) => (
            <LoadingSkeleton key={i} className="h-64" />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          <ChartErrorBoundary>
            <HistoryChart
              parameter="moisture"
              readings={readings}
              notes={notes}
              rangeMs={rangeToSinceMs(range)}
            />
          </ChartErrorBoundary>
          <ChartErrorBoundary>
            <HistoryChart
              parameter="temperature"
              readings={readings}
              notes={notes}
              rangeMs={rangeToSinceMs(range)}
            />
          </ChartErrorBoundary>
          <ChartErrorBoundary>
            <HistoryChart
              parameter="light"
              readings={readings}
              notes={notes}
              rangeMs={rangeToSinceMs(range)}
            />
          </ChartErrorBoundary>

          {notes.length > 0 && (
            <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
              <h3 className="mb-3 text-sm font-semibold text-gray-900">
                Notes in this window
              </h3>
              <ol className="space-y-2 text-sm">
                {[...notes]
                  .sort(
                    (a, b) =>
                      new Date(a.recorded_at).getTime() -
                      new Date(b.recorded_at).getTime(),
                  )
                  .map((note, idx) => (
                    <li key={note.id} className="flex gap-3">
                      <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-700">
                        {idx + 1}
                      </span>
                      <div>
                        <span className="text-gray-900">{note.body}</span>
                        <span className="ml-2 text-xs text-gray-500">
                          {formatLocalDateTime(note.recorded_at)}
                        </span>
                      </div>
                    </li>
                  ))}
              </ol>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
