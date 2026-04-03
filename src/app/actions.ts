"use server";

import { revalidatePath } from "next/cache";
import { parseAuditCsv, parseBomCsv, parseOrderCsv } from "@/lib/csv";
import { parseProjectBomLines, serializeProjectBomLines } from "@/lib/project-bom";
import { prisma } from "@/lib/prisma";
import type {
  ActionState,
  AuditData,
  BomData,
  BomDraftItem,
  BomLine,
  OrderImportData,
} from "@/lib/types";

async function readUploadedCsv(formData: FormData, fieldName: string) {
  const value = formData.get(fieldName);

  if (!(value instanceof File) || value.size === 0) {
    return {
      error: "Upload a CSV file first.",
      file: null,
      text: null,
    };
  }

  const text = await value.text();

  if (!text.trim()) {
    return {
      error: "The uploaded CSV file is empty.",
      file: null,
      text: null,
    };
  }

  return {
    error: null,
    file: value,
    text,
  };
}

function createState<TData>(
  status: ActionState<TData>["status"],
  message: string,
  data: TData | null,
  debug: ActionState<TData>["debug"] = null,
): ActionState<TData> {
  return {
    status,
    message,
    data,
    debug,
  };
}

function trimInput(value: FormDataEntryValue | null) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function parseProjectId(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || !value.trim()) {
    return null;
  }

  const parsed = Number(value);
  return Number.isInteger(parsed) ? parsed : null;
}

