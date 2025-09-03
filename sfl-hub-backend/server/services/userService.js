import { Sequelize } from "sequelize";
import createSequelizeInstance from "../config/dbConnection.js";
import moment from "moment";
import nodemailer from "nodemailer";
import bcrypt from "bcrypt";
import mg from "nodemailer-mailgun-transport";
import CryptoJS from "crypto-js";
import * as dotenv from "dotenv";
dotenv.config();

import { SecretManagerServiceClient } from "@google-cloud/secret-manager";
const client = new SecretManagerServiceClient();

let fetchedSecrets = null;
let initPromise = null;

// Helper to get secret value from GCP Secret Manager
async function getSecretValue(secretName) {
  try {
    // console.log(`Accessing secret version: ${secretName}`);
    const [version] = await client.accessSecretVersion({
      name: secretName,
    });
    const payload = version.payload.data.toString("utf8");
    // console.log(`Successfully accessed secret version: ${secretName}`);
    return payload;
  } catch (error) {
    console.error(`Error accessing secret version ${secretName}:`, error);
    throw new Error(
      `Failed to access secret: ${secretName}. Check permissions and secret existence.`
    );
  }
}

// Helper to parse the key-value string from the secret
const parseKeyValueString = (secretString) => {
  const config = {};
  if (!secretString) {
    console.warn("Warning: Received empty secret string for parsing.");
    return config;
  }
  const lines = secretString.split(/\r?\n/);
  for (const line of lines) {
    const trimmedLine = line.trim();
    // Skip empty lines and comments
    if (!trimmedLine || trimmedLine.startsWith("#")) continue;
    const delimiterIndex = trimmedLine.indexOf("=");
    if (delimiterIndex > 0) {
      const key = trimmedLine.substring(0, delimiterIndex).trim();
      let value = trimmedLine.substring(delimiterIndex + 1).trim();
      // Remove surrounding quotes if present
      if (value.length >= 2 && value.startsWith('"') && value.endsWith('"')) {
        value = value.substring(1, value.length - 1);
      }
      if (value.length >= 2 && value.startsWith("'") && value.endsWith("'")) {
        value = value.substring(1, value.length - 1);
      }
      config[key] = value;
    } else if (trimmedLine) {
      console.warn(
        `Warning: Skipping malformed line in secret (no '=' found or key empty): "${trimmedLine.substring(
          0,
          50
        )}${trimmedLine.length > 50 ? "..." : ""}"`
      );
    }
  }
  return config;
};

// Function to initialize secrets (fetches only once)
async function initializeSecretsInternal() {
  // console.log("Initializing secrets...");
  const GCP_PROJECT_ID = process.env.GCP_PROJECT_ID;
  const USER_SERVICE_SECRET_ID = process.env.GCP_SECRET_KEY;

  if (!GCP_PROJECT_ID) {
    throw new Error("FATAL: GCP_PROJECT_ID environment variable is not set.");
  }
  if (!USER_SERVICE_SECRET_ID) {
    throw new Error("FATAL: GCP_SECRET_KEY environment variable is not set.");
  }

  const secretName = `projects/${GCP_PROJECT_ID}/secrets/${USER_SERVICE_SECRET_ID}/versions/latest`;
  const secretString = await getSecretValue(secretName);
  const secretData = parseKeyValueString(secretString);

  // console.log('Parsed secret keys:', Object.keys(secretData));

  const requiredKeys = [
    "VITE_SECRET_KEY",
    "MailGunapi_key",
    "MailGundomain",
    "JWT_SECRET",
    "AUTHORIZE_NET_API_LOGIN_ID",
    "AUTHORIZE_NET_TRANSACTION_KEY",
    "AUTHORIZE_NET_TOKEN_URL",
    "PAY_SFL_URL",
  ];
  const missingKeys = requiredKeys.filter(
    (key) => !(key in secretData) || !secretData[key]
  );

  if (missingKeys.length > 0) {
    throw new Error(
      `FATAL: Missing required keys in secret manager data: ${missingKeys.join(
        ", "
      )}`
    );
  }

  fetchedSecrets = {
    SECRET_KEY: secretData.VITE_SECRET_KEY,
    MailGunapi_key: secretData.MailGunapi_key,
    MailGundomain: secretData.MailGundomain,
    JWT_SECRET: secretData.JWT_SECRET,
  };
  // console.log("Secrets initialized and cached successfully.");
  return fetchedSecrets;
}

