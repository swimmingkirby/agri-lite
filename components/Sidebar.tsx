"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import type { Plot } from "@/lib/types";
import CreatePlotModal from "./CreatePlotModal";

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const selectedPlotId = searchParams.get("plot");

  const [plots, setPlots] = useState<Plot[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Plot | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadPlots = useCallback(async () => {
    try {
      const res = await fetch("/api/plots", { cache: "no-store" });
      if (!res.ok) throw new Error("Request failed");
      const data: Plot[] = await res.json();
      setPlots(data);
      setLoadError(null);
      if (!selectedPlotId && data.length > 0) {
        const params = new URLSearchParams(searchParams.toString());
        params.set("plot", data[0].id);
        router.replace(`${pathname}?${params.toString()}`);
      }
    } catch {
      setLoadError("Could not load plots");
      setPlots([]);
    }
  }, [selectedPlotId, searchParams, pathname, router]);

  useEffect(() => {
    void loadPlots();
  }, [loadPlots]);

  const handleCreated = useCallback(
    (plot: Plot) => {
      setCreateOpen(false);
      setPlots((prev) => (prev ? [plot, ...prev] : [plot]));
      const params = new URLSearchParams(searchParams.toString());
      params.set("plot", plot.id);
      router.push(`${pathname}?${params.toString()}`);
    },
    [pathname, router, searchParams],
  );

  const buildHref = useCallback(
    (plotId: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("plot", plotId);
      return `${pathname}?${params.toString()}`;
    },
    [pathname, searchParams],
  );

  const handleDelete = useCallback(async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/plots/${pendingDelete.id}`, {
        method: "DELETE",
      });
      if (!res.ok && res.status !== 204) {
        throw new Error("Failed");
      }
      const remaining = (plots ?? []).filter(
        (p) => p.id !== pendingDelete.id,
      );
      setPlots(remaining);
      setPendingDelete(null);

      const params = new URLSearchParams(searchParams.toString());
      if (selectedPlotId === pendingDelete.id) {
        if (remaining.length > 0) {
          params.set("plot", remaining[0].id);
        } else {
          params.delete("plot");
        }
        const qs = params.toString();
        router.replace(qs ? `${pathname}?${qs}` : pathname);
      }
    } catch {
      setLoadError("Could not delete plot");
    } finally {
      setDeleting(false);
    }
  }, [pendingDelete, plots, selectedPlotId, searchParams, router, pathname]);

  return (
    <>
      <button
        type="button"
        className="flex items-center justify-between border-b bg-white px-4 py-3 md:hidden"
        onClick={() => setMobileOpen((v) => !v)}
        aria-expanded={mobileOpen}
        aria-controls="agri-sidebar"
      >
        <span className="text-lg font-semibold text-green-700">Agri-Lite</span>
        <span aria-hidden className="text-2xl leading-none">
          {mobileOpen ? "×" : "≡"}
        </span>
      </button>

      <aside
        id="agri-sidebar"
        className={`${
          mobileOpen ? "block" : "hidden"
        } w-full border-b bg-white md:block md:w-64 md:border-r md:border-b-0`}
      >
        <div className="flex h-full flex-col">
          <div className="hidden px-5 py-5 md:block">
            <Link
              href={buildHref(selectedPlotId ?? "")}
              className="text-xl font-semibold text-green-700"
            >
              Agri-Lite
            </Link>
          </div>

          <nav className="flex-1 overflow-y-auto px-3 py-2">
            <p className="px-2 pb-2 text-xs font-medium uppercase tracking-wide text-gray-500">
              Plots
            </p>

            {plots === null ? (
              <ul className="space-y-1">
                {[0, 1, 2].map((i) => (
                  <li
                    key={i}
                    className="h-9 animate-pulse rounded bg-gray-100"
                  />
                ))}
              </ul>
            ) : plots.length === 0 ? (
              <p className="px-2 py-2 text-sm text-gray-500">
                No plots yet. Create one to begin.
              </p>
            ) : (
              <ul className="space-y-1">
                {plots.map((plot) => {
                  const active = plot.id === selectedPlotId;
                  return (
                    <li key={plot.id} className="group relative">
                      <Link
                        href={buildHref(plot.id)}
                        onClick={() => setMobileOpen(false)}
                        className={`flex items-center justify-between rounded px-3 py-2 text-sm ${
                          active
                            ? "bg-green-50 text-green-800"
                            : "text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        <span className="truncate">{plot.name}</span>
                      </Link>
                      <button
                        type="button"
                        aria-label={`Delete ${plot.name}`}
                        onClick={(e) => {
                          e.preventDefault();
                          setPendingDelete(plot);
                        }}
                        className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-1 text-gray-400 opacity-0 transition hover:bg-red-50 hover:text-red-600 group-hover:opacity-100 focus:opacity-100"
                      >
                        <svg
                          aria-hidden
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M3 6h18" />
                          <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                        </svg>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}

            {loadError && (
              <p className="px-2 pt-2 text-xs text-red-600">{loadError}</p>
            )}
          </nav>

          <div className="border-t p-3">
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              className="w-full rounded-md bg-green-700 px-3 py-2 text-sm font-medium text-white hover:bg-green-800"
            >
              + New plot
            </button>
          </div>
        </div>
      </aside>

      {createOpen && (
        <CreatePlotModal
          onClose={() => setCreateOpen(false)}
          onCreated={handleCreated}
        />
      )}

      {pendingDelete && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-delete-title"
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4"
        >
          <div className="w-full max-w-sm rounded-lg bg-white p-5 shadow-lg">
            <h2
              id="confirm-delete-title"
              className="text-base font-semibold text-gray-900"
            >
              Delete this plot?
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Readings, thresholds and notes will be removed.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setPendingDelete(null)}
                disabled={deleting}
                className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
              >
                {deleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
