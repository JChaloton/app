import { OrderImportForm } from "@/components/order-import-form";

export default function ImportPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">Import</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
          Stock & Price Entry
        </h1>
        <p className="mt-2 max-w-3xl text-base text-slate-600">
          Supports flexible LCSC headers like `LCSC#`, `LCSC Part Number`, and `LCSC PN`. Each CSV
          line becomes its own `PriceHistory` row and increments stock.
        </p>
      </div>

      <OrderImportForm />
    </div>
  );
}
