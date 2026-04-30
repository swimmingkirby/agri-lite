"use client";

export type TimeRange = "1h" | "24h" | "7d";

const OPTIONS: { value: TimeRange; label: string }[] = [
  { value: "1h", label: "1 hour" },
  { value: "24h", label: "24 hours" },
  { value: "7d", label: "7 days" },
];

type Props = {
  value: TimeRange;
  onChange: (value: TimeRange) => void;
};

export default function TimeRangeSelector({ value, onChange }: Props) {
  return (
    <div className="inline-flex rounded-md border border-gray-200 bg-white p-1">
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`rounded px-3 py-1 text-sm font-medium transition-colors ${
            value === opt.value
              ? "bg-green-700 text-white"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export function rangeToSinceMs(range: TimeRange): number {
  switch (range) {
    case "1h":
      return 60 * 60 * 1000;
    case "24h":
      return 24 * 60 * 60 * 1000;
    case "7d":
      return 7 * 24 * 60 * 60 * 1000;
  }
}

export function rangeToLimit(range: TimeRange): number {
  switch (range) {
    case "1h":
      return 120;
    case "24h":
      return 1500;
    case "7d":
      return 10000;
  }
}
