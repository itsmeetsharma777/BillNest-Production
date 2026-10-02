import { Barcode, Check, ChevronDown, Loader2, Search, ScanLine, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:5001/api";

export interface Product {
  _id: string;
  name: string;
  sku?: string | null;
  category?: string | null;
  brand?: string | null;
  barcode?: string | null;
  unit?: string | null;
  sellingPrice: number;
  stockQuantity: number;
  isActive: boolean;
  productId?: string;
  variantId?: string;
  variantName?: string;
  variantAttributes?: Record<string, string>;
}

interface Variant {
  _id: string;
  productId: string;
  attributes: Record<string, string>;
  sku?: string | null;
  barcode?: string | null;
  sellingPrice: number;
  stockQuantity: number;
  isActive: boolean;
}

interface Props {
  value: string;
  onSelect: (product: Product) => void;
  onClear: () => void;
}

function currency(value: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(value);
}
function variantLabel(v: Variant) {
  return Object.entries(v.attributes).map(([key, value]) => `${key}: ${value}`).join(" • ");
}

export default function ProductSelector({ value, onSelect, onClear }: Props) {
  const [products, setProducts] = useState<Product[]>([]);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [loading, setLoading] = useState(true);
  const [variantsLoading, setVariantsLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [variantProduct, setVariantProduct] = useState<Product | null>(null);
  const [search, setSearch] = useState("");
  const [barcode, setBarcode] = useState("");
  const [barcodeLoading, setBarcodeLoading] = useState(false);
  const [barcodeError, setBarcodeError] = useState("");
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const response = await fetch(`${API_URL}/products?limit=100&isActive=true`, { credentials: "include" });
        const result = await response.json().catch(() => null);
        if (!response.ok) throw new Error(result?.message ?? "Unable to load products.");
        if (!cancelled) setProducts((result?.data?.products ?? result?.products ?? []).filter((p: Product) => p.isActive));
      } catch {
        if (!cancelled) setProducts([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return products;
    return products.filter(p => [p.name, p.sku, p.category, p.brand, p.barcode].filter(Boolean).some(v => String(v).toLowerCase().includes(q)));
  }, [products, search]);

  async function selectProduct(product: Product) {
    setBarcodeError("");
    setVariants([]);
    setVariantProduct(null);
    setVariantsLoading(true);
    try {
      const response = await fetch(`${API_URL}/product-variants/${product._id}?isActive=true`, { credentials: "include" });
      const result = await response.json().catch(() => null);
      if (!response.ok) throw new Error(result?.message ?? "Unable to load variants.");
      const next = (result?.data?.variants ?? []) as Variant[];
      if (next.length) {
        setVariants(next);
        setVariantProduct(product);
        return;
      }
      if (product.stockQuantity <= 0) throw new Error(`Product found, but it is out of stock: ${product.name}.`);
      onSelect(product);
      setOpen(false);
    } catch (e) {
      if (e instanceof Error && e.message.includes("out of stock")) setBarcodeError(e.message);
      else if (product.stockQuantity > 0) {
        onSelect(product);
        setOpen(false);
      } else setBarcodeError("This product has no available stock.");
    } finally {
      setVariantsLoading(false);
    }
  }

  function selectVariant(variant: Variant) {
    if (!variantProduct || variant.stockQuantity <= 0) return;
    const attributes = variant.attributes;
    onSelect({
      ...variantProduct,
      _id: variant._id,
      productId: variantProduct._id,
      variantId: variant._id,
      variantName: variantLabel(variant),
      variantAttributes: attributes,
      sku: variant.sku ?? variantProduct.sku,
      barcode: variant.barcode ?? variantProduct.barcode,
      sellingPrice: variant.sellingPrice,
      stockQuantity: variant.stockQuantity,
    });
    setVariants([]);
    setVariantProduct(null);
    setSearch("");
    setOpen(false);
  }

  async function lookupBarcode(value: string) {
    const code = value.trim();
    if (!code) { setBarcodeError("Scan or enter a barcode first."); return; }
    setBarcodeLoading(true);
    setBarcodeError("");
    try {
      const variantResponse = await fetch(`${API_URL}/product-variants/barcode/${encodeURIComponent(code)}`, { credentials: "include" });
      const variantResult = await variantResponse.json().catch(() => null);
      if (variantResponse.ok && variantResult?.data?.variant) {
        const v = variantResult.data.variant as Variant;
        const product = products.find(p => p._id === v.productId);
        if (!product) throw new Error("The variant's parent product is not available.");
        if (v.stockQuantity <= 0) throw new Error("This variant is out of stock.");
        selectVariant({ ...v, productId: product._id });
        return;
      }

      const response = await fetch(`${API_URL}/products/barcode/${encodeURIComponent(code)}`, { credentials: "include" });
      const result = await response.json().catch(() => null);
      if (!response.ok) throw new Error(result?.message ?? "No product was found with this barcode.");
      const product = result?.data?.product ?? result?.product;
      if (!product) throw new Error("No product was found with this barcode.");
      if (product.stockQuantity <= 0) throw new Error(`Product found, but it is out of stock: ${product.name}.`);
      onSelect(product);
      setBarcode("");
      setOpen(false);
    } catch (e) {
      setBarcodeError(e instanceof Error ? e.message : "Unable to look up barcode.");
    } finally {
      setBarcodeLoading(false);
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <span className="mb-1.5 block text-xs font-medium text-muted-foreground">Product</span>
      <button type="button" onClick={() => setOpen(v => !v)} className="flex h-10 w-full items-center justify-between rounded-lg border bg-background px-3 text-left text-sm hover:bg-muted/40 focus:border-primary focus:ring-2 focus:ring-primary/20">
        <span className={value ? "truncate" : "truncate text-muted-foreground"}>{value || "Select a product"}</span>
        <ChevronDown className={`size-4 shrink-0 text-muted-foreground ${open ? "rotate-180" : ""}`} />
      </button>

      {open && <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-xl border bg-popover shadow-xl">
        <form onSubmit={e => { e.preventDefault(); void lookupBarcode(barcode); }} className="border-b bg-primary/[0.03] p-3">
          <div className="mb-2 flex items-center gap-2"><ScanLine className="size-4 text-primary" /><p className="text-xs font-semibold">Scan barcode</p></div>
          <div className="flex gap-2">
            <div className="relative flex-1"><Barcode className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><input value={barcode} onChange={e => { setBarcode(e.target.value); setBarcodeError(""); }} autoFocus autoComplete="off" placeholder="Scan or type barcode..." className="h-10 w-full rounded-lg border bg-background pl-9 pr-3 font-mono text-sm" /></div>
            <button type="submit" disabled={barcodeLoading} className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-3 text-xs font-semibold text-primary-foreground disabled:opacity-60">{barcodeLoading ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}Lookup</button>
          </div>
          {barcodeError && <p className="mt-2 rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-[11px] text-destructive">{barcodeError}</p>}
        </form>

        <div className="border-b p-2"><div className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search product, SKU, category, brand..." className="h-10 w-full rounded-lg border bg-background pl-9 pr-3 text-sm" /></div></div>

        {variantProduct ? <div className="max-h-72 overflow-y-auto">
          <div className="flex items-center justify-between border-b p-3"><div><p className="text-xs font-semibold">Choose variant</p><p className="text-[11px] text-muted-foreground">{variantProduct.name}</p></div><button type="button" onClick={() => { setVariantProduct(null); setVariants([]); }} className="rounded-lg p-1 hover:bg-muted"><X className="size-4" /></button></div>
          {variantsLoading ? <div className="p-6 text-center text-sm text-muted-foreground"><Loader2 className="mx-auto size-4 animate-spin" /></div> : variants.map(v => <button key={v._id} type="button" disabled={v.stockQuantity <= 0} onClick={() => selectVariant(v)} className="flex w-full items-center gap-3 px-3 py-3 text-left hover:bg-muted disabled:opacity-40"><div className="min-w-0 flex-1"><p className="text-sm font-medium">{variantLabel(v)}</p><p className="mt-1 text-[11px] text-muted-foreground">SKU: {v.sku ?? "—"} · Stock: {v.stockQuantity}</p></div><span className="text-sm font-semibold">{currency(v.sellingPrice)}</span></button>)}
        </div> : loading ? <div className="p-6 text-center text-sm text-muted-foreground"><Loader2 className="mx-auto size-4 animate-spin" /></div> : <div className="max-h-72 overflow-y-auto">
          {value && <button type="button" onClick={() => { onClear(); setOpen(false); }} className="flex w-full items-center gap-2 border-b px-3 py-2.5 text-xs text-muted-foreground hover:bg-muted"><X className="size-3.5" />Clear selection</button>}
          {filteredProducts.length === 0 ? <p className="p-5 text-center text-sm text-muted-foreground">No matching products found.</p> : filteredProducts.map(product => {
            const selected = product.name === value;
            return <button key={product._id} type="button" disabled={product.stockQuantity <= 0 || variantsLoading} onClick={() => void selectProduct(product)} className={`flex w-full items-center gap-3 px-3 py-3 text-left hover:bg-muted disabled:opacity-50 ${selected ? "bg-primary/10" : ""}`}>
              <div className="min-w-0 flex-1"><div className="flex items-center gap-2"><p className="truncate text-sm font-medium">{product.name}</p>{selected && <Check className="size-4 text-primary" />}</div><p className="mt-1 text-[11px] text-muted-foreground">{product.sku ? `SKU: ${product.sku} · ` : ""}Stock: {product.stockQuantity}</p></div>
              <span className="shrink-0 text-sm font-semibold">{currency(product.sellingPrice)}</span>
            </button>;
          })}
        </div>}
      </div>}
    </div>
  );
}