// Public function to get secrets, handles lazy initialization
async function getSecrets() {
  if (fetchedSecrets) {
    return fetchedSecrets;
  }
  if (!initPromise) {
    initPromise = initializeSecretsInternal();
  }
  return await initPromise;
}

const BaseURL = process.env.FRONTEND_URL;

const getUserById = async (userId) => {
  try {
    const sequelize = await createSequelizeInstance();
    // console.log("here = ",userId);

    const result = await sequelize.query("SELECT NOW()", {
      type: Sequelize.QueryTypes.SELECT,
    });
    return result;
  } catch (error) {
    console.error("Error in getUserById:", error);
    throw error;
  }
};

const UserLogin = async (Userdata) => {
  try {
    const secrets = await getSecrets();
    const sequelize = await createSequelizeInstance();

    if (!Userdata || !Userdata.Password || !Userdata.UserName) {
      console.warn("UserLogin: Missing Userdata, Password, or UserName.");
      return { message: "User data missing" };
    }
    if (!secrets.SECRET_KEY) {
      // console.error("UserLogin: SECRET_KEY is missing from fetched secrets.");
      return { message: "Internal configuration error." };
    }
    const Password = CryptoJS.AES.decrypt(
      Userdata.Password,
      secrets.SECRET_KEY
    ).toString(CryptoJS.enc.Utf8);
    const UserName = CryptoJS.AES.decrypt(
      Userdata.UserName,
      secrets.SECRET_KEY
    ).toString(CryptoJS.enc.Utf8);
    // console.log("Decrypted UserName:", UserName);

    const comparePass = `CALL spgetpassword(:p_loginid, :p_password);`;
    const resultPass = await sequelize.query(comparePass, {
      replacements: { p_loginid: UserName, p_password: null },
      type: Sequelize.QueryTypes.RAW,
    });
    const p_password = resultPass?.[0]?.[0]?.p_password || "";

    if (!p_password) {
      // console.log(`UserLogin: Password not found for username: ${UserName}`);
      return { message: "Username or Password does not match." };
    }

    const isMatch = await bcrypt.compare(Password, p_password);
    const prepaidLabelUsernames = [
      "Sgrglama1",
      "Zaid@123",
      "rahul.p2205@gmail.com",
      "shwet.shah",
      "celnet.com",
      "PoovarasanSimmer",
      "purveen.sfl"
    ];

    if (isMatch) {
      const Loginquery = `CALL spgetuserdetails(:p_loginid,:p_name,:p_email,:p_phonenum,:p_username,:p_personID,:p_ersonOLD,:p_account_number,:p_paperorgname);`;
      const result = await sequelize.query(Loginquery, {
        replacements: {
          p_loginid: UserName,
          p_name: null,
          p_email: null,
          p_phonenum: null,
          p_username: null,
          p_personID: null,
          p_ersonOLD: null,
          p_account_number: null,
          p_paperorgname: null,
        },
        type: Sequelize.QueryTypes.RAW,
      });
      const userDetails = result?.[0]?.[0];
      // console.log("userDetails:", userDetails);
      if (userDetails && userDetails.p_name) {
        let encryptedAccountNumber = null;
        if (userDetails.p_account_number != null) {
          encryptedAccountNumber = CryptoJS.AES.encrypt(
            userDetails.p_account_number.toString(),
            secrets.SECRET_KEY
          ).toString();
        }
        const isPrepaidUser = prepaidLabelUsernames.some(
          (username) =>
            username.toLowerCase() === userDetails.p_username.toLowerCase()
        );
        var data = {
          p_name: CryptoJS.AES.encrypt(
            userDetails.p_name,
            secrets.SECRET_KEY
          ).toString(),
          p_email: CryptoJS.AES.encrypt(
            userDetails.p_email,
            secrets.SECRET_KEY
          ).toString(),
          p_phonenum: CryptoJS.AES.encrypt(
            userDetails.p_phonenum,
            secrets.SECRET_KEY
          ).toString(),
          p_username: CryptoJS.AES.encrypt(
            userDetails.p_username,
            secrets.SECRET_KEY
          ).toString(),
          setusername: userDetails.p_username,
          p_personID: CryptoJS.AES.encrypt(
            userDetails.p_personid,
            secrets.SECRET_KEY
          ).toString(),
          p_OldPersonID: CryptoJS.AES.encrypt(
            userDetails.p_old_personid.toString(),
            secrets.SECRET_KEY
          ).toString(),
          p_account_number: encryptedAccountNumber,
          p_paper_originalname: userDetails.p_paper_originalname,
          p_prepaid_label: isPrepaidUser ? 1 : 0,
          Messages: "Login Successfully",
        };
        return { data: data };
      } else {
        console.error(
          `Error: Person details not found for username: ${UserName} after successful password match.`
        );
        return { message: "Something went wrong, User details not found" };
      }
    } else {
      // console.log(`UserLogin: Password mismatch for username: ${UserName}`);
      return { message: "Username or Password does not match." };
    }
  } catch (error) {
    if (error.message.includes("Malformed UTF-8 data")) {
      console.error("Error during user login decryption:", error);
      console.error(
        "Possible causes: Incorrect SECRET_KEY used for encryption/decryption, or corrupted input data."
      );
      return {
        message: "Login failed due to data mismatch. Please try again.",
      };
    }
    console.error("Error during user login:", error);
    return { message: "Something went wrong, please try again." };
  }
};

