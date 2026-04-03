import Papa from "papaparse";

type ParsedCsvRow = Record<string, string>;

type CsvParseResult<TRecord> = {
  records: TRecord[];
  debug: {
    normalizedHeaders: string[];
    rowErrors: string[];
  };
};

type HeaderAliasMap<TField extends string> = Record<TField, string[]>;

type RawRowResult<TField extends string> = {
  rowNumber: number;
  values: Partial<Record<TField, string>>;
};

function normalizeHeader(header: string) {
  return header.trim().toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function toOptionalString(value: string | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function parseNumber(value: string | undefined) {
  if (!value) {
    return null;
  }

  const cleaned = value.replace(/[$,\s]/g, "");
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseDate(value: string | undefined, fallback: Date) {
  if (!value?.trim()) {
    return fallback;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? fallback : parsed;
}

function parseWithAliases<TField extends string>(
  text: string,
  aliases: HeaderAliasMap<TField>,
) {
  const parsed = Papa.parse<ParsedCsvRow>(text, {
    header: true,
    skipEmptyLines: "greedy",
    transformHeader: normalizeHeader,
  });

  const normalizedHeaders = parsed.meta.fields ?? [];
  const rowErrors = parsed.errors.map((error) => `Row ${error.row}: ${error.message}`);

  return {
    rows: parsed.data.map((row, index) => {
      const values = {} as Partial<Record<TField, string>>;

      for (const [field, fieldAliases] of Object.entries(aliases) as Array<
        [TField, string[]]
      >) {
        const matchedHeader = fieldAliases.find((header) => row[header] !== undefined);
        values[field] = matchedHeader ? row[matchedHeader] : undefined;
      }

      return {
        rowNumber: index + 2,
        values,
      } satisfies RawRowResult<TField>;
    }),
    debug: {
      normalizedHeaders,
      rowErrors,
    },
  };
}

type OrderCsvField =
  | "lcscId"
  | "quantity"
  | "unitPrice"
  | "orderDate"
  | "mpn"
  | "manufacturer"
  | "description"
  | "packageName";

const orderAliases: HeaderAliasMap<OrderCsvField> = {
  lcscId: ["lcscpartnumber", "lcsc", "lcscpn", "lcscnumber"],
  quantity: ["quantity", "qty"],
  unitPrice: ["unitprice", "unitpriceusd", "unitprice$", "price", "pricepaid"],
  orderDate: ["orderdate", "date", "purchasedate"],
  mpn: ["mpn", "partnumber", "manufacturerpartnumber", "manufacturepartnumber"],
  manufacturer: ["manufacturer", "brand"],
  description: ["description", "productdescription", "comment"],
  packageName: ["package", "packagesize", "casepackage"],
};

export type ParsedOrderRow = {
  lcscId: string;
  quantity: number;
  unitPrice: number;
  orderDate: Date;
  mpn: string | null;
  manufacturer: string | null;
  description: string | null;
  packageName: string | null;
};

export function parseOrderCsv(text: string, fallbackDate = new Date()): CsvParseResult<ParsedOrderRow> {
  const parsed = parseWithAliases(text, orderAliases);
  const records: ParsedOrderRow[] = [];

  for (const row of parsed.rows) {
    const lcscId = row.values.lcscId?.trim();
    const quantity = parseNumber(row.values.quantity);
    const unitPrice = parseNumber(row.values.unitPrice);

    if (!lcscId || quantity === null || unitPrice === null) {
      parsed.debug.rowErrors.push(
        `Row ${row.rowNumber}: missing or invalid LCSC id, quantity, or unit price`,
      );
      continue;
    }

    records.push({
      lcscId,
      quantity,
      unitPrice,
      orderDate: parseDate(row.values.orderDate, fallbackDate),
      mpn: toOptionalString(row.values.mpn),
      manufacturer: toOptionalString(row.values.manufacturer),
      description: toOptionalString(row.values.description),
      packageName: toOptionalString(row.values.packageName),
    });
  }

  return {
    records,
    debug: parsed.debug,
  };
}

type AuditCsvField = "lcscId" | "quantity" | "unitPrice";

const auditAliases: HeaderAliasMap<AuditCsvField> = {
  lcscId: orderAliases.lcscId,
  quantity: orderAliases.quantity,
  unitPrice: orderAliases.unitPrice,
};

export type ParsedAuditRow = {
  lcscId: string;
  quantity: number;
  unitPrice: number;
};

export function parseAuditCsv(text: string): CsvParseResult<ParsedAuditRow> {
  const parsed = parseWithAliases(text, auditAliases);
  const records: ParsedAuditRow[] = [];

  for (const row of parsed.rows) {
    const lcscId = row.values.lcscId?.trim();
    const quantity = parseNumber(row.values.quantity);
    const unitPrice = parseNumber(row.values.unitPrice);

    if (!lcscId || quantity === null || unitPrice === null) {
      parsed.debug.rowErrors.push(
        `Row ${row.rowNumber}: missing or invalid LCSC id, quantity, or unit price`,
      );
      continue;
    }

    records.push({
      lcscId,
      quantity,
      unitPrice,
    });
  }

  return {
    records,
    debug: parsed.debug,
  };
}

type BomCsvField = "lcscId" | "quantity";

const bomAliases: HeaderAliasMap<BomCsvField> = {
  lcscId: orderAliases.lcscId,
  quantity: orderAliases.quantity,
};

export type ParsedBomRow = {
  lcscId: string;
  quantity: number;
};

export function parseBomCsv(text: string): CsvParseResult<ParsedBomRow> {
  const parsed = parseWithAliases(text, bomAliases);
  const aggregated = new Map<string, number>();

  for (const row of parsed.rows) {
    const lcscId = row.values.lcscId?.trim();
    const quantity = parseNumber(row.values.quantity);

    if (!lcscId || quantity === null) {
      parsed.debug.rowErrors.push(`Row ${row.rowNumber}: missing or invalid LCSC id or quantity`);
      continue;
    }

    aggregated.set(lcscId, (aggregated.get(lcscId) ?? 0) + quantity);
  }

  return {
    records: Array.from(aggregated.entries()).map(([lcscId, quantity]) => ({
      lcscId,
      quantity,
    })),
    debug: parsed.debug,
  };
}
