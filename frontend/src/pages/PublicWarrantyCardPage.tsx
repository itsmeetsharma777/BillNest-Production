import { Component, useEffect, useState } from "react";
import type { ErrorInfo, ReactNode } from "react";
import { useParams } from "react-router-dom";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "https://billnest-backend-oq1j.onrender.com/api";

type WarrantyResponse = {
  warranty: {
    id: string;
    productName: string;
    serialNumber?: string;
    warrantyPeriodMonths: number;
    startDate: string;
    expiryDate: string;
    status: string;
    terms?: string;
  };
  customer?: { name?: string } | null;
  shop?: {
    name?: string;
    phone?: string;
    email?: string;
    address?: unknown;
  } | null;
};

class WarrantyErrorBoundary extends Component<
  { children: ReactNode },
  { error: string | null }
> {
  state = { error: null as string | null };

  static getDerivedStateFromError(error: unknown) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "The warranty card could not be displayed.",
    };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Warranty card error:", error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div style={styles.page}>
          <div style={styles.message}>
            <div style={styles.logo}>BILLNEST</div>
            <h1 style={styles.heading}>Warranty Card Error</h1>
            <p style={styles.muted}>{this.state.error}</p>
            <button
              style={styles.button}
              onClick={() => window.location.reload()}
            >
              Reload
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

function formatDate(value?: string) {
  if (!value) return "Not available";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Not available"
    : date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
}

function formatAddress(address: unknown): string {
  if (!address) return "";
  if (typeof address === "string") return address;
  if (typeof address !== "object") return String(address);

  const value = address as Record<string, unknown>;
  return [
    value.line1,
    value.line2,
    value.addressLine1,
    value.addressLine2,
    value.area,
    value.city,
    value.state,
    value.postalCode,
    value.pincode,
    value.country,
  ]
    .filter((part) => typeof part === "string" && part.trim())
    .join(", ");
}

