import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "https://billnest-backend-oq1j.onrender.com/api";

type PublicWarrantyData = {
  warranty: {
    id: string;
    productName: string;
    serialNumber?: string;
    warrantyPeriodMonths: number;
    startDate: string;
    expiryDate: string;
    status: string;
    terms?: string;
    notes?: string;
  };
  customer?: {
    name?: string;
  } | null;
  shop?: {
    name?: string;
    phone?: string;
    email?: string;
    address?: string;
  } | null;
};

function formatDate(value?: string) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function statusText(status: string) {
  if (status === "active") return "ACTIVE WARRANTY";
  if (status === "expiring_soon") return "EXPIRING SOON";
  if (status === "expired") return "EXPIRED";
  return status.replaceAll("_", " ").toUpperCase();
}

export default function PublicWarrantyCardPage() {
  const { warrantyId, token } = useParams<{
    warrantyId: string;
    token: string;
  }>();

  const [data, setData] = useState<PublicWarrantyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function load() {
      if (!warrantyId || !token) {
        setError("Invalid warranty verification link.");
        setLoading(false);
        return;
      }

      try {
        const url = `${API_URL}/public/warranties/${encodeURIComponent(
          warrantyId,
        )}/${encodeURIComponent(token)}`;

        const response = await fetch(url, {
          method: "GET",
          headers: { Accept: "application/json" },
        });

        const text = await response.text();
        let result: { data?: PublicWarrantyData; message?: string } = {};

        try {
          result = text ? JSON.parse(text) : {};
        } catch {
          throw new Error(
            `Server returned an invalid response (HTTP ${response.status}).`,
          );
        }

        if (!response.ok) {
          throw new Error(
            result.message || `Warranty verification failed (HTTP ${response.status}).`,
          );
        }

        if (!result.data?.warranty) {
          throw new Error("Warranty data was not returned by the server.");
        }

        if (active) setData(result.data);
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load the warranty card.",
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, [warrantyId, token]);

  if (loading) {
    return (
      <main style={pageStyle}>
        <div style={messageStyle}>
          <div style={spinnerStyle} />
          <h1 style={titleStyle}>Verifying Warranty</h1>
          <p style={mutedStyle}>Please wait while BillNest verifies this card.</p>
        </div>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main style={pageStyle}>
        <div style={errorCardStyle}>
          <div style={badgeStyle}>BILLNEST</div>
          <h1 style={titleStyle}>Warranty Card Unavailable</h1>
          <p style={mutedStyle}>{error || "The warranty could not be verified."}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            style={buttonStyle}
          >
            Try Again
          </button>
        </div>
      </main>
    );
  }

  const { warranty, customer, shop } = data;
  const publicUrl = window.location.href;
  const qrUrl =
    "https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=12&data=" +
    encodeURIComponent(publicUrl);

  return (
    <main style={pageStyle}>
      <div style={containerStyle}>
        <div style={brandRowStyle}>
          <div>
            <div style={brandStyle}>BILLNEST</div>
            <div style={mutedSmallStyle}>DIGITAL WARRANTY VERIFICATION</div>
          </div>
          <div style={statusStyle}>{statusText(warranty.status)}</div>
        </div>

        <section style={cardStyle}>
          <div style={headerStyle}>
            <div>
              <div style={eyebrowStyle}>VERIFIED WARRANTY CARD</div>
              <h1 style={productTitleStyle}>{warranty.productName}</h1>
              <div style={mutedStyle}>Genuine BillNest warranty record</div>
            </div>
            <div style={verifiedStyle}>✓ Digitally Verified</div>
          </div>

          <div style={bodyStyle}>
            <div style={mainGridStyle}>
              <div>
                <section style={sectionStyle}>
                  <div style={sectionTitleStyle}>PRODUCT & WARRANTY</div>
                  <div style={detailsGridStyle}>
                    <Detail label="Product" value={warranty.productName} />
                    <Detail
                      label="Serial Number"
                      value={warranty.serialNumber || "Not provided"}
                    />
                    <Detail label="Start Date" value={formatDate(warranty.startDate)} />
                    <Detail label="Expiry Date" value={formatDate(warranty.expiryDate)} />
                    <Detail
                      label="Warranty Period"
                      value={`${warranty.warrantyPeriodMonths} month${warranty.warrantyPeriodMonths === 1 ? "" : "s"}`}
                    />
                    <Detail label="Status" value={statusText(warranty.status)} />
                  </div>
                </section>

                <div style={twoColumnStyle}>
                  <section style={sectionStyle}>
                    <div style={sectionTitleStyle}>CUSTOMER</div>
                    <div style={valueStyle}>{customer?.name || "Customer"}</div>
                    <div style={mutedSmallStyle}>Warranty holder</div>
                  </section>

                  <section style={sectionStyle}>
                    <div style={sectionTitleStyle}>PURCHASE STORE</div>
                    <div style={valueStyle}>{shop?.name || "Store"}</div>
                    {shop?.address && (
                      <div style={mutedSmallStyle}>{shop.address}</div>
                    )}
                  </section>
                </div>

                {(shop?.phone || shop?.email) && (
                  <section style={sectionStyle}>
                    <div style={sectionTitleStyle}>STORE SUPPORT</div>
                    <div style={supportStyle}>
                      {shop.phone && <span>☎ {shop.phone}</span>}
                      {shop.email && <span>✉ {shop.email}</span>}
                    </div>
                  </section>
                )}

                {warranty.terms && (
                  <section style={sectionStyle}>
                    <div style={sectionTitleStyle}>WARRANTY TERMS</div>
                    <div style={termsStyle}>{warranty.terms}</div>
                  </section>
                )}
              </div>

              <aside style={qrPanelStyle}>
                <div style={qrHeadingStyle}>VERIFY THIS WARRANTY</div>
                <div style={mutedSmallStyle}>
                  Scan this QR code from any device to open this verified warranty card.
                </div>
                <div style={qrBoxStyle}>
                  <img
                    src={qrUrl}
                    alt="Warranty verification QR code"
                    width={210}
                    height={210}
                    style={{ display: "block", width: "210px", height: "210px" }}
                  />
                </div>
                <div style={mutedSmallStyle}>
                  Computer generated card
                  <br />
                  Signature not required
                </div>
              </aside>
            </div>

            <div style={footerStyle}>
              This warranty card is digitally verified by BillNest. Keep your original
              invoice for service requests.
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={labelStyle}>{label}</div>
      <div style={valueStyle}>{value}</div>
    </div>
  );
}

const pageStyle: React.CSSProperties = {
  minHeight: "100vh",
  background: "#030712",
  color: "#fff",
  padding: "32px 16px",
  fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
};

const containerStyle: React.CSSProperties = {
  width: "100%",
  maxWidth: 1180,
  margin: "0 auto",
};

const brandRowStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 16,
  marginBottom: 20,
};

