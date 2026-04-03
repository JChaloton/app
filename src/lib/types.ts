export type DebugInfo = {
  normalizedHeaders: string[];
  rowErrors: string[];
};

export type ActionState<TData> = {
  status: "idle" | "success" | "error";
  message: string | null;
  debug: DebugInfo | null;
  data: TData | null;
};

export type OrderImportLine = {
  lcscId: string;
  quantity: number;
  unitPrice: number;
  orderDate: string;
};

export type OrderImportData = {
  importedRows: number;
  touchedParts: number;
  lines: OrderImportLine[];
};

export type AuditLine = {
  lcscId: string;
  quantity: number;
  cartUnitPrice: number;
  stockLevel: number | null;
  latestPrice: number | null;
  deltaPercent: number | null;
  mpn: string | null;
  manufacturer: string | null;
  description: string | null;
  packageName: string | null;
  storageLocation: string | null;
  notes: string[];
};

export type AuditData = {
  rows: AuditLine[];
  summary: {
    totalRows: number;
    unknownParts: number;
    overstockedParts: number;
    priceIncreases: number;
  };
};

export type BomLine = {
  lcscId: string;
  quantity: number;
  stockLevel: number;
  unitPrice: number | null;
  lineTotal: number;
  shortfall: number;
  mpn: string | null;
  manufacturer: string | null;
  description: string | null;
  packageName: string | null;
  storageLocation: string | null;
  notes: string[];
};

export type BomDraftItem = {
  lcscId: string;
  quantity: number;
};

export type StoredProjectBomLine = {
  lcscId: string;
  quantity: number;
  mpn?: string | null;
  manufacturer?: string | null;
  description?: string | null;
  packageName?: string | null;
  storageLocation?: string | null;
};

export type BomData = {
  projectId: number | null;
  projectName: string | null;
  pcbCount: number;
  totalCost: number;
  readyToBuild: boolean;
  draftItems: BomDraftItem[];
  lines: BomLine[];
  shortages: string[];
};

export const emptyOrderImportState: ActionState<OrderImportData> = {
  status: "idle",
  message: null,
  debug: null,
  data: null,
};

export const emptyAuditState: ActionState<AuditData> = {
  status: "idle",
  message: null,
  debug: null,
  data: null,
};

export const emptyBomState: ActionState<BomData> = {
  status: "idle",
  message: null,
  debug: null,
  data: null,
};
