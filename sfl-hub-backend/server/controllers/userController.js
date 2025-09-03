// import { User } from '../models/User.js';
import { getUserById } from "../services/userService.js";
import { UserRegisteration } from "../services/userService.js";
import { EmailVerifyOtp } from "../services/userService.js";
import { VerifyOtp } from "../services/userService.js";
import { UserLogin } from "../services/userService.js";
import { UserForgotPasswordMail } from "../services/userService.js";
import { getSecrets } from "../services/userService.js";
import { getPersonIdByLoginId } from "../services/userService.js";
import CryptoJS from "crypto-js";
import {
  UserResetPasswordMail,
  UpdateOtpStatus,
} from "../services/userService.js";
import jwt from "jsonwebtoken";
import logger from "../utils/logger.js";
import { Sequelize } from "sequelize";

const createUser = async (req, res) => {
  try {
    const { name, email } = req.body;
    res.status(201).json({ message: "User created (if applicable)" });
  } catch (error) {
    console.error("Error in createUser:", error);
    res.status(400).json({ error: error.message });
  }
};

const fetchUserById = async (req, res) => {
  try {
    const userId = req.params.id;
    if (!userId) {
      return res.status(400).json({ error: "User ID parameter is required" });
    }
    // console.log(`fetchUserById: Fetching user with ID: ${userId}`);
    const user = await getUserById(userId);
    res.status(200).json({ message: "Data fetched", data: user });
  } catch (error) {
    console.error(`Error in fetchUserById for ID ${req.params.id}:`, error);
    res.status(500).json({ error: "Error fetching user by ID" });
  }
};

const SaveUserRegisteration = async (req, res) => {
  try {
    const userdata = req.body.data;
    if (!userdata) {
      return res.status(400).json({
        user: {
          message:
            "Registration data not found in request body. Expected req.body.data",
        },
      });
    }
    // console.log("SaveUserRegisteration: Received registration data.");
    const result = await UserRegisteration(userdata);

    if (result && result.message === "User Registration Successfully") {
      // console.log("SaveUserRegisteration: Registration successful.");
      res.status(200).json({
        user: {
          message: result.message,
        },
      });
    } else {
      // console.log("SaveUserRegisteration: Registration failed.", result?.message);
      const statusCode =
        result?.message?.includes("already exists") ||
        result?.message?.includes("duplicate")
          ? 409
          : 400;
      res.status(statusCode).json({
        user: {
          message: result?.message || "Registration failed",
        },
      });
    }
  } catch (error) {
    console.error("Error in SaveUserRegisteration controller:", error);
    res.status(500).json({
      user: {
        message: "An unexpected error occurred during registration.",
      },
    });
  }
};

const UserLoginAuthenticate = async (req, res) => {
  try {
    const userdata = req.body;
    if (!userdata || !userdata.UserName || !userdata.Password) {
      return res
        .status(400)
        .json({ error: "Username and Password are required." });
    }

    const loginResult = await UserLogin(userdata);

    if (loginResult?.data?.setusername) {
      const secrets = await getSecrets();
      if (!secrets?.JWT_SECRET) {
        return res
          .status(500)
          .json({ error: "Internal server configuration error (JWT)." });
      }

      const token = jwt.sign(
        {
          users: {
            LoginId: loginResult.data.setusername,
            UserType: "Customer",
          },
          lastActivity: Date.now(),
        },
        secrets.JWT_SECRET,
        { expiresIn: "1h" }
      );

      const userIP =
        userdata.userIP ||
        req.headers["x-forwarded-for"] ||
        req.connection.remoteAddress ||
        "::1";

      logger.info({
        username: loginResult.data.setusername,
        ip: userIP,
        message: "User logged in",
        timestamp: new Date().toLocaleString("en-US", {
          timeZone: "America/Chicago",
        }),
      });

      const isSecure =
        req.secure || req.headers["x-forwarded-proto"] === "https";
      //const isSecure = false; // hardcode this in development (localhost)

      res.cookie("LKA", token, {
        httpOnly: true,
        secure: isSecure,
        // sameSite: isSecure ? 'Strict' : 'Lax',
        sameSite: "Lax",
        path: "/",
        maxAge: 3600 * 1000,
        //maxAge: 0

        //         path: "/",
        // maxAge: 3600 * 1000,
      });

      const decoded = jwt.verify(token, secrets.JWT_SECRET);

      res.status(200).json({ user: loginResult });
    } else {
      res.status(401).json({
        error: loginResult?.message || "Invalid username or password.",
      });
    }
  } catch (error) {
    console.error("Error in login:", error);
    res
      .status(500)
      .json({ error: "An unexpected error occurred during login." });
  }
};

