"use client";

import { useEffect, useState } from "react";
import type { Note } from "@/lib/types";
import { formatRelative } from "@/lib/format";

type Props = {
  plotId: string;
};

export default function NotesPanel({ plotId }: Props) {
  const [notes, setNotes] = useState<Note[] | null>(null);
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setNotes(null);
    fetch(`/api/notes?plot_id=${plotId}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("notes"))))
      .then((data: Note[]) => {
        if (!cancelled) setNotes(data);
      })
      .catch(() => {
        if (!cancelled) setError("Could not load notes.");
      });
    return () => {
      cancelled = true;
    };
  }, [plotId]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = body.trim();
    if (!trimmed) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plot_id: plotId, body: trimmed }),
      });
      if (!res.ok) throw new Error("Failed");
      const note: Note = await res.json();
      setNotes((prev) => (prev ? [note, ...prev] : [note]));
      setBody("");
    } catch {
      setError("Could not add note. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-900">Notes</h3>
      <form onSubmit={handleAdd} className="mt-3 space-y-2">
        <textarea
          value={body}
          maxLength={500}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Watered today, seedlings looking healthy…"
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-green-700 focus:outline-none focus:ring-1 focus:ring-green-700"
          rows={3}
        />
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">{body.length}/500</span>
          <button
            type="submit"
            disabled={submitting || !body.trim()}
            className="rounded-md bg-green-700 px-3 py-2 text-sm font-medium text-white hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "Adding…" : "Add note"}
          </button>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </form>

      <div className="mt-5">
        {notes === null ? (
          <p className="text-sm text-gray-500">Loading…</p>
        ) : notes.length === 0 ? (
          <p className="text-sm text-gray-500">
            No notes yet. Use the box above to log observations.
          </p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {notes.map((note) => (
              <li key={note.id} className="py-3">
                <p className="text-sm text-gray-800 whitespace-pre-wrap">
                  {note.body}
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  {formatRelative(note.recorded_at)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
