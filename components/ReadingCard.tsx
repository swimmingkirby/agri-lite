"use client";

import { Line, LineChart, ResponsiveContainer } from "recharts";
import ChartFrame from "./ChartFrame";
import type { Parameter, Reading, Threshold } from "@/lib/types";
import {
  PARAMETER_LABELS,
  PARAMETER_UNITS,
  formatRelative,
  formatValue,
} from "@/lib/format";
import {
  STATUS_BADGE,
  STATUS_LABEL,
  computeStatus,
} from "@/lib/threshold";

const STROKE: Record<Parameter, string> = {
  moisture: "#0284c7",
  temperature: "#dc2626",
  light: "#ca8a04",
};

type Props = {
  parameter: Parameter;
  readings: Reading[];
  threshold: Threshold | null;
};

export default function ReadingCard({ parameter, readings, threshold }: Props) {
  const latest = readings[0];
  const value = latest ? Number(latest[parameter]) : null;
  const status = computeStatus(value, threshold);

  const sparkData = [...readings]
    .reverse()
    .map((r) => ({ v: Number(r[parameter]) }));

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">
            {PARAMETER_LABELS[parameter]} ({PARAMETER_UNITS[parameter]})
          </p>
          <p className="mt-1 text-3xl font-semibold text-gray-900 tabular-nums">
            {value != null ? formatValue(value, parameter) : "—"}
          </p>
        </div>
        <span
          className={`rounded-full px-2 py-1 text-xs font-medium ${STATUS_BADGE[status]}`}
        >
          {STATUS_LABEL[status]}
        </span>
      </div>

      <ChartFrame className="mt-3 h-10 w-full">
        {sparkData.length > 1 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={sparkData}
              margin={{ top: 2, right: 2, bottom: 2, left: 2 }}
            >
              <Line
                type="monotone"
                dataKey="v"
                stroke={STROKE[parameter]}
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : null}
      </ChartFrame>

      <p className="mt-2 text-xs text-gray-500">
        {latest
          ? `Last updated ${formatRelative(latest.recorded_at)}`
          : "Awaiting first reading"}
      </p>
    </div>
  );
}
