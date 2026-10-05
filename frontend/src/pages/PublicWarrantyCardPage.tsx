import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  Mail,
  Phone,
  QrCode,
  ShieldCheck,
  Store,
  Tag,
  UserRound,
  XCircle,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import { Card, CardContent } from "@/components/ui/card";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "https://billnest-backend-oq1j.onrender.com/api";

interface PublicWarrantyData {
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
    logoUrl?: string;
  } | null;
}

function formatDate(value?: string) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function getStatusLabel(status: string) {
  switch (status) {
    case "active":
      return "Active";
    case "expiring_soon":
      return "Expiring Soon";
    case "expired":
      return "Expired";
    default:
      return "Warranty";
  }
}

function getStatusClass(status: string) {
  switch (status) {
    case "active":
      return "border-emerald-500/20 bg-emerald-500/10 text-emerald-400";
    case "expiring_soon":
      return "border-amber-500/20 bg-amber-500/10 text-amber-400";
    case "expired":
      return "border-red-500/20 bg-red-500/10 text-red-400";
    default:
      return "border-primary/20 bg-primary/10 text-primary";
  }
}

function StatusIcon({ status }: { status: string }) {
  if (status === "active") {
    return <CheckCircle2 className="size-4" />;
  }

  if (status === "expiring_soon") {
    return <Clock3 className="size-4" />;
  }

  return <XCircle className="size-4" />;
}