const UserRegisteration = async (Userdata) => {
  try {
    const secrets = await getSecrets();
    const sequelize = await createSequelizeInstance();

    if (
      !Userdata ||
      !Userdata.Password ||
      !Userdata.Name ||
      !Userdata.UserName ||
      !Userdata.Phone ||
      !Userdata.Email
    ) {
      console.warn("UserRegisteration: Missing required fields in Userdata.");
      return { message: "User Registration data missing required fields" };
    }
    if (!secrets.SECRET_KEY) {
      console.error(
        "UserRegisteration: SECRET_KEY is missing from fetched secrets."
      );
      return { message: "Internal configuration error." };
    }

    const salt = await bcrypt.genSalt(10);
    const Password = CryptoJS.AES.decrypt(
      Userdata.Password,
      secrets.SECRET_KEY
    ).toString(CryptoJS.enc.Utf8);
    // console.log("Register Pass Decrypted");

    const newPass = await bcrypt.hash(Password, salt);
    // console.log("Register Pass Hashed");

    const Name = CryptoJS.AES.decrypt(
      Userdata.Name,
      secrets.SECRET_KEY
    ).toString(CryptoJS.enc.Utf8);
    const UserName = CryptoJS.AES.decrypt(
      Userdata.UserName,
      secrets.SECRET_KEY
    ).toString(CryptoJS.enc.Utf8);
    const Phone = CryptoJS.AES.decrypt(
      Userdata.Phone,
      secrets.SECRET_KEY
    ).toString(CryptoJS.enc.Utf8);
    const Email = CryptoJS.AES.decrypt(
      Userdata.Email,
      secrets.SECRET_KEY
    ).toString(CryptoJS.enc.Utf8);
    const oldUserID = CryptoJS.AES.decrypt(
      Userdata.PersonID,
      secrets.SECRET_KEY
    ).toString(CryptoJS.enc.Utf8);

    var datajson = {
      Name: Name,
      UserName: UserName,
      Phone: Phone,
      Email: Email,
      Password: newPass,
      oldID: oldUserID,
    };

    const Personquery = `CALL spregisteruser(:data,:personid,:getmessage);`;
    const result = await sequelize.query(Personquery, {
      replacements: {
        data: JSON.stringify(datajson),
        personid: null,
        getmessage: null,
      },
      type: Sequelize.QueryTypes.RAW,
    });

    const spResult = result?.[0]?.[0];
    // console.log("SP Result spregisteruser: ", spResult);

    if (spResult?.personid) {
      // console.log("User Registration Success");
      return { message: "User Registration Successfully" };
    } else {
      // Return the specific message from the stored procedure if available
      const errorMessage = spResult?.result || "User registration failed.";
      // console.log(`User Registration Failed: ${errorMessage}`);
      return { message: errorMessage };
    }
  } catch (error) {
    if (error.message.includes("Malformed UTF-8 data")) {
      console.error("Error during user registration decryption:", error);
      return { message: "Registration failed due to data mismatch." };
    }
    console.error("Error during user registration:", error);
    return {
      message: "Something went wrong during registration, please try again.",
    };
  }
};

