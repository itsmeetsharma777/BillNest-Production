import "dotenv/config";

import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

import { env } from "./config/env";
import { connectDatabase } from "./config/database";

import authRoutes from "./routes/auth.routes";
import passwordResetRoutes from "./routes/password-reset.routes";
import shopRoutes from "./routes/shop.routes";
import customerRoutes from "./routes/customer.routes";
import customerPortalRoutes from "./routes/customer-portal.routes";
import customerNotificationRoutes from "./routes/customer-notification.routes";
import customerAccountRoutes from "./routes/customer-account.routes";
import productRoutes from "./routes/product.routes";
import inventoryRoutes from "./routes/inventory.routes";
import invoiceRoutes from "./routes/invoice.routes";
import warrantyRoutes from "./routes/warranty.routes";
import reportRoutes from "./routes/report.routes";
import notificationRoutes from "./routes/notification.routes";
import dashboardRoutes from "./routes/dashboard.routes";
import documentRoutes from "./routes/document.routes";

import { errorMiddleware } from "./middleware/error.middleware";
import { csrfProtection } from "./middleware/csrf.middleware";

import {
  runWarrantyNotificationCheck,
} from "./services/warranty-notification.service";

const app = express();

/**
 * BillNest is deployed behind platforms/proxies
 * such as Vercel/Render/etc.
 */
app.set(
  "trust proxy",
  1,
);

/**
 * ============================================================
 * SECURITY HEADERS
 * ============================================================
 */

app.use(
  helmet({
    crossOriginResourcePolicy: {
      policy: "cross-origin",
    },
  }),
);

/**
 * ============================================================
 * CORS
 * ============================================================
 */

app.use(
  cors({
    origin:
      env.FRONTEND_URL,
    credentials: true,
  }),
);

/**
 * ============================================================
 * REQUEST BODY LIMITS
 * ============================================================
 */

app.use(
  express.json({
    limit: "1mb",
  }),
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "1mb",
  }),
);

/**
 * ============================================================
 * COOKIE PARSER
 * ============================================================
 */

app.use(
  cookieParser(),
);

/**
 * ============================================================
 * CSRF PROTECTION
 * ============================================================
 */

app.use(
  csrfProtection,
);

/**
 * ============================================================
 * GENERAL API RATE LIMITER
 * ============================================================
 */

const generalRateLimiter =
  rateLimit({
    windowMs:
      15 * 60 * 1000,

    limit: 200,

    standardHeaders:
      "draft-7",

    legacyHeaders:
      false,
  });

app.use(
  generalRateLimiter,
);

/**
 * ============================================================
 * HEALTH CHECK
 * ============================================================
 */

app.get(
  "/health",
  (_req, res) => {
    res.status(200).json({
      success: true,
      message:
        "BillNest API is healthy.",
    });
  },
);

/**
 * ============================================================
 * AUTHENTICATION
 * ============================================================
 */

app.use(
  "/api/auth",
  authRoutes,
);

app.use(
  "/api/auth",
  passwordResetRoutes,
);

/**
 * ============================================================
 * SHOPKEEPER APIs
 * ============================================================
 */

app.use(
  "/api/shops",
  shopRoutes,
);

app.use(
  "/api/customers",
  customerRoutes,
);

/**
 * ============================================================
 * PRODUCT MANAGEMENT
 * ============================================================
 */

app.use(
  "/api/products",
  productRoutes,
);

/**
 * ============================================================
 * INVENTORY MANAGEMENT
 * ============================================================
 */

app.use(
  "/api/inventory",
  inventoryRoutes,
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
  "/api/dashboard",
  dashboardRoutes,
);

app.use(
  "/api/documents",
  documentRoutes,
);

app.use(
  "/api/notifications",
  notificationRoutes,
);

/**
 * ============================================================
 * CUSTOMER APIs
 * ============================================================
 */

app.use(
  "/api/customer",
  customerPortalRoutes,
);

app.use(
  "/api/customer/account",
  customerAccountRoutes,
);

app.use(
  "/api/customer/notifications",
  customerNotificationRoutes,
);

/**
 * ============================================================
 * GLOBAL ERROR HANDLER
 * ============================================================
 *
 * This must remain after all routes.
 */
app.use(
  errorMiddleware,
);

/**
 * ============================================================
 * WARRANTY NOTIFICATION SCHEDULER
 * ============================================================
 */

const WARRANTY_NOTIFICATION_INTERVAL_MS =
  60 * 60 * 1000;

function startWarrantyNotificationScheduler() {
  const runCheck =
    async () => {
      try {
        const result =
          await runWarrantyNotificationCheck();

        console.log(
          "[Warranty Notifications]",
          {
            statusUpdated:
              result.statusUpdated,

            expiringCreated:
              result.expiringCreated,

            customerExpiringCreated:
              result.customerExpiringCreated,

            expiredCreated:
              result.expiredCreated,

            customerExpiredCreated:
              result.customerExpiredCreated,

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

  void runCheck();

  return setInterval(
    () => {
      void runCheck();
    },
    WARRANTY_NOTIFICATION_INTERVAL_MS,
  );
}

/**
 * ============================================================
 * START SERVER
 * ============================================================
 */

async function startServer() {
  await connectDatabase();

  startWarrantyNotificationScheduler();

  app.listen(
    env.PORT,
    () => {
      console.log(
        `BillNest API running on port ${env.PORT}`,
      );
    },
  );
}

startServer().catch(
  (error) => {
    console.error(
      "Failed to start BillNest API:",
      error,
    );

    process.exit(1);
  },
);