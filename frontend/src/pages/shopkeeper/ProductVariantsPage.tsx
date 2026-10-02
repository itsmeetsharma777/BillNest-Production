import { useEffect, useMemo, useState, type FormEvent } from "react";
import { ArrowLeft, Boxes, Loader2, Minus, Plus, Save, Trash2, X } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:5001/api";

type Variant = {
  _id: string;
  attributes: Record<string, string>;
  sku?: string | null;
  barcode?: string | null;
  purchasePrice: number;
  sellingPrice: number;
  stockQuantity: number;
  lowStockThreshold: number;
  warrantyPeriodMonths: number;
  isActive: boolean;
  profitAmount?: number;
  profitMarginPercent?: number;
  markupPercent?: number;
};

type FormState = {
  attributes: Array<{ key: string; value: string }>;
  sku: string;
  barcode: string;
  purchasePrice: string;
  sellingPrice: string;
  stockQuantity: string;
  lowStockThreshold: string;
  warrantyPeriodMonths: string;
};

const emptyForm: FormState = {
  attributes: [{ key: "", value: "" }],
  sku: "",
  barcode: "",
  purchasePrice: "0",
  sellingPrice: "0",
  stockQuantity: "0",
  lowStockThreshold: "5",
  warrantyPeriodMonths: "0",
};

function currency(value: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(value);
}

function variantLabel(variant: Variant) {
  return Object.entries(variant.attributes).map(([key, value]) => key + ": " + value).join(" • ");
}

function attributesToRows(attributes: Record<string, string>) {
  const rows = Object.entries(attributes).map(([key, value]) => ({ key, value }));
  return rows.length ? rows : [{ key: "", value: "" }];
}