const SaveOtpVerify = async (req, res) => {
  try {
    const userdata = req.body;
    if (!userdata || !userdata.email) {
      return res.status(400).json({ error: "Email is required to send OTP." });
    }
    // console.log(`SaveOtpVerify: Requesting OTP for email: ${userdata.email}`);
    const result = await EmailVerifyOtp(userdata);
    let statusCode = 200;
    let responseBody = { message: result?.message || "Processing complete." };

    switch (result?.status) {
      case "OTP_SENT":
        statusCode = 200;
        break;
      case "ALREADY_VERIFIED":
        statusCode = 200;
        responseBody = { message: result.message, status: result.status };
        break;
      case "EMAIL_FAILED":
        statusCode = 502;
        responseBody = { error: result.message, status: result.status };
        break;
      case "OTP_GENERATION_FAILED":
        statusCode = 400;
        responseBody = { error: result.message, status: result.status };
        break;
      case "UNKNOWN_SP_MESSAGE_WITH_OTP":
        statusCode = 500;
        responseBody = { error: result.message, status: result.status };
        break;
      case "SERVICE_ERROR":
      default:
        statusCode = 500;
        responseBody = {
          error: result?.message || "An unexpected error occurred.",
          status: result?.status || "SERVICE_ERROR",
        };
        break;
    }
    res.status(statusCode).json(responseBody);
  } catch (error) {
    console.error(
      `Critical Error in SaveOtpVerify controller for ${req.body?.email}:`,
      error
    );
    res.status(500).json({
      error: "An unexpected server error occurred while sending OTP.",
    });
  }
};

const UserForgotPassword = async (req, res) => {
  try {
    const userdata = req.body.data;
    if (!userdata || !userdata.email || !userdata.selectedEmailMy) {
      return res.status(400).json({
        error: "Required information missing for forgot password/username.",
      });
    }
    const secrets = await getSecrets();
    const p_emails = decodeURIComponent(userdata.email);
    const decryptedEmail = CryptoJS.AES.decrypt(
      p_emails,
      secrets.SECRET_KEY
    ).toString(CryptoJS.enc.Utf8);
    const result = await UserForgotPasswordMail(userdata);

    const userIP =
      userdata.userIP ||
      req.headers["x-forwarded-for"] ||
      req.connection.remoteAddress ||
      "::1";

    logger.info({
      email: decryptedEmail,
      ip: userIP,
      message: "Forgot password request",
      type: "forgotPassword",
      timestamp: new Date().toLocaleString("en-US", {
        timeZone: "America/Chicago",
      }),
    });

    res.status(200).json({
      message:
        result?.message ||
        "Failed to process forgot password/username request.",
    });
  } catch (error) {
    logger.error({
      message: "Error in UserForgotPassword controller",
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toLocaleString("en-US", {
        timeZone: "America/Chicago",
      }),
    });
    res.status(500).json({ error: "An unexpected error occurred." });
  }
};

const UserResetPassword = async (req, res) => {
  try {
    const userdata = req.body;
    if (!userdata || !userdata.email || !userdata.newPassword) {
      return res
        .status(400)
        .json({ error: "Required information missing (email/newPassword)." });
    }

    const secrets = await getSecrets();
    const decryptedEmail = CryptoJS.AES.decrypt(
      userdata.email,
      secrets.SECRET_KEY
    ).toString(CryptoJS.enc.Utf8);
    const result = await UserResetPasswordMail(userdata);

    const userIP =
      userdata.userIP ||
      req.headers["x-forwarded-for"] ||
      req.connection.remoteAddress ||
      "::1";
    // Enhanced logging
    logger.info({
      email: decryptedEmail,
      ip: userIP,
      message: "Password reset successfully",
      type: "resetPassword",
      status: "success",
      timestamp: new Date().toLocaleString("en-US", {
        timeZone: "America/Chicago",
      }),
    });

    res
      .status(200)
      .json({ message: result?.message || "Password reset processed." });
  } catch (error) {
    logger.error({
      message: "Error in UserResetPassword controller",
      error: error.message,
      stack: error.stack,
      email: userdata?.email || "unknown",
      timestamp: new Date().toLocaleString("en-US", {
        timeZone: "America/Chicago",
      }),
    });
    res.status(500).json({
      error: "An unexpected server error occurred during password reset.",
    });
  }
};

