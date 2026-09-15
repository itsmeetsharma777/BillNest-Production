import express from "express";

const app = express();

const PORT = process.env.PORT || 5000;

app.get("/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "BillNest API is running",
  });
});

app.listen(PORT, () => {
  console.log(`BillNest API running on port ${PORT}`);
});