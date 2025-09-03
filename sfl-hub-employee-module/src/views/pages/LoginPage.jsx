import { useState } from "react";
import { TextField, Button, IconButton, InputAdornment, Box, Typography } from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import logo from "/SFL_logo.png";
import { toast } from "react-hot-toast";
import axios from "axios";
import { api, encryptURL, getUserIP } from "../../utils/api";

import { PersonOutline as FaUser, LockOutlined as FaLock } from "@mui/icons-material";
import { BackgroundContainer, StyledPaper, StyledButton, linkStyle } from "../styles/AuthStyle";

import { useNavigate } from "react-router-dom";
import CryptoJS from "crypto-js";


const LoginPage = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  //   const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [error, setError] = useState({
    usernameErr: false,
    usernameHelperText: "",
    passwordErr: false,
    passwordHelperText: "",
  });


  const handleLogin = async (event) => {
    event.preventDefault();

    if (!username.trim() || !password.trim()) {
      setError({
        usernameErr: !username.trim(),
        usernameHelperText: !username.trim() ? "Please enter username" : "",
        passwordErr: !password.trim(),
        passwordHelperText: !password.trim() ? "Please enter password" : "",
      });
      return;
    }

    setError({ usernameErr: false, usernameHelperText: "", passwordErr: false, passwordHelperText: "" });

    // Show loading toast
    const loadingToastId = toast.loading("Logging in...");

    try {
      const SECRET_KEY = import.meta.env.VITE_SECRET_KEY;
      const ip = await getUserIP();
      if (!SECRET_KEY) {
        throw new Error("Encryption key is missing!");
      }

      const encodedUrl = encryptURL("/users/UserLogin");


      // Encrypt the login credentials before sending them to the backend
      const encryptedData = {
        UserName: CryptoJS.AES.encrypt(username.toLowerCase(), SECRET_KEY).toString(),
        Password: CryptoJS.AES.encrypt(password, SECRET_KEY).toString(),
        userIP: ip,
      };

      // Send the encrypted data to the backend without wrapping it in "data"
      const res = await axios.post(`${api.BackendURL}/users/${encodedUrl}`, encryptedData);

      toast.dismiss(loadingToastId);

      // Check if the login was successful
      if (res.status === 200 && res.data?.user?.data) {
        const decryptedName = CryptoJS.AES.decrypt(res.data.user.data.p_name, SECRET_KEY).toString(CryptoJS.enc.Utf8);
        const decryptedEmail = CryptoJS.AES.decrypt(res.data.user.data.p_email, SECRET_KEY).toString(CryptoJS.enc.Utf8);
        const decryptedPhone = CryptoJS.AES.decrypt(res.data.user.data.p_phonenum, SECRET_KEY).toString(CryptoJS.enc.Utf8);
        const decryptedUsername = CryptoJS.AES.decrypt(res.data.user.data.p_username, SECRET_KEY).toString(CryptoJS.enc.Utf8);
        const decryptedPersonID = CryptoJS.AES.decrypt(res.data.user.data.p_personID, SECRET_KEY).toString(CryptoJS.enc.Utf8);
        const decryptedOldPersonID = CryptoJS.AES.decrypt(res.data.user.data.p_OldPersonID, SECRET_KEY).toString(CryptoJS.enc.Utf8);
        const encryptedAccountNumber = res.data.user.data.p_account_number;
        const decryptedaccount_number = encryptedAccountNumber
          ? CryptoJS.AES.decrypt(encryptedAccountNumber, SECRET_KEY).toString(CryptoJS.enc.Utf8)
          : null;

          const p_paper_originalname=res.data.user.data.p_paper_originalname;
          const p_prepaid_label = res.data.user.data.p_prepaid_label;
        sessionStorage.setItem("user", JSON.stringify({
          name: decryptedName,
          email: decryptedEmail,
          phone: decryptedPhone,
          username: decryptedUsername,
          personID: decryptedPersonID,
          oldPersonID: decryptedOldPersonID,
          account_number: decryptedaccount_number,
          p_paper_originalname: p_paper_originalname,
          p_prepaid_label: p_prepaid_label,
        }));
        sessionStorage.setItem("PersonID", decryptedOldPersonID);

        toast.success("Login successful!", { position: "top-right", autoClose: 3000 });
        navigate("/admin/Scheduleshipment", { replace: true });
      } else {
        throw new Error(res.data?.message || "Invalid credentials");
      }

    } catch (error) {
      console.error("Login error:", error);

      toast.dismiss(loadingToastId);

      toast.error(error.response?.data?.error || error.message || "Something went wrong", {
        position: "top-right",
        autoClose: 3000,
      });
    }
  };

  return (
    <BackgroundContainer>
      <StyledPaper elevation={3}>
        <img src={logo} alt="Logo" width={150} style={{ marginBottom: 20, justifySelf: "center" }} />
        <Typography variant="h5" fontWeight="bold" gutterBottom>

        </Typography>
        <form onSubmit={handleLogin}>
          <TextField
            label="Username"
            variant="outlined"
            autocomplete="off"
            autocorrect="off"
            autocapitalize="none"
            fullWidth
            margin="normal"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            error={error.usernameErr}
            helperText={error.usernameHelperText}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <FaUser style={{ color: "gray", marginRight: 8 }} />
                </InputAdornment>
              ),
            }}
            inputProps={{
              autoComplete: "off",
              autoCorrect: "off",
              autoCapitalize: "none"
            }}
          />
          <TextField
            label="Password"
            variant="outlined"
            autocomplete="new-password"
            autocorrect="off"
            autocapitalize="none"
            fullWidth
            margin="normal"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={error.passwordErr}
            helperText={error.passwordHelperText}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <FaLock color="gray" />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowPassword((prev) => !prev)}>
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            inputProps={{
              autoComplete: "new-password",
              autoCorrect: "off",
              autoCapitalize: "none"
            }}
          />
          <StyledButton
            type="submit"
            variant="contained"
            color="error"
            fullWidth
          >
            {/* {loading ? <CircularProgress size={24} /> : "LOG IN"} */}
            LOG IN
          </StyledButton>
          <Box display="flex" justifyContent="space-between" mt={2}>
            <Typography variant="body2" component="a" href="/auth/forgotpassword-page" color="primary" sx={linkStyle}>
              Forgot Password?
            </Typography>
            <Typography variant="body2" color="primary" component="a" href="/auth/register-page" sx={linkStyle} >
              Don't have an account?
            </Typography>
          </Box>
        </form>
      </StyledPaper>
    </BackgroundContainer>
  );
};

export default LoginPage;