function PublicWarrantyCardContent() {
  const { warrantyId, token } = useParams<{
    warrantyId: string;
    token: string;
  }>();

  const [data, setData] = useState<WarrantyResponse | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadWarranty = async () => {
      try {
        if (!warrantyId || !token) {
          throw new Error("Invalid warranty card URL.");
        }

        const endpoint =
          API_URL.replace(/\/$/, "") +
          "/public/warranties/" +
          encodeURIComponent(warrantyId) +
          "/" +
          encodeURIComponent(token);

        console.log("Warranty API:", endpoint);

        const response = await fetch(endpoint, {
          method: "GET",
          headers: { Accept: "application/json" },
        });

        const body = await response.text();

        let json: {
          success?: boolean;
          data?: WarrantyResponse;
          message?: string;
        };

        try {
          json = JSON.parse(body);
        } catch {
          throw new Error(
            "BillNest server returned an invalid response. HTTP " +
              response.status,
          );
        }

        if (!response.ok || !json.data?.warranty) {
          throw new Error(
            json.message ||
              "Warranty verification failed. HTTP " + response.status,
          );
        }

        setData(json.data);
      } catch (e) {
        console.error("Warranty loading error:", e);
        setError(
          e instanceof Error
            ? e.message
            : "Unable to load this warranty card.",
        );
      } finally {
        setLoading(false);
      }
    };

    void loadWarranty();
  }, [warrantyId, token]);

  if (loading) {
    return (
      <div style={styles.page}>
        <div style={styles.message}>
          <div style={styles.logo}>BILLNEST</div>
          <h1 style={styles.heading}>Verifying Warranty</h1>
          <p style={styles.muted}>
            Connecting to BillNest warranty verification...
          </p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={styles.page}>
        <div style={styles.message}>
          <div style={styles.logo}>BILLNEST</div>
          <h1 style={styles.heading}>Warranty Card Unavailable</h1>
          <p style={styles.muted}>{error || "No warranty data found."}</p>
          <button
            style={styles.button}
            onClick={() => window.location.reload()}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const { warranty, customer, shop } = data;
  const publicUrl = window.location.href;
  const qrUrl =
    "https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=10&data=" +
    encodeURIComponent(publicUrl);

  return (
    <div className="warranty-page" style={styles.page}>
      <style>{responsiveStyles}</style>
      <div className="warranty-wrapper" style={styles.wrapper}>
        <header className="warranty-top" style={styles.top}>
          <div className="brand-block">
            <div className="brand-mark">B</div>
            <div>
              <div className="brand-name">BillNest</div>
              <div className="brand-subtitle">Customer Portal</div>
            </div>
          </div>
          <div className="brand-tagline">GENUINE PRODUCTS&nbsp; • &nbsp;PEACE OF MIND</div>
        </header>

        <div className="warranty-card" style={styles.card}>
          <section className="warranty-hero" style={styles.hero}>
            <div>
              <div className="hero-kicker">WARRANTY CARD</div>
              <h1 className="hero-title">Warranty Card</h1>
              <p className="hero-subtitle">Covered today. Supported tomorrow.</p>
              <div className="hero-line" />
            </div>
            <div className="valid-block">
              <div className="valid-badge">
                <span className="valid-icon">✓</span>
                VALID WARRANTY
              </div>
              <div className="valid-note">Keep this card for future reference</div>
            </div>
          </section>

          <section className="details-panel">
            <div className="details-column details-left">
              <Info label="Product" value={warranty.productName} />
              <Info label="Customer" value={customer?.name || "Warranty Holder"} />
              <Info label="Serial Number" value={warranty.serialNumber || "Not provided"} />
            </div>
            <div className="details-divider" />
            <div className="details-column details-right">
              <Info label="Warranty Start Date" value={formatDate(warranty.startDate)} />
              <Info label="Warranty End Date" value={formatDate(warranty.expiryDate)} />
              <Info label="Warranty Period" value={String(warranty.warrantyPeriodMonths) + " Months"} />
              <Info label="Warranty Status" value={warranty.status.toUpperCase()} />
            </div>
          </section>

          <section className="bottom-panel">
            <div className="store-column">
              <div className="panel-heading">PURCHASE STORE</div>
              <div className="store-name">{shop?.name || "Store"}</div>
              {Boolean(shop?.address) && (
                <div className="store-text">{formatAddress(shop?.address)}</div>
              )}
              {shop?.phone && <div className="store-text">☎ {shop.phone}</div>}
              {shop?.email && <div className="store-text">✉ {shop.email}</div>}
            </div>

            <div className="qr-column">
              <div className="qr-box-large">
                <img src={qrUrl} alt="Warranty verification QR code" style={styles.qr} />
              </div>
              <div className="qr-title">Scan to Verify</div>
              <div className="qr-subtitle">Verify this warranty card<br />on BillNest</div>
            </div>

            <div className="notes-column">
              <div className="panel-heading">IMPORTANT NOTES</div>
              <ul className="notes-list">
                <li>This warranty covers manufacturing defects only.</li>
                <li>Keep this card and original invoice.</li>
                <li>Warranty is valid only with matching serial number.</li>
                <li>For service or support, contact the purchase store.</li>
              </ul>
            </div>
          </section>

          {warranty.terms && (
            <section className="terms-panel">
              <div className="panel-heading">TERMS</div>
              <div className="store-text">{warranty.terms}</div>
            </section>
          )}

          <footer className="warranty-footer" style={styles.footer}>
            This warranty card is digitally verified by BillNest • Computer generated • Signature not required
          </footer>
        </div>
      </div>
    </div>
  );
}
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div style={styles.info}>
      <div style={styles.label}>{label}</div>
      <div style={styles.value}>{value}</div>
    </div>
  );
}

export default function PublicWarrantyCardPage() {
  return (
    <WarrantyErrorBoundary>
      <PublicWarrantyCardContent />
    </WarrantyErrorBoundary>
  );
}


