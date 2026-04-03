"use client";

import { useActionState, useMemo, useState } from "react";
import { analyzeBomAction, commitBomAction, recalculateBomAction } from "@/app/actions";
import { ActionDebug } from "@/components/action-debug";
import { SortHeader } from "@/components/sort-header";
import { StatusBanner } from "@/components/status-banner";
import { SubmitButton } from "@/components/submit-button";
import { formatCurrency, formatInteger } from "@/lib/format";
import { compareNumber, compareText } from "@/lib/sort";
import { emptyBomState, type BomDraftItem } from "@/lib/types";

type ProjectOption = {
  id: number;
  name: string;
  buildQuantity: number;
};

type BomSort =
  | "lcsc-asc"
  | "lcsc-desc"
  | "quantity-asc"
  | "quantity-desc"
  | "stock-asc"
  | "stock-desc"
  | "price-asc"
  | "price-desc"
  | "line-total-asc"
  | "line-total-desc"
  | "shortfall-asc"
  | "shortfall-desc";

type BomDraftRow = {
  id: string;
  lcscId: string;
  quantity: string;
};

function toDraftRows(items: BomDraftItem[]) {
  return items.map((item, index) => ({
    id: `${item.lcscId}-${index}`,
    lcscId: item.lcscId,
    quantity: String(item.quantity),
  }));
}

