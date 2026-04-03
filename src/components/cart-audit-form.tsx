"use client";

import { useActionState, useMemo, useState } from "react";
import { auditCartAction } from "@/app/actions";
import { ActionDebug } from "@/components/action-debug";
import { SortHeader } from "@/components/sort-header";
import { StatusBanner } from "@/components/status-banner";
import { SubmitButton } from "@/components/submit-button";
import { formatCurrency, formatInteger, formatPercent } from "@/lib/format";
import { compareNumber, compareText } from "@/lib/sort";
import { emptyAuditState } from "@/lib/types";

type CartAuditSort =
  | "lcsc-asc"
  | "lcsc-desc"
  | "quantity-asc"
  | "quantity-desc"
  | "stock-asc"
  | "stock-desc"
  | "cart-price-asc"
  | "cart-price-desc"
  | "delta-asc"
  | "delta-desc";

export function CartAuditForm() {
  const [state, formAction] = useActionState(auditCartAction, emptyAuditState);
  const [sort, setSort] = useState<CartAuditSort>("delta-desc");

  const sortedRows = useMemo(() => {
    const rows = state.data?.rows ?? [];

    return [...rows].sort((left, right) => {
      switch (sort) {
        case "lcsc-desc":
          return compareText(left.lcscId, right.lcscId, "desc");
        case "quantity-asc":
          return compareNumber(left.quantity, right.quantity, "asc");
        case "quantity-desc":
          return compareNumber(left.quantity, right.quantity, "desc");
        case "stock-asc":
          return compareNumber(left.stockLevel, right.stockLevel, "asc");
        case "stock-desc":
          return compareNumber(left.stockLevel, right.stockLevel, "desc");
        case "cart-price-asc":
          return compareNumber(left.cartUnitPrice, right.cartUnitPrice, "asc");
        case "cart-price-desc":
          return compareNumber(left.cartUnitPrice, right.cartUnitPrice, "desc");
        case "delta-asc":
          return compareNumber(left.deltaPercent, right.deltaPercent, "asc");
        case "delta-desc":
          return compareNumber(left.deltaPercent, right.deltaPercent, "desc");
        case "lcsc-asc":
        default:
          return compareText(left.lcscId, right.lcscId, "asc");
      }
    });
  }, [sort, state.data?.rows]);

  return (
    <div className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div>
        <h2 className="text-xl font-semibold text-slate-950">Shopping Cart Auditor</h2>
        <p className="mt-2 text-sm text-slate-600">
          Upload your cart CSV before buying. The app compares live cart pricing against your last
          paid price and warns when drawer stock is already high.
        </p>
      </div>

      <form action={formAction} className="space-y-4">
        <label className="block space-y-2 text-sm font-medium text-slate-700">
          <span>Cart CSV</span>
          <input
            type="file"
            name="cartFile"
            accept=".csv,text/csv"
            className="block w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700"
          />
        </label>

        <SubmitButton idleLabel="Audit Cart" pendingLabel="Auditing..." />
      </form>

      <StatusBanner status={state.status} message={state.message} />

      {state.data ? (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-4">
            <MetricCard label="Cart rows" value={formatInteger(state.data.summary.totalRows)} />
            <MetricCard label="Unknown parts" value={formatInteger(state.data.summary.unknownParts)} />
            <MetricCard
              label="Stock > 100"
              value={formatInteger(state.data.summary.overstockedParts)}
            />
            <MetricCard
              label="Price increases"
              value={formatInteger(state.data.summary.priceIncreases)}
            />
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-slate-500">
                <tr>
                  <SortHeader label="LCSC ID" sortKey="lcsc" activeSort={sort} onSort={setSort} />
                  <SortHeader label="Qty" sortKey="quantity" activeSort={sort} onSort={setSort} />
                  <SortHeader label="Stock" sortKey="stock" activeSort={sort} onSort={setSort} />
                  <SortHeader
                    label="Cart Unit $"
                    sortKey="cart-price"
                    activeSort={sort}
                    onSort={setSort}
                  />
                  <th className="px-4 py-3 font-medium">Last Paid $</th>
                  <SortHeader label="Delta" sortKey="delta" activeSort={sort} onSort={setSort} />
                  <th className="px-4 py-3 font-medium">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {sortedRows.map((row) => (
                  <tr key={`${row.lcscId}-${row.cartUnitPrice}-${row.quantity}`}>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">{row.lcscId}</div>
                      <div className="text-xs text-slate-500">
                        {row.mpn ?? row.description ?? "—"}
                        {row.packageName ? ` · ${row.packageName}` : ""}
                        {row.storageLocation ? ` · ${row.storageLocation}` : ""}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{formatInteger(row.quantity)}</td>
                    <td
                      className={`px-4 py-3 ${
                        (row.stockLevel ?? 0) > 100 ? "bg-rose-50 font-medium text-rose-700" : "text-slate-600"
                      }`}
                    >
                      {formatInteger(row.stockLevel)}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {formatCurrency(row.cartUnitPrice)}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{formatCurrency(row.latestPrice)}</td>
                    <td
                      className={`px-4 py-3 ${
                        (row.deltaPercent ?? 0) > 0
                          ? "font-medium text-rose-700"
                          : "text-slate-600"
                      }`}
                    >
                      {formatPercent(row.deltaPercent)}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {row.notes.length > 0 ? row.notes.join(", ") : "OK"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      <ActionDebug debug={state.debug} />
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-950">{value}</p>
    </div>
  );
}
