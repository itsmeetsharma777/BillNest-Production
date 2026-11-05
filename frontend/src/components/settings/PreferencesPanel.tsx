import { useEffect, useState } from "react";
import { Check, Loader2, Save, Settings2, Palette, Trash2 } from "lucide-react";\nimport { useTheme } from "@/context/theme-context";

const API_URL = import.meta.env.PROD ? "/api" : (import.meta.env.VITE_API_URL ?? "http://localhost:5001/api");

type Field = { key: string; label: string; kind: "toggle" | "select"; options?: string[]; description?: string };
type Section = { title: string; description: string; fields: Field[] };

const shopkeeperSections: Section[] = [
  { title: "Invoice Preferences", description: "Defaults used while creating invoices.", fields: [
    { key: "invoicePrefix", label: "Invoice prefix", kind: "select", options: ["INV", "BILL", "BN"] },
    { key: "invoiceDefaultPayment", label: "Default payment method", kind: "select", options: ["Cash", "UPI", "Bank Transfer", "Razorpay"] },
    { key: "invoiceDefaultStatus", label: "Default invoice status", kind: "select", options: ["Paid", "Unpaid", "Partially Paid"] },
    { key: "invoiceTerms", label: "Include standard terms & conditions", kind: "toggle" },
  ]},
  { title: "Tax & Payments", description: "Set invoice tax and payment preferences.", fields: [
    { key: "taxDefaultMode", label: "Tax pricing mode", kind: "select", options: ["GST exclusive", "GST inclusive"] },
    { key: "taxDefaultRate", label: "Default tax rate", kind: "select", options: ["0%", "5%", "12%", "18%", "28%"] },
    { key: "paymentCash", label: "Allow Cash", kind: "toggle" },
    { key: "paymentUpi", label: "Allow UPI", kind: "toggle" },
    { key: "paymentBank", label: "Allow Bank Transfer", kind: "toggle" },
    { key: "paymentRazorpay", label: "Allow Razorpay", kind: "toggle" },
  ]},
  { title: "Inventory Preferences", description: "Stock alerts and inventory defaults.", fields: [
    { key: "lowStockThreshold", label: "Low-stock alert threshold", kind: "select", options: ["1 unit", "3 units", "5 units", "10 units", "20 units"] },
    { key: "stockTracking", label: "Track stock movements", kind: "toggle" },
    { key: "stockAlerts", label: "Enable low-stock notifications", kind: "toggle" },
  ]},
  { title: "Warranty Preferences", description: "Default warranty behavior.", fields: [
    { key: "warrantyDefaultDuration", label: "Default warranty duration", kind: "select", options: ["No warranty", "30 days", "3 months", "6 months", "1 year", "2 years"] },
    { key: "warrantyExpiryAlerts", label: "Warranty expiry notifications", kind: "toggle" },
    { key: "warrantyTerms", label: "Include default warranty terms", kind: "toggle" },
  ]},
  { title: "Notifications", description: "Choose which in-app alerts you receive.", fields: [
    { key: "notifyInvoice", label: "Invoice created or updated", kind: "toggle" },
    { key: "notifyPayment", label: "Payment received", kind: "toggle" },
    { key: "notifyStock", label: "Low stock", kind: "toggle" },
    { key: "notifyWarranty", label: "Warranty updates", kind: "toggle" },
    { key: "notifySystem", label: "System announcements", kind: "toggle" },
  ]},
  { title: "Appearance", description: "Display preferences.", fields: [
    { key: "theme", label: "Theme", kind: "select", options: ["System", "Light", "Dark"] },
    { key: "layoutDensity", label: "Layout density", kind: "select", options: ["Comfortable", "Compact"] },
  ]},
  { title: "Integrations", description: "Preference toggles only; integration credentials remain managed by their secure setup flows.", fields: [
    { key: "integrationRazorpay", label: "Use Razorpay integration", kind: "toggle" },
    { key: "integrationWhatsapp", label: "Enable WhatsApp sharing", kind: "toggle" },
    { key: "integrationOcr", label: "Enable AI OCR workflow", kind: "toggle" },
  ]},
];

