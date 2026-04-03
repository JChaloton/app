import { CartAuditForm } from "@/components/cart-audit-form";

export default function AuditPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">Audit</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
          Shopping Cart Auditor
        </h1>
        <p className="mt-2 max-w-3xl text-base text-slate-600">
          Upload the cart before buying to catch overstocked items and price jumps versus your most
          recent purchase history.
        </p>
      </div>

      <CartAuditForm />
    </div>
  );
}
