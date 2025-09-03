import * as dotenv from "dotenv";
dotenv.config();
import express from "express";
import bodyParser from "body-parser";
import { initDB } from "./server/models/index.js";
import userRoutes from "./server/routes/userRoutes.js";
import locationRoutes from "./server/routes/locationRoutes.js";
import shipmentRoutes from "./server/routes/shipmentRoutes.js";
import paymentRoutes from "./server/routes/paymentRoutes.js";
import healthRoutes from "./server/routes/healthRoutes.js";
import getQuotesRoutes from "./server/routes/getQuotesRoutes.js";
import generateInvoiceRoutes from "./server/routes/InvoiceRoutes.js";
import FedexETDRoutes from "./server/routes/FedexETDRoutes.js";
import FedexLabelRoutes from "./server/routes/FedexLabelRoutes.js";
import usermanagementRoutes from "./server/routes/usermanagementRoutes.js";
import cookieParser from "cookie-parser";

import cors from "cors";

const app = express();
app.use(cookieParser());

const allowedOrigins = ['https://hub.sflworldwide.com', 'https://pay.sflworldwide.com', 'https://hub.sflworldwide.net'];

// Redis key: heartbeat:<userId>

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      } else {
        return callback(new Error("Not allowed by CORS"));
      }
    },
    methods: "GET,POST,PUT,DELETE",
    allowedHeaders: "Content-Type,Authorization",
    credentials: true,
  })
);

app.use(cookieParser());

app.use(bodyParser.json());
app.use("/users", userRoutes);
app.use("/usermanagement", usermanagementRoutes);
app.use("/locations", locationRoutes);
app.use("/shipment", shipmentRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/healthz", healthRoutes);
app.use("/getRates", getQuotesRoutes);
app.use("/generateInvoice", generateInvoiceRoutes);
app.use("/FedexApi", FedexETDRoutes);
app.use("/FedexLabelApi", FedexLabelRoutes);

const PORT = 5000;

app.listen(PORT, async () => {
  await initDB();
  console.log(`Server is running on port ${PORT}`);
});
