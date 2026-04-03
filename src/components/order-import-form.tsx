"use client";

import { useActionState, useMemo, useState } from "react";
import { importOrderAction } from "@/app/actions";
import { ActionDebug } from "@/components/action-debug";
import { SortHeader } from "@/components/sort-header";
import { StatusBanner } from "@/components/status-banner";
import { SubmitButton } from "@/components/submit-button";
import { formatCurrency, formatDate, formatInteger } from "@/lib/format";
import { compareDate, compareNumber, compareText } from "@/lib/sort";
import { emptyOrderImportState } from "@/lib/types";

type OrderImportSort =
  | "lcsc-asc"
  | "lcsc-desc"
  | "quantity-asc"
  | "quantity-desc"
  | "price-asc"
  | "price-desc"
  | "date-desc"
  | "date-asc";

export function OrderImportForm() {
  const [state, formAction] = useActionState(importOrderAction, emptyOrderImportState);
  const [sort, setSort] = useState<OrderImportSort>("date-desc");
  const isPreviewReady = state.data?.mode === "preview";
  const metricsLabel = isPreviewReady ? "Preview rows" : "Imported rows";

  const sortedLines = useMemo(() => {
    const lines = state.data?.lines ?? [];

    return [...lines].sort((left, right) => {
      switch (sort) {
        case "lcsc-desc":
          return compareText(left.lcscId, right.lcscId, "desc");
        case "quantity-asc":
          return compareNumber(left.quantity, right.quantity, "asc");
        case "quantity-desc":
          return compareNumber(left.quantity, right.quantity, "desc");
        case "price-asc":
          return compareNumber(left.unitPrice, right.unitPrice, "asc");
        case "price-desc":
          return compareNumber(left.unitPrice, right.unitPrice, "desc");
        case "date-asc":
          return compareDate(left.orderDate, right.orderDate, "asc");
        case "date-desc":
          return compareDate(left.orderDate, right.orderDate, "desc");
        case "lcsc-asc":
        default:
          return compareText(left.lcscId, right.lcscId, "asc");
      }
    });
  }, [sort, state.data?.lines]);

  return (
    <div className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div>
        <h2 className="text-xl font-semibold text-slate-950">LCSC Order Importer</h2>
        <p className="mt-2 text-sm text-slate-600">
          Upload a CSV with LCSC id, quantity, and unit price to preview the rows first. Stock is
          only updated after you confirm the import.
        </p>
      </div>

      <form action={formAction} className="space-y-4">
        <input type="hidden" name="intent" value="preview" />
        <label className="block space-y-2 text-sm font-medium text-slate-700">
          <span>Order CSV</span>
          <input
            type="file"
            name="orderFile"
            accept=".csv,text/csv"
            className="block w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700"
          />
        </label>

        <SubmitButton idleLabel="Preview Order" pendingLabel="Previewing..." />
      </form>

      <StatusBanner status={state.status} message={state.message} />

      {state.data ? (
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
            <p className="font-medium text-slate-900">Source file</p>
            <p className="mt-1 break-all">{state.data.sourceFile}</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm text-slate-500">{metricsLabel}</p>
              <p className="mt-2 text-2xl font-semibold text-slate-950">
                {formatInteger(state.data.importedRows)}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Touched parts</p>
              <p className="mt-2 text-2xl font-semibold text-slate-950">
                {formatInteger(state.data.touchedParts)}
              </p>
            </div>
          </div>

          {isPreviewReady ? (
            <form action={formAction} className="space-y-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <input type="hidden" name="intent" value="commit" />
              <input type="hidden" name="sourceFile" value={state.data.sourceFile} />
              <input type="hidden" name="linesJson" value={JSON.stringify(state.data.lines)} />
              <label className="flex items-start gap-3 text-sm text-amber-950">
                <input
                  type="checkbox"
                  name="confirmImport"
                  required
                  className="mt-1 h-4 w-4 rounded border-amber-300"
                />
                <span>I reviewed the preview above and want to import these stock movements.</span>
              </label>
              <SubmitButton idleLabel="Confirm Import" pendingLabel="Importing..." />
            </form>
          ) : null}

          <div className="overflow-hidden rounded-2xl border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-slate-500">
                <tr>
                  <SortHeader label="LCSC ID" sortKey="lcsc" activeSort={sort} onSort={setSort} />
                  <SortHeader label="Qty" sortKey="quantity" activeSort={sort} onSort={setSort} />
                  <SortHeader label="Unit Price" sortKey="price" activeSort={sort} onSort={setSort} />
                  <SortHeader label="Order Date" sortKey="date" activeSort={sort} onSort={setSort} />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {sortedLines.map((line) => (
                  <tr key={`${line.lcscId}-${line.orderDate}-${line.unitPrice}`}>
                    <td className="px-4 py-3 font-medium text-slate-900">{line.lcscId}</td>
                    <td className="px-4 py-3 text-slate-600">{formatInteger(line.quantity)}</td>
                    <td className="px-4 py-3 text-slate-600">{formatCurrency(line.unitPrice)}</td>
                    <td className="px-4 py-3 text-slate-600">{formatDate(line.orderDate)}</td>
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
