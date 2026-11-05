import { useEffect, useMemo, useState } from "react";
import {
  Bell, Check, ChevronRight, CircleUserRound, Download, FileText, HelpCircle,
  Loader2, Palette, Settings2, Shield, SlidersHorizontal, Store, Trash2, Wallet,
  Award, Save, Sun, Moon, Monitor, Sparkles,
} from "lucide-react";
import { useTheme } from "@/context/theme-context";

const API_URL = import.meta.env.PROD ? "/api" : (import.meta.env.VITE_API_URL ?? "http://localhost:5001/api");

type Field = { key: string; label: string; kind: "toggle" | "select"; options?: string[]; description?: string };
type Section = { title: string; description: string; fields: Field[] };
type Category = { title: string; description: string; icon: typeof Settings2; section?: Section };

const shopkeeperCategories: Category[] = [
  { title: "General", description: "Shop preferences and everyday defaults.", icon: Settings2, section: { title: "General", description: "Set common defaults for your BillNest workspace.", fields: [
    { key: "layoutDensity", label: "Layout density", kind: "select", options: ["Comfortable", "Compact"] },
    { key: "invoiceTerms", label: "Include standard terms & conditions", kind: "toggle" },
  ]}},
  { title: "Appearance", description: "Make BillNest feel like your workspace.", icon: Palette },
  { title: "Personalization", description: "Tune your dashboard and workflow.", icon: SlidersHorizontal, section: { title: "Personalization", description: "Choose how your workspace is presented.", fields: [
    { key: "layoutDensity", label: "Dashboard density", kind: "select", options: ["Comfortable", "Compact"] },
    { key: "stockTracking", label: "Show stock movement tracking", kind: "toggle" },
  ]}},
  { title: "Notifications", description: "Invoice, stock, payment and warranty alerts.", icon: Bell, section: { title: "Notifications", description: "Choose the in-app alerts you receive.", fields: [
    { key: "notifyInvoice", label: "Invoice created or updated", kind: "toggle" },
    { key: "notifyPayment", label: "Payment received", kind: "toggle" },
    { key: "notifyStock", label: "Low stock", kind: "toggle" },
    { key: "notifyWarranty", label: "Warranty updates", kind: "toggle" },
    { key: "notifySystem", label: "System announcements", kind: "toggle" },
  ]}},
  { title: "Privacy & Security", description: "Manage privacy-related preferences.", icon: Shield, section: { title: "Privacy & Security", description: "Control privacy preferences for your account.", fields: [
    { key: "personalizedNotices", label: "Allow personalized in-app notices", kind: "toggle" },
  ]}},
  { title: "Data & Export", description: "Choose your preferred business export format.", icon: Download, section: { title: "Data & Export", description: "Choose the preferred format for data exports.", fields: [
    { key: "dataExportFormat", label: "Preferred export format", kind: "select", options: ["CSV", "JSON"] },
  ]}},
  { title: "Invoices", description: "Invoice numbering, PDF and defaults.", icon: FileText, section: { title: "Invoices", description: "Defaults used when creating invoices.", fields: [
    { key: "invoicePrefix", label: "Invoice prefix", kind: "select", options: ["INV", "BILL", "BN"] },
    { key: "invoiceDefaultStatus", label: "Default invoice status", kind: "select", options: ["Paid", "Unpaid", "Partially Paid"] },
    { key: "invoiceDefaultPayment", label: "Default payment method", kind: "select", options: ["Cash", "UPI", "Bank Transfer", "Razorpay"] },
  ]}},
  { title: "Payments", description: "Payment methods and tax defaults.", icon: Wallet, section: { title: "Payments", description: "Choose which payment methods are available by preference.", fields: [
    { key: "taxDefaultMode", label: "Tax pricing mode", kind: "select", options: ["GST exclusive", "GST inclusive"] },
    { key: "taxDefaultRate", label: "Default tax rate", kind: "select", options: ["0%", "5%", "12%", "18%", "28%"] },
    { key: "paymentCash", label: "Allow Cash", kind: "toggle" },
    { key: "paymentUpi", label: "Allow UPI", kind: "toggle" },
    { key: "paymentBank", label: "Allow Bank Transfer", kind: "toggle" },
    { key: "paymentRazorpay", label: "Allow Razorpay", kind: "toggle" },
  ]}},
  { title: "Warranty", description: "Default duration, terms and alerts.", icon: Award, section: { title: "Warranty", description: "Set warranty-related defaults.", fields: [
    { key: "warrantyDefaultDuration", label: "Default warranty duration", kind: "select", options: ["No warranty", "30 days", "3 months", "6 months", "1 year", "2 years"] },
    { key: "warrantyExpiryAlerts", label: "Warranty expiry notifications", kind: "toggle" },
    { key: "warrantyTerms", label: "Include default warranty terms", kind: "toggle" },
  ]}},
  { title: "Shop / Account", description: "Business profile and account information.", icon: Store, section: { title: "Shop / Account", description: "Your business profile is managed in the Shop Settings form above.", fields: [
    { key: "integrationWhatsapp", label: "Enable WhatsApp sharing preference", kind: "toggle" },
    { key: "integrationOcr", label: "Enable AI OCR workflow preference", kind: "toggle" },
  ]}},
  { title: "Help & Support", description: "Find help and support resources.", icon: HelpCircle, section: { title: "Help & Support", description: "Support resources for your BillNest workspace.", fields: [
    { key: "personalizedNotices", label: "Show helpful in-app guidance", kind: "toggle" },
  ]}},
];