const brandStyle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 800,
  letterSpacing: "0.28em",
  color: "#60a5fa",
};

const mutedSmallStyle: React.CSSProperties = {
  fontSize: 12,
  lineHeight: 1.6,
  color: "rgba(255,255,255,.45)",
};

const mutedStyle: React.CSSProperties = {
  fontSize: 14,
  lineHeight: 1.6,
  color: "rgba(255,255,255,.55)",
};

const statusStyle: React.CSSProperties = {
  border: "1px solid rgba(52,211,153,.25)",
  background: "rgba(52,211,153,.08)",
  color: "#6ee7b7",
  borderRadius: 999,
  padding: "9px 14px",
  fontSize: 11,
  fontWeight: 800,
  letterSpacing: ".08em",
};

const cardStyle: React.CSSProperties = {
  overflow: "hidden",
  border: "1px solid rgba(255,255,255,.10)",
  borderRadius: 24,
  background: "#070c16",
  boxShadow: "0 30px 80px rgba(0,0,0,.35)",
};

const headerStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-end",
  gap: 24,
  padding: "38px 40px",
  borderBottom: "1px solid rgba(255,255,255,.08)",
  background: "linear-gradient(110deg, rgba(37,99,235,.13), transparent 60%)",
};

const eyebrowStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 700,
  letterSpacing: ".16em",
  color: "rgba(255,255,255,.45)",
};

