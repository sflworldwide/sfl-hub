import React, { useState, useEffect } from "react";
import { Box, Typography, TextField, InputAdornment, IconButton } from "@mui/material";
import { FaLock } from "react-icons/fa";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-hot-toast";
import logo from "/SFL_logo.png";
import { api, encryptURL, getUserIP } from "../../utils/api";
import CryptoJS from "crypto-js";
import { BackgroundContainer, StyledPaper, StyledButton, linkStyle } from "../styles/AuthStyle";

const ResetPassword = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [error, setError] = useState({
    newPasswordErr: false,
    newPasswordHelperText: "",
    confirmPasswordErr: false,
    confirmPasswordHelperText: "",
  });

  // Extract 'key' from query params
  const queryParams = new URLSearchParams(location.search);
  const resetKey = queryParams.get("key")
    ? decodeURIComponent(queryParams.get("key"))
    : null;

  useEffect(() => {
    console.log("resetKey:", resetKey); // Debug log
    if (!resetKey || resetKey.trim() === "") {
      toast.dismiss();
      toast.error("Invalid or missing reset key.", { duration: 1000 });
      navigate("/auth/login-page", { replace: true }); // Immediate redirect
    }
  }, [resetKey, navigate]);

  const validatePassword = (password) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (password.length < minLength) {
      return {
        isValid: false,
        message: `Password must be at least ${minLength} characters long`,
      };
    }
    if (!hasUpperCase) {
      return {
        isValid: false,
        message: "Password must contain at least one uppercase letter",
      };
    }
    if (!hasLowerCase) {
      return {
        isValid: false,
        message: "Password must contain at least one lowercase letter",
      };
    }
    if (!hasNumber) {
      return {
        isValid: false,
        message: "Password must contain at least one number",
      };
    }
    if (!hasSpecialChar) {
      return {
        isValid: false,
        message: "Password must contain at least one special character",
      };
    }
    return { isValid: true, message: "" };
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Clear previous error states
    setError({
      newPasswordErr: false,
      newPasswordHelperText: "",
      confirmPasswordErr: false,
      confirmPasswordHelperText: "",
    });

    // Validate password
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.isValid) {
      setError((prev) => ({
        ...prev,
        newPasswordErr: true,
        newPasswordHelperText: passwordValidation.message,
      }));
      setIsSubmitting(false);
      return;
    }

    // Validate confirm password
    if (newPassword !== confirmPassword) {
      setError((prev) => ({
        ...prev,
        confirmPasswordErr: true,
        confirmPasswordHelperText: "Passwords do not match",
      }));
      setIsSubmitting(false);
      return;
    }

    try {
      const loadingToast = toast.loading("Resetting password...");
      const SECRET_KEY = import.meta.env.VITE_SECRET_KEY;

      if (!SECRET_KEY) {
        toast.dismiss(loadingToast);
        throw new Error("Encryption key is missing!");
      }

      if (!newPassword || !resetKey) {
        toast.dismiss(loadingToast);
        toast.error("Missing required fields.");
        setIsSubmitting(false);
        return;
      }

      const userIP = await getUserIP();
      const encodedUrl = encryptURL("/users/resetPassword");
      const encryptedPassword = CryptoJS.AES.encrypt(newPassword, SECRET_KEY).toString();

      const res = await axios.post(`${api.BackendURL}/users/${encodedUrl}`, {
        newPassword: encryptedPassword,
        email: resetKey, // Assuming resetKey is the email
        userIP: userIP,
      });

      console.log("Response from reset password:", res.data);

      if (res.data?.message === "Password updated successfully") {
        toast.dismiss(loadingToast);
        toast.success("Password has been reset successfully!", { duration: 3000 });
        setNewPassword("");
        setConfirmPassword("");
        navigate("/auth/login-page", { replace: true });
      } else {
        toast.dismiss(loadingToast);
        toast.error(res.data?.error || res.data?.message || "Something went wrong");
      }
    } catch (err) {
      console.error("Reset error:", err);
      toast.dismiss();
      toast.error(err?.response?.data?.error || err.message || "Failed to reset password");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render nothing or a fallback UI if resetKey is invalid
  if (!resetKey || resetKey.trim() === "") {
    return null; // Prevent rendering the form
  }

  return (
    <BackgroundContainer>
      <StyledPaper elevation={3}>
        <img src={logo} alt="Logo" width={150} style={{ marginBottom: 20 }} />
        <Typography variant="h5" fontWeight="bold" gutterBottom>
          Reset Password
        </Typography>
        <form onSubmit={handleResetPassword}>
          <TextField
            label="New Password"
            variant="outlined"
            fullWidth
            margin="normal"
            type={showPassword ? "text" : "password"}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            error={error.newPasswordErr}
            helperText={error.newPasswordHelperText}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <FaLock color="gray" />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <TextField
            label="Confirm Password"
            variant="outlined"
            fullWidth
            margin="normal"
            type={showPassword ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            error={error.confirmPasswordErr}
            helperText={error.confirmPasswordHelperText}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <FaLock color="gray" />
                </InputAdornment>
              ),
            }}
          />
          <StyledButton
            type="submit"
            variant="contained"
            color="error"
            fullWidth
            disabled={isSubmitting}
          >
            Reset Password
          </StyledButton>
          <Box display="flex" justifyContent="center" mt={2}>
            <Typography
              variant="body2"
              color="primary"
              component="a"
              href="/auth/login-page"
              sx={linkStyle}
            >
              Back to Login
            </Typography>
          </Box>
        </form>
      </StyledPaper>
    </BackgroundContainer>
  );
};

export default ResetPassword;