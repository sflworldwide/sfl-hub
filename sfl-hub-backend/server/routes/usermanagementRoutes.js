import express from "express";
import {
  getUserList,
  getUserDataById,
  getpersonDetailsProfile,
  updateProfileDetails,
  updateUserProfileDetails,
} from "../controllers/usermanagementController.js";
import { getSecrets } from "../services/userService.js";
import CryptoJS from "crypto-js";
import { authenticateUser } from "../Middleware/AuthorizeToken.js";
import * as dotenv from "dotenv";
dotenv.config();

const router = express.Router();
const conditionalMiddleware = (middleware) => {
  return (req, res, next) => {
    if (process.env.NODE_ENV === "middleware") {
      return middleware(req, res, next);
    } else {
      return next(); // skip middleware
    }
  };
};
router.post(
  "/getUserList",
  conditionalMiddleware(authenticateUser),
  getUserList
);
router.get("/getUserListById", getUserDataById);
router.get(
  "/getProfiledetails",
  conditionalMiddleware(authenticateUser),
  getpersonDetailsProfile
);
router.post(
  "/updateProfile",
  conditionalMiddleware(authenticateUser),
  updateProfileDetails
);
router.post("/updateUserProfile", updateUserProfileDetails);
// 🔒 Middleware wrapper

// 📌 Static Routes
router.post(
  "/getUserList",
  conditionalMiddleware(authenticateUser),
  getUserList
);
router.post("/getUserListById", getUserDataById);
router.post(
  "/getProfiledetails",
  conditionalMiddleware(authenticateUser),
  getpersonDetailsProfile
);
router.post(
  "/updateProfile",
  conditionalMiddleware(authenticateUser),
  updateProfileDetails
);

// 🔐 Encrypted URL Handler
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

    // 👇 Conditional Middleware Execution
    const runWithOptionalMiddleware = (middleware, handler) => {
      if (process.env.NODE_ENV === "middleware") {
        middleware(req, res, function next(err) {
          if (err) return res.status(401).json({ error: "Unauthorized" });
          return handler(req, res);
        });
      } else {
        return handler(req, res);
      }
    };

    // ✅ Encrypted Route Matching
    if (decryptedUrl === "/usermanagement/getUserList") {
      return runWithOptionalMiddleware(authenticateUser, getUserList);
    }

    if (decryptedUrl === "/usermanagement/updateProfile") {
      return runWithOptionalMiddleware(authenticateUser, updateProfileDetails);
    }

    if (decryptedUrl === "/usermanagement/getProfiledetails") {
      return runWithOptionalMiddleware(
        authenticateUser,
        getpersonDetailsProfile
      );
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