// For Email generate OTP to Store in db
const EmailVerifyOtp = async (Userdata) => {
  try {
    const secrets = await getSecrets(); // Fetch secrets
    const sequelize = await createSequelizeInstance();

    if (!Userdata || !Userdata.email) {
      console.warn("EmailVerifyOtp: Missing email in Userdata.");
      return { message: "Email is required" };
    }
    if (!secrets.MailGunapi_key || !secrets.MailGundomain) {
      console.error("EmailVerifyOtp: MailGun secrets are missing.");
      return { message: "Internal configuration error (Mail)." };
    }

    const otpQuery = `CALL spInsertOTP(:email, :otp_code, :message);`;
    const result = await sequelize.query(otpQuery, {
      replacements: { email: Userdata.email, otp_code: null, message: null },
      type: Sequelize.QueryTypes.RAW,
    });

    const spResult = result?.[0]?.[0];
    // console.log("SP Result spInsertOTP:", spResult);

    const otp_code = spResult?.otp_code || "";
    const message = spResult?.message || "";

    // Handle specific known non-success/non-error cases first
    if (message === "Email is already verified, no need to generate OTP.") {
      // console.log(`Email already verified: ${Userdata.email}`);
      return { message: message, status: "ALREADY_VERIFIED" };
    }

    if (otp_code && message === "OTP sent successfully") {
      const mailgunAuth = {
        auth: {
          api_key: secrets.MailGunapi_key,
          domain: secrets.MailGundomain,
        },
      };
      const transporter = nodemailer.createTransport(mg(mailgunAuth));
      var text = `<html lang="en">
          <head><meta charset="utf-8"><title>SFL Worldwide OTP</title></head>
          <body><div><p>Hello,</p><p>Use OTP <strong>${otp_code}</strong> to verify your email for SFL Worldwide.</p><p>Thanks,<br/>SFL Team</p></div></body>
      </html>`;

      var mailOptions = {
        from: "contact@sflworldwide.com",
        to: Userdata.email,
        subject: "SFL Worldwide Email Verification OTP",
        html: text,
      };

      try {
        const info = await transporter.sendMail(mailOptions);
        // console.log(`EmailVerifyOtp: OTP email SENT successfully to ${Userdata.email}. Message ID: ${info.messageId}`);
        return { message: message, status: "OTP_SENT" };
      } catch (sendMailerror) {
        console.error(
          `EmailVerifyOtp: Error SENDING email via Mailgun to ${Userdata.email}:`,
          sendMailerror
        );
        return {
          message:
            "OTP generated, but failed to send email. Please try again later or contact support.",
          status: "EMAIL_FAILED",
        };
      }
    } else if (otp_code) {
      console.warn(
        `EmailVerifyOtp: OTP generated for ${Userdata.email}, but SP message was unexpected: '${message}'`
      );
      return {
        message: message || "OTP generated, but status unclear.",
        status: "UNKNOWN_SP_MESSAGE_WITH_OTP",
      };
    } else {
      console.error(
        `Error: OTP code missing for ${Userdata.email}. SP Message: '${message}'`
      );
      return {
        message: message || "Something went wrong, OTP could not be generated",
        status: "OTP_GENERATION_FAILED",
      };
    }
  } catch (error) {
    console.error(
      `Error in EmailVerifyOtp for ${Userdata.email || "unknown email"}:`,
      error
    );
    return {
      message: "An unexpected error occurred while processing your request.",
      status: "SERVICE_ERROR",
    };
  }
};

