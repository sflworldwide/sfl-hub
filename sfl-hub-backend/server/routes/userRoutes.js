import express from "express";
import {
  updateOtpStatus,
  SaveUserRegisteration,
  SaveOtpVerify,
  verifyOtp,
  UserLoginAuthenticate,
  UserForgotPassword,
  UserResetPassword,
  fetchPersonId,
  keepAlive,
  getUserList,
  getUserDataById,
} from "../controllers/userController.js";
import { getSecrets } from "../services/userService.js";
import CryptoJS from "crypto-js";
// import { authenticateToken } from "../middleware/auth.js";
import { authenticateUser } from "../Middleware/AuthorizeToken.js";
const router = express.Router();

// router.post('/create', createUser);
// router.get('/getUse/:id', fetchUserById);
router.post("/UserRegisteration", SaveUserRegisteration);
router.post("/EmailVerifyOtp", SaveOtpVerify);
router.post("/verifyOtp", verifyOtp);
router.post("/UserLogin", UserLoginAuthenticate);
router.post("/forgotPassword", UserForgotPassword);
router.post("/resetPassword", UserResetPassword);
router.post("/updateOtpStatus", updateOtpStatus);
router.post("/getPersonid", fetchPersonId);
router.post("/keepAlive", keepAlive);

router.post("/getUserList", authenticateUser, getUserList);
router.post("/getUserListById", getUserDataById);

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
    // console.log('Decrypted URL:', decryptedUrl);

    if (decryptedUrl === "/users/forgotPassword") {
      return UserForgotPassword(req, res);
    }

    if (decryptedUrl === "/users/resetPassword") {
      return UserResetPassword(req, res);
    }

    if (decryptedUrl === "/users/EmailVerifyOtp") {
      return SaveOtpVerify(req, res);
    }

    if (decryptedUrl === "/users/verifyOtp") {
      return verifyOtp(req, res);
    }

    if (decryptedUrl === "/users/updateOtpStatus") {
      return updateOtpStatus(req, res);
    }

    if (decryptedUrl === "/users/UserRegisteration") {
      return SaveUserRegisteration(req, res);
    }

    if (decryptedUrl === "/users/UserLogin") {
      return UserLoginAuthenticate(req, res);
    }
    if (decryptedUrl === "/users/heartbeat") {
      return checkActivity(req, res);
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