export default function ProductVariantsPage() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const [variants, setVariants] = useState<Variant[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [stockSaving, setStockSaving] = useState(false);
  const [error, setError] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Variant | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [stockTarget, setStockTarget] = useState<Variant | null>(null);
  const [stockType, setStockType] = useState<"in" | "out">("in");
  const [stockQuantity, setStockQuantity] = useState("1");
  const [stockReason, setStockReason] = useState("");

  async function loadVariants() {
    if (!productId) return;
    try {
      setLoading(true);
      const response = await fetch(API_URL + "/product-variants/" + productId + "?isActive=all", { credentials: "include" });
      const result = await response.json().catch(() => null);
      if (!response.ok) throw new Error(result?.message ?? "Unable to load variants.");
      setVariants(result?.data?.variants ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load variants.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void loadVariants(); }, [productId]);

  const activeVariants = useMemo(() => variants.filter((v) => v.isActive), [variants]);

  function openCreate() {
    setEditing(null);
    setForm({ ...emptyForm, attributes: [{ key: "", value: "" }] });
    setError("");
    setFormOpen(true);
  }

  function openEdit(variant: Variant) {
    setEditing(variant);
    setForm({
      attributes: attributesToRows(variant.attributes),
      sku: variant.sku ?? "",
      barcode: variant.barcode ?? "",
      purchasePrice: String(variant.purchasePrice),
      sellingPrice: String(variant.sellingPrice),
      stockQuantity: String(variant.stockQuantity),
      lowStockThreshold: String(variant.lowStockThreshold),
      warrantyPeriodMonths: String(variant.warrantyPeriodMonths),
    });
    setError("");
    setFormOpen(true);
  }

  function openStock(variant: Variant, type: "in" | "out") {
    setStockTarget(variant);
    setStockType(type);
    setStockQuantity("1");
    setStockReason("");
    setError("");
  }

  function updateAttribute(index: number, field: "key" | "value", value: string) {
    setForm((current) => ({
      ...current,
      attributes: current.attributes.map((row, i) => i === index ? { ...row, [field]: value } : row),
    }));
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!productId) return;
    setError("");

    const attributes: Record<string, string> = {};
    for (const row of form.attributes) {
      const key = row.key.trim();
      const value = row.value.trim();
      if (key && value) attributes[key] = value;
    }
    if (!Object.keys(attributes).length) {
      setError("Add at least one variant attribute, such as RAM = 16 GB.");
      return;
    }

    const payload = {
      attributes,
      sku: form.sku.trim() || undefined,
      barcode: form.barcode.trim() || undefined,
      purchasePrice: Number(form.purchasePrice),
      sellingPrice: Number(form.sellingPrice),
      stockQuantity: Number(form.stockQuantity),
      lowStockThreshold: Number(form.lowStockThreshold),
      warrantyPeriodMonths: Number(form.warrantyPeriodMonths),
    };

    if (![payload.purchasePrice, payload.sellingPrice, payload.stockQuantity, payload.lowStockThreshold, payload.warrantyPeriodMonths].every(Number.isFinite)) {
      setError("All numeric fields must contain valid numbers.");
      return;
    }

    try {
      setSaving(true);
      const url = editing ? API_URL + "/product-variants/" + productId + "/" + editing._id : API_URL + "/product-variants/" + productId;
      const response = await fetch(url, {
        method: editing ? "PATCH" : "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) throw new Error(result?.message ?? "Unable to save variant.");
      setFormOpen(false);
      await loadVariants();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to save variant.");
    } finally {
      setSaving(false);
    }
  }

  async function adjustStock(event: FormEvent) {
    event.preventDefault();
    if (!productId || !stockTarget) return;
    const quantity = Number(stockQuantity);
    if (!Number.isFinite(quantity) || quantity <= 0) {
      setError("Stock quantity must be greater than zero.");
      return;
    }
    try {
      setStockSaving(true);
      const response = await fetch(API_URL + "/product-variants/" + productId + "/" + stockTarget._id + "/adjust-stock", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: stockType, quantity, reason: stockReason.trim() || undefined }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) throw new Error(result?.message ?? "Unable to adjust variant stock.");
      setStockTarget(null);
      await loadVariants();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to adjust variant stock.");
    } finally {
      setStockSaving(false);
    }
  }

  async function deactivate(variant: Variant) {
    if (!productId || variant.stockQuantity > 0) {
      setError("A variant must have zero stock before it can be deactivated.");
      return;
    }
    if (!window.confirm("Deactivate variant " + (variant.sku ?? variant._id) + "?")) return;
    try {
      const response = await fetch(API_URL + "/product-variants/" + productId + "/" + variant._id, { method: "DELETE", credentials: "include" });
      const result = await response.json().catch(() => null);
      if (!response.ok) throw new Error(result?.message ?? "Unable to deactivate variant.");
      await loadVariants();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to deactivate variant.");
    }
  }

  return (
    <div className="mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <button type="button" onClick={() => navigate("/shopkeeper/products")} className="mt-1 flex size-9 items-center justify-center rounded-xl border hover:bg-muted"><ArrowLeft className="size-4" /></button>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">Advanced catalog</p>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Product Variants</h1>
            <p className="mt-1 text-sm text-muted-foreground">Manage SKU, barcode, pricing and stock independently for every variant.</p>
          </div>
        </div>
        <button type="button" onClick={openCreate} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90"><Plus className="size-4" />Add variant</button>
      </div>

      {error && <div className="mb-5 rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">{error}</div>}

      <div className="mb-5 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border bg-card p-4"><p className="text-xs text-muted-foreground">Total variants</p><p className="mt-1 text-2xl font-bold">{variants.length}</p></div>
        <div className="rounded-2xl border bg-card p-4"><p className="text-xs text-muted-foreground">Active variants</p><p className="mt-1 text-2xl font-bold">{activeVariants.length}</p></div>
        <div className="rounded-2xl border bg-card p-4"><p className="text-xs text-muted-foreground">Units in stock</p><p className="mt-1 text-2xl font-bold">{activeVariants.reduce((sum, v) => sum + v.stockQuantity, 0).toLocaleString("en-IN")}</p></div>
      </div>

      <section className="overflow-hidden rounded-2xl border bg-card shadow-sm">
        {loading ? <div className="flex min-h-64 items-center justify-center gap-2 text-sm text-muted-foreground"><Loader2 className="size-5 animate-spin" />Loading variants...</div> : variants.length === 0 ? <div className="flex min-h-64 flex-col items-center justify-center px-6 text-center"><Boxes className="size-10 text-muted-foreground" /><h2 className="mt-3 font-semibold">No variants yet</h2><p className="mt-1 text-sm text-muted-foreground">Create variants such as RAM, storage, color or capacity.</p></div> : (
          <div className="divide-y">
            {variants.map((variant) => (
              <div key={variant._id} className="p-4 sm:p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(variant.attributes).map(([key, value]) => <span key={key} className="rounded-lg bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">{key}: {value}</span>)}
                      {!variant.isActive && <span className="rounded-lg bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground">Inactive</span>}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span>SKU: <strong className="font-mono text-foreground">{variant.sku ?? "—"}</strong></span>
                      <span>Barcode: <strong className="font-mono text-foreground">{variant.barcode ?? "—"}</strong></span>
                      <span>Stock: <strong className="text-foreground">{variant.stockQuantity}</strong></span>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="mr-2"><p className="text-xs text-muted-foreground">Selling</p><p className="font-bold">{currency(variant.sellingPrice)}</p></div>
                    <div className="mr-2"><p className="text-xs text-muted-foreground">Profit</p><p className={variant.sellingPrice >= variant.purchasePrice ? "font-semibold text-emerald-600 dark:text-emerald-400" : "font-semibold text-red-600 dark:text-red-400"}>{currency(variant.profitAmount ?? (variant.sellingPrice - variant.purchasePrice))}</p></div>
                    {variant.isActive && <button type="button" onClick={() => openStock(variant, "in")} className="inline-flex items-center gap-1 rounded-lg border px-2.5 py-2 text-xs font-semibold hover:bg-muted"><Plus className="size-3.5" />Stock in</button>}
                    {variant.isActive && <button type="button" onClick={() => openStock(variant, "out")} disabled={variant.stockQuantity <= 0} className="inline-flex items-center gap-1 rounded-lg border px-2.5 py-2 text-xs font-semibold hover:bg-muted disabled:opacity-40"><Minus className="size-3.5" />Stock out</button>}
                    <button type="button" onClick={() => openEdit(variant)} className="rounded-lg border px-3 py-2 text-xs font-semibold hover:bg-muted">Edit</button>
                    {variant.isActive && <button type="button" onClick={() => void deactivate(variant)} disabled={variant.stockQuantity > 0} title={variant.stockQuantity > 0 ? "Stock must be zero before deactivation" : "Deactivate"} className="rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:opacity-40"><Trash2 className="size-4" /></button>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {formOpen && <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
        <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border bg-card shadow-2xl">
          <div className="flex items-center justify-between border-b p-5"><div><h2 className="font-semibold">{editing ? "Edit variant" : "Add variant"}</h2><p className="text-xs text-muted-foreground">Every variant keeps its own SKU, barcode, price and stock.</p></div><button type="button" onClick={() => setFormOpen(false)} disabled={saving} className="rounded-lg p-2 hover:bg-muted"><X className="size-4" /></button></div>
          <form onSubmit={submit} className="space-y-5 p-5">
            <div>
              <div className="mb-2 flex items-center justify-between"><span className="text-xs font-semibold text-muted-foreground">Attributes</span><button type="button" onClick={() => setForm((f) => ({ ...f, attributes: [...f.attributes, { key: "", value: "" }] }))} className="text-xs font-semibold text-primary">+ Add attribute</button></div>
              <div className="space-y-2">{form.attributes.map((row, index) => <div key={index} className="grid grid-cols-[1fr_1fr_auto] gap-2"><input value={row.key} onChange={(e) => updateAttribute(index, "key", e.target.value)} placeholder="e.g. RAM" className="h-10 rounded-lg border bg-background px-3 text-sm outline-none focus:border-primary" /><input value={row.value} onChange={(e) => updateAttribute(index, "value", e.target.value)} placeholder="e.g. 16 GB" className="h-10 rounded-lg border bg-background px-3 text-sm outline-none focus:border-primary" /><button type="button" disabled={form.attributes.length === 1} onClick={() => setForm((f) => ({ ...f, attributes: f.attributes.filter((_, i) => i !== index) }))} className="rounded-lg p-2 text-muted-foreground hover:bg-muted disabled:opacity-30"><X className="size-4" /></button></div>)}</div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                ["SKU", "sku", "text"], ["Barcode", "barcode", "text"], ["Purchase price", "purchasePrice", "number"], ["Selling price", "sellingPrice", "number"], ["Initial stock", "stockQuantity", "number"], ["Low-stock alert", "lowStockThreshold", "number"], ["Warranty months", "warrantyPeriodMonths", "number"],
              ].map(([label, field, type]) => <label key={field} className="block"><span className="mb-1.5 block text-xs font-medium text-muted-foreground">{label}</span><input type={type} min={type === "number" ? "0" : undefined} step={type === "number" ? "0.01" : undefined} value={form[field as keyof FormState] as string} onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))} className="h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none focus:border-primary" /></label>)}
            </div>
            <div className="flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:justify-end"><button type="button" onClick={() => setFormOpen(false)} disabled={saving} className="h-10 rounded-xl border px-4 text-sm font-medium hover:bg-muted">Cancel</button><button type="submit" disabled={saving} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60">{saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}{editing ? "Save changes" : "Create variant"}</button></div>
          </form>
        </div>
      </div>}

      {stockTarget && <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
        <div className="w-full max-w-md rounded-2xl border bg-card shadow-2xl">
          <div className="flex items-center justify-between border-b p-5"><div><h2 className="font-semibold">{stockType === "in" ? "Add variant stock" : "Remove variant stock"}</h2><p className="mt-1 text-xs text-muted-foreground">{variantLabel(stockTarget)}</p></div><button type="button" onClick={() => setStockTarget(null)} disabled={stockSaving} className="rounded-lg p-2 hover:bg-muted"><X className="size-4" /></button></div>
          <form onSubmit={adjustStock} className="space-y-4 p-5">
            <label className="block"><span className="mb-1.5 block text-xs font-medium text-muted-foreground">Quantity</span><input autoFocus type="number" min="0.01" step="0.01" value={stockQuantity} onChange={(e) => setStockQuantity(e.target.value)} className="h-10 w-full rounded-xl border bg-background px-3 text-sm" /></label>
            <label className="block"><span className="mb-1.5 block text-xs font-medium text-muted-foreground">Reason</span><input value={stockReason} onChange={(e) => setStockReason(e.target.value)} maxLength={500} placeholder={stockType === "in" ? "Purchase / restock" : "Damaged / adjustment"} className="h-10 w-full rounded-xl border bg-background px-3 text-sm" /></label>
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><button type="button" onClick={() => setStockTarget(null)} disabled={stockSaving} className="h-10 rounded-xl border px-4 text-sm hover:bg-muted">Cancel</button><button type="submit" disabled={stockSaving} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-60">{stockSaving && <Loader2 className="size-4 animate-spin" />}{stockType === "in" ? "Add stock" : "Remove stock"}</button></div>
          </form>
        </div>
      </div>}
    </div>
  );
}
