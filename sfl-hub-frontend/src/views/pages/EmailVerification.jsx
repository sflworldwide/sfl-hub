import React, { useState, useRef, useEffect } from "react";
import { Box, Container, Grid, TextField, Typography, useMediaQuery } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useTheme } from "@mui/material/styles";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { useRegister } from "../RegisterContext";
import axios from "axios";
import { api, encryptURL } from "../../utils/api";
import CryptoJS from "crypto-js";
import { BackgroundContainer, CloseButton, emailverifyContainer, StyledButton, StyledPaper,emailLogoBox } from "../styles/AuthStyle";
// import { Person } from "@mui/icons-material";


const EmailVerification = () => {
  const {  registerDetails } = useRegister();
  // const personid=sessionStorage.getItem("PersonID")||"";

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const navigate = useNavigate();

  const [otp, setOtp] = useState(new Array(6).fill(""));
  const [filled, setFilled] = useState(new Array(6).fill(false));
  const [open, setOpen] = useState(true);
  const inputRefs = useRef([]);
  const [disable, setdisable] = useState(false);

  const handleChange = (e, index) => {
    let value = e.target.value;
    if (/^[0-9]?$/.test(value)) {
      let newOtp = [...otp];
      let newFilled = [...filled];
      newOtp[index] = value;
      newFilled[index] = value !== "";
      setOtp(newOtp);
      setFilled(newFilled);


      if (value !== "" && index < 5) {
        inputRefs.current[index + 1].focus();
      }
    }
  };


  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").slice(0, 6); // Only take first 6 digits
    if (/^\d{1,6}$/.test(pastedData)) {
      const newOtp = pastedData.split('').concat(Array(6 - pastedData.length).fill(''));
      const newFilled = Array(6).fill(false).map((_, index) => index < pastedData.length);
      setOtp(newOtp);
      setFilled(newFilled);
      
      // Focus on the next empty field or last field if all pasted
      if (pastedData.length < 6) {
        inputRefs.current[pastedData.length]?.focus();
      } else {
        inputRefs.current[5]?.focus();
      }
    }
  };
  

  const SendtoOldDatabase = async () => {
      console.log("Sending OTP to old database...");
      const loadingToast = toast.loading("wait...");
      try {
        const response = await axios.post(`${api.OldDatabaseURL}/authentication/userRegister`, {
          Email: registerDetails.email,
          Password: registerDetails.password,
          Phone: registerDetails.mobile,
          Name: registerDetails.fullname,
          UserName: registerDetails.username.toLowerCase(),
          Phone2: "",
          UserDetails: {
            AccountNumber: "", ManagedBy: "", CompanyName: "", AddressLine1: "",
            AddressLine2: "", AddressLine3: "", ZipCode: "", City: "", State: "",
            ContactName: "", CountryID: "", UserDetailID: null
          }
        });
    
        const resData = response.data;
    
        if (resData.success) {
          toast.dismiss(loadingToast);
          console.log("old database: ", resData.data.message);
          sessionStorage.setItem("PersonID", resData.data?.PersonID);
          return true; 
        } else {
          console.warn("User not added, message:", resData.message);
          toast.dismiss(loadingToast);
          toast.error(resData.message)
          return false;
        }
      } catch (error) {
        console.error("Error sending data to old database:", error);
        toast.dismiss(loadingToast);
        toast.error(error);
        return false;
      }
    };

  const validateOtp = async (enteredOtp) => {
    const loadingToast = toast.loading("Verifying OTP...");
    const encodedUrl= encryptURL("/users/verifyOtp");

    try {
      const response = await axios.post(`${api.BackendURL}/users/${encodedUrl}`, {
        email: registerDetails.email,
        otp_code: enteredOtp,
      });
  
      if (response.status === 200 && response.data.status === "verified") {
        toast.success(response.data.message, {
          position: "top-right",
          autoClose: 1500,
        });
  
        setdisable(true);
        const addedSuccessfully = await SendtoOldDatabase();
      if (addedSuccessfully) {
  
        try {
          const SECRET_KEY = import.meta.env.VITE_SECRET_KEY;
          if (!SECRET_KEY) throw new Error("Encryption key is missing!");
        
          const registerToast = toast.loading("Registering user...");
          console.log(registerDetails)
          const personid=sessionStorage.getItem("PersonID")||"";

              const encodedUrl= encryptURL("/users/UserRegisteration");
        
          const encrypt = (text) => CryptoJS.AES.encrypt(text, SECRET_KEY).toString();
        
          const encryptedData = {
            Name: encrypt(registerDetails.fullname),
            UserName: encrypt(registerDetails.username.toLowerCase()),
            Password: encrypt(registerDetails.password),
            Phone: encrypt(registerDetails.mobile),
            Email: encrypt(registerDetails.email),
            PersonID: encrypt(personid)       };


          const res = await axios.post(`${api.BackendURL}/users/${encodedUrl}`, {
            data: encryptedData,
          });
        
          toast.dismiss(registerToast); // dismiss after response
        
          if (res.status === 200 && res.data.user?.message === "User Registration Successfully") {
            toast.success("Registered successfully!");
            
            // navigate("/auth/login-page");
            const loadingToastId = toast.loading("Wait...");
              
                try {
                  const SECRET_KEY = import.meta.env.VITE_SECRET_KEY;
                  if (!SECRET_KEY) {
                    throw new Error("Encryption key is missing!");
                  }
            
                      const encodedUrl= encryptURL("/users/UserLogin");
                  
              
                  // Encrypt the login credentials before sending them to the backend
                  const encryptedData = {
                    UserName: CryptoJS.AES.encrypt(registerDetails.username.toLowerCase(), SECRET_KEY).toString(),
                    Password: CryptoJS.AES.encrypt(registerDetails.password, SECRET_KEY).toString(),
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
              
                    sessionStorage.setItem("user", JSON.stringify({
                      name: decryptedName,
                      email: decryptedEmail,
                      phone: decryptedPhone,
                      username: decryptedUsername,
                      personID: decryptedPersonID,
                      oldPersonID: decryptedOldPersonID,
                    }));
                    sessionStorage.setItem("PersonID", decryptedOldPersonID);
                 
                    toast.success("Login successful!", { position: "top-right", autoClose: 1500 });
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
          } else {
            toast.error(res.data.user?.message || "Registration failed");
          }
        
        } catch (error) {
          toast.dismiss(); 
          console.error("Registration Error:", error);
          toast.error(error?.response?.data?.message || "Something went wrong!");
        }        
  
      } else {
        throw new Error("OTP verification failed");
      }
    }
    } catch (error) {
      console.error("Error verifying OTP:", error);
      toast.error("Invalid OTP. Please try again.", {
        position: "top-right",
        autoClose: 3000,
      });
    } finally {
      toast.dismiss(loadingToast);
    }
  
  };
  
  const sendMail = async () => {
    const loadingToast = toast.loading("Sending OTP...");
    const encodedUrl= encryptURL("/users/EmailVerifyOtp");

    try {
      const response = await axios.post(`${api.BackendURL}/users/${encodedUrl}`, {
        email: registerDetails.email,
      });
      const userMessage = response.data?.message;
      if (userMessage === 'Email is already verified, no need to generate OTP.') {
        toast.error("Email already registered. Try another email ID", {
          position: "top-right",
          autoClose: 3000,
        });
        return { success: false, verified: true };
      } else if (userMessage === "OTP sent successfully") {
        toast.success("OTP sent successfully!", {
          position: "top-right",
          autoClose: 3000,
        });
        return { success: true, verified: false };
      } else {
        throw new Error(userMessage || "Failed to send OTP");
      }
    } catch (error) {
      console.error("Error sending OTP:", error);
      toast.error(error?.response?.data?.message || "Failed to send OTP. Try again.", {
        position: "top-right",
        autoClose: 3000,
      });
      return { success: false, verified: false };
    } finally {
      toast.dismiss(loadingToast);
    }
  };


  useEffect(() => {
    if (!open) {
      navigate("/auth/register-page");
    }
  }, [open, navigate]);

  return (
    <>
      <BackgroundContainer
        position="absolute"
        top={0} left={0} right={0} bottom={0}
      />
      <Container maxWidth="sm" sx={emailverifyContainer}>
        <StyledPaper elevation={3}>
          <Box sx={emailLogoBox}>
            <img src="/3001931.jpg" alt="Email Verification" width={isMobile ? 60 : 200} height={isMobile ? 60 : 200} />
          </Box>
          <CloseButton
            onClick={() => setOpen(false)}
          >
            <CloseIcon />
          </CloseButton>
          <Typography variant={isMobile ? "h6" : "h5"} fontWeight={600} gutterBottom>
            Verify Your Email Address
          </Typography>
          <Typography variant="body2" color="textSecondary" mb={2}>
            Please enter the 6-digit code sent to your email.
          </Typography>
          <Grid container spacing={1} justifyContent="center" sx={{ flexWrap: "nowrap" }}>
            {otp.map((digit, index) => (
              <Grid item key={index}>
                <TextField
                  variant="outlined"
                  size={isMobile ? "small" : "medium"}
                  inputProps={{autoComplete: "off",
                    autoCorrect: "off",
                    autoCapitalize: "none", maxLength: 1, style: { textAlign: "center", fontSize: "1.5rem" } }}
                  value={digit}
                  onChange={(e) => handleChange(e, index)}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                  inputRef={(el) => (inputRefs.current[index] = el)}
                  onPaste={handlePaste}
                  sx={{
                    width: isMobile ? 40 : 50,
                    height: isMobile ? 40 : 60,
                    backgroundColor: filled[index] ? "#f0f0f0" : "white"
                  }}
                />
              </Grid>
            ))}
          </Grid>
          <Typography variant="body2" mt={2}>
            Want to change your email? <Typography component="span" color="primary" sx={{ cursor: "pointer" }} onClick={() => { navigate('/auth/register-page') }}>Change Here</Typography>
          </Typography>
          <StyledButton
            variant="contained"
            color="warning"
            fullWidth
            onClick={() => validateOtp(otp.join(""))}
            disabled={disable}
            sx={{p:1.5}}
          >
            Verify Email
          </StyledButton>
          <Typography variant="body2" mt={2} color="primary" sx={{ cursor: "pointer" }} onClick={sendMail}>
            Resend Code
          </Typography>
        </StyledPaper>
      </Container></>

  );
};

export default EmailVerification;