const customerSections: Section[] = [
  { title: "Notifications", description: "Choose which customer updates you receive.", fields: [
    { key: "notifyInvoice", label: "Bill and invoice updates", kind: "toggle" },
    { key: "notifyPaymentReminder", label: "Payment reminders", kind: "toggle" },
    { key: "notifyWarranty", label: "Warranty expiry alerts", kind: "toggle" },
    { key: "notifyUpload", label: "Bill upload and OCR status", kind: "toggle" },
    { key: "notifySystem", label: "System announcements", kind: "toggle" },
  ]},
  { title: "Invoice Preferences", description: "Your preferred invoice presentation.", fields: [
    { key: "invoiceView", label: "Default bill view", kind: "select", options: ["Detailed", "Compact"] },
    { key: "invoiceDownload", label: "Download format", kind: "select", options: ["PDF", "Original document when available"] },
  ]},
  { title: "Warranty Preferences", description: "Warranty reminder preferences.", fields: [
    { key: "warrantyReminderTiming", label: "Remind me before expiry", kind: "select", options: ["7 days", "15 days", "30 days"] },
    { key: "warrantyAlerts", label: "Enable warranty reminders", kind: "toggle" },
  ]},
  { title: "Appearance", description: "Display preferences.", fields: [
    { key: "theme", label: "Theme", kind: "select", options: ["System", "Light", "Dark"] },
    { key: "layoutDensity", label: "Layout density", kind: "select", options: ["Comfortable", "Compact"] },
  ]},
  { title: "Privacy & Data", description: "Privacy preference settings.", fields: [
    { key: "dataExportFormat", label: "Preferred export format", kind: "select", options: ["JSON", "CSV"] },
    { key: "personalizedNotices", label: "Allow personalized in-app notices", kind: "toggle" },
  ]},
];

const defaults: Record<string, string | boolean> = {
  invoicePrefix: "INV", invoiceDefaultPayment: "Cash", invoiceDefaultStatus: "Paid", invoiceTerms: true,
  taxDefaultMode: "GST exclusive", taxDefaultRate: "0%", paymentCash: true, paymentUpi: true, paymentBank: true, paymentRazorpay: true,
  lowStockThreshold: "5 units", stockTracking: true, stockAlerts: true,
  warrantyDefaultDuration: "1 year", warrantyExpiryAlerts: true, warrantyTerms: true,
  notifyInvoice: true, notifyPayment: true, notifyStock: true, notifyWarranty: true, notifySystem: true,
  theme: "System", layoutDensity: "Comfortable", integrationRazorpay: true, integrationWhatsapp: true, integrationOcr: true,
  notifyPaymentReminder: true, notifyUpload: true, invoiceView: "Detailed", invoiceDownload: "PDF",
  warrantyReminderTiming: "30 days", warrantyAlerts: true, dataExportFormat: "JSON", personalizedNotices: true,
};