const UserForgotPasswordMail = async (Userdata) => {
  try {
    const secrets = await getSecrets();
    const sequelize = await createSequelizeInstance();

    if (!Userdata || !Userdata.email || !Userdata.selectedEmailMy) {
      console.warn(
        "UserForgotPasswordMail: Missing required fields in Userdata."
      );
      return { message: "Required information missing" };
    }
    if (
      !secrets.SECRET_KEY ||
      !secrets.MailGunapi_key ||
      !secrets.MailGundomain
    ) {
      console.error(
        "UserForgotPasswordMail: Required secrets (SECRET_KEY/MailGun) are missing."
      );
      return { message: "Internal configuration error." };
    }

    const mailgunAuth = {
      auth: {
        api_key: secrets.MailGunapi_key,
        domain: secrets.MailGundomain,
      },
    };
    const transporter = nodemailer.createTransport(mg(mailgunAuth));

    // console.log("UserForgotPasswordMail request data (encrypted):", Userdata);
    let p_emails = decodeURIComponent(Userdata.email);
    let p_email = CryptoJS.AES.decrypt(p_emails, secrets.SECRET_KEY).toString(
      CryptoJS.enc.Utf8
    );
    var p_userType = CryptoJS.AES.decrypt(
      Userdata.selectedEmailMy,
      secrets.SECRET_KEY
    ).toString(CryptoJS.enc.Utf8);
    // console.log(`UserForgotPasswordMail: Decrypted email=${p_email}, type=${p_userType}`);
    // console.log(`Decrypted email: ${p_email}, Decrypted userType: ${p_userType}`);

    const otpQuery = `CALL spforgot(:email, :userType, :username,:name,:phone,:id,:data);`;
    const result = await sequelize.query(otpQuery, {
      replacements: {
        email: p_email,
        userType: p_userType,
        username: null,
        name: null,
        phone: null,
        id: null,
        data: null,
      },
      type: Sequelize.QueryTypes.RAW,
    });

    const spResult = result?.[0]?.[0];
    // console.log("SP Result spforgot:", spResult);

    const message = spResult?.result || "";

    if (message === "EMAIL_NOT_EXISTS") {
      // console.log(`UserForgotPasswordMail: Email not found: ${p_email}`);
      return { message: "EMAIL_NOT_EXISTS" };
    }

    if (
      !spResult?.vname ||
      (!spResult?.vloginid && p_userType === "username")
    ) {
      console.error(
        `UserForgotPasswordMail: SP spforgot did not return required details (vname/vloginid) for ${p_email}, type=${p_userType}. SP Result:`,
        spResult
      );
      return { message: "Could not retrieve necessary user details." };
    }

    let html = "";
    let subject = "";
    let successMessage = "";

    if (p_userType === "username") {
      subject = "SFL Worldwide - Forgot Username Request";
      successMessage = "Username sent successfully over email";
      html = `<html><body><h3>Dear ${
        spResult.vname
      },</h3><p>Your SFL Worldwide username is: <strong>${
        spResult.vloginid
      }</strong></p><br/><br/><p>Thank you,<br/>SFL Team</p><p><small>Ref: ${new Date().getTime()}</small></p></body></html>`;
    } else {
      subject = "SFL Worldwide - Password Reset Request";
      successMessage = "Reset password link sent successfully over email";
      const encodedEmailKey = encodeURIComponent(Userdata.email);
      const resetLink = `${BaseURL}/auth/ResetPassword/?key=${encodedEmailKey}`;
      html = `<html><body><h3>Dear ${
        spResult.vname
      },</h3><p>Please click the link below to reset your password:</p><p><a href="${resetLink}">Reset Password</a></p><p>If you did not request this, please ignore this email.</p><br/><br/><p>Thank you,<br/>SFL Team</p><p><small>Ref: ${new Date().getTime()}</small></p></body></html>`;
    }

    var mailOptions = {
      from: "contact@sflworldwide.com",
      to: p_email,
      // cc: "anshul@sflworldwide.com", // Make configurable?
      subject: subject,
      html: html,
    };

    try {
      const info = await transporter.sendMail(mailOptions);
      // console.log(`UserForgotPasswordMail: Email sent successfully to ${p_email}. Type: ${p_userType}. Message ID: ${info.messageId}`);
      return { message: successMessage };
    } catch (sendMailerror) {
      console.error(
        `UserForgotPasswordMail: Error sending email via Mailgun to ${p_email}. Type: ${p_userType}:`,
        sendMailerror
      );
      return {
        message:
          "Request processed, but failed to send email. Please try again later or contact support.",
      };
    }
  } catch (error) {
    if (error.message.includes("Malformed UTF-8 data")) {
      console.error("Error during forgot password decryption:", error);
      return { message: "Request failed due to data mismatch." };
    }
    console.error(
      `Error in UserForgotPasswordMail for email ending in ${
        Userdata?.email?.slice(-4) || "unknown"
      }:`,
      error
    );
    return {
      message: "An unexpected error occurred while processing your request.",
    };
  }
};