export default function PublicWarrantyCardPage() {
  const {
    warrantyId,
    token,
  } = useParams<{
    warrantyId: string;
    token: string;
  }>();

  const [data, setData] =
    useState<PublicWarrantyData | null>(null);
  const [isLoading, setIsLoading] =
    useState(true);
  const [error, setError] =
    useState("");

  useEffect(() => {
    let mounted = true;

    async function loadCard() {
      if (!warrantyId || !token) {
        setError(
          "This warranty verification link is invalid.",
        );
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `${API_URL}/public/warranties/${warrantyId}/${token}`,
        );

        const result =
          await response.json();

        if (!response.ok) {
          throw new Error(
            result?.message ??
              "Warranty card not found.",
          );
        }

        if (mounted) {
          setData(
            result?.data ?? null,
          );
        }
      } catch (err) {
        if (mounted) {
          setError(
            err instanceof Error
              ? err.message
              : "Warranty card not found.",
          );
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    void loadCard();

    return () => {
      mounted = false;
    };
  }, [warrantyId, token]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#030712] px-6 text-white">
        <div className="text-center">
          <div className="mx-auto size-9 animate-spin rounded-full border-2 border-white/10 border-t-blue-500" />
          <p className="mt-4 text-sm text-white/60">
            Verifying warranty card...
          </p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#030712] px-6">
        <Card className="w-full max-w-md border-white/10 bg-[#080d18] text-white">
          <CardContent className="p-8 text-center">
            <ShieldCheck className="mx-auto size-12 text-blue-400" />
            <h1 className="mt-5 text-2xl font-bold">
              Warranty card unavailable
            </h1>
            <p className="mt-2 text-sm text-white/55">
              {error ||
                "This verification link is invalid or the warranty is no longer available."}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const {
    warranty,
    customer,
    shop,
  } = data;

  const publicUrl =
    window.location.href;

  return (
    <main className="min-h-screen bg-[#030712] px-4 py-8 text-white sm:px-6 lg:px-10">
      <div className="mx-auto w-full max-w-6xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.25em] text-blue-400">
              BillNest
            </p>
            <p className="mt-1 text-sm text-white/45">
              Digital Warranty Verification
            </p>
          </div>

          <div
            className={`flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold ${getStatusClass(
              warranty.status,
            )}`}
          >
            <StatusIcon
              status={warranty.status}
            />
            {getStatusLabel(
              warranty.status,
            )}
          </div>
        </div>

        <Card className="overflow-hidden border-white/10 bg-[#070c16] shadow-2xl shadow-blue-950/20">
          <div className="border-b border-white/10 bg-gradient-to-r from-blue-500/[0.08] via-transparent to-blue-500/[0.04] p-6 sm:p-8 lg:p-10">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm text-white/45">
                  Verified Warranty Card
                </p>
                <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
                  {warranty.productName}
                </h1>
                <p className="mt-2 text-sm text-white/45">
                  Genuine BillNest warranty record
                </p>
              </div>

              <div className="flex items-center gap-2 text-sm text-white/50">
                <ShieldCheck className="size-5 text-blue-400" />
                Digitally verified
              </div>
            </div>
          </div>

          <CardContent className="p-6 sm:p-8 lg:p-10">
            <div className="grid gap-6 lg:grid-cols-[1fr_260px]">
              <div className="space-y-6">
                <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 sm:p-6">
                  <div className="mb-5 flex items-center gap-2">
                    <Tag className="size-5 text-blue-400" />
                    <h2 className="font-semibold">
                      Product & Warranty
                    </h2>
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <p className="text-xs uppercase tracking-wider text-white/35">
                        Product
                      </p>
                      <p className="mt-1 font-semibold">
                        {warranty.productName}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs uppercase tracking-wider text-white/35">
                        Serial number
                      </p>
                      <p className="mt-1 font-semibold break-all">
                        {warranty.serialNumber ||
                          "Not provided"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs uppercase tracking-wider text-white/35">
                        Start date
                      </p>
                      <p className="mt-1 flex items-center gap-2 font-semibold">
                        <CalendarDays className="size-4 text-blue-400" />
                        {formatDate(
                          warranty.startDate,
                        )}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs uppercase tracking-wider text-white/35">
                        Expiry date
                      </p>
                      <p className="mt-1 flex items-center gap-2 font-semibold">
                        <CalendarDays className="size-4 text-blue-400" />
                        {formatDate(
                          warranty.expiryDate,
                        )}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs uppercase tracking-wider text-white/35">
                        Warranty period
                      </p>
                      <p className="mt-1 font-semibold">
                        {warranty.warrantyPeriodMonths} month
                        {warranty.warrantyPeriodMonths ===
                        1
                          ? ""
                          : "s"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs uppercase tracking-wider text-white/35">
                        Status
                      </p>
                      <p className="mt-1 font-semibold text-emerald-400">
                        {getStatusLabel(
                          warranty.status,
                        )}
                      </p>
                    </div>
                  </div>
                </section>

                <div className="grid gap-6 sm:grid-cols-2">
                  <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
                    <div className="flex items-center gap-2">
                      <UserRound className="size-5 text-blue-400" />
                      <h2 className="font-semibold">
                        Customer
                      </h2>
                    </div>
                    <p className="mt-4 font-semibold">
                      {customer?.name ||
                        "Customer"}
                    </p>
                    <p className="mt-1 text-sm text-white/45">
                      Warranty holder
                    </p>
                  </section>

                  <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
                    <div className="flex items-center gap-2">
                      <Store className="size-5 text-blue-400" />
                      <h2 className="font-semibold">
                        Purchase store
                      </h2>
                    </div>
                    <p className="mt-4 font-semibold">
                      {shop?.name ||
                        "Store"}
                    </p>
                    {shop?.address && (
                      <p className="mt-1 text-sm leading-6 text-white/45">
                        {shop.address}
                      </p>
                    )}
                  </section>
                </div>

                {(shop?.phone ||
                  shop?.email) && (
                  <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
                    <p className="text-sm font-semibold">
                      Store support
                    </p>

                    <div className="mt-4 flex flex-wrap gap-4 text-sm text-white/55">
                      {shop.phone && (
                        <span className="flex items-center gap-2">
                          <Phone className="size-4 text-blue-400" />
                          {shop.phone}
                        </span>
                      )}

                      {shop.email && (
                        <span className="flex items-center gap-2 break-all">
                          <Mail className="size-4 text-blue-400" />
                          {shop.email}
                        </span>
                      )}
                    </div>
                  </section>
                )}

                {warranty.terms && (
                  <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
                    <h2 className="font-semibold">
                      Warranty terms
                    </h2>
                    <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-white/55">
                      {warranty.terms}
                    </p>
                  </section>
                )}
              </div>

              <aside className="lg:sticky lg:top-8 lg:self-start">
                <div className="rounded-3xl border border-blue-400/20 bg-gradient-to-b from-blue-500/[0.10] to-white/[0.02] p-5 text-center">
                  <div className="mx-auto flex size-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
                    <QrCode className="size-5" />
                  </div>

                  <h2 className="mt-4 font-semibold">
                    Verify this warranty
                  </h2>

                  <p className="mt-1 text-xs leading-5 text-white/45">
                    Scan this QR code from any device to
                    open this verified warranty card.
                  </p>

                  <div className="mx-auto mt-5 flex aspect-square max-w-[210px] items-center justify-center rounded-2xl bg-white p-4">
                    <QRCodeSVG
                      value={publicUrl}
                      size={170}
                      level="H"
                      includeMargin
                    />
                  </div>

                  <p className="mt-4 text-[11px] leading-4 text-white/35">
                    Computer generated card
                    <br />
                    Signature not required
                  </p>
                </div>
              </aside>
            </div>

            <div className="mt-8 border-t border-white/10 pt-6 text-center text-xs text-white/30">
              This warranty card is digitally verified by BillNest.
              Keep your original invoice for service requests.
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