export function ProjectBomForm({ projects }: { projects: ProjectOption[] }) {
  const [analysisState, analyzeAction] = useActionState(analyzeBomAction, emptyBomState);
  const [recalculationState, recalculateAction] = useActionState(recalculateBomAction, emptyBomState);
  const [commitState, commitAction] = useActionState(commitBomAction, emptyBomState);
  const [sort, setSort] = useState<BomSort>("shortfall-desc");
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [projectName, setProjectName] = useState("");
  const [pcbCount, setPcbCount] = useState("1");

  const displayedData = commitState.data ?? recalculationState.data ?? analysisState.data;

  const sortedLines = useMemo(() => {
    const lines = displayedData?.lines ?? [];

    return [...lines].sort((left, right) => {
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
        case "price-asc":
          return compareNumber(left.unitPrice, right.unitPrice, "asc");
        case "price-desc":
          return compareNumber(left.unitPrice, right.unitPrice, "desc");
        case "line-total-asc":
          return compareNumber(left.lineTotal, right.lineTotal, "asc");
        case "line-total-desc":
          return compareNumber(left.lineTotal, right.lineTotal, "desc");
        case "shortfall-asc":
          return compareNumber(left.shortfall, right.shortfall, "asc");
        case "shortfall-desc":
          return compareNumber(left.shortfall, right.shortfall, "desc");
        case "lcsc-asc":
        default:
          return compareText(left.lcscId, right.lcscId, "asc");
      }
    });
  }, [displayedData?.lines, sort]);

  return (
    <div className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div>
        <h2 className="text-xl font-semibold text-slate-950">BOM Cost Calculator & Deductor</h2>
        <p className="mt-2 text-sm text-slate-600">
          Upload a BOM, run a pre-flight cost and stock check, then commit the deduction into
          inventory. Negative stock is allowed.
        </p>
        <p className="mt-2 text-sm text-slate-500">
          Tip: choose an existing project and click Analyze BOM to load its saved BOM without
          uploading the CSV again, then adjust the PCB quantity to scale part usage.
        </p>
      </div>

      <form action={analyzeAction} className="grid gap-4 lg:grid-cols-[1fr_1fr_auto] lg:items-end">
        <label className="block space-y-2 text-sm font-medium text-slate-700">
          <span>Existing project</span>
          <select
            name="projectId"
            value={selectedProjectId}
            onChange={(event) => {
              const nextProjectId = event.target.value;
              const selectedProject = projects.find((project) => String(project.id) === nextProjectId);

              setSelectedProjectId(nextProjectId);
              setPcbCount(String(selectedProject?.buildQuantity ?? 1));
            }}
            className="block w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700"
          >
            <option value="">Create/use by name below</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </label>

        <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_10rem]">
          <label className="block space-y-2 text-sm font-medium text-slate-700">
            <span>New project name</span>
            <input
              type="text"
              name="projectName"
              value={projectName}
              onChange={(event) => setProjectName(event.target.value)}
              placeholder="esp32-controller-rev-a"
              className="block w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700"
            />
          </label>
          <label className="block space-y-2 text-sm font-medium text-slate-700">
            <span>PCB Quantity</span>
            <input
              type="number"
              name="pcbCount"
              min="1"
              step="1"
              value={pcbCount}
              onChange={(event) => setPcbCount(event.target.value)}
              className="block w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700"
            />
          </label>
          <label className="block space-y-2 text-sm font-medium text-slate-700">
            <span>BOM CSV</span>
            <input
              type="file"
              name="bomFile"
              accept=".csv,text/csv"
              className="block w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700"
            />
          </label>
        </div>

        <SubmitButton idleLabel="Analyze BOM" pendingLabel="Analyzing..." />
      </form>

      <StatusBanner status={analysisState.status} message={analysisState.message} />
      <StatusBanner status={recalculationState.status} message={recalculationState.message} />
      <StatusBanner status={commitState.status} message={commitState.message} />

      {displayedData ? (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Stock</p>
              <p className="mt-2 text-xl font-semibold text-slate-950">
                {displayedData.readyToBuild
                  ? "Ready to build"
                  : `Short ${formatInteger(displayedData.shortages.length)} line item(s)`}
              </p>
              {!displayedData.readyToBuild ? (
                <p className="mt-2 text-sm text-slate-600">
                  {displayedData.shortages.join(", ")}
                </p>
              ) : null}
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Budget</p>
              <p className="mt-2 text-xl font-semibold text-slate-950">
                {formatCurrency(displayedData.totalCost)}
              </p>
              <p className="mt-2 text-sm text-slate-600">
                Project: {displayedData.projectName ?? "Unnamed project"}
              </p>
              <p className="mt-1 text-sm text-slate-600">
                PCB Quantity: {formatInteger(displayedData.pcbCount)}
              </p>
            </div>
          </div>
          <EditableBomSection
            key={`${displayedData.projectId ?? "new"}:${displayedData.projectName ?? ""}:${displayedData.pcbCount}:${JSON.stringify(
              displayedData.draftItems,
            )}`}
            projectId={displayedData.projectId}
            projectName={displayedData.projectName}
            initialItems={displayedData.draftItems}
            initialPcbCount={displayedData.pcbCount}
            recalculateAction={recalculateAction}
            commitAction={commitAction}
          />

          <div className="overflow-hidden rounded-2xl border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-slate-500">
                <tr>
                  <SortHeader label="Part" sortKey="lcsc" activeSort={sort} onSort={setSort} />
                  <SortHeader label="Qty" sortKey="quantity" activeSort={sort} onSort={setSort} />
                  <SortHeader label="Stock" sortKey="stock" activeSort={sort} onSort={setSort} />
                  <SortHeader label="Last Price" sortKey="price" activeSort={sort} onSort={setSort} />
                  <SortHeader
                    label="Line Total"
                    sortKey="line-total"
                    activeSort={sort}
                    onSort={setSort}
                  />
                  <SortHeader
                    label="Shortfall"
                    sortKey="shortfall"
                    activeSort={sort}
                    onSort={setSort}
                  />
                  <th className="px-4 py-3 font-medium">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {sortedLines.map((line) => (
                  <tr key={line.lcscId}>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">{line.lcscId}</div>
                      <div className="text-xs text-slate-500">
                        {line.mpn ?? line.description ?? "—"}
                        {line.packageName ? ` · ${line.packageName}` : ""}
                        {line.storageLocation ? ` · ${line.storageLocation}` : ""}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{formatInteger(line.quantity)}</td>
                    <td className="px-4 py-3 text-slate-600">{formatInteger(line.stockLevel)}</td>
                    <td className="px-4 py-3 text-slate-600">{formatCurrency(line.unitPrice)}</td>
                    <td className="px-4 py-3 text-slate-600">{formatCurrency(line.lineTotal)}</td>
                    <td
                      className={`px-4 py-3 ${
                        line.shortfall > 0 ? "font-medium text-rose-700" : "text-slate-600"
                      }`}
                    >
                      {formatInteger(line.shortfall)}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {line.notes.length > 0 ? line.notes.join(", ") : "OK"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      <ActionDebug debug={analysisState.debug} />
      <ActionDebug debug={recalculationState.debug} />
      <ActionDebug debug={commitState.debug} />
    </div>
  );
}

function EditableBomSection({
  projectId,
  projectName,
  initialItems,
  initialPcbCount,
  recalculateAction,
  commitAction,
}: {
  projectId: number | null;
  projectName: string | null;
  initialItems: BomDraftItem[];
  initialPcbCount: number;
  recalculateAction: (payload: FormData) => void;
  commitAction: (payload: FormData) => void;
}) {
  const [draftRows, setDraftRows] = useState<BomDraftRow[]>(() => toDraftRows(initialItems));
  const [draftProjectName, setDraftProjectName] = useState(projectName ?? "");
  const [draftPcbCount, setDraftPcbCount] = useState(String(initialPcbCount));
  const draftItemsJson = JSON.stringify(
    draftRows.map((row) => ({
      lcscId: row.lcscId,
      quantity: row.quantity,
    })),
  );

  return (
    <>
      <form action={recalculateAction} className="space-y-4 rounded-2xl border border-slate-200 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-slate-950">Manual BOM Editor</h3>
            <p className="mt-1 text-sm text-slate-600">
              Edit per-PCB BOM quantities, change part IDs, remove rows, or add new parts.
              Recalculate to refresh total usage, stock, pricing, and shortages.
            </p>
          </div>
          <button
            type="button"
            onClick={() =>
              setDraftRows((current) => [
                ...current,
                {
                  id: `new-${current.length}-${Date.now()}`,
                  lcscId: "",
                  quantity: "1",
                },
              ])
            }
            className="inline-flex items-center justify-center rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:text-slate-950"
          >
            Add Part
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block space-y-2 text-sm font-medium text-slate-700">
            <span>Project Name</span>
            <input
              type="text"
              value={draftProjectName}
              onChange={(event) => setDraftProjectName(event.target.value)}
              placeholder="esp32-controller-rev-a"
              className="block w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700"
            />
          </label>
          <label className="block space-y-2 text-sm font-medium text-slate-700">
            <span>PCB Quantity</span>
            <input
              type="number"
              min="1"
              step="1"
              value={draftPcbCount}
              onChange={(event) => setDraftPcbCount(event.target.value)}
              className="block w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700"
            />
          </label>
        </div>

        <input type="hidden" name="projectId" value={projectId ?? ""} />
        <input type="hidden" name="projectName" value={draftProjectName} />
        <input type="hidden" name="pcbCount" value={draftPcbCount} />
        <input type="hidden" name="itemsJson" value={draftItemsJson} />

        <div className="overflow-hidden rounded-2xl border border-slate-200">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Part</th>
                <th className="px-4 py-3 font-medium">Qty</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {draftRows.map((row) => (
                <tr key={row.id}>
                  <td className="px-4 py-3">
                    <input
                      type="text"
                      value={row.lcscId}
                      onChange={(event) =>
                        setDraftRows((current) =>
                          current.map((entry) =>
                            entry.id === row.id ? { ...entry, lcscId: event.target.value } : entry,
                          ),
                        )
                      }
                      placeholder="C123456"
                      className="block w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={row.quantity}
                      onChange={(event) =>
                        setDraftRows((current) =>
                          current.map((entry) =>
                            entry.id === row.id ? { ...entry, quantity: event.target.value } : entry,
                          ),
                        )
                      }
                      className="block w-28 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() =>
                        setDraftRows((current) => current.filter((entry) => entry.id !== row.id))
                      }
                      className="text-sm font-medium text-rose-700 transition hover:text-rose-900"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
              {draftRows.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-slate-500" colSpan={3}>
                    No BOM rows left. Add at least one part before recalculating or committing.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <SubmitButton idleLabel="Recalculate Edited BOM" pendingLabel="Recalculating..." />
          <p className="text-sm text-slate-500">
            Debug tip: if totals look wrong, verify the per-PCB BOM quantities and PCB quantity,
            then recalculate before committing.
          </p>
        </div>
      </form>

      <form action={commitAction} className="flex flex-wrap items-center gap-3">
        <input type="hidden" name="projectId" value={projectId ?? ""} />
        <input type="hidden" name="projectName" value={draftProjectName} />
        <input type="hidden" name="pcbCount" value={draftPcbCount} />
        <input type="hidden" name="itemsJson" value={draftItemsJson} />
        <SubmitButton idleLabel="Commit BOM" pendingLabel="Committing..." />
        <p className="text-sm text-slate-500">
          Commit subtracts stock using BOM quantity x PCB quantity and keeps the project&apos;s saved
          stock snapshot in sync for future edits or deletion.
        </p>
      </form>
    </>
  );
}
