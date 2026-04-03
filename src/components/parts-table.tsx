"use client";

import Link from "next/link";
import { useActionState, useMemo, useState } from "react";
import { updatePartAction } from "@/app/actions";
import { Sparkline } from "@/components/sparkline";
import { StatusBanner } from "@/components/status-banner";
import { SubmitButton } from "@/components/submit-button";
import { SortHeader } from "@/components/sort-header";
import { formatCurrency, formatInteger } from "@/lib/format";
import { compareNumber, compareText } from "@/lib/sort";
import type { ActionState } from "@/lib/types";

type PartRow = {
  lcscId: string;
  mpn: string | null;
  manufacturer: string | null;
  description: string | null;
  packageName: string | null;
  storageLocation: string | null;
  stockLevel: number;
  priceHistory: Array<{
    pricePaid: number;
  }>;
};

type PartsSort =
  | "lcsc-asc"
  | "lcsc-desc"
  | "mpn-asc"
  | "mpn-desc"
  | "manufacturer-asc"
  | "manufacturer-desc"
  | "package-asc"
  | "package-desc"
  | "stock-asc"
  | "stock-desc"
  | "price-asc"
  | "price-desc";

export function PartsTable({ parts }: { parts: PartRow[] }) {
  const [sort, setSort] = useState<PartsSort>("lcsc-asc");
  const handleSort = (nextSort: string) => setSort(nextSort as PartsSort);

  const sortedParts = useMemo(() => {
    return [...parts].sort((left, right) => {
      switch (sort) {
        case "lcsc-desc":
          return compareText(left.lcscId, right.lcscId, "desc");
        case "mpn-asc":
          return compareText(left.mpn, right.mpn, "asc");
        case "mpn-desc":
          return compareText(left.mpn, right.mpn, "desc");
        case "manufacturer-asc":
          return compareText(left.manufacturer, right.manufacturer, "asc");
        case "manufacturer-desc":
          return compareText(left.manufacturer, right.manufacturer, "desc");
        case "package-asc":
          return compareText(left.packageName, right.packageName, "asc");
        case "package-desc":
          return compareText(left.packageName, right.packageName, "desc");
        case "stock-asc":
          return compareNumber(left.stockLevel, right.stockLevel, "asc");
        case "stock-desc":
          return compareNumber(left.stockLevel, right.stockLevel, "desc");
        case "price-asc":
          return compareNumber(left.priceHistory[0]?.pricePaid, right.priceHistory[0]?.pricePaid, "asc");
        case "price-desc":
          return compareNumber(
            left.priceHistory[0]?.pricePaid,
            right.priceHistory[0]?.pricePaid,
            "desc",
          );
        case "lcsc-asc":
        default:
          return compareText(left.lcscId, right.lcscId, "asc");
      }
    });
  }, [parts, sort]);

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50 text-left text-slate-500">
          <tr>
            <SortHeader label="LCSC ID" sortKey="lcsc" activeSort={sort} onSort={handleSort} />
            <SortHeader label="MPN" sortKey="mpn" activeSort={sort} onSort={handleSort} />
            <SortHeader
              label="Manufacturer"
              sortKey="manufacturer"
              activeSort={sort}
              onSort={handleSort}
            />
            <SortHeader label="Package" sortKey="package" activeSort={sort} onSort={handleSort} />
            <th className="px-4 py-3 font-medium">Location</th>
            <SortHeader label="Stock" sortKey="stock" activeSort={sort} onSort={handleSort} />
            <SortHeader label="Last Price" sortKey="price" activeSort={sort} onSort={handleSort} />
            <th className="px-4 py-3 font-medium">Trend</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {sortedParts.length > 0 ? (
            sortedParts.map((part) => <EditablePartRow key={part.lcscId} part={part} />)
          ) : (
            <tr>
              <td className="px-4 py-6 text-slate-500" colSpan={8}>
                No parts matched your search yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

const emptyPartEditState: ActionState<null> = {
  status: "idle",
  message: null,
  debug: null,
  data: null,
};

function EditablePartRow({ part }: { part: PartRow }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editState, editAction] = useActionState(updatePartAction, emptyPartEditState);

  return (
    <>
      <tr>
        <td className="px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <Link href={`/parts/${part.lcscId}`} className="font-medium text-slate-900">
                {part.lcscId}
              </Link>
              <div className="text-xs text-slate-500">{part.description ?? "—"}</div>
            </div>
            <button
              type="button"
              onClick={() => setIsEditing((current) => !current)}
              className="rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-700 transition hover:border-slate-300 hover:text-slate-950"
            >
              {isEditing ? "Close" : "Edit"}
            </button>
          </div>
        </td>
        <td className="px-4 py-3 text-slate-600">{part.mpn ?? "—"}</td>
        <td className="px-4 py-3 text-slate-600">{part.manufacturer ?? "—"}</td>
        <td className="px-4 py-3 text-slate-600">{part.packageName ?? "—"}</td>
        <td className="px-4 py-3 text-slate-600">{part.storageLocation ?? "—"}</td>
        <td className="px-4 py-3 text-slate-600">{formatInteger(part.stockLevel)}</td>
        <td className="px-4 py-3 text-slate-600">{formatCurrency(part.priceHistory[0]?.pricePaid)}</td>
        <td className="px-4 py-3 text-slate-600">
          <Sparkline values={part.priceHistory.map((entry) => entry.pricePaid)} />
        </td>
      </tr>
      {isEditing ? (
        <tr>
          <td className="bg-slate-50 px-4 py-4" colSpan={8}>
            <form action={editAction} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4">
              <input type="hidden" name="lcscId" value={part.lcscId} />
              <div className="grid gap-4 lg:grid-cols-2">
                <label className="block space-y-2 text-sm font-medium text-slate-700">
                  <span>MPN</span>
                  <input
                    type="text"
                    name="mpn"
                    defaultValue={part.mpn ?? ""}
                    className="block w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700"
                  />
                </label>
                <label className="block space-y-2 text-sm font-medium text-slate-700">
                  <span>Manufacturer</span>
                  <input
                    type="text"
                    name="manufacturer"
                    defaultValue={part.manufacturer ?? ""}
                    className="block w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700"
                  />
                </label>
                <label className="block space-y-2 text-sm font-medium text-slate-700 lg:col-span-2">
                  <span>Description</span>
                  <input
                    type="text"
                    name="description"
                    defaultValue={part.description ?? ""}
                    className="block w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700"
                  />
                </label>
                <label className="block space-y-2 text-sm font-medium text-slate-700">
                  <span>Package</span>
                  <input
                    type="text"
                    name="packageName"
                    defaultValue={part.packageName ?? ""}
                    placeholder="0402, 0603, SOT-23-6..."
                    className="block w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700"
                  />
                </label>
                <label className="block space-y-2 text-sm font-medium text-slate-700">
                  <span>Storage Location</span>
                  <input
                    type="text"
                    name="storageLocation"
                    defaultValue={part.storageLocation ?? ""}
                    placeholder="Drawer A1, shelf 2, bin TBD..."
                    className="block w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700"
                  />
                </label>
                <label className="block space-y-2 text-sm font-medium text-slate-700">
                  <span>Absolute Stock Level</span>
                  <input
                    type="number"
                    name="stockLevel"
                    defaultValue={part.stockLevel}
                    step="1"
                    className="block w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700"
                  />
                </label>
                <label className="block space-y-2 text-sm font-medium text-slate-700">
                  <span>Debug Note</span>
                  <input
                    type="text"
                    name="editNote"
                    placeholder="Adjusted after hand count"
                    className="block w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700"
                  />
                </label>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <SubmitButton idleLabel="Save Part" pendingLabel="Saving..." />
                <p className="text-sm text-slate-500">
                  Debug tip: stock here is the final absolute quantity, not a delta.
                </p>
              </div>
              <StatusBanner status={editState.status} message={editState.message} />
            </form>
          </td>
        </tr>
      ) : null}
    </>
  );
}