const productTitleStyle: React.CSSProperties = {
  margin: "8px 0",
  fontSize: "clamp(28px, 5vw, 46px)",
  lineHeight: 1.05,
  fontWeight: 800,
  letterSpacing: "-.03em",
};

const verifiedStyle: React.CSSProperties = {
  color: "#60a5fa",
  fontSize: 13,
  fontWeight: 700,
  whiteSpace: "nowrap",
};

const bodyStyle: React.CSSProperties = {
  padding: "32px 40px 28px",
};

const mainGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) 280px",
  gap: 24,
};

const sectionStyle: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,.08)",
  borderRadius: 18,
  background: "rgba(255,255,255,.018)",
  padding: 22,
  marginBottom: 20,
};

const sectionTitleStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 800,
  letterSpacing: ".12em",
  color: "#60a5fa",
  marginBottom: 18,
};

const detailsGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "22px 28px",
};

const labelStyle: React.CSSProperties = {
  fontSize: 10,
  textTransform: "uppercase",
  letterSpacing: ".12em",
  color: "rgba(255,255,255,.32)",
  marginBottom: 5,
};

const valueStyle: React.CSSProperties = {
  fontSize: 15,
  fontWeight: 650,
  lineHeight: 1.5,
  wordBreak: "break-word",
};

const twoColumnStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: 20,
};

const supportStyle: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 16,
  color: "rgba(255,255,255,.6)",
  fontSize: 13,
};

const termsStyle: React.CSSProperties = {
  whiteSpace: "pre-wrap",
  color: "rgba(255,255,255,.55)",
  fontSize: 13,
  lineHeight: 1.8,
};

const qrPanelStyle: React.CSSProperties = {
  alignSelf: "start",
  border: "1px solid rgba(96,165,250,.20)",
  borderRadius: 22,
  background: "linear-gradient(180deg, rgba(37,99,235,.10), rgba(255,255,255,.015))",
  padding: 22,
  textAlign: "center",
};

const qrHeadingStyle: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 800,
  marginBottom: 8,
};

const qrBoxStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  margin: "18px auto",
  width: 242,
  height: 242,
  maxWidth: "100%",
  borderRadius: 18,
  background: "#fff",
  padding: 16,
};

const footerStyle: React.CSSProperties = {
  borderTop: "1px solid rgba(255,255,255,.08)",
  paddingTop: 20,
  textAlign: "center",
  color: "rgba(255,255,255,.30)",
  fontSize: 11,
  lineHeight: 1.6,
};

const messageStyle: React.CSSProperties = {
  width: "100%",
  maxWidth: 460,
  margin: "18vh auto 0",
  textAlign: "center",
};

const errorCardStyle: React.CSSProperties = {
  width: "100%",
  maxWidth: 520,
  margin: "14vh auto 0",
  border: "1px solid rgba(255,255,255,.10)",
  borderRadius: 24,
  background: "#070c16",
  padding: 36,
  textAlign: "center",
};

const titleStyle: React.CSSProperties = {
  margin: "16px 0 8px",
  fontSize: 26,
  fontWeight: 800,
};

const badgeStyle: React.CSSProperties = {
  color: "#60a5fa",
  fontSize: 12,
  fontWeight: 800,
  letterSpacing: ".25em",
};

const spinnerStyle: React.CSSProperties = {
  width: 38,
  height: 38,
  margin: "0 auto",
  border: "3px solid rgba(255,255,255,.12)",
  borderTopColor: "#60a5fa",
  borderRadius: "50%",
  animation: "spin 1s linear infinite",
};

const buttonStyle: React.CSSProperties = {
  marginTop: 22,
  border: 0,
  borderRadius: 10,
  padding: "11px 18px",
  background: "#2563eb",
  color: "#fff",
  fontWeight: 700,
  cursor: "pointer",
};

