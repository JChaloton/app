export type SortDirection = "asc" | "desc";

function isMissing(value: number | string | null | undefined) {
  return value == null || value === "";
}

export function compareText(
  left: string | null | undefined,
  right: string | null | undefined,
  direction: SortDirection,
) {
  if (isMissing(left) && isMissing(right)) {
    return 0;
  }

  if (isMissing(left)) {
    return 1;
  }

  if (isMissing(right)) {
    return -1;
  }

  const comparison = left.localeCompare(right, undefined, { sensitivity: "base" });
  return direction === "asc" ? comparison : -comparison;
}

export function compareNumber(
  left: number | null | undefined,
  right: number | null | undefined,
  direction: SortDirection,
) {
  const leftMissing = left == null || Number.isNaN(left);
  const rightMissing = right == null || Number.isNaN(right);

  if (leftMissing && rightMissing) {
    return 0;
  }

  if (leftMissing) {
    return 1;
  }

  if (rightMissing) {
    return -1;
  }

  const comparison = left - right;
  return direction === "asc" ? comparison : -comparison;
}

export function compareDate(
  left: string | null | undefined,
  right: string | null | undefined,
  direction: SortDirection,
) {
  const leftTime = left ? Date.parse(left) : null;
  const rightTime = right ? Date.parse(right) : null;
  return compareNumber(leftTime, rightTime, direction);
}
