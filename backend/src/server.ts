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

const app = express();

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
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get("/health", (_request, response) => {
  response.status(200).json({
    success: true,
    message: "BillNest API is running",
  });
});

/* API routes */
app.use("/api/auth", authRoutes);
app.use("/api/auth", passwordResetRoutes);
app.use("/api/shops", shopRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/invoices", invoiceRoutes);

/* Error handler must remain last */
app.use(errorMiddleware);

async function startServer() {
  await connectDatabase();

  app.listen(env.PORT, () => {
    console.log(
      `BillNest API running on port ${env.PORT}`,
    );
  });
}

startServer();