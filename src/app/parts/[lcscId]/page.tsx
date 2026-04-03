import Link from "next/link";
import { notFound } from "next/navigation";
import { PurchaseHistoryTable } from "@/components/purchase-history-table";
import { Sparkline } from "@/components/sparkline";
import { StockMovementTable } from "@/components/stock-movement-table";
import { getPartById } from "@/lib/data";
import { formatCurrency, formatInteger } from "@/lib/format";

type PartDetailPageProps = {
  params: Promise<{
    lcscId: string;
  }>;
};

export default async function PartDetailPage({ params }: PartDetailPageProps) {
  const { lcscId } = await params;
  const part = await getPartById(lcscId);

  if (!part) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
        <Link href="/parts" className="hover:text-slate-950">
          Parts
        </Link>
        <span>/</span>
        <span>{part.lcscId}</span>
      </div>

      <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">
            Part Detail
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
            {part.lcscId}
          </h1>
          <div className="mt-4 grid gap-3 text-sm text-slate-600 md:grid-cols-2">
            <div>
              <p className="text-slate-500">MPN</p>
              <p className="mt-1 font-medium text-slate-900">{part.mpn ?? "—"}</p>
            </div>
            <div>
              <p className="text-slate-500">Manufacturer</p>
              <p className="mt-1 font-medium text-slate-900">{part.manufacturer ?? "—"}</p>
            </div>
            <div>
              <p className="text-slate-500">Current stock</p>
              <p className="mt-1 font-medium text-slate-900">{formatInteger(part.stockLevel)}</p>
            </div>
            <div>
              <p className="text-slate-500">Package</p>
              <p className="mt-1 font-medium text-slate-900">{part.packageName ?? "—"}</p>
            </div>
            <div>
              <p className="text-slate-500">Storage location</p>
              <p className="mt-1 font-medium text-slate-900">{part.storageLocation ?? "—"}</p>
            </div>
            <div>
              <p className="text-slate-500">Last paid</p>
              <p className="mt-1 font-medium text-slate-900">
                {formatCurrency(part.priceHistory[0]?.pricePaid)}
              </p>
            </div>
          </div>
          <div className="mt-4">
            <p className="text-slate-500">Description</p>
            <p className="mt-1 text-sm text-slate-700">{part.description ?? "—"}</p>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-950">Price Trend</h2>
          <p className="mt-2 text-sm text-slate-600">
            Based on the full purchase history for this part.
          </p>
          <div className="mt-6 flex min-h-40 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-500">
            <Sparkline
              className="h-24 w-full max-w-xs"
              values={part.priceHistory.map((entry) => entry.pricePaid)}
            />
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-950">Purchase History</h2>
        <p className="mt-1 text-sm text-slate-600">
          Every imported purchase row is preserved separately, including same-day multiples.
        </p>
        <PurchaseHistoryTable
          entries={part.priceHistory.map((entry) => ({
            id: entry.id,
            orderDate: entry.orderDate.toISOString(),
            quantity: entry.quantity,
            pricePaid: entry.pricePaid,
            sourceFile: entry.sourceFile,
          }))}
        />
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-950">Stock Movements</h2>
        <p className="mt-1 text-sm text-slate-600">
          Audit trail for imports, project commits, project deletions, and manual part edits.
        </p>
        <StockMovementTable
          entries={part.stockMovements.map((entry) => ({
            id: entry.id,
            createdAt: entry.createdAt.toISOString(),
            quantityDelta: entry.quantityDelta,
            note: entry.note,
          }))}
        />
      </section>
    </div>
  );
}
