import type { BomDraftItem, StoredProjectBomLine } from "@/lib/types";

export function serializeProjectBomLines(lines: BomDraftItem[]) {
  return JSON.stringify(lines);
}

export function parseProjectBomLines(value: string | null): StoredProjectBomLine[] {
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.flatMap((entry) => {
      if (
        !entry ||
        typeof entry !== "object" ||
        typeof entry.lcscId !== "string" ||
        !Number.isInteger(entry.quantity) ||
        entry.quantity <= 0
      ) {
        return [];
      }

      return [
        {
          lcscId: entry.lcscId,
          quantity: entry.quantity,
          mpn: typeof entry.mpn === "string" ? entry.mpn : null,
          manufacturer: typeof entry.manufacturer === "string" ? entry.manufacturer : null,
          description: typeof entry.description === "string" ? entry.description : null,
        },
      ];
    });
  } catch (error) {
    console.error("Failed to parse stored project BOM lines", error);
    return [];
  }
}
