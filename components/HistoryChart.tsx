"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import ChartFrame from "./ChartFrame";
import type { Note, Parameter, Reading } from "@/lib/types";
import {
  PARAMETER_LABELS,
  PARAMETER_UNITS,
  formatLocalDateTime,
  formatLocalTime,
  formatValue,
} from "@/lib/format";

const STROKE: Record<Parameter, string> = {
  moisture: "#0284c7",
  temperature: "#dc2626",
  light: "#ca8a04",
};

type Props = {
  parameter: Parameter;
  readings: Reading[];
  notes: Note[];
  rangeMs: number;
};

type Point = { t: number; v: number };

export default function HistoryChart({
  parameter,
  readings,
  notes,
  rangeMs,
}: Props) {
  const data: Point[] = [...readings]
    .sort(
      (a, b) =>
        new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime(),
    )
    .map((r) => ({
      t: new Date(r.recorded_at).getTime(),
      v: Number(r[parameter]),
    }));

  const tickFormatter = (ms: number) =>
    rangeMs <= 60 * 60 * 1000
      ? formatLocalTime(new Date(ms).toISOString())
      : formatLocalDateTime(new Date(ms).toISOString());

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-baseline justify-between">
        <h3 className="text-sm font-semibold text-gray-900">
          {PARAMETER_LABELS[parameter]} ({PARAMETER_UNITS[parameter]})
        </h3>
        <span className="text-xs text-gray-500">{data.length} points</span>
      </div>
      {data.length < 2 ? (
        <div className="flex h-56 items-center justify-center text-sm text-gray-500">
          Not enough data yet for this range.
        </div>
      ) : (
        <ChartFrame className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{ top: 8, right: 16, bottom: 8, left: 8 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="t"
                type="number"
                domain={["dataMin", "dataMax"]}
                tickFormatter={tickFormatter}
                stroke="#9ca3af"
                fontSize={11}
                minTickGap={40}
              />
              <YAxis
                stroke="#9ca3af"
                fontSize={11}
                width={50}
                tickFormatter={(v) => `${v}`}
              />
              <Tooltip
                contentStyle={{
                  fontSize: 12,
                  borderRadius: 6,
                  border: "1px solid #e5e7eb",
                }}
                labelFormatter={(label) =>
                  formatLocalDateTime(new Date(label as number).toISOString())
                }
                formatter={(value) => [
                  formatValue(Number(value), parameter),
                  PARAMETER_LABELS[parameter],
                ]}
              />
              <Line
                type="monotone"
                dataKey="v"
                stroke={STROKE[parameter]}
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
              {[...notes]
                .sort(
                  (a, b) =>
                    new Date(a.recorded_at).getTime() -
                    new Date(b.recorded_at).getTime(),
                )
                .map((note, idx) => (
                  <ReferenceLine
                    key={note.id}
                    x={new Date(note.recorded_at).getTime()}
                    stroke="#6b7280"
                    strokeDasharray="2 2"
                    label={{
                      value: String(idx + 1),
                      position: "insideTop",
                      fill: "#374151",
                      fontSize: 11,
                      fontWeight: 600,
                    }}
                  />
                ))}
            </LineChart>
          </ResponsiveContainer>
        </ChartFrame>
      )}
    </div>
  );
}
