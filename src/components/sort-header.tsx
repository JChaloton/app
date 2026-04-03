"use client";

type SortHeaderProps<TSort extends string> = {
  label: string;
  sortKey: string;
  activeSort: TSort;
  onSort: (nextSort: TSort) => void;
  className?: string;
};

function getDirection(activeSort: string, sortKey: string) {
  if (activeSort === `${sortKey}-asc`) {
    return "asc";
  }

  if (activeSort === `${sortKey}-desc`) {
    return "desc";
  }

  return null;
}

export function SortHeader<TSort extends string>({
  label,
  sortKey,
  activeSort,
  onSort,
  className = "px-4 py-3 font-medium",
}: SortHeaderProps<TSort>) {
  const direction = getDirection(activeSort, sortKey);
  const indicator = direction === "asc" ? "^" : direction === "desc" ? "v" : "<>";
  const ariaSort =
    direction === "asc" ? "ascending" : direction === "desc" ? "descending" : "none";

  return (
    <th aria-sort={ariaSort} className={className}>
      <button
        type="button"
        onClick={() =>
          onSort(
            direction === "asc"
              ? (`${sortKey}-desc` as TSort)
              : (`${sortKey}-asc` as TSort),
          )
        }
        className="inline-flex items-center gap-2 text-left transition hover:text-slate-900"
      >
        <span>{label}</span>
        <span className="font-mono text-xs text-slate-400">{indicator}</span>
      </button>
    </th>
  );
}
