"use client";

import { useEffect, useState } from "react";
import type { Parameter, Threshold } from "@/lib/types";
import { PARAMETER_LABELS, PARAMETER_UNITS } from "@/lib/format";

type Props = {
  plotId: string;
  parameter: Parameter;
  initial: Threshold | null;
  onSaved: (next: Threshold) => void;
};

function toInput(value: number | null): string {
  return value == null ? "" : String(value);
}

function fromInput(value: string): number | null {
  const trimmed = value.trim();
  if (trimmed === "") return null;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : NaN;
}

export default function ThresholdCard({
  plotId,
  parameter,
  initial,
  onSaved,
}: Props) {
  const [minStr, setMinStr] = useState(toInput(initial?.min_value ?? null));
  const [maxStr, setMaxStr] = useState(toInput(initial?.max_value ?? null));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  useEffect(() => {
    setMinStr(toInput(initial?.min_value ?? null));
    setMaxStr(toInput(initial?.max_value ?? null));
    setError(null);
  }, [initial]);

  const dirty =
    minStr !== toInput(initial?.min_value ?? null) ||
    maxStr !== toInput(initial?.max_value ?? null);

  const handleSave = async () => {
    const min = fromInput(minStr);
    const max = fromInput(maxStr);
    if (Number.isNaN(min) || Number.isNaN(max)) {
      setError("Please enter valid numbers.");
      return;
    }
    if (min != null && max != null && min > max) {
      setError("Min cannot be greater than max.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/thresholds", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plot_id: plotId,
          parameter,
          min_value: min,
          max_value: max,
        }),
      });
      if (!res.ok) {
        let serverMessage: string | null = null;
        try {
          const payload = (await res.json()) as { error?: string };
          if (payload && typeof payload.error === "string") {
            serverMessage = payload.error;
          }
        } catch {
          // Body wasn't JSON; fall through to generic message.
        }
        throw new Error(serverMessage ?? "Failed");
      }
      const data: Threshold = await res.json();
      onSaved(data);
      setSavedAt(Date.now());
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      setError(
        message && message !== "Failed"
          ? message
          : "Could not save. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-900">
        {PARAMETER_LABELS[parameter]} ({PARAMETER_UNITS[parameter]})
      </h3>
      <p className="mt-1 text-xs text-gray-500">
        Leave blank for no limit on either side.
      </p>
      <div className="mt-3 grid grid-cols-2 gap-3">
        <label className="block text-sm">
          <span className="text-gray-700">Min</span>
          <input
            type="number"
            inputMode="decimal"
            step="any"
            value={minStr}
            onChange={(e) => setMinStr(e.target.value)}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-green-700 focus:outline-none focus:ring-1 focus:ring-green-700"
          />
        </label>
        <label className="block text-sm">
          <span className="text-gray-700">Max</span>
          <input
            type="number"
            inputMode="decimal"
            step="any"
            value={maxStr}
            onChange={(e) => setMaxStr(e.target.value)}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-green-700 focus:outline-none focus:ring-1 focus:ring-green-700"
          />
        </label>
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      <div className="mt-3 flex items-center justify-between">
        <span className="text-xs text-gray-500">
          {savedAt && !dirty ? "Saved" : ""}
        </span>
        <button
          type="button"
          onClick={handleSave}
          disabled={!dirty || saving}
          className="rounded-md bg-green-700 px-3 py-2 text-sm font-medium text-white hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
    </div>
  );
}
