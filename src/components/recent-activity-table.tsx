"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { SortHeader } from "@/components/sort-header";
import { formatCurrency, formatDate } from "@/lib/format";
import { compareDate, compareNumber, compareText } from "@/lib/sort";

type RecentActivityRow = {
  id: number;
  partId: string;
  partLabel: string | null;
  pricePaid: number;
  orderDate: string;
  sourceFile: string;
};

type RecentActivitySort =
  | "date-desc"
  | "date-asc"
  | "part-asc"
  | "part-desc"
  | "price-asc"
  | "price-desc"
  | "source-asc"
  | "source-desc";

export function RecentActivityTable({ entries }: { entries: RecentActivityRow[] }) {
  const [sort, setSort] = useState<RecentActivitySort>("date-desc");

  const sortedEntries = useMemo(() => {
    return [...entries].sort((left, right) => {
      switch (sort) {
        case "date-asc":
          return compareDate(left.orderDate, right.orderDate, "asc");
        case "part-asc":
          return compareText(left.partId, right.partId, "asc");
        case "part-desc":
          return compareText(left.partId, right.partId, "desc");
        case "price-asc":
          return compareNumber(left.pricePaid, right.pricePaid, "asc");
        case "price-desc":
          return compareNumber(left.pricePaid, right.pricePaid, "desc");
        case "source-asc":
          return compareText(left.sourceFile, right.sourceFile, "asc");
        case "source-desc":
          return compareText(left.sourceFile, right.sourceFile, "desc");
        case "date-desc":
        default:
          return compareDate(left.orderDate, right.orderDate, "desc");
      }
    });
  }, [entries, sort]);

  return (
    <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50 text-left text-slate-500">
          <tr>
            <SortHeader label="Part" sortKey="part" activeSort={sort} onSort={setSort} />
            <SortHeader label="Price" sortKey="price" activeSort={sort} onSort={setSort} />
            <SortHeader label="Date" sortKey="date" activeSort={sort} onSort={setSort} />
            <SortHeader label="Source" sortKey="source" activeSort={sort} onSort={setSort} />
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {sortedEntries.length > 0 ? (
            sortedEntries.map((entry) => (
              <tr key={entry.id}>
                <td className="px-4 py-3">
                  <Link href={`/parts/${entry.partId}`} className="font-medium text-slate-900">
                    {entry.partId}
                  </Link>
                  <div className="text-xs text-slate-500">{entry.partLabel ?? "—"}</div>
                </td>
                <td className="px-4 py-3 text-slate-600">{formatCurrency(entry.pricePaid)}</td>
                <td className="px-4 py-3 text-slate-600">{formatDate(entry.orderDate)}</td>
                <td className="px-4 py-3 text-slate-600">{entry.sourceFile}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td className="px-4 py-6 text-slate-500" colSpan={4}>
                No imports yet. Start with the order importer to create your first stock and price
                history entries.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