const UserResetPasswordMail = async (Userdata) => {
  try {
    const secrets = await getSecrets();
    const sequelize = await createSequelizeInstance();
    if (!Userdata || !Userdata.email || !Userdata.newPassword) {
      console.warn(
        "UserResetPasswordMail: Missing email or newPassword in Userdata."
      );
      return { message: "Required information missing." };
    }
    if (
      !secrets.SECRET_KEY ||
      !secrets.MailGunapi_key ||
      !secrets.MailGundomain
    ) {
      console.error(
        "UserResetPasswordMail: Required secrets (SECRET_KEY/MailGun) are missing."
      );
      return { message: "Internal configuration error." };
    }
    const mailgunAuth = {
      auth: {
        api_key: secrets.MailGunapi_key,
        domain: secrets.MailGundomain,
      },
    };
    const transporter = nodemailer.createTransport(mg(mailgunAuth));
    // console.log("UserResetPasswordMail: Mailgun transporter configured using secrets.")

    let p_email;
    try {
      // console.log('Encrypted email:', Userdata.email);
      // console.log("Using secret key ending with:", secrets.SECRET_KEY.slice(-4));
      p_email = CryptoJS.AES.decrypt(
        Userdata.email,
        secrets.SECRET_KEY
      ).toString(CryptoJS.enc.Utf8);
      // console.log('Decrypted email:', p_email);
      // console.log(`UserResetPasswordMail: Decrypted email (checking existence for): ${p_email}`);
    } catch (e) {
      console.error("UserResetPasswordMail: Error decrypting email.", e);
      console.error("Details:", e.message);
      return { message: "Invalid request data (email)." };
    }
    if (!p_email) {
      console.error(
        "UserResetPasswordMail: Decryption resulted in an empty email string."
      );
      return {
        message: "Invalid request data (empty email after decryption).",
      };
    }

    const p_userType = "username";
    const checkEmailQuery = `CALL spforgot(:email, :userType, :username,:name,:phone,:id,:data);`;
    const checkResult = await sequelize.query(checkEmailQuery, {
      replacements: {
        email: p_email,
        userType: p_userType,
        username: null,
        name: null,
        phone: null,
        id: null,
        data: null,
      },
      type: Sequelize.QueryTypes.RAW,
    });
    const checkStatus = checkResult?.[0]?.[0]?.result || "";
    // console.log("UserResetPasswordMail: spforgot check result:", checkStatus);
    if (checkStatus === "EMAIL_NOT_EXISTS") {
      // console.log(`UserResetPasswordMail: Email not found during check: ${p_email}`);
      return { message: "EMAIL_NOT_EXISTS" };
    }

    let newPass;
    try {
      const salt = await bcrypt.genSalt(10);
      const Password = CryptoJS.AES.decrypt(
        Userdata.newPassword,
        secrets.SECRET_KEY
      ).toString(CryptoJS.enc.Utf8);
      // const Password = Userdata.newPassword
      newPass = await bcrypt.hash(Password, salt);
      // console.log("UserResetPasswordMail: New password hashed.");
    } catch (e) {
      console.error(
        "UserResetPasswordMail: Error decrypting/hashing password.",
        e
      );
      return { message: "Invalid request data (password)." };
    }

    const resetpasswordQuery = `CALL spupdatepassword(:email, :password, :message);`;
    const updateResult = await sequelize.query(resetpasswordQuery, {
      replacements: { email: p_email, password: newPass, message: null },
      type: Sequelize.QueryTypes.RAW,
    });
    const updateStatus = updateResult?.[0]?.[0]?.result || "";
    // console.log("UserResetPasswordMail: spupdatepassword result:", updateStatus);

    if (updateStatus && updateStatus.toLowerCase().includes("success")) {
      return { message: "Password updated successfully" };
    } else {
      console.error(
        `UserResetPasswordMail: Password update failed for ${p_email}. SP Result: ${updateStatus}`
      );
      return {
        message: updateStatus || "Password update failed. Please try again.",
      };
    }
  } catch (error) {
    if (error.message.includes("Malformed UTF-8 data")) {
      console.error("Error during password reset decryption:", error);
      return { message: "Password reset failed due to data mismatch." };
    }
    console.error("Error during UserResetPasswordMail:", error);
    return { message: "An unexpected error occurred during password reset." };
  }
};