const verifyOtp = async (req, res) => {
  try {
    const { email, otp_code } = req.body;
    if (!email || !otp_code) {
      return res
        .status(400)
        .json({ message: "Email and OTP code are required" });
    }
    // console.log(`verifyOtp: Verifying OTP for ${email}`);
    const result = await VerifyOtp(email, otp_code);
    let statusCode = 200;
    if (result?.status === "INVALID" || result?.status === "EXPIRED") {
      statusCode = 400;
    } else if (result?.status === "ERROR" || result?.status === "UNKNOWN") {
      statusCode = 500;
    }
    return res.status(statusCode).json(result);
  } catch (error) {
    console.error(
      `Error in verifyOtp controller for ${req.body?.email}:`,
      error
    );
    return res
      .status(500)
      .json({ message: "An unexpected error occurred while verifying OTP" });
  }
};

const updateOtpStatus = async (req, res) => {
  try {
    const { email, status } = req.body;

    if (!email || !status) {
      return res.status(400).json({ message: "Email and status are required" });
    }

    if (status !== "pending" && status !== "verified") {
      return res
        .status(400)
        .json({ message: "Status must be either 'pending' or 'verified'" });
    }

    console.log(`updateOtpStatus: Updating status for ${email} to ${status}`);
    const result = await UpdateOtpStatus(email, status);

    if (result.success) {
      return res.status(200).json(result);
    } else {
      return res.status(500).json(result);
    }
  } catch (error) {
    console.error(
      `Error in updateOtpStatus controller for ${req.body?.email}:`,
      error
    );
    return res.status(500).json({
      message: "An unexpected error occurred while updating OTP status",
    });
  }
};

const fetchPersonId = async (req, res) => {
  try {
    const { username } = req.body;
    if (!username)
      return res.status(400).json({ error: "Username is required" });

    const result = await getPersonIdByLoginId(username);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const keepAlive = async (req, res) => {
  try {
    const token = req.cookies?.LKA;
    if (!token) {
      return res.status(401).json({ error: "Authentication failed" });
    }

    const secrets = await getSecrets();
    if (!secrets?.JWT_SECRET) {
      return res.status(500).json({ error: "Server error" });
    }

    const decoded = jwt.verify(token, secrets.JWT_SECRET);

    const currentTime = Date.now();
    const lastActivity = decoded.lastActivity; // Assuming you have `lastActivity` in the token payload
    const inactivityTimeout = 15 * 60 * 1000; // 3 minutes in milliseconds
    // Check if the session has been inactive for too long
    if (currentTime - lastActivity > inactivityTimeout) {
      res.clearCookie("LKA", {
        httpOnly: true,
        secure: true,
        sameSite: "Strict",
        path: "/",
      });
      return res
        .status(401)
        .json({ error: "Session expired due to inactivity" });
    }

    // Update the last activity time
    const updatedToken = jwt.sign(
      { users: decoded.users, lastActivity: currentTime },
      secrets.JWT_SECRET,
      { expiresIn: "1h" } // Refresh the token expiration to 1 hour
    );

    // Attach the updated token to the response
    res.cookie("LKA", updatedToken, {
      httpOnly: true,
      secure: true,
      sameSite: "Strict",
      path: "/",
    });

    // Attach the decoded user info to the request object

    req.user = decoded.users;
    // next();
    res.status(200).json({ message: "Session is active" });
  } catch (err) {
    return res.status(401).json({ error: "Unauthorized" });
  }
};

const getUserList = async (req, res) => {
  try {
    const { userDetails } = req.body;
    if (!userDetails)
      return res.status(400).json({ error: "Userdetails is required" });

    const result = await getUserDetailsBySearch(userDetails);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getUserDataById = async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userDetails)
      return res.status(400).json({ error: "Userdetails is required" });

    const result = await getUserDetailsById(userId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export {
  UserForgotPassword,
  createUser,
  fetchUserById,
  SaveUserRegisteration,
  SaveOtpVerify,
  verifyOtp,
  UserLoginAuthenticate,
  UserResetPassword,
  updateOtpStatus,
  fetchPersonId,
  keepAlive,
  getUserList,
  getUserDataById,
};