const responsiveStyles = `
  * { box-sizing: border-box; }
  .warranty-page { width: 100%; overflow-x: hidden; }
  .warranty-wrapper { width: 100%; }
  .warranty-top { min-height: 72px; }
  .brand-block { display:flex; align-items:center; gap:12px; }
  .brand-mark { width:46px; height:46px; border-radius:13px; display:grid; place-items:center; color:#fff; font-size:25px; font-weight:900; background:linear-gradient(135deg,#38bdf8,#2563eb 55%,#7c3aed); box-shadow:0 8px 25px rgba(37,99,235,.25); }
  .brand-name { color:#f8fafc; font-size:30px; line-height:1; font-weight:850; letter-spacing:-.04em; }
  .brand-subtitle { color:#91a4c5; font-size:15px; margin-top:5px; }
  .brand-tagline { color:#9fb1d0; font-size:12px; letter-spacing:.14em; font-weight:600; }
  .warranty-card { border-color:rgba(96,165,250,.32)!important; }
  .warranty-hero { min-height:190px; }
  .hero-kicker { color:#91a4c5; font-size:13px; letter-spacing:.14em; font-weight:700; }
  .hero-title { margin:8px 0 3px; color:#f8fafc; font-size:clamp(42px,5vw,68px); line-height:1; letter-spacing:-.055em; font-weight:850; }
  .hero-subtitle { margin:8px 0 0; color:#8ea3c7; font-size:21px; }
  .hero-line { width:68px; height:3px; margin-top:20px; border-radius:99px; background:#3b82f6; }
  .valid-block { text-align:center; min-width:300px; }
  .valid-badge { display:flex; align-items:center; justify-content:center; gap:12px; min-height:64px; padding:0 24px; border:1px solid rgba(96,165,250,.55); border-radius:999px; color:#7db9ff; font-size:16px; letter-spacing:.08em; font-weight:800; }
  .valid-icon { width:32px; height:32px; display:grid; place-items:center; border-radius:50%; background:#9ac7ff; color:#07101f; font-size:20px; font-weight:900; }
  .valid-note { margin-top:12px; color:#9aaaca; font-size:13px; }
  .details-panel, .bottom-panel { margin:20px 34px 0; border:1px solid rgba(255,255,255,.08); border-radius:22px; background:rgba(3,12,25,.72); }
  .details-panel { display:grid; grid-template-columns:minmax(0,1fr) 1px minmax(0,1fr); padding:26px 34px; gap:34px; }
  .details-column { min-width:0; }
  .details-divider { width:1px; background:rgba(148,163,184,.2); }
  .details-panel .info { margin:0; padding:0 0 20px; }
  .details-panel .info + .info { padding-top:18px; border-top:1px solid rgba(255,255,255,.08); }
  .details-panel .label { color:#8ea3c7; font-size:12px; letter-spacing:.14em; font-weight:600; }
  .details-panel .value { color:#f1f5f9; font-size:20px; font-weight:750; line-height:1.35; overflow-wrap:anywhere; }
  .details-right .info:last-child .value { color:#34d399; }
  .bottom-panel { display:grid; grid-template-columns:1.15fr .7fr 1.15fr; padding:28px 34px; gap:28px; align-items:center; }
  .store-column, .qr-column, .notes-column { min-width:0; }
  .qr-column { border-left:1px solid rgba(148,163,184,.2); border-right:1px solid rgba(148,163,184,.2); text-align:center; padding:0 28px; }
  .panel-heading { color:#8ea3c7; font-size:12px; letter-spacing:.14em; font-weight:700; margin-bottom:10px; }
  .store-name { color:#f1f5f9; font-size:20px; font-weight:750; margin-bottom:4px; }
  .store-text { color:#91a4c5; font-size:15px; line-height:1.6; overflow-wrap:anywhere; }
  .qr-box-large { width:128px; height:128px; padding:7px; margin:0 auto 10px; border-radius:8px; background:#fff; }
  .qr-title { color:#f8fafc; font-size:21px; font-weight:800; }
  .qr-subtitle { color:#91a4c5; font-size:14px; line-height:1.4; margin-top:4px; }
  .notes-list { list-style:none; padding:0; margin:0; }
  .notes-list li { position:relative; padding-left:18px; color:#91a4c5; font-size:14px; line-height:1.55; margin:8px 0; }
  .notes-list li:before { content:""; width:8px; height:8px; border-radius:50%; background:#3b82f6; position:absolute; left:0; top:.55em; }
  .terms-panel { margin:20px 34px 0; padding:22px 26px; border:1px solid rgba(255,255,255,.08); border-radius:18px; background:rgba(255,255,255,.02); }
  .warranty-footer { margin:20px 34px 0; }
  @media (max-width: 820px) {
    .warranty-page { padding:16px 10px!important; }
    .warranty-top { align-items:flex-start!important; margin-bottom:14px!important; }
    .brand-tagline { display:none; }
    .brand-name { font-size:24px; }
    .brand-subtitle { font-size:12px; }
    .brand-mark { width:40px; height:40px; font-size:21px; border-radius:11px; }
    .warranty-card { border-radius:20px!important; }
    .warranty-hero { padding:26px 20px!important; display:block!important; min-height:0!important; }
    .hero-title { font-size:44px; }
    .hero-subtitle { font-size:17px; }
    .valid-block { min-width:0; margin-top:24px; text-align:left; }
    .valid-badge { width:100%; min-height:54px; font-size:13px; }
    .valid-note { text-align:center; }
    .details-panel { grid-template-columns:1fr; gap:0; margin:14px 14px 0; padding:20px; border-radius:17px; }
    .details-divider { display:none; }
    .details-column + .details-column { margin-top:0; }
    .details-panel .info { padding:14px 0!important; }
    .details-panel .value { font-size:17px; }
    .bottom-panel { grid-template-columns:1fr; margin:14px 14px 0; padding:20px; gap:22px; border-radius:17px; }
    .qr-column { border-left:0; border-right:0; border-top:1px solid rgba(148,163,184,.2); border-bottom:1px solid rgba(148,163,184,.2); padding:22px 0; }
    .store-text { font-size:14px; }
    .notes-list li { font-size:13px; }
    .terms-panel { margin:14px 14px 0; padding:18px; }
    .warranty-footer { margin:16px 20px 0; font-size:10px!important; line-height:1.5; }
  }
  @media (max-width: 430px) {
    .warranty-page { padding:8px 6px!important; }
    .hero-title { font-size:38px; }
    .hero-subtitle { font-size:15px; }
    .details-panel, .bottom-panel { margin-left:8px; margin-right:8px; padding:16px; }
    .details-panel .value { font-size:16px; }
    .qr-box-large { width:150px; height:150px; }
  }
`;

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    boxSizing: "border-box",
    background: "#020617",
    color: "#f8fafc",
    padding: "32px 16px",
    fontFamily:
      "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
  },
  wrapper: { maxWidth: 1100, margin: "0 auto" },
  top: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 16,
    marginBottom: 20,
  },
  logo: {
    color: "#60a5fa",
    fontSize: 14,
    fontWeight: 900,
    letterSpacing: "0.28em",
  },
  caption: {
    color: "rgba(255,255,255,.42)",
    fontSize: 11,
    letterSpacing: ".12em",
    lineHeight: 1.6,
  },
  active: {
    color: "#6ee7b7",
    background: "rgba(52,211,153,.08)",
    border: "1px solid rgba(52,211,153,.25)",
    borderRadius: 999,
    padding: "8px 13px",
    fontSize: 11,
    fontWeight: 800,
  },
  card: {
    overflow: "hidden",
    background: "#07101f",
    border: "1px solid rgba(255,255,255,.10)",
    borderRadius: 24,
    boxShadow: "0 30px 90px rgba(0,0,0,.45)",
  },
  hero: {
    padding: "38px 40px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    gap: 20,
    borderBottom: "1px solid rgba(255,255,255,.08)",
  },
  product: {
    margin: "8px 0",
    fontSize: "clamp(28px,5vw,48px)",
    lineHeight: 1.05,
    letterSpacing: "-.04em",
  },
  verified: { color: "#60a5fa", fontSize: 12, fontWeight: 800 },
  content: { padding: 32 },
  grid: {
    display: "grid",
    gridTemplateColumns: "minmax(0,1fr) 300px",
    gap: 24,
  },
  section: {
    padding: 20,
    marginBottom: 18,
    border: "1px solid rgba(255,255,255,.08)",
    borderRadius: 16,
    background: "rgba(255,255,255,.018)",
  },
  sectionTitle: {
    margin: "0 0 16px",
    color: "#60a5fa",
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: ".12em",
  },
  info: { marginBottom: 15 },
  label: {
    color: "rgba(255,255,255,.35)",
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: ".1em",
    marginBottom: 4,
  },
  value: { fontSize: 15, fontWeight: 650, lineHeight: 1.5 },
  muted: {
    color: "rgba(255,255,255,.55)",
    fontSize: 13,
    lineHeight: 1.7,
    wordBreak: "break-word",
  },
  qrPanel: {
    padding: 22,
    borderRadius: 18,
    border: "1px solid rgba(96,165,250,.20)",
    background: "rgba(37,99,235,.06)",
    textAlign: "center",
    alignSelf: "start",
  },
  qrBox: {
    background: "#fff",
    padding: 15,
    borderRadius: 16,
    width: 260,
    maxWidth: "100%",
    boxSizing: "border-box",
    margin: "18px auto",
  },
  qr: { display: "block", width: "100%", height: "auto" },
  footer: {
    borderTop: "1px solid rgba(255,255,255,.08)",
    paddingTop: 20,
    color: "rgba(255,255,255,.35)",
    fontSize: 11,
    textAlign: "center",
  },
  message: {
    maxWidth: 560,
    margin: "15vh auto",
    padding: 36,
    boxSizing: "border-box",
    textAlign: "center",
    borderRadius: 24,
    border: "1px solid rgba(255,255,255,.10)",
    background: "#07101f",
  },
  heading: { margin: "14px 0 8px", fontSize: 28, fontWeight: 800 },
  button: {
    marginTop: 20,
    border: 0,
    borderRadius: 10,
    padding: "11px 20px",
    background: "#2563eb",
    color: "#fff",
    fontWeight: 700,
    cursor: "pointer",
  },
};