const VerifyOtp = async (email, otp_code) => {
  try {
    const sequelize = await createSequelizeInstance();
    const query = `CALL spVerifyOtp(:email_input, :otp_code_input, :status_message, :status_code);`;
    const result = await sequelize.query(query, {
      replacements: {
        email_input: email,
        otp_code_input: otp_code,
        status_message: null,
        status_code: null,
      },
      type: Sequelize.QueryTypes.RAW,
    });

    const spResult = result?.[0]?.[0];
    // console.log(`SP Result spVerifyOtp for ${email}:`, spResult);

    const message = spResult?.status_message || "Could not verify OTP.";
    const status = spResult?.status_code || "UNKNOWN";

    return { message: message, status: status };
  } catch (error) {
    console.error(`Error verifying OTP for ${email}:`, error);
    return {
      message: "An error occurred during OTP verification.",
      status: "ERROR",
    };
  }
};

const UpdateOtpStatus = async (email, status) => {
  try {
    const sequelize = await createSequelizeInstance();
    const query = `CALL spupdateotpstatus(:email_input, :status_input, :result_message);`;
    const result = await sequelize.query(query, {
      replacements: {
        email_input: email,
        status_input: status, // 'pending' or 'verified'
        result_message: null,
      },
      type: Sequelize.QueryTypes.RAW,
    });

    const spResult = result?.[0]?.[0];
    const message = spResult?.result_message || "Status updated successfully";

    return { message: message, success: true };
  } catch (error) {
    console.error(
      `Error updating OTP status for ${email} to ${status}:`,
      error
    );
    return {
      message: "An error occurred during status update.",
      success: false,
    };
  }
};

const getPersonIdByLoginId = async (username) => {
  try {
    const sequelize = await createSequelizeInstance();

    const query = `CALL spgetpersonidbyloginid(:login_id, :vpersonid);`;
    const result = await sequelize.query(query, {
      replacements: {
        login_id: username,
        vpersonid: null,
      },
      type: Sequelize.QueryTypes.RAW,
    });
    const personID = result?.[0]?.[0]?.vpersonid || null;

    return { personID };
  } catch (error) {
    throw new Error("Error fetching person ID: " + error.message);
  }
};

export {
  getSecrets,
  getUserById,
  UserRegisteration,
  EmailVerifyOtp,
  VerifyOtp,
  UserLogin,
  UserForgotPasswordMail,
  UserResetPasswordMail,
  UpdateOtpStatus,
  getPersonIdByLoginId,
};
