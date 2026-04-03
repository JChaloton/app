"use client";

import { useMemo, useState } from "react";
import { SortHeader } from "@/components/sort-header";
import { formatDate, formatInteger } from "@/lib/format";
import { compareDate, compareNumber, compareText } from "@/lib/sort";

type StockMovementRow = {
  id: number;
  createdAt: string;
  quantityDelta: number;
  note: string | null;
};

type StockMovementSort =
  | "date-desc"
  | "date-asc"
  | "delta-asc"
  | "delta-desc"
  | "note-asc"
  | "note-desc";

export function StockMovementTable({ entries }: { entries: StockMovementRow[] }) {
  const [sort, setSort] = useState<StockMovementSort>("date-desc");
  const handleSort = (nextSort: string) => setSort(nextSort as StockMovementSort);

  const sortedEntries = useMemo(() => {
    return [...entries].sort((left, right) => {
      switch (sort) {
        case "date-asc":
          return compareDate(left.createdAt, right.createdAt, "asc");
        case "delta-asc":
          return compareNumber(left.quantityDelta, right.quantityDelta, "asc");
        case "delta-desc":
          return compareNumber(left.quantityDelta, right.quantityDelta, "desc");
        case "note-asc":
          return compareText(left.note, right.note, "asc");
        case "note-desc":
          return compareText(left.note, right.note, "desc");
        case "date-desc":
        default:
          return compareDate(left.createdAt, right.createdAt, "desc");
      }
    });
  }, [entries, sort]);

  return (
    <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50 text-left text-slate-500">
          <tr>
            <SortHeader label="Timestamp" sortKey="date" activeSort={sort} onSort={handleSort} />
            <SortHeader label="Delta" sortKey="delta" activeSort={sort} onSort={handleSort} />
            <SortHeader label="Note" sortKey="note" activeSort={sort} onSort={handleSort} />
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {sortedEntries.length > 0 ? (
            sortedEntries.map((entry) => (
              <tr key={entry.id}>
                <td className="px-4 py-3 text-slate-600">{formatDate(entry.createdAt)}</td>
                <td
                  className={`px-4 py-3 font-medium ${
                    entry.quantityDelta >= 0 ? "text-emerald-700" : "text-rose-700"
                  }`}
                >
                  {entry.quantityDelta > 0 ? "+" : ""}
                  {formatInteger(entry.quantityDelta)}
                </td>
                <td className="px-4 py-3 text-slate-600">{entry.note ?? "—"}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td className="px-4 py-6 text-slate-500" colSpan={3}>
                No stock movements for this part yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
