"use client";

import { useMemo, useState } from "react";
import { SortHeader } from "@/components/sort-header";
import { formatCurrency } from "@/lib/format";
import { compareNumber, compareText } from "@/lib/sort";
import type { StoredProjectBomLine } from "@/lib/types";

type ProjectTotal = {
  id: number;
  name: string;
  totalCost: number;
  buildQuantity: number;
  bomLines: StoredProjectBomLine[];
};

type ProjectTotalsSort = "name-asc" | "name-desc" | "cost-asc" | "cost-desc";

export function ProjectTotalsList({ projects }: { projects: ProjectTotal[] }) {
  const [sort, setSort] = useState<ProjectTotalsSort>("name-asc");

  const sortedProjects = useMemo(() => {
    return [...projects].sort((left, right) => {
      switch (sort) {
        case "name-desc":
          return compareText(left.name, right.name, "desc");
        case "cost-asc":
          return compareNumber(left.totalCost, right.totalCost, "asc");
        case "cost-desc":
          return compareNumber(left.totalCost, right.totalCost, "desc");
        case "name-asc":
        default:
          return compareText(left.name, right.name, "asc");
      }
    });
  }, [projects, sort]);

  return (
    <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50 text-left text-slate-500">
          <tr>
            <SortHeader label="Project" sortKey="name" activeSort={sort} onSort={setSort} />
            <SortHeader label="Cost" sortKey="cost" activeSort={sort} onSort={setSort} />
            <th className="px-4 py-3 font-medium">PCB Qty</th>
            <th className="px-4 py-3 font-medium">Saved BOM Parts</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {sortedProjects.length > 0 ? (
            sortedProjects.map((project) => (
              <tr key={project.id}>
                <td className="px-4 py-3 font-medium text-slate-900">{project.name}</td>
                <td className="px-4 py-3 text-slate-600">{formatCurrency(project.totalCost)}</td>
                <td className="px-4 py-3 text-slate-600">{project.buildQuantity}</td>
                <td className="px-4 py-3 text-slate-600">
                  {project.bomLines.length > 0 ? (
                    <div className="space-y-1">
                      {project.bomLines.map((line) => (
                        <div key={line.lcscId} className="text-xs">
                          <span className="font-medium text-slate-900">{line.lcscId}</span>
                          <span className="ml-2 text-slate-500">Qty {line.quantity}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="text-xs text-slate-500">No saved BOM lines yet.</span>
                  )}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td className="px-4 py-6 text-sm text-slate-500" colSpan={4}>
                No project totals saved yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
