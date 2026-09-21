import {
  useMemo,
} from "react";

interface SalesPoint {
  date: string;
  sales: number;
  invoices: number;
}

interface PaymentPoint {
  date: string;
  amount: number;
  payments: number;
}

interface PaymentMethod {
  method: string;
  count: number;
  amount: number;
}

interface ProductPoint {
  id: string | null;
  productName: string;
  sku: string | null;
  quantity: number;
  revenue: number;
}

interface CustomerPoint {
  id: string | null;
  name: string;
  email: string | null;
  phone: string | null;
  totalPurchases: number;
  invoiceCount: number;
  totalPaid: number;
  totalDue: number;
}

function formatCurrency(
  value: number,
) {
  return new Intl.NumberFormat(
    "en-IN",
    {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    },
  ).format(Number(value) || 0);
}

function formatCompactCurrency(
  value: number,
) {
  const amount =
    Number(value) || 0;

  if (amount >= 10000000) {
    return `₹${(
      amount / 10000000
    ).toFixed(1)}Cr`;
  }

  if (amount >= 100000) {
    return `₹${(
      amount / 100000
    ).toFixed(1)}L`;
  }

  if (amount >= 1000) {
    return `₹${(
      amount / 1000
    ).toFixed(1)}K`;
  }

  return `₹${Math.round(amount)}`;
}

function formatDate(
  value: string,
) {
  const date = new Date(
    `${value}T00:00:00`,
  );

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return value;
  }

  return new Intl.DateTimeFormat(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
    },
  ).format(date);
}

function formatPaymentMethod(
  value: string,
) {
  return value
    .replaceAll("_", " ")
    .replace(
      /\b\w/g,
      (letter) =>
        letter.toUpperCase(),
    );
}

/* ========================================================= */
/* SALES CHART                                               */
/* ========================================================= */

export function SalesPerformanceChart({
  data,
}: {
  data: SalesPoint[];
}) {
  const chart = useMemo(() => {
    if (data.length === 0) {
      return null;
    }

    const width = 900;
    const height = 340;

    const paddingLeft = 64;
    const paddingRight = 24;
    const paddingTop = 28;
    const paddingBottom = 52;

    const chartWidth =
      width -
      paddingLeft -
      paddingRight;

    const chartHeight =
      height -
      paddingTop -
      paddingBottom;

    const maxValue =
      Math.max(
        ...data.map(
          (item) => item.sales,
        ),
        1,
      );

    const minValue = 0;

    const getX = (
      index: number,
    ) => {
      if (data.length === 1) {
        return (
          paddingLeft +
          chartWidth / 2
        );
      }

      return (
        paddingLeft +
        (index /
          (data.length - 1)) *
          chartWidth
      );
    };

    const getY = (
      value: number,
    ) => {
      const ratio =
        (value - minValue) /
        (maxValue - minValue ||
          1);

      return (
        paddingTop +
        chartHeight -
        ratio * chartHeight
      );
    };

    const points = data.map(
      (item, index) => ({
        x: getX(index),
        y: getY(item.sales),
        ...item,
      }),
    );

    const linePath = points
      .map(
        (point, index) =>
          `${
            index === 0
              ? "M"
              : "L"
          } ${point.x} ${point.y}`,
      )
      .join(" ");

    const areaPath = [
      `M ${points[0].x} ${
        paddingTop +
        chartHeight
      }`,
      ...points.map(
        (point) =>
          `L ${point.x} ${point.y}`,
      ),
      `L ${
        points[
          points.length - 1
        ].x
      } ${
        paddingTop +
        chartHeight
      }`,
      "Z",
    ].join(" ");

    return {
      width,
      height,
      paddingLeft,
      paddingRight,
      paddingTop,
      paddingBottom,
      chartWidth,
      chartHeight,
      maxValue,
      points,
      linePath,
      areaPath,
    };
  }, [data]);

  if (!chart) {
    return (
      <EmptyChart message="No sales data available for this period." />
    );
  }

  const gridValues = [
    1,
    0.75,
    0.5,
    0.25,
    0,
  ];

  return (
    <div className="w-full overflow-hidden">
      <div className="relative h-[340px] w-full min-w-[650px]">
        <svg
          viewBox={`0 0 ${chart.width} ${chart.height}`}
          className="h-full w-full"
          role="img"
          aria-label="Sales performance chart"
        >
          <defs>
            <linearGradient
              id="sales-area-gradient"
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop
                offset="0%"
                stopOpacity="0.28"
              />

              <stop
                offset="100%"
                stopOpacity="0"
              />
            </linearGradient>
          </defs>

          {gridValues.map(
            (ratio) => {
              const y =
                chart.paddingTop +
                chart.chartHeight -
                ratio *
                  chart.chartHeight;

              const value =
                chart.maxValue *
                ratio;

              return (
                <g
                  key={ratio}
                >
                  <line
                    x1={
                      chart.paddingLeft
                    }
                    x2={
                      chart.width -
                      chart.paddingRight
                    }
                    y1={y}
                    y2={y}
                    className="stroke-border"
                    strokeWidth="1"
                    strokeDasharray="4 6"
                  />

                  <text
                    x={
                      chart.paddingLeft -
                      10
                    }
                    y={y + 4}
                    textAnchor="end"
                    className="fill-muted-foreground"
                    fontSize="11"
                  >
                    {formatCompactCurrency(
                      value,
                    )}
                  </text>
                </g>
              );
            },
          )}

          <path
            d={chart.areaPath}
            className="fill-primary/10"
          />

          <path
            d={chart.linePath}
            fill="none"
            className="stroke-primary"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {chart.points.map(
            (point, index) => (
              <g
                key={`${point.date}-${index}`}
              >
                <circle
                  cx={point.x}
                  cy={point.y}
                  r="5"
                  className="fill-background stroke-primary"
                  strokeWidth="3"
                />

                <title>
                  {`${formatDate(
                    point.date,
                  )}: ${formatCurrency(
                    point.sales,
                  )} • ${
                    point.invoices
                  } invoice${
                    point.invoices ===
                    1
                      ? ""
                      : "s"
                  }`}
                </title>

                {(data.length <=
                  12 ||
                  index === 0 ||
                  index ===
                    data.length -
                      1 ||
                  index %
                    Math.ceil(
                      data.length /
                        8,
                    ) ===
                    0) && (
                  <text
                    x={point.x}
                    y={
                      chart.height -
                      18
                    }
                    textAnchor="middle"
                    className="fill-muted-foreground"
                    fontSize="11"
                  >
                    {formatDate(
                      point.date,
                    )}
                  </text>
                )}
              </g>
            ),
          )}
        </svg>
      </div>
    </div>
  );
}

