import Link from "next/link";

const navItems = [
  { href: "/", label: "Dashboard" },
  { href: "/parts", label: "Parts" },
  { href: "/import", label: "Import Order" },
  { href: "/audit", label: "Audit" },
  { href: "/projects", label: "Projects" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <header className="border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <Link href="/" className="text-xl font-semibold tracking-tight text-slate-950">
              Personal Electronics ERP
            </Link>
            <p className="mt-1 text-sm text-slate-500">
              Inventory, costing, order imports, and cart auditing for LCSC parts.
            </p>
          </div>
          <nav className="flex flex-wrap gap-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-950"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-6 py-8">{children}</main>
    </div>
  );
}
