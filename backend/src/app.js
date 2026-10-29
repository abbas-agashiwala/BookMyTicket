import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import authRoutes from "./routes/auth.js";
import catalogRoutes from "./routes/catalog.js";
import bookingRoutes from "./routes/bookings.js";
import notificationsRouter from "./routes/notifications.js";
const app = express();
app.use(helmet());
app.use(
  cors({
    origin: (process.env.CLIENT_ORIGIN || "http://localhost:5173").split(","),
    credentials: true,
  }),
);
app.use(express.json({ limit: "1mb" }));
app.use(
  "/api/auth",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 30,
    standardHeaders: true,
    legacyHeaders: false,
  }),
  authRoutes,
);
app.use("/api", catalogRoutes);
app.use(
  "/api/bookings",
  rateLimit({ windowMs: 60 * 1000, limit: 30 }),
  bookingRoutes,
);
app.use("/api/notifications", notificationsRouter);
app.get("/api/health", (_req, res) =>
  res.json({ ok: true, service: "flickt-api" }),
);
app.use((err, _req, res, _next) => {
  console.error(err);
  if (err?.code === 11000)
    return res
      .status(409)
      .json({ message: "A record with this value already exists" });
  res
    .status(500)
    .json({
      message:
        process.env.NODE_ENV === "production"
          ? "Something went wrong"
          : err.message || "Internal server error",
    });
});
export default app;
