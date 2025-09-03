import React, { useState } from "react";
import { toast } from "react-hot-toast";
import CryptoJS from "crypto-js";
import axios from "axios";
import { api, encryptURL, getUserIP } from "../../utils/api";
import { Box, TextField, MenuItem, Typography } from "@mui/material";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import logo from "/SFL_logo.png";

import {
  BackgroundContainer,
  StyledPaper,
  StyledButton,
  linkStyle,
} from "../styles/AuthStyle";
import "../styles/Forgetpage.css";
import { useNavigate } from "react-router-dom";

const ForgotPassword = () => {
  const navigate = useNavigate();
  // State to manage form inputs
  const [formData, setFormData] = useState({
    email: "",
    requestType: "",
  });

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "email" ? value.trim() : value,
    }));
  };

  // Validate email format
  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    const SECRET_KEY = import.meta.env.VITE_SECRET_KEY;

    if (!SECRET_KEY) {
      toast.error("Encryption key is missing!");
      return;
    }

    // Check for valid email format
    if (!isValidEmail(formData.email)) {
      toast.error("E-MAIL ID Not Found");
      return;
    }
    if (!formData.requestType) {
      toast.error("Please select an option from the dropdown.");
      return;
    }

    const userIP = await getUserIP();
    const payload = {
      email: CryptoJS.AES.encrypt(formData.email, SECRET_KEY).toString(),
      selectedEmailMy: CryptoJS.AES.encrypt(
        formData.requestType,
        SECRET_KEY
      ).toString(),
      userIP: userIP,
    };
    const encodedUrl = encryptURL("/users/forgotPassword");

    toast.dismiss();
    await toast.promise(
      axios.post(`${api.BackendURL}/users/${encodedUrl}`, { data: payload }),
      {
        loading: "Sending Mail...",
        success: (res) => {
          const msg = res.data?.message;
          console.log("Response message:", msg);

          if (
            msg === "Reset password link sent successfully over email" ||
            msg === "Username sent successfully over email"
          ) {
            setTimeout(() => navigate("/auth/login-page"), 1500);
            return msg;
          } else if (msg === "Could not retrieve necessary user details.") {
            toast.error(
              "Could not retrieve user details. Please provide a valid email or sign up."
            );
            return;
          } else {
            toast.error(msg || "Cannot send email");
            return;
          }
        },
        error: (err) => {
          console.log(err);
          return err || "Something went wrong";
        },
      }
    );
  };

  return (
    <BackgroundContainer>
      <StyledPaper elevation={3}>
        <img
          src={logo}
          alt="Logo"
          width={150}
          style={{ marginBottom: 20, justifySelf: "center" }}
        />
        <Typography variant="h5" fontWeight="bold" gutterBottom>
          {/* You can add a title here if needed */}
        </Typography>
        <TextField
          fullWidth
          label="Email Address"
          variant="outlined"
          margin="normal"
          name="email"
          value={formData.email}
          onChange={handleChange}
          InputProps={{
            startAdornment: <AccountCircleIcon sx={{ mr: 1, color: "gray" }} />,
          }}
          inputProps={{
            autoComplete: "off",
            autoCorrect: "off",
            autoCapitalize: "none",
          }}
        />

        {/* Dropdown */}
        <TextField
          select
          fullWidth
          label="Please Email My"
          variant="outlined"
          margin="normal"
          name="requestType"
          value={formData.requestType}
          onChange={handleChange}
          className="custom-textfield"
          slotProps={{
            select: {
              MenuProps: {
                className: "custom-select-menu",
              },
            },
          }}
        >
          <MenuItem value="username">Username</MenuItem>
          <MenuItem value="password">Password</MenuItem>
        </TextField>

        {/* Submit Button */}
        <StyledButton
          variant="contained"
          color="error"
          fullWidth
          sx={{ mt: 2, fontWeight: "bold" }}
          onClick={handleSubmit}
        >
          SUBMIT
        </StyledButton>

        {/* Back to Login */}
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
      </StyledPaper>
    </BackgroundContainer>
  );
};

export default ForgotPassword;
