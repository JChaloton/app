import Link from "next/link";
import { ProjectTotalsList } from "@/components/project-totals-list";
import { RecentActivityTable } from "@/components/recent-activity-table";
import { formatCurrency, formatInteger } from "@/lib/format";
import { getDashboardData } from "@/lib/data";

export default async function Home() {
  const data = await getDashboardData();

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">
          Dashboard
        </p>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-4xl font-semibold tracking-tight text-slate-950">
              Personal Electronics Inventory & Costing ERP
            </h1>
            <p className="mt-2 max-w-3xl text-base text-slate-600">
              Track what you already own, import fresh order pricing, pre-flight BOM builds, and
              audit LCSC carts before buying duplicate stock.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <QuickLink href="/import" label="Upload Order CSV" />
            <QuickLink href="/audit" label="Audit Cart" />
            <QuickLink href="/projects" label="Open Projects" />
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Parts" value={formatInteger(data.totalParts)} />
        <StatCard label="Inventory Value" value={formatCurrency(data.inventoryValue)} />
        <StatCard label="Pending Orders" value={data.pendingOrdersLabel} />
        <StatCard label="Parts Without Price History" value={formatInteger(data.partsWithoutHistory)} />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_1fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-950">Recent Activity</h2>
              <p className="mt-1 text-sm text-slate-600">
                Latest imported price history rows across your parts library.
              </p>
            </div>
            <Link href="/parts" className="text-sm font-medium text-slate-600 hover:text-slate-950">
              Browse parts
            </Link>
          </div>

          <RecentActivityTable
            entries={data.recentHistory.map((entry) => ({
              id: entry.id,
              partId: entry.partId,
              partLabel: entry.part.mpn ?? entry.part.description,
              pricePaid: entry.pricePaid,
              orderDate: entry.orderDate.toISOString(),
              sourceFile: entry.sourceFile,
            }))}
          />
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-950">Project Totals</h2>
            <p className="mt-1 text-sm text-slate-600">
              Stored `total_cost` values for your latest committed BOMs.
            </p>
            <ProjectTotalsList projects={data.latestProjects} />
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-950">Suggested Workflow</h2>
            <div className="mt-4 space-y-3 text-sm text-slate-600">
              <p>1. Import your latest LCSC order CSV to refresh stock and pricing.</p>
              <p>2. Audit the next shopping cart before placing an order.</p>
              <p>3. Upload a BOM and commit it when you are ready to build.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">{value}</p>
    </div>
  );
}

function QuickLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:text-slate-950"
    >
      {label}
    </Link>
  );
}
