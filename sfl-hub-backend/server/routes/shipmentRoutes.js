import express from "express";
import {
  savenewShipments,
  getmyShipments,
  getmyShipmentsByID,
  removeShipment,
} from "../controllers/shipmentController.js";
import { getSecrets } from "../services/userService.js";
import CryptoJS from "crypto-js";
import { authenticateUser } from "../Middleware/AuthorizeToken.js";
import * as dotenv from "dotenv";
dotenv.config();

const router = express.Router();

const conditionalMiddleware = (middleware) => {
  return (req, res, next) => {
    if (process.env.NODE_ENV == "middleware") {
      return middleware(req, res, next);
    } else {
      return next(); // Skip middleware
    }
  };
};


router.post("/addShipments", conditionalMiddleware(authenticateUser), savenewShipments);
router.post("/myShipments", conditionalMiddleware(authenticateUser), getmyShipments);
router.post("/getmyShipments", conditionalMiddleware(authenticateUser), getmyShipmentsByID);
router.post("/deleteShipment", removeShipment); // no auth required


router.post("/:encryptedUrl", async (req, res) => {
  const { encryptedUrl } = req.params;
  const secrets = await getSecrets();
  const secretKey = secrets.SECRET_KEY;

  if (!secretKey) {
    return res
      .status(500)
      .json({ error: "Encryption secret key is missing from Secret Manager." });
  }

  try {
    const decodedUrl = decodeURIComponent(encryptedUrl);
    const decryptedUrl = CryptoJS.AES.decrypt(decodedUrl, secretKey).toString(
      CryptoJS.enc.Utf8
    );

    // Conditional middleware runner
    const runWithOptionalMiddleware = (middleware, handler) => {
      if (process.env.NODE_ENV == "middleware") {
        middleware(req, res, function next(err) {
          if (err) return res.status(401).json({ error: "Unauthorized" });
          return handler(req, res);
        });
      } else {
        return handler(req, res);
      }
    };

    if (decryptedUrl === "/shipment/myShipments") {
      return runWithOptionalMiddleware(authenticateUser, getmyShipments);
    }

    if (decryptedUrl === "/shipment/addShipments") {
      return runWithOptionalMiddleware(authenticateUser, savenewShipments);
    }

    if (decryptedUrl === "/shipment/getmyShipments") {
      return runWithOptionalMiddleware(authenticateUser, getmyShipmentsByID);
    }

    return res.status(400).json({ error: "Invalid endpoint path" });
  } catch (error) {
    console.error("Error decrypting URL:", error);
    return res
      .status(500)
      .json({ error: "An error occurred while processing the URL." });
  }
});

export default router;