function parsePositiveInteger(value: FormDataEntryValue | null, fieldLabel: string, fallback = 1) {
  if (value === null) {
    return fallback;
  }

  if (typeof value !== "string" || !value.trim()) {
    return fallback;
  }

  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${fieldLabel} must be a positive whole number.`);
  }

  return parsed;
}

function parseInteger(value: FormDataEntryValue | null, fieldLabel: string, fallback = 0) {
  if (value === null) {
    return fallback;
  }

  if (typeof value !== "string" || !value.trim()) {
    return fallback;
  }

  const parsed = Number(value);

  if (!Number.isInteger(parsed)) {
    throw new Error(`${fieldLabel} must be a whole number.`);
  }

  return parsed;
}

function getPartMutationFields(input: {
  mpn: string | null;
  manufacturer: string | null;
  description: string | null;
  packageName?: string | null;
}) {
  return {
    ...(input.mpn ? { mpn: input.mpn } : {}),
    ...(input.manufacturer ? { manufacturer: input.manufacturer } : {}),
    ...(input.description ? { description: input.description } : {}),
    ...(input.packageName ? { packageName: input.packageName } : {}),
  };
}

async function resolveProjectSelection(projectId: number | null, projectName: string | null) {
  if (projectId) {
    return prisma.project.findUnique({
      where: { id: projectId },
    });
  }

  if (projectName) {
    return prisma.project.findUnique({
      where: { name: projectName },
    });
  }

  return null;
}

function normalizeBomDraftItems(items: BomDraftItem[]) {
  const merged = new Map<string, number>();

  for (const item of items) {
    const lcscId = item.lcscId.trim();
    const quantity = Number(item.quantity);

    if (!lcscId) {
      throw new Error("Each BOM row must include an LCSC part ID.");
    }

    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw new Error(`Quantity for ${lcscId} must be a positive whole number.`);
    }

    merged.set(lcscId, (merged.get(lcscId) ?? 0) + quantity);
  }

  return [...merged.entries()].map(([lcscId, quantity]) => ({
    lcscId,
    quantity,
  }));
}

function parseBomDraftItems(payload: FormDataEntryValue | null) {
  if (typeof payload !== "string" || !payload.trim()) {
    throw new Error("No BOM rows were provided.");
  }

  const parsed = JSON.parse(payload);

  if (!Array.isArray(parsed)) {
    throw new Error("BOM editor payload is not an array.");
  }

  return normalizeBomDraftItems(parsed as BomDraftItem[]);
}

async function buildBomData(
  items: BomDraftItem[],
  pcbCount: number,
  project: { id: number; name: string } | null,
  fallbackProjectName: string | null,
) {
  const normalizedItems = normalizeBomDraftItems(items);
  const scaledItems = normalizedItems.map((item) => ({
    lcscId: item.lcscId,
    quantity: item.quantity * pcbCount,
  }));
  const uniqueIds = [...new Set(normalizedItems.map((item) => item.lcscId))];
  const parts = await prisma.part.findMany({
    where: {
      lcscId: {
        in: uniqueIds,
      },
    },
    include: {
      priceHistory: {
        orderBy: [{ orderDate: "desc" }, { id: "desc" }],
        take: 1,
      },
    },
  });

  const partsById = new Map(parts.map((part) => [part.lcscId, part]));
  const lines: BomLine[] = scaledItems.map((item) => {
    const part = partsById.get(item.lcscId);
    const latestPrice = part?.priceHistory[0]?.pricePaid ?? null;
    const stockLevel = part?.stockLevel ?? 0;
    const shortfall = Math.max(0, item.quantity - stockLevel);
    const notes: string[] = [];

    if (!part) {
      notes.push("Part not found in inventory");
    }

    if (part && latestPrice === null) {
      notes.push("No price history");
    }

    return {
      lcscId: item.lcscId,
      quantity: item.quantity,
      stockLevel,
      unitPrice: latestPrice,
      lineTotal: item.quantity * (latestPrice ?? 0),
      shortfall,
      mpn: part?.mpn ?? null,
      manufacturer: part?.manufacturer ?? null,
      description: part?.description ?? null,
      packageName: part?.packageName ?? null,
      storageLocation: part?.storageLocation ?? null,
      notes,
    };
  });

  const totalCost = lines.reduce((sum, line) => sum + line.lineTotal, 0);
  const shortages = lines
    .filter((line) => line.shortfall > 0)
    .map((line) => `${line.lcscId}: missing ${line.shortfall}`);

  return {
    projectId: project?.id ?? null,
    projectName: project?.name ?? fallbackProjectName,
    pcbCount,
    totalCost,
    readyToBuild: shortages.length === 0,
    draftItems: normalizedItems,
    lines,
    shortages,
  } satisfies BomData;
}

export async function importOrderAction(
  _previousState: ActionState<OrderImportData>,
  formData: FormData,
): Promise<ActionState<OrderImportData>> {
  const uploaded = await readUploadedCsv(formData, "orderFile");

  if (uploaded.error || !uploaded.file || !uploaded.text) {
    return createState<OrderImportData>(
      "error",
      uploaded.error ?? "Unable to read the uploaded file.",
      null,
    );
  }

  const parsed = parseOrderCsv(uploaded.text);

  if (parsed.records.length === 0) {
    return createState<OrderImportData>(
      "error",
      "No valid order rows were found in the CSV.",
      null,
      parsed.debug,
    );
  }

  try {
    const touchedParts = new Set<string>();

    await prisma.$transaction(async (tx) => {
      for (const row of parsed.records) {
        touchedParts.add(row.lcscId);

        await tx.part.upsert({
          where: { lcscId: row.lcscId },
          create: {
            lcscId: row.lcscId,
            stockLevel: row.quantity,
            ...getPartMutationFields(row),
          },
          update: {
            stockLevel: {
              increment: row.quantity,
            },
            ...getPartMutationFields(row),
          },
        });

        await tx.priceHistory.create({
          data: {
            partId: row.lcscId,
            quantity: row.quantity,
            pricePaid: row.unitPrice,
            orderDate: row.orderDate,
            sourceFile: uploaded.file.name,
          },
        });

        await tx.stockMovement.create({
          data: {
            partId: row.lcscId,
            quantityDelta: row.quantity,
            note: `Imported from order CSV ${uploaded.file.name}.`,
          },
        });
      }
    });

    revalidatePath("/");
    revalidatePath("/import");
    revalidatePath("/parts");
    revalidatePath("/projects");

    return createState<OrderImportData>(
      "success",
      `Imported ${parsed.records.length} order rows from ${uploaded.file.name}.`,
      {
        importedRows: parsed.records.length,
        touchedParts: touchedParts.size,
        lines: parsed.records.map((row) => ({
          lcscId: row.lcscId,
          quantity: row.quantity,
          unitPrice: row.unitPrice,
          orderDate: row.orderDate.toISOString(),
        })),
      },
      parsed.debug,
    );
  } catch (error) {
    console.error("Order import failed", error);

    return createState<OrderImportData>(
      "error",
      "Order import failed. Check the debug panel and the server logs for the failing row.",
      null,
      parsed.debug,
    );
  }
}

export async function auditCartAction(
  _previousState: ActionState<AuditData>,
  formData: FormData,
): Promise<ActionState<AuditData>> {
  const uploaded = await readUploadedCsv(formData, "cartFile");

  if (uploaded.error || !uploaded.text) {
    return createState<AuditData>(
      "error",
      uploaded.error ?? "Unable to read the uploaded file.",
      null,
    );
  }

  const parsed = parseAuditCsv(uploaded.text);

  if (parsed.records.length === 0) {
    return createState<AuditData>(
      "error",
      "No valid cart rows were found in the CSV.",
      null,
      parsed.debug,
    );
  }

  const parts = await prisma.part.findMany({
    where: {
      lcscId: {
        in: [...new Set(parsed.records.map((row) => row.lcscId))],
      },
    },
    include: {
      priceHistory: {
        orderBy: [{ orderDate: "desc" }, { id: "desc" }],
        take: 1,
      },
    },
  });

  const partsById = new Map(parts.map((part) => [part.lcscId, part]));

  const rows = parsed.records.map((row) => {
    const part = partsById.get(row.lcscId);
    const latestPrice = part?.priceHistory[0]?.pricePaid ?? null;
    const deltaPercent =
      latestPrice && latestPrice !== 0 ? (row.unitPrice - latestPrice) / latestPrice : null;
    const notes: string[] = [];

    if (!part) {
      notes.push("Not in inventory");
    }

    if (part && latestPrice === null) {
      notes.push("No price history");
    }

    if ((part?.stockLevel ?? 0) > 100) {
      notes.push("Stock above 100");
    }

    return {
      lcscId: row.lcscId,
      quantity: row.quantity,
      cartUnitPrice: row.unitPrice,
      stockLevel: part?.stockLevel ?? null,
      latestPrice,
      deltaPercent,
      mpn: part?.mpn ?? null,
      manufacturer: part?.manufacturer ?? null,
      description: part?.description ?? null,
      packageName: part?.packageName ?? null,
      storageLocation: part?.storageLocation ?? null,
      notes,
    };
  });

  return createState<AuditData>(
    "success",
    `Audited ${rows.length} cart rows from ${uploaded.file.name}.`,
    {
      rows,
      summary: {
        totalRows: rows.length,
        unknownParts: rows.filter((row) => row.stockLevel === null).length,
        overstockedParts: rows.filter((row) => (row.stockLevel ?? 0) > 100).length,
        priceIncreases: rows.filter((row) => (row.deltaPercent ?? 0) > 0).length,
      },
    },
    parsed.debug,
  );
}

export async function analyzeBomAction(
  _previousState: ActionState<BomData>,
  formData: FormData,
): Promise<ActionState<BomData>> {
  const uploaded = await readUploadedCsv(formData, "bomFile");

  try {
    const selectedProjectId = parseProjectId(formData.get("projectId"));
    const projectNameInput = trimInput(formData.get("projectName"));
    const selectedProject = await resolveProjectSelection(selectedProjectId, projectNameInput);
    const pcbCount = parsePositiveInteger(
      formData.get("pcbCount"),
      "PCB quantity",
      selectedProject?.buildQuantity ?? 1,
    );

    if (uploaded.text) {
      const parsed = parseBomCsv(uploaded.text);

      if (parsed.records.length === 0) {
        return createState<BomData>(
          "error",
          "No valid BOM rows were found in the CSV.",
          null,
          parsed.debug,
        );
      }

      const data = await buildBomData(parsed.records, pcbCount, selectedProject, projectNameInput);
      return createState<BomData>(
        "success",
        `Calculated BOM cost for ${data.lines.length} unique parts across ${data.pcbCount} PCB(s) from ${uploaded.file?.name ?? "the uploaded CSV"}.`,
        data,
        parsed.debug,
      );
    }

    if (uploaded.error && !selectedProject?.bomLinesJson) {
      return createState<BomData>(
        "error",
        selectedProjectId
          ? "This saved project has no stored BOM yet. Upload a BOM CSV once before reusing it."
          : uploaded.error,
        null,
      );
    }

    if (!selectedProject?.bomLinesJson) {
      return createState<BomData>(
        "error",
        "Upload a BOM CSV or choose an existing project with saved BOM lines.",
        null,
      );
    }

    const savedItems = parseProjectBomLines(selectedProject.bomLinesJson).map((line) => ({
      lcscId: line.lcscId,
      quantity: line.quantity,
    }));

    const data = await buildBomData(savedItems, pcbCount, selectedProject, projectNameInput);
    return createState<BomData>(
      "success",
      `Loaded ${data.lines.length} BOM line(s) from ${selectedProject.name} for ${data.pcbCount} PCB(s).`,
      data,
    );
  } catch (error) {
    return createState<BomData>(
      "error",
      error instanceof Error ? error.message : "Unable to analyze the BOM.",
      null,
    );
  }
}

export async function recalculateBomAction(
  _previousState: ActionState<BomData>,
  formData: FormData,
): Promise<ActionState<BomData>> {
  const projectId = parseProjectId(formData.get("projectId"));
  const projectName = trimInput(formData.get("projectName"));

  try {
    const pcbCount = parsePositiveInteger(formData.get("pcbCount"), "PCB quantity");
    const items = parseBomDraftItems(formData.get("itemsJson"));
    const selectedProject = await resolveProjectSelection(projectId, projectName);
    const data = await buildBomData(items, pcbCount, selectedProject, projectName);

    return createState<BomData>(
      "success",
      `Recalculated ${data.lines.length} BOM line(s) for ${data.pcbCount} PCB(s).`,
      data,
    );
  } catch (error) {
    return createState<BomData>(
      "error",
      error instanceof Error ? error.message : "Unable to recalculate the edited BOM.",
      null,
    );
  }
}

export async function commitBomAction(
  _previousState: ActionState<BomData>,
  formData: FormData,
): Promise<ActionState<BomData>> {
  const projectId = parseProjectId(formData.get("projectId"));
  const projectName = trimInput(formData.get("projectName"));

  if (!projectId && !projectName) {
    return createState<BomData>(
      "error",
      "Choose an existing project or enter a new project name before commit.",
      null,
    );
  }

  try {
    const pcbCount = parsePositiveInteger(formData.get("pcbCount"), "PCB quantity");
    const items = parseBomDraftItems(formData.get("itemsJson"));
    const selectedProject = await resolveProjectSelection(projectId, projectName);
    const data = await buildBomData(items, pcbCount, selectedProject, projectName);
    const totalCost = data.totalCost;
    const lines = data.lines;
    const savedProject = await prisma.$transaction(async (tx) => {
      if (!selectedProject) {
        const createdProject = await tx.project.create({
          data: {
            name: projectName!,
            totalCost,
            buildQuantity: data.pcbCount,
            bomLinesJson: serializeProjectBomLines(data.draftItems),
          },
        });

        for (const line of lines) {
          await tx.part.upsert({
            where: { lcscId: line.lcscId },
            create: {
              lcscId: line.lcscId,
              stockLevel: -line.quantity,
            },
            update: {
              stockLevel: {
                decrement: line.quantity,
              },
            },
          });

          await tx.stockMovement.create({
            data: {
              partId: line.lcscId,
              projectId: createdProject.id,
              quantityDelta: -line.quantity,
              note: `Committed project "${createdProject.name}" for ${data.pcbCount} PCB(s).`,
            },
          });
        }

        return createdProject;
      }

      if (selectedProject) {
        const previousItems = parseProjectBomLines(selectedProject.bomLinesJson);

        for (const item of previousItems) {
          await tx.part.upsert({
            where: { lcscId: item.lcscId },
            create: {
              lcscId: item.lcscId,
              stockLevel: item.quantity * selectedProject.buildQuantity,
            },
            update: {
              stockLevel: {
                increment: item.quantity * selectedProject.buildQuantity,
              },
            },
          });

          await tx.stockMovement.create({
            data: {
              partId: item.lcscId,
              projectId: selectedProject.id,
              quantityDelta: item.quantity * selectedProject.buildQuantity,
              note: `Restored previous committed stock for project "${selectedProject.name}" before recompute.`,
            },
          });
        }
      }

      for (const line of lines) {
        await tx.part.upsert({
          where: { lcscId: line.lcscId },
          create: {
            lcscId: line.lcscId,
            stockLevel: -line.quantity,
          },
          update: {
            stockLevel: {
              decrement: line.quantity,
            },
          },
        });

        await tx.stockMovement.create({
          data: {
            partId: line.lcscId,
            projectId: selectedProject.id,
            quantityDelta: -line.quantity,
            note: `Committed project "${selectedProject.name}" for ${data.pcbCount} PCB(s).`,
          },
        });
      }

      return tx.project.update({
        where: { id: selectedProject.id },
        data: {
          totalCost,
          buildQuantity: data.pcbCount,
          bomLinesJson: serializeProjectBomLines(data.draftItems),
        },
      });
    });

    revalidatePath("/");
    revalidatePath("/parts");
    revalidatePath("/projects");

    return createState<BomData>(
      "success",
      `Committed BOM stock movement to ${savedProject.name} for ${data.pcbCount} PCB(s). Negative inventory is allowed and has been preserved.`,
      {
        projectId: savedProject.id,
        projectName: savedProject.name,
        pcbCount: data.pcbCount,
        totalCost,
        readyToBuild: data.readyToBuild,
        draftItems: data.draftItems,
        lines,
        shortages: data.shortages,
      },
    );
  } catch (error) {
    console.error("BOM commit failed", error);
    return createState<BomData>(
      "error",
      error instanceof Error
        ? error.message
        : "BOM commit failed. Check the server logs and retry after reviewing the analyzed lines.",
      null,
    );
  }
}

export async function deleteProjectAction(
  previousState: ActionState<null>,
  formData: FormData,
): Promise<ActionState<null>> {
  const projectId = parseProjectId(formData.get("projectId"));

  if (!projectId) {
    return createState<null>("error", "Choose a valid project to delete.", previousState.data);
  }

  try {
    const existingProject = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!existingProject) {
      return createState<null>("error", "Project not found.", null);
    }

    await prisma.$transaction(async (tx) => {
      const savedItems = parseProjectBomLines(existingProject.bomLinesJson);

      for (const item of savedItems) {
        await tx.part.upsert({
          where: { lcscId: item.lcscId },
          create: {
            lcscId: item.lcscId,
            stockLevel: item.quantity * existingProject.buildQuantity,
          },
          update: {
            stockLevel: {
              increment: item.quantity * existingProject.buildQuantity,
            },
          },
        });

        await tx.stockMovement.create({
          data: {
            partId: item.lcscId,
            projectId: existingProject.id,
            quantityDelta: item.quantity * existingProject.buildQuantity,
            note: `Deleted project "${existingProject.name}" and restored stock for ${existingProject.buildQuantity} PCB(s).`,
          },
        });
      }

      await tx.project.delete({
        where: { id: projectId },
      });
    });

    revalidatePath("/");
    revalidatePath("/parts");
    revalidatePath("/projects");

    return createState<null>(
      "success",
      `Deleted project ${existingProject.name} and restored its committed stock for ${existingProject.buildQuantity} PCB(s).`,
      null,
    );
  } catch (error) {
    console.error("Project deletion failed", error);
    return createState<null>(
      "error",
      "Project deletion failed. Check the server logs and retry.",
      null,
    );
  }
}

export async function updatePartAction(
  previousState: ActionState<null>,
  formData: FormData,
): Promise<ActionState<null>> {
  const lcscId = trimInput(formData.get("lcscId"));

  if (!lcscId) {
    return createState<null>("error", "Choose a valid part to edit.", previousState.data);
  }

  try {
    const nextStockLevel = parseInteger(formData.get("stockLevel"), "Stock level", 0);
    const mpn = trimInput(formData.get("mpn"));
    const manufacturer = trimInput(formData.get("manufacturer"));
    const description = trimInput(formData.get("description"));
    const packageName = trimInput(formData.get("packageName"));
    const storageLocation = trimInput(formData.get("storageLocation"));
    const editNote = trimInput(formData.get("editNote"));

    const existingPart = await prisma.part.findUnique({
      where: { lcscId },
    });

    if (!existingPart) {
      return createState<null>("error", "Part not found.", null);
    }

    const quantityDelta = nextStockLevel - existingPart.stockLevel;

    await prisma.$transaction(async (tx) => {
      await tx.part.update({
        where: { lcscId },
        data: {
          stockLevel: nextStockLevel,
          mpn,
          manufacturer,
          description,
          packageName,
          storageLocation,
        },
      });

      if (quantityDelta !== 0) {
        await tx.stockMovement.create({
          data: {
            partId: lcscId,
            quantityDelta,
            note:
              editNote ??
              `Manual edit from parts page. Stock changed from ${existingPart.stockLevel} to ${nextStockLevel}.`,
          },
        });
      }
    });

    revalidatePath("/");
    revalidatePath("/parts");
    revalidatePath(`/parts/${lcscId}`);
    revalidatePath("/projects");

    return createState<null>("success", `Saved manual edits for ${lcscId}.`, null);
  } catch (error) {
    console.error("Part update failed", error);
    return createState<null>(
      "error",
      error instanceof Error ? error.message : "Part update failed. Check the server logs and retry.",
      null,
    );
  }
}