const customerCategories: Category[] = [
  { title: "General", description: "Account preferences.", icon: Settings2, section: { title: "General", description: "Set your everyday BillNest preferences.", fields: [
    { key: "layoutDensity", label: "Layout density", kind: "select", options: ["Comfortable", "Compact"] },
  ]}},
  { title: "Appearance", description: "Make BillNest feel like your space.", icon: Palette },
  { title: "Personalization", description: "Customize your customer dashboard.", icon: SlidersHorizontal, section: { title: "Personalization", description: "Choose your preferred bill presentation.", fields: [
    { key: "invoiceView", label: "Default bill view", kind: "select", options: ["Detailed", "Compact"] },
    { key: "invoiceDownload", label: "Download format", kind: "select", options: ["PDF", "Original document when available"] },
  ]}},
  { title: "Notifications", description: "Warranty, invoice and payment alerts.", icon: Bell, section: { title: "Notifications", description: "Choose which customer updates you receive.", fields: [
    { key: "notifyInvoice", label: "Bill and invoice updates", kind: "toggle" },
    { key: "notifyPaymentReminder", label: "Payment reminders", kind: "toggle" },
    { key: "notifyWarranty", label: "Warranty expiry alerts", kind: "toggle" },
    { key: "notifyUpload", label: "Bill upload and OCR status", kind: "toggle" },
    { key: "notifySystem", label: "System announcements", kind: "toggle" },
  ]}},
  { title: "Privacy & Security", description: "Privacy controls and account preferences.", icon: Shield, section: { title: "Privacy & Security", description: "Control privacy-related preferences.", fields: [
    { key: "personalizedNotices", label: "Allow personalized in-app notices", kind: "toggle" },
  ]}},
  { title: "Data & Export", description: "Choose a preferred data export format.", icon: Download, section: { title: "Data & Export", description: "Choose the preferred export format.", fields: [
    { key: "dataExportFormat", label: "Preferred export format", kind: "select", options: ["JSON", "CSV"] },
  ]}},
  { title: "Invoices", description: "Bill display and download preferences.", icon: FileText, section: { title: "Invoices", description: "Customize how bills are displayed and downloaded.", fields: [
    { key: "invoiceView", label: "Default bill view", kind: "select", options: ["Detailed", "Compact"] },
    { key: "invoiceDownload", label: "Download format", kind: "select", options: ["PDF", "Original document when available"] },
  ]}},
  { title: "Payments", description: "Payment reminder preferences.", icon: Wallet, section: { title: "Payments", description: "Manage payment reminders.", fields: [
    { key: "notifyPaymentReminder", label: "Payment reminders", kind: "toggle" },
  ]}},
  { title: "Warranty", description: "Warranty reminder timing and alerts.", icon: Award, section: { title: "Warranty", description: "Choose when you want warranty reminders.", fields: [
    { key: "warrantyReminderTiming", label: "Remind me before expiry", kind: "select", options: ["7 days", "15 days", "30 days"] },
    { key: "warrantyAlerts", label: "Enable warranty reminders", kind: "toggle" },
  ]}},
  { title: "Shop / Account", description: "Personal profile and contact information.", icon: CircleUserRound, section: { title: "Shop / Account", description: "Your profile and address are managed in the Account Settings form above.", fields: [
    { key: "personalizedNotices", label: "Show account tips", kind: "toggle" },
  ]}},
  { title: "Help & Support", description: "Find help and support resources.", icon: HelpCircle, section: { title: "Help & Support", description: "Support resources for your BillNest account.", fields: [
    { key: "personalizedNotices", label: "Show helpful in-app guidance", kind: "toggle" },
  ]}},
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

const presets = [
  { name: "BillNest Blue", primary: "#3b82f6", background: "#09090b", surface: "#18181b", mode: "dark" as const },
  { name: "Emerald", primary: "#10b981", background: "#07130f", surface: "#10231b", mode: "dark" as const },
  { name: "Rose", primary: "#f43f5e", background: "#fff1f2", surface: "#ffe4e6", mode: "light" as const },
  { name: "Violet", primary: "#8b5cf6", background: "#0e0b18", surface: "#1c1630", mode: "dark" as const },
];

export default function PreferencesPanel({ role }: { role: "shopkeeper" | "customer" }) {
  const categories = role === "shopkeeper" ? shopkeeperCategories : customerCategories;
  const { theme, setTheme, customThemes, activeCustomThemeId, saveCustomTheme, applyCustomTheme, deleteCustomTheme } = useTheme();
  const [activeCategory, setActiveCategory] = useState("General");
  const [customThemeName, setCustomThemeName] = useState("");
  const [customThemeMode, setCustomThemeMode] = useState<"light" | "dark">("dark");
  const [customPrimary, setCustomPrimary] = useState("#3b82f6");
  const [customBackground, setCustomBackground] = useState("#09090b");
  const [customSurface, setCustomSurface] = useState("#18181b");
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

  const activeEntry = categories.find((item) => item.title === activeCategory) ?? categories[0];
  const activeSection = activeEntry.section;

  const categoryValues = useMemo(() => {
    if (!activeSection) return {};
    return Object.fromEntries(activeSection.fields.map((field) => [field.key, values[field.key] ?? defaults[field.key]]));
  }, [activeSection, values]);

  function change(key: string, value: string | boolean) {
    setValues((current) => ({ ...current, [key]: value }));
    setError("");
    setSuccess("");
  }

  async function save() {
    if (!activeSection) return;
    setSaving(true); setError(""); setSuccess("");
    try {
      const response = await fetch(`${API_URL}/user-preferences`, {
        method: "PATCH", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preferences: Object.fromEntries(categories.flatMap((category) => (category.section?.fields ?? []).map((field) => [field.key, values[field.key] ?? defaults[field.key]]))) }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message ?? "Unable to save preferences.");
      setValues((current) => ({ ...current, ...(result.data ?? categoryValues) }));
      setSuccess(`${activeCategory} settings saved.`);
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to save preferences."); }
    finally { setSaving(false); }
  }

  if (loading) return <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin"/>Loading settings…</div>;

  return <div className="mt-8 space-y-5">
    <header>
      <div className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">BillNest · Settings</div>
      <h2 className="mt-2 text-2xl font-bold tracking-tight">Settings</h2>
      <p className="mt-1 text-sm text-muted-foreground">Manage your {role === "shopkeeper" ? "business workspace" : "customer account"} preferences.</p>
    </header>

    <div className="grid gap-5 lg:grid-cols-[230px_minmax(0,1fr)]">
      <aside className="rounded-2xl border bg-card p-2" aria-label="Settings categories">
        <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Settings menu</div>
        <nav className="space-y-1">
          {categories.map((category) => {
            const Icon = category.icon;
            const selected = activeCategory === category.title;
            return <button key={category.title} type="button" onClick={() => { setActiveCategory(category.title); setError(""); setSuccess(""); }} aria-current={selected ? "page" : undefined}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors ${selected ? "bg-primary/10 font-semibold text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}>
              <Icon className="size-4 shrink-0"/><span className="min-w-0 flex-1">{category.title}</span>{selected && <ChevronRight className="size-4"/>}
            </button>;
          })}
        </nav>
      </aside>

      <main className="min-w-0 rounded-2xl border bg-card p-5 sm:p-6">
        <div className="mb-6 border-b pb-5">
          <h3 className="text-xl font-semibold">{activeEntry.title}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{activeEntry.description}</p>
        </div>

        {activeCategory === "Appearance" ? <div className="space-y-6">
          <section>
            <h4 className="font-semibold">Theme</h4><p className="mt-1 text-sm text-muted-foreground">Choose Light, Dark or System appearance.</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              {[{ value: "light", label: "Light", Icon: Sun }, { value: "dark", label: "Dark", Icon: Moon }, { value: "system", label: "System", Icon: Monitor }].map(({ value, label, Icon }) =>
                <button key={value} type="button" onClick={() => { setTheme(value as "light" | "dark" | "system"); setSuccess("Appearance updated."); }} aria-pressed={theme === value}
                  className={`flex items-center gap-3 rounded-xl border p-3 text-sm ${theme === value ? "border-primary bg-primary/5 text-primary" : "hover:bg-muted"}`}><Icon className="size-4"/>{label}{theme === value && <Check className="ml-auto size-4"/>}</button>)}
            </div>
          </section>
          <section>
            <h4 className="font-semibold">Preset themes</h4><p className="mt-1 text-sm text-muted-foreground">Apply a ready-made color palette.</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {presets.map((preset) => <button key={preset.name} type="button" onClick={() => { saveCustomTheme(preset); setSuccess(`${preset.name} theme applied.`); }} className="flex items-center gap-3 rounded-xl border p-3 text-left hover:bg-muted">
                <span className="flex size-10 shrink-0 overflow-hidden rounded-lg border"><span className="w-1/2" style={{ background: preset.background }}/><span className="w-1/2" style={{ background: preset.primary }}/></span><span className="min-w-0"><span className="block text-sm font-medium">{preset.name}</span><span className="block text-xs text-muted-foreground">{preset.mode === "dark" ? "Dark palette" : "Light palette"}</span></span><Sparkles className="ml-auto size-4 text-muted-foreground"/></button>)}
            </div>
          </section>
          <section>
            <h4 className="font-semibold">Custom themes</h4><p className="mt-1 text-sm text-muted-foreground">Create a theme, preview it, and apply it. Themes are saved in this browser.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" onClick={() => applyCustomTheme(null)} className="rounded-lg border px-3 py-2 text-sm">Use standard theme</button>
              {customThemes.map((item) => <div key={item.id} className="flex items-center gap-1 rounded-lg border p-1">
                <button type="button" onClick={() => applyCustomTheme(item.id)} aria-pressed={activeCustomThemeId === item.id} className="rounded-md px-3 py-1.5 text-sm" style={{ backgroundColor: item.background, color: item.primary, border: "1px solid " + item.primary }}>{item.name}</button>
                <button type="button" onClick={() => deleteCustomTheme(item.id)} aria-label={"Delete " + item.name} className="rounded-md p-2 text-muted-foreground hover:text-destructive"><Trash2 className="size-3.5"/></button>
              </div>)}
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="space-y-1.5 text-sm">Theme name<input value={customThemeName} onChange={(e) => setCustomThemeName(e.target.value)} maxLength={32} placeholder="Midnight Blue" className="h-10 w-full rounded-lg border bg-background px-3"/></label>
              <label className="space-y-1.5 text-sm">Base mode<select value={customThemeMode} onChange={(e) => setCustomThemeMode(e.target.value as "light" | "dark")} className="h-10 w-full rounded-lg border bg-background px-3"><option value="dark">Dark</option><option value="light">Light</option></select></label>
              <label className="space-y-1.5 text-sm">Primary / accent color<input type="color" value={customPrimary} onChange={(e) => setCustomPrimary(e.target.value)} className="h-10 w-full rounded-lg border bg-background p-1"/></label>
              <label className="space-y-1.5 text-sm">Background color<input type="color" value={customBackground} onChange={(e) => setCustomBackground(e.target.value)} className="h-10 w-full rounded-lg border bg-background p-1"/></label>
              <label className="space-y-1.5 text-sm">Surface color<input type="color" value={customSurface} onChange={(e) => setCustomSurface(e.target.value)} className="h-10 w-full rounded-lg border bg-background p-1"/></label>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-3"><div className="flex h-12 flex-1 items-center gap-3 rounded-xl border p-2" style={{ background: customBackground, color: customPrimary }}><span className="size-5 rounded-md" style={{ background: customPrimary }}/><span className="text-sm font-semibold">{customThemeName.trim() || "Live theme preview"}</span><span className="ml-auto rounded-md px-2 py-1 text-xs" style={{ background: customSurface }}>Surface</span></div><button type="button" disabled={!customThemeName.trim()} onClick={() => { saveCustomTheme({ name: customThemeName.trim(), mode: customThemeMode, primary: customPrimary, background: customBackground, surface: customSurface }); setCustomThemeName(""); setSuccess("Custom theme created and applied."); }} className="h-10 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground disabled:opacity-40">Create & apply</button></div>
          </section>
        </div> : activeSection ? <div className="space-y-4">
          {activeSection.fields.map((field) => <div key={field.key} className="flex items-center justify-between gap-4 border-b pb-4 last:border-0 last:pb-0">
            <div className="min-w-0"><label htmlFor={field.key} className="text-sm font-medium">{field.label}</label>{field.description && <p className="mt-0.5 text-xs text-muted-foreground">{field.description}</p>}</div>
            {field.kind === "toggle" ? <input id={field.key} type="checkbox" checked={Boolean(values[field.key] ?? defaults[field.key])} onChange={(e) => change(field.key, e.target.checked)} className="size-4 shrink-0 accent-primary"/> :
              <select id={field.key} value={String(values[field.key] ?? defaults[field.key] ?? field.options?.[0])} onChange={(e) => change(field.key, e.target.value)} className="max-w-[55%] rounded-lg border bg-background px-3 py-2 text-sm">{field.options?.map((option) => <option key={option}>{option}</option>)}</select>}
          </div>)}
          <div className="flex justify-end border-t pt-4"><button onClick={save} disabled={saving} className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground disabled:opacity-50">{saving ? <Loader2 className="size-4 animate-spin"/> : <Save className="size-4"/>}{saving ? "Saving…" : "Save changes"}</button></div>
        </div> : <div className="text-sm text-muted-foreground">Settings are available from the profile section of this page.</div>}

        {error && <p role="alert" className="mt-4 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{error}</p>}
        {success && <p role="status" className="mt-4 flex items-center gap-2 rounded-xl border border-green-500/30 bg-green-500/5 p-3 text-sm text-green-700 dark:text-green-400"><Check className="size-4"/>{success}</p>}
      </main>
    </div>
  </div>;
}
