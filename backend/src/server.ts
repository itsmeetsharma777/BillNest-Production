import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";

import { errorMiddleware } from "./middleware/error.middleware";
import { env } from "./config/env";
import { connectDatabase } from "./config/database";

import authRoutes from "./routes/auth.routes";
import shopRoutes from "./routes/shop.routes";
import customerRoutes from "./routes/customer.routes";
import invoiceRoutes from "./routes/invoice.routes";
import passwordResetRoutes from "./routes/password-reset.routes";
import warrantyRoutes from "./routes/warranty.routes";
import reportRoutes from "./routes/report.routes";
import notificationRoutes from "./routes/notification.routes";

import { runWarrantyNotificationCheck } from "./services/warranty-notification.service";

const app = express();

/*
 * Security & request middleware
 */

app.use(
  cors({
    origin: env.FRONTEND_URL,
    credentials: true,
  }),
);

app.use(
  helmet({
    contentSecurityPolicy:
      process.env.NODE_ENV === "production"
        ? undefined
        : false,
  }),
);

app.use(express.json({ limit: "1mb" }));

app.use(
  express.urlencoded({
    extended: true,
  }),
);

app.use(cookieParser());

/*
 * Health check
 */

app.get("/health", (_request, response) => {
  response.status(200).json({
    success: true,
    message: "BillNest API is running",
  });
});

/*
 * API routes
 */

app.use("/api/auth", authRoutes);

app.use(
  "/api/auth",
  passwordResetRoutes,
);

app.use("/api/shops", shopRoutes);

app.use(
  "/api/customers",
  customerRoutes,
);

app.use(
  "/api/invoices",
  invoiceRoutes,
);

app.use(
  "/api/warranties",
  warrantyRoutes,
);

app.use(
  "/api/reports",
  reportRoutes,
);

app.use(
  "/api/notifications",
  notificationRoutes,
);

/*
 * Error handler must remain last.
 */

app.use(errorMiddleware);

/*
 * Warranty notification scheduler
 *
 * The check runs once every hour.
 *
 * Running hourly gives us enough frequency to catch
 * warranties entering the 30-day expiration window
 * without requiring a separate cron dependency.
 */

const WARRANTY_NOTIFICATION_INTERVAL_MS =
  60 * 60 * 1000;

function startWarrantyNotificationScheduler() {
  const runCheck = async () => {
    try {
      const result =
        await runWarrantyNotificationCheck();

      console.log(
        "[Warranty Notifications]",
        {
          expiringCreated:
            result.expiringCreated,
          expiredCreated:
            result.expiredCreated,
          checkedAt:
            result.checkedAt.toISOString(),
        },
      );
    } catch (error) {
      console.error(
        "[Warranty Notifications] Check failed:",
        error,
      );
    }
  };

  /*
   * Run once when the server starts so we don't
   * have to wait one hour for the first check.
   */
  void runCheck();

  /*
   * Continue checking every hour.
   */
  return setInterval(
    () => {
      void runCheck();
    },
    WARRANTY_NOTIFICATION_INTERVAL_MS,
  );
}

/*
 * Start server
 */

async function startServer() {
  await connectDatabase();

  startWarrantyNotificationScheduler();

  app.listen(env.PORT, () => {
    console.log(
      `BillNest API running on port ${env.PORT}`,
    );
  });
}

startServer().catch((error) => {
  console.error(
    "Failed to start BillNest API:",
    error,
  );

  process.exit(1);
});