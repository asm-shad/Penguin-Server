import cookieParser from "cookie-parser";
import cors from "cors";
import express, { Application, NextFunction, Request, Response } from "express";
import httpStatus from "http-status";
import globalErrorHandler from "./app/middlewares/globalErrorHandler";
import router from "./app/routes";
import { paymentController } from "./app/modules/payment/payment.controller";

const app: Application = express();

// === CRITICAL: Webhook routes MUST come before body parsers ===
// This is because Stripe webhooks require raw body, not parsed JSON

// 1. SSL IPN route (GET with query params)
app.get(
  "/api/payments/ipn",
  paymentController.handleSSLIPN
);

// 2. Stripe webhook route (POST with raw body)
app.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  paymentController.handleStripeWebhook
);

// Now add cookie parser and CORS
app.use(cookieParser());
app.use(
  cors({
    origin: ["http://localhost:3000", "https://gen-z-mart-frontend.vercel.app"],
    credentials: true,
  })
);

// Now add body parsers for all other routes
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req: Request, res: Response) => {
  res.send({
    Message: "E-commerce server is running..",
  });
});

app.use("/api", router);

app.use(globalErrorHandler);

app.use((req: Request, res: Response, next: NextFunction) => {
  res.status(httpStatus.NOT_FOUND).json({
    success: false,
    message: "API NOT FOUND!",
    error: {
      path: req.originalUrl,
      message: "Your requested path is not found!",
    },
  });
});

export default app;