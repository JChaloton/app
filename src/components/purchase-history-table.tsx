"use client";

import { useMemo, useState } from "react";
import { SortHeader } from "@/components/sort-header";
import { formatCurrency, formatDate, formatInteger } from "@/lib/format";
import { compareDate, compareNumber, compareText } from "@/lib/sort";

type PurchaseHistoryRow = {
  id: number;
  orderDate: string;
  quantity: number | null;
  pricePaid: number;
  sourceFile: string;
};

type PurchaseHistorySort =
  | "date-desc"
  | "date-asc"
  | "quantity-asc"
  | "quantity-desc"
  | "price-asc"
  | "price-desc"
  | "source-asc"
  | "source-desc";

export function PurchaseHistoryTable({ entries }: { entries: PurchaseHistoryRow[] }) {
  const [sort, setSort] = useState<PurchaseHistorySort>("date-desc");

  const sortedEntries = useMemo(() => {
    return [...entries].sort((left, right) => {
      switch (sort) {
        case "date-asc":
          return compareDate(left.orderDate, right.orderDate, "asc");
        case "quantity-asc":
          return compareNumber(left.quantity, right.quantity, "asc");
        case "quantity-desc":
          return compareNumber(left.quantity, right.quantity, "desc");
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
    <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50 text-left text-slate-500">
          <tr>
            <SortHeader label="Order Date" sortKey="date" activeSort={sort} onSort={setSort} />
            <SortHeader label="Quantity" sortKey="quantity" activeSort={sort} onSort={setSort} />
            <SortHeader label="Price Paid" sortKey="price" activeSort={sort} onSort={setSort} />
            <SortHeader label="Source File" sortKey="source" activeSort={sort} onSort={setSort} />
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {sortedEntries.length > 0 ? (
            sortedEntries.map((entry) => (
              <tr key={entry.id}>
                <td className="px-4 py-3 text-slate-600">{formatDate(entry.orderDate)}</td>
                <td className="px-4 py-3 text-slate-600">
                  {entry.quantity === null ? "—" : formatInteger(entry.quantity)}
                </td>
                <td className="px-4 py-3 text-slate-600">{formatCurrency(entry.pricePaid)}</td>
                <td className="px-4 py-3 text-slate-600">{entry.sourceFile}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td className="px-4 py-6 text-slate-500" colSpan={4}>
                No purchase history for this part yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
