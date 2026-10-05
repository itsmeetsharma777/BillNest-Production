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
    address?: string;
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
    <div style={styles.page}>
      <div style={styles.wrapper}>
        <header style={styles.top}>
          <div>
            <div style={styles.logo}>BILLNEST</div>
            <div style={styles.caption}>DIGITAL WARRANTY CARD</div>
          </div>
          <div style={styles.active}>✓ VERIFIED</div>
        </header>

        <div style={styles.card}>
          <div style={styles.hero}>
            <div>
              <div style={styles.caption}>PRODUCT WARRANTY</div>
              <h1 style={styles.product}>{warranty.productName}</h1>
              <p style={styles.muted}>Official BillNest warranty record</p>
            </div>
            <div style={styles.verified}>DIGITALLY VERIFIED</div>
          </div>

          <div style={styles.content}>
            <div style={styles.grid}>
              <div>
                <section style={styles.section}>
                  <h2 style={styles.sectionTitle}>WARRANTY DETAILS</h2>
                  <Info label="Product" value={warranty.productName} />
                  <Info
                    label="Serial Number"
                    value={warranty.serialNumber || "Not provided"}
                  />
                  <Info
                    label="Warranty Period"
                    value={String(warranty.warrantyPeriodMonths) + " months"}
                  />
                  <Info
                    label="Start Date"
                    value={formatDate(warranty.startDate)}
                  />
                  <Info
                    label="Expiry Date"
                    value={formatDate(warranty.expiryDate)}
                  />
                  <Info
                    label="Status"
                    value={warranty.status.toUpperCase()}
                  />
                </section>

                <section style={styles.section}>
                  <h2 style={styles.sectionTitle}>CUSTOMER</h2>
                  <div style={styles.value}>
                    {customer?.name || "Warranty Holder"}
                  </div>
                </section>

                <section style={styles.section}>
                  <h2 style={styles.sectionTitle}>PURCHASE STORE</h2>
                  <div style={styles.value}>{shop?.name || "Store"}</div>
                  {shop?.address && (
                    <div style={styles.muted}>{shop.address}</div>
                  )}
                  {shop?.phone && (
                    <div style={styles.muted}>☎ {shop.phone}</div>
                  )}
                  {shop?.email && (
                    <div style={styles.muted}>✉ {shop.email}</div>
                  )}
                </section>

                {warranty.terms && (
                  <section style={styles.section}>
                    <h2 style={styles.sectionTitle}>TERMS</h2>
                    <div style={styles.muted}>{warranty.terms}</div>
                  </section>
                )}
              </div>

              <aside style={styles.qrPanel}>
                <h2 style={styles.sectionTitle}>SCAN TO VERIFY</h2>
                <div style={styles.qrBox}>
                  <img
                    src={qrUrl}
                    alt="Warranty verification QR code"
                    style={styles.qr}
                  />
                </div>
                <p style={styles.caption}>
                  Scan from any device to open this warranty card.
                </p>
                <p style={styles.caption}>
                  Computer generated • Signature not required
                </p>
              </aside>
            </div>

            <footer style={styles.footer}>
              This warranty card is digitally verified by BillNest.
            </footer>
          </div>
        </div>
      </div>
    </div>
  );
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