export default function PreferencesPanel({ role }: { role: "shopkeeper" | "customer" }) {
  const sections = role === "shopkeeper" ? shopkeeperSections : customerSections;\n  const { customThemes, activeCustomThemeId, saveCustomTheme, applyCustomTheme, deleteCustomTheme } = useTheme();\n  const [customThemeName, setCustomThemeName] = useState("");\n  const [customThemeMode, setCustomThemeMode] = useState<"light" | "dark">("dark");\n  const [customPrimary, setCustomPrimary] = useState("#3b82f6");\n  const [customBackground, setCustomBackground] = useState("#09090b");\n  const [customSurface, setCustomSurface] = useState("#18181b");
  const [values, setValues] = useState<Record<string, string | boolean>>(defaults);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let active = true;
    fetch(`${API_URL}/user-preferences`, { credentials: "include" })
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json.message ?? "Unable to load preferences.");
        if (active && json.data && typeof json.data === "object") setValues((prev) => ({ ...prev, ...json.data }));
      })
      .catch((e) => { if (active) setError(e instanceof Error ? e.message : "Unable to load preferences."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  function change(key: string, value: string | boolean) {
    setValues((current) => ({ ...current, [key]: value }));
    setError("");
    setSuccess("");
  }

  async function save() {
    setSaving(true); setError(""); setSuccess("");
    try {
      const response = await fetch(`${API_URL}/user-preferences`, {
        method: "PATCH", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preferences: Object.fromEntries(sections.flatMap((section) => section.fields.map((field) => [field.key, values[field.key] ?? defaults[field.key]]))) }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message ?? "Unable to save preferences.");
      setValues((current) => ({ ...current, ...result.data }));
      setSuccess("Preferences saved.");
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to save preferences."); }
    finally { setSaving(false); }
  }

  if (loading) return <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin"/>Loading preferences…</div>;

  return <div className="mt-8 space-y-5">
    <section className="rounded-2xl border bg-card p-5">
      <div className="mb-4 flex items-center gap-3"><span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary"><Palette className="size-4"/></span><div><h3 className="font-semibold">Appearance & Theme Studio</h3><p className="text-xs text-muted-foreground">Choose a saved custom theme or create your own colors. Themes are stored in this browser.</p></div></div>
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => applyCustomTheme(null)} className="rounded-lg border px-3 py-2 text-sm">Use standard theme</button>
        {customThemes.map((item) => <div key={item.id} className="flex items-center gap-1 rounded-lg border p-1">
          <button type="button" onClick={() => applyCustomTheme(item.id)} aria-pressed={activeCustomThemeId === item.id} className="rounded-md px-3 py-1.5 text-sm" style={{ backgroundColor: item.background, color: item.primary, border: "1px solid " + item.primary }}>{item.name}</button>
          <button type="button" onClick={() => deleteCustomTheme(item.id)} aria-label={"Delete " + item.name} className="rounded-md p-2 text-muted-foreground hover:text-destructive"><Trash2 className="size-3.5"/></button>
        </div>)}
      </div>
      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <label className="space-y-1.5 text-sm">Theme name<input value={customThemeName} onChange={(e) => setCustomThemeName(e.target.value)} maxLength={32} placeholder="Midnight Blue" className="h-10 w-full rounded-lg border bg-background px-3"/></label>
        <label className="space-y-1.5 text-sm">Base mode<select value={customThemeMode} onChange={(e) => setCustomThemeMode(e.target.value as "light" | "dark")} className="h-10 w-full rounded-lg border bg-background px-3"><option value="dark">Dark</option><option value="light">Light</option></select></label>
        <label className="space-y-1.5 text-sm">Primary color<input type="color" value={customPrimary} onChange={(e) => setCustomPrimary(e.target.value)} className="h-10 w-full rounded-lg border bg-background p-1"/></label>
        <label className="space-y-1.5 text-sm">Background color<input type="color" value={customBackground} onChange={(e) => setCustomBackground(e.target.value)} className="h-10 w-full rounded-lg border bg-background p-1"/></label>
        <label className="space-y-1.5 text-sm">Card / surface color<input type="color" value={customSurface} onChange={(e) => setCustomSurface(e.target.value)} className="h-10 w-full rounded-lg border bg-background p-1"/></label>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3"><div className="flex h-10 flex-1 items-center gap-3 rounded-xl border p-2" style={{ background: customBackground, color: customPrimary }}><span className="size-5 rounded-md" style={{ background: customPrimary }}/><span className="text-sm font-semibold">{customThemeName.trim() || "Your theme preview"}</span><span className="ml-auto rounded-md px-2 py-1 text-xs" style={{ background: customSurface }}>Surface preview</span></div><button type="button" disabled={!customThemeName.trim()} onClick={() => { saveCustomTheme({ name: customThemeName.trim(), mode: customThemeMode, primary: customPrimary, background: customBackground, surface: customSurface }); setCustomThemeName(""); }} className="h-10 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground disabled:opacity-40">Create & apply theme</button></div>
    </section>
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><h2 className="text-2xl font-bold">Preferences</h2><p className="text-sm text-muted-foreground">Manage your BillNest experience.</p></div>
      <button onClick={save} disabled={saving} className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground disabled:opacity-50">{saving ? <Loader2 className="size-4 animate-spin"/> : <Save className="size-4"/>}{saving ? "Saving…" : "Save preferences"}</button>
    </div>
    {error && <p role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{error}</p>}
    {success && <p role="status" className="flex items-center gap-2 rounded-xl border border-green-500/30 bg-green-500/5 p-3 text-sm text-green-700 dark:text-green-400"><Check className="size-4"/>{success}</p>}
    <div className="grid gap-5 lg:grid-cols-2">
      {sections.map((section) => <section key={section.title} className="rounded-2xl border bg-card p-5">
        <div className="mb-4 flex items-center gap-3"><span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary"><Settings2 className="size-4"/></span><div><h3 className="font-semibold">{section.title}</h3><p className="text-xs text-muted-foreground">{section.description}</p></div></div>
        <div className="space-y-3">{section.fields.map((field) => <div key={field.key} className="flex items-center justify-between gap-4 border-t pt-3 first:border-0 first:pt-0">
          <label htmlFor={field.key} className="text-sm">{field.label}</label>
          {field.kind === "toggle" ? <input id={field.key} type="checkbox" checked={Boolean(values[field.key] ?? defaults[field.key])} onChange={(e) => change(field.key, e.target.checked)} className="size-4 accent-primary"/> : <select id={field.key} value={String(values[field.key] ?? defaults[field.key] ?? field.options?.[0])} onChange={(e) => change(field.key, e.target.value)} className="max-w-[52%] rounded-lg border bg-background px-3 py-2 text-sm">{field.options?.map((option) => <option key={option}>{option}</option>)}</select>}
        </div>)}</div>
      </section>)}
    </div>
  </div>;
}
