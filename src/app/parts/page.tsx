import { PartsTable } from "@/components/parts-table";
import { getParts } from "@/lib/data";

type PartsPageProps = {
  searchParams: Promise<{
    q?: string;
  }>;
};

export default async function PartsPage({ searchParams }: PartsPageProps) {
  const { q = "" } = await searchParams;
  const parts = await getParts(q);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">Parts</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
          Searchable Parts Library
        </h1>
        <p className="mt-2 max-w-3xl text-base text-slate-600">
          Search by LCSC id, MPN, manufacturer, description, package, or storage location. The
          sparkline uses your most recent price-history points. Use the inline Edit action to
          manually correct stock or metadata.
        </p>
      </div>

      <form className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        <label className="block space-y-2 text-sm font-medium text-slate-700">
          <span>Search</span>
          <div className="flex gap-3">
            <input
              type="search"
              name="q"
              defaultValue={q}
              placeholder="C2484292, 0402, Drawer A1, ESP32..."
              className="block w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700"
            />
            <button
              type="submit"
              className="rounded-full bg-slate-950 px-4 py-2 text-sm font-medium text-white"
            >
              Search
            </button>
          </div>
        </label>
      </form>

      <PartsTable parts={parts} />
    </div>
  );
}