/* ========================================================= */
/* PAYMENT CHART                                             */
/* ========================================================= */

export function PaymentPerformanceChart({
  data,
}: {
  data: PaymentPoint[];
}) {
  const maxValue = useMemo(
    () =>
      Math.max(
        ...data.map(
          (item) => item.amount,
        ),
        1,
      ),
    [data],
  );

  if (data.length === 0) {
    return (
      <EmptyChart message="No payment data available for this period." />
    );
  }

  return (
    <div className="space-y-4">
      {data.map((item) => {
        const percentage =
          Math.max(
            3,
            (item.amount /
              maxValue) *
              100,
          );

        return (
          <div
            key={item.date}
            className="group"
          >
            <div className="mb-1.5 flex items-center justify-between gap-3">
              <span className="text-xs text-muted-foreground">
                {formatDate(
                  item.date,
                )}
              </span>

              <div className="flex items-center gap-3">
                <span className="text-[11px] text-muted-foreground">
                  {item.payments}{" "}
                  payment
                  {item.payments ===
                  1
                    ? ""
                    : "s"}
                </span>

                <span className="text-xs font-semibold">
                  {formatCurrency(
                    item.amount,
                  )}
                </span>
              </div>
            </div>

            <div className="h-2.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500 group-hover:opacity-80"
                style={{
                  width: `${percentage}%`,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ========================================================= */
/* PAYMENT METHOD CHART                                      */
/* ========================================================= */

export function PaymentMethodChart({
  data,
  total,
}: {
  data: PaymentMethod[];
  total: number;
}) {
  if (data.length === 0) {
    return (
      <EmptyChart message="No payment methods recorded for this period." />
    );
  }

  const radius = 78;
  const circumference =
    2 * Math.PI * radius;

  let offset = 0;

  const segments = data.map(
    (item) => {
      const percentage =
        total > 0
          ? item.amount / total
          : 0;

      const dash =
        percentage *
        circumference;

      const segment = {
        ...item,
        percentage:
          percentage * 100,
        dash,
        offset,
      };

      offset += dash;

      return segment;
    },
  );

  return (
    <div className="grid items-center gap-6 sm:grid-cols-[190px_1fr]">
      <div className="relative mx-auto size-[190px]">
        <svg
          viewBox="0 0 190 190"
          className="size-full -rotate-90"
          role="img"
          aria-label="Payment method distribution"
        >
          <circle
            cx="95"
            cy="95"
            r={radius}
            fill="none"
            className="stroke-muted"
            strokeWidth="20"
          />

          {segments.map(
            (segment, index) => (
              <circle
                key={
                  segment.method
                }
                cx="95"
                cy="95"
                r={radius}
                fill="none"
                className={
                  index % 4 === 0
                    ? "stroke-primary"
                    : index % 4 === 1
                      ? "stroke-primary/70"
                      : index % 4 ===
                          2
                        ? "stroke-primary/45"
                        : "stroke-primary/25"
                }
                strokeWidth="20"
                strokeDasharray={`${segment.dash} ${
                  circumference -
                  segment.dash
                }`}
                strokeDashoffset={
                  -segment.offset
                }
                strokeLinecap="butt"
              >
                <title>
                  {`${formatPaymentMethod(
                    segment.method,
                  )}: ${formatCurrency(
                    segment.amount,
                  )}`}
                </title>
              </circle>
            ),
          )}
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-bold">
            {formatCompactCurrency(
              total,
            )}
          </span>

          <span className="text-[11px] text-muted-foreground">
            collected
          </span>
        </div>
      </div>

      <div className="space-y-3">
        {segments.map(
          (segment, index) => (
            <div
              key={
                segment.method
              }
              className="flex items-center justify-between gap-3"
            >
              <div className="flex min-w-0 items-center gap-2">
                <span
                  className={`size-2.5 shrink-0 rounded-full ${
                    index % 4 === 0
                      ? "bg-primary"
                      : index % 4 ===
                          1
                        ? "bg-primary/70"
                        : index % 4 ===
                            2
                          ? "bg-primary/45"
                          : "bg-primary/25"
                  }`}
                />

                <span className="truncate text-sm">
                  {formatPaymentMethod(
                    segment.method,
                  )}
                </span>
              </div>

              <div className="shrink-0 text-right">
                <p className="text-sm font-semibold">
                  {formatCurrency(
                    segment.amount,
                  )}
                </p>

                <p className="text-[11px] text-muted-foreground">
                  {segment.percentage.toFixed(
                    1,
                  )}
                  %
                </p>
              </div>
            </div>
          ),
        )}
      </div>
    </div>
  );
}

/* ========================================================= */
/* TOP PRODUCTS                                              */
/* ========================================================= */

export function TopProductsChart({
  data,
}: {
  data: ProductPoint[];
}) {
  const maxRevenue =
    Math.max(
      ...data.map(
        (item) => item.revenue,
      ),
      1,
    );

  if (data.length === 0) {
    return (
      <EmptyChart message="No product sales recorded for this period." />
    );
  }

  return (
    <div className="space-y-4">
      {data.slice(0, 8).map(
        (product, index) => {
          const percentage =
            Math.max(
              4,
              (product.revenue /
                maxRevenue) *
                100,
            );

          return (
            <div
              key={
                product.id ??
                `${product.productName}-${index}`
              }
              className="group"
            >
              <div className="mb-2 flex items-center gap-3">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">
                  {index + 1}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">
                    {
                      product.productName
                    }
                  </p>

                  <p className="text-[11px] text-muted-foreground">
                    {product.sku
                      ? `SKU: ${product.sku} • `
                      : ""}
                    {product.quantity}{" "}
                    sold
                  </p>
                </div>

                <span className="shrink-0 text-sm font-bold">
                  {formatCompactCurrency(
                    product.revenue,
                  )}
                </span>
              </div>

              <div className="ml-11 h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-500 group-hover:opacity-80"
                  style={{
                    width: `${percentage}%`,
                  }}
                />
              </div>
            </div>
          );
        },
      )}
    </div>
  );
}

/* ========================================================= */
/* TOP CUSTOMERS                                             */
/* ========================================================= */

export function TopCustomersChart({
  data,
}: {
  data: CustomerPoint[];
}) {
  const maxPurchases =
    Math.max(
      ...data.map(
        (item) =>
          item.totalPurchases,
      ),
      1,
    );

  if (data.length === 0) {
    return (
      <EmptyChart message="No customer purchases recorded for this period." />
    );
  }

  return (
    <div className="space-y-3">
      {data.slice(0, 8).map(
        (customer, index) => {
          const percentage =
            Math.max(
              4,
              (customer.totalPurchases /
                maxPurchases) *
                100,
            );

          return (
            <div
              key={
                customer.id ??
                `${customer.name}-${index}`
              }
              className="rounded-xl bg-muted/30 p-3 transition-colors hover:bg-muted/50"
            >
              <div className="flex items-center gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                  {index + 1}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">
                        {customer.name}
                      </p>

                      <p className="truncate text-[11px] text-muted-foreground">
                        {
                          customer.invoiceCount
                        }{" "}
                        invoice
                        {customer.invoiceCount ===
                        1
                          ? ""
                          : "s"}
                      </p>
                    </div>

                    <div className="shrink-0 text-right">
                      <p className="text-sm font-bold">
                        {formatCompactCurrency(
                          customer.totalPurchases,
                        )}
                      </p>

                      {customer.totalDue >
                        0 && (
                        <p className="text-[11px] text-destructive">
                          Due{" "}
                          {formatCompactCurrency(
                            customer.totalDue,
                          )}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{
                        width: `${percentage}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        },
      )}
    </div>
  );
}

/* ========================================================= */
/* EMPTY STATE                                               */
/* ========================================================= */

function EmptyChart({
  message,
}: {
  message: string;
}) {
  return (
    <div className="flex min-h-48 items-center justify-center rounded-xl bg-muted/30 px-6 text-center">
      <p className="text-sm text-muted-foreground">
        {message}
      </p>
    </div>
  );
}