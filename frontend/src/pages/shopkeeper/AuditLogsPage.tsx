import { useEffect, useMemo, useState } from "react";
import { Search, ShieldCheck, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";

type AuditItem = {
  _id: string;
  action: string;
  entityType: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  userId?: { name?: string; email?: string } | string;
};
type AuditResponse = { items: AuditItem[]; total: number; page: number; limit: number; totalPages: number; actions: string[]; entityTypes: string[] };

const labelize = (value: string) => value.replace(/[_-]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

export default function AuditLogsPage() {
  const [data, setData] = useState<AuditResponse | null>(null);
  const [page, setPage] = useState(1);
  const [action, setAction] = useState("");
  const [entityType, setEntityType] = useState("");
  const [search, setSearch] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const query = useMemo(() => {
    const params = new URLSearchParams({ page: String(page), limit: "25" });
    if (action) params.set("action", action);
    if (entityType) params.set("entityType", entityType);
    if (search.trim()) params.set("search", search.trim());
    if (from) params.set("from", new Date(from).toISOString());
    if (to) params.set("to", new Date(to + "T23:59:59").toISOString());
    return params.toString();
  }, [page, action, entityType, search, from, to]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    fetch(`/api/audit-logs?${query}`, { credentials: "include" })
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok || !body.success) throw new Error(body.message || "Unable to load audit logs.");
        return body.data as AuditResponse;
      })
      .then((result) => { if (active) setData(result); })
      .catch((reason: unknown) => { if (active) setError(reason instanceof Error ? reason.message : "Unable to load audit logs."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [query]);

  const reset = () => { setAction(""); setEntityType(""); setSearch(""); setFrom(""); setTo(""); setPage(1); };

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2"><ShieldCheck className="size-6 text-primary" /><h1 className="text-2xl font-bold tracking-tight">Audit Logs</h1></div>
          <p className="mt-1 text-sm text-muted-foreground">A timeline of recorded activity in your shop.</p>
        </div>
        <button type="button" onClick={() => setPage((p) => p)} className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-muted"><RefreshCw className="size-4" /> Refresh</button>
      </div>

      <section className="rounded-2xl border bg-card p-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <label className="relative lg:col-span-2"><span className="sr-only">Search activity</span><Search className="absolute left-3 top-3 size-4 text-muted-foreground" /><input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search action or record type" className="w-full rounded-lg border bg-background py-2.5 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-primary/30" /></label>
          <select value={action} onChange={(e) => { setAction(e.target.value); setPage(1); }} className="rounded-lg border bg-background px-3 py-2.5 text-sm"><option value="">All actions</option>{(data?.actions ?? []).map((v) => <option key={v} value={v}>{labelize(v)}</option>)}</select>
          <select value={entityType} onChange={(e) => { setEntityType(e.target.value); setPage(1); }} className="rounded-lg border bg-background px-3 py-2.5 text-sm"><option value="">All record types</option>{(data?.entityTypes ?? []).map((v) => <option key={v} value={v}>{labelize(v)}</option>)}</select>
          <button type="button" onClick={reset} className="rounded-lg border px-3 py-2.5 text-sm hover:bg-muted">Clear filters</button>
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="text-xs text-muted-foreground">From date<input type="date" value={from} onChange={(e) => { setFrom(e.target.value); setPage(1); }} className="mt-1 block w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground" /></label>
          <label className="text-xs text-muted-foreground">To date<input type="date" value={to} onChange={(e) => { setTo(e.target.value); setPage(1); }} className="mt-1 block w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground" /></label>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border bg-card">
        <div className="flex items-center justify-between border-b px-4 py-3"><p className="text-sm font-semibold">Activity history</p><span className="text-xs text-muted-foreground">{data?.total ?? 0} events</span></div>
        {loading ? <div className="p-10 text-center text-sm text-muted-foreground">Loading activity…</div> :
          error ? <div className="p-10 text-center text-sm text-destructive">{error}</div> :
          !data?.items.length ? <div className="p-10 text-center"><ShieldCheck className="mx-auto size-8 text-muted-foreground" /><p className="mt-3 font-medium">No activity found</p><p className="mt-1 text-sm text-muted-foreground">Recorded events will appear here as you use BillNest.</p></div> :
          <div className="overflow-x-auto"><table className="w-full min-w-[720px] text-left text-sm"><thead className="bg-muted/40 text-xs text-muted-foreground"><tr><th className="px-4 py-3 font-medium">Activity</th><th className="px-4 py-3 font-medium">Record</th><th className="px-4 py-3 font-medium">Performed by</th><th className="px-4 py-3 font-medium">Details</th><th className="px-4 py-3 font-medium">Date & time</th></tr></thead><tbody className="divide-y">{data.items.map((item) => { const actor = typeof item.userId === "object" ? item.userId?.name || item.userId?.email || "Shopkeeper" : "Shopkeeper"; return <tr key={item._id} className="hover:bg-muted/20"><td className="px-4 py-3"><span className="rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary">{labelize(item.action)}</span></td><td className="px-4 py-3"><p className="font-medium">{labelize(item.entityType)}</p><p className="max-w-44 truncate text-xs text-muted-foreground">{item.entityId || "—"}</p></td><td className="px-4 py-3">{actor}</td><td className="px-4 py-3 text-xs text-muted-foreground">{item.metadata && Object.keys(item.metadata).length ? Object.entries(item.metadata).map(([k,v]) => `${labelize(k)}: ${String(v)}`).join(" · ") : "—"}</td><td className="whitespace-nowrap px-4 py-3 text-xs text-muted-foreground">{new Date(item.createdAt).toLocaleString()}</td></tr>; })}</tbody></table></div>}
        <div className="flex items-center justify-between border-t px-4 py-3"><p className="text-xs text-muted-foreground">Page {data?.page ?? page} of {Math.max(data?.totalPages ?? 1, 1)}</p><div className="flex gap-2"><button type="button" disabled={page <= 1 || loading} onClick={() => setPage((p) => Math.max(1, p - 1))} className="rounded-lg border p-2 disabled:opacity-40" aria-label="Previous page"><ChevronLeft className="size-4" /></button><button type="button" disabled={page >= (data?.totalPages ?? 1) || loading} onClick={() => setPage((p) => p + 1)} className="rounded-lg border p-2 disabled:opacity-40" aria-label="Next page"><ChevronRight className="size-4" /></button></div></div>
      </section>
    </div>
  );
}
