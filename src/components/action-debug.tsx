import type { DebugInfo } from "@/lib/types";

export function ActionDebug({ debug }: { debug: DebugInfo | null }) {
  if (!debug) {
    return null;
  }

  return (
    <details className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
      <summary className="cursor-pointer font-medium text-slate-900">Debug details</summary>
      <div className="mt-3 space-y-4">
        <div>
          <p className="font-medium text-slate-900">Normalized headers</p>
          <p className="mt-1 break-all text-slate-600">
            {debug.normalizedHeaders.length > 0 ? debug.normalizedHeaders.join(", ") : "None"}
          </p>
        </div>
        <div>
          <p className="font-medium text-slate-900">Row errors</p>
          {debug.rowErrors.length > 0 ? (
            <ul className="mt-1 space-y-1 text-slate-600">
              {debug.rowErrors.map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          ) : (
            <p className="mt-1 text-slate-600">No parsing errors.</p>
          )}
        </div>
      </div>
    </details>
  );
}
