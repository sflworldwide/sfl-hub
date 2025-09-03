import { React, useState } from "react";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { api, encryptURL } from "../../utils/api";
import { isEmpty } from "../../utils/constant";
import { Box, Paper, TextField, Button, Typography, Link, InputAdornment, Grid, Popover, useMediaQuery, IconButton } from "@mui/material";
// import { Visibility, VisibilityOff } from "@mui/icons-material";
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { PersonOutline as FaUser, LockOutlined as FaLock } from "@mui/icons-material";
import CloseIcon from "@mui/icons-material/Close";
import DoneIcon from "@mui/icons-material/Done";
import { CheckCircle, Cancel } from "@mui/icons-material";
import MailOutlineIcon from "@mui/icons-material/MailOutline";
import MobileInput from "../MobileInput";
import { useRegister } from "../RegisterContext";
import { useStyles } from "../styles/RegisterStyle";

const RegisterPage = () => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [activeField, setActiveField] = useState("");
  const isMobile = useMediaQuery("(max-width:600px)");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { registerDetails, setRegisterDetails } = useRegister();
  const navigate = useNavigate();
  const classes = useStyles({ isMobile });

  const [state, setState] = useState({
    fullnameErr: false,
    usernameErr: false,
    emailErr: false,
    passwordErr: false,
    confirmpasswordErr: false,
    mobileErr: false,
    isloggedIn: false,
    Loading: false,
    username: "",
    fullname: "",
    email: "",
    mobile: "",
    password: "",
    confirmpassword: "",
    fullnameHelperText: "",
    usernameHelperText: "",
    emailHelperText: "",
    confirmpasswordHelperText: "",
    passwordHelperText: "",
    mobileHelperText: "",
    checkUserName: false,
    checkFullName: false,
    checkEmail: false,
    checkPassword: false,
    checkConfirmPassword: false,
    checkMobile: false,
    checkLetter: false,
    checkUpperCase: false,
    checkLowerCase: false,
    checkNumber: false,
    checkSpecialCharacter: false,
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setState((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleRegister = (e) => {
    const { name, value } = e.target;
    setRegisterDetails({
      ...registerDetails,
      [name]: value,
    });
  };

  const validate = () => {
    let isFormValid = true;
    let errors = {};

    if (isEmpty(registerDetails.fullname)) {
      isFormValid = false;
      errors.fullnameErr = true;
      errors.fullnameHelperText = "Please enter Full name";
    }
    if (isEmpty(registerDetails.username)) {
      isFormValid = false;
      errors.usernameErr = true;
      errors.usernameHelperText = "Please enter username";
    }
    if (isEmpty(registerDetails.mobile)) {
      isFormValid = false;
      errors.mobileErr = true;
      errors.mobileHelperText = "Please enter mobile number";
    }
    if (isEmpty(registerDetails.password)) {
      isFormValid = false;
      errors.passwordErr = true;
      errors.passwordHelperText = "Please enter password";
    }
    if (isEmpty(registerDetails.confirmpassword)) {
      isFormValid = false;
      errors.confirmpasswordErr = true;
      errors.confirmpasswordHelperText = "Please enter confirm password";
    }
    if (isEmpty(registerDetails.email)) {
      isFormValid = false;
      errors.emailErr = true;
      errors.emailHelperText = "Please enter email";
    }

    setState((prevState) => ({ ...prevState, ...errors }));
    return isFormValid;
  };

  const handleBlur = (event, type) => {
    let value = event.target.value;
    let errors = {};

    switch (type) {
      case "fullname":
        errors.checkFullName = true;
        if (isEmpty(value)) {
          errors.fullnameErr = true;
          errors.fullnameHelperText = "Please enter Full Name";
        } else if (value.trim() !== value) {
          errors.fullnameErr = true;
          errors.fullnameHelperText = "Please enter valid Full Name";
        } else if (value.length < 3) {
          errors.fullnameErr = true;
          errors.fullnameHelperText = "Full Name must be at least 3 characters long";
        }
        else if (!/^[a-zA-Z\s]+$/.test(value)) {
          errors.fullnameErr = true;
          errors.fullnameHelperText = "Full Name must contain only letters";
        }
        else {
          errors.fullname = value;
          errors.fullnameErr = false;
          errors.fullnameHelperText = "";
        }
        break;
      case "username":
        errors.checkUserName = true;
        if (isEmpty(value)) {
          errors.usernameErr = true;
          errors.usernameHelperText = "Please enter User Name";
        } else if (value.trim() !== value) {
          errors.usernameErr = true;
          errors.usernameHelperText = "Please enter valid User Name";
        } else {
          errors.username = value;
          errors.usernameErr = false;
          errors.usernameHelperText = "";
        }
        setTimeout(() => setAnchorEl(null), 100);
        break;
      case "email":
        errors.checkEmail = true;
        const emailRegExp = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Z0-9-]+\.[A-Z]{2,6}$/gi;
        if (isEmpty(value)) {
          errors.emailErr = true;
          errors.emailHelperText = "Please enter Email";
        } else if (value.trim() !== value || !value.match(emailRegExp)) {
          errors.emailErr = true;
          errors.emailHelperText = "Please enter valid Email";
        } else {
          errors.email = value;
          errors.emailErr = false;
          errors.emailHelperText = "";
        }
        break;
        case "mobile":
          errors.checkMobile = true;
          const mobileRegExp = /^\+?[1-9]\d{8,14}$/; // international format, 9–15 digits
        
          if (!value || value === "+" || isEmpty(value.trim())) {
            errors.mobileErr = true;
            errors.mobileHelperText = "Please enter Mobile Number";
          } else if (!mobileRegExp.test(value.trim())) {
            errors.mobileErr = true;
            errors.mobileHelperText = "Please enter valid Mobile Number";
          } else {
            errors.mobile = value.trim();
            errors.mobileErr = false;
            errors.mobileHelperText = "";
          }
          break;
        
      case "password":
        errors.checkPassword = true;
        if (isEmpty(value)) {
          errors.passwordErr = true;
          errors.passwordHelperText = "Please enter Password";
        } else {
          setState((prevState) => ({
            ...prevState,
            password: value,
            checkUpperCase: /[A-Z]/.test(value),
            checkLowerCase: /[a-z]/.test(value),
            checkNumber: /[0-9]/.test(value),
            checkSpecialCharacter: /[@\-_.]/.test(value),
            checkMinLength: value.length >= 8,
            passwordErr: false,
            passwordHelperText: "",
          }));
        }
        setTimeout(() => setAnchorEl(null), 100);
        break;
      case "confirmpassword":
        errors.checkConfirmPassword = true;
        if (isEmpty(value)) {
          errors.confirmpasswordErr = true;
          errors.confirmpasswordHelperText = "Please enter Confirm Password";
        } else if (value !== state.password) {
          errors.confirmpasswordErr = true;
          errors.confirmpasswordHelperText = "Password and Confirm Password do not match";
        } else {
          errors.confirmpassword = value;
          errors.confirmpasswordErr = false;
          errors.confirmpasswordHelperText = "";
        }
        break;
      default:
        break;
    }

    setState((prevState) => ({ ...prevState, ...errors }));
  };

  const sendMail = async () => {
    const loadingToast = toast.loading("Sending OTP...");
    const encodedUrl = encryptURL("/users/EmailVerifyOtp");

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



  const signUp = async (event) => {
    event.preventDefault();
    if (!validate()) return;


    const otpResult = await sendMail();
    if (otpResult.success && !otpResult.verified) {

      navigate("/emailverification");
    }


    if (!otpResult.success && otpResult.verified) {
      return;
    }
  };


  return (
    <Box className={classes.root}>
      <Box className={classes.backgroundImage} />
      <Paper className={classes.paper}>
        <Box className={classes.logoContainer}>
          <img src="/SFL_logo.png" alt="SFL Worldwide" className={classes.logo} />
        </Box>

        <form onSubmit={signUp} >
          <TextField
            fullWidth
            name="fullname"
            label="Full Name"
            variant="outlined"
            autocomplete="off" 
            autocorrect="off" 
            autocapitalize="none"
            margin="normal"
            value={registerDetails.fullname}
            onChange={(e) => {
              handleChange(e);
              handleRegister(e);
            }}
            onBlur={(e) => handleBlur(e, "fullname")}
            onFocus={() =>
              setState((prevState) => ({
                ...prevState,
                fullnameErr: false,
                fullnameHelperText: "",
                checkFullName: false,
              }))
            }
            error={state.fullnameErr}
            helperText={state.fullnameHelperText}
            InputProps={{
              startAdornment: <FaUser className={classes.inputIcon} />,
              endAdornment: state.checkFullName ? (
                state.fullnameErr ? (
                  <CloseIcon style={{ color: "red" }} />
                ) : (
                  <DoneIcon style={{ color: "green" }} />
                )
              ) : null,
            }}
            inputProps={{
              autoComplete: "off",
              autoCorrect: "off",
              autoCapitalize: "none"
            }}
          />
          <Box className={classes.usernameContainer}>
            <TextField
              fullWidth
              name="username"
              label="Username"
              variant="outlined"
              autocomplete="off" 
              autocorrect="off" 
              autocapitalize="none"
              margin="normal"
              value={registerDetails.username}
              onChange={(e) => {
                handleChange(e);
                handleRegister(e);
              }}
              onBlur={(e) => handleBlur(e, "username")}
              onFocus={(e) => {
                setAnchorEl(e.currentTarget);
                setActiveField("username");
                setState((prevState) => ({
                  ...prevState,
                  usernameErr: false,
                  usernameHelperText: "",
                  checkUserName: false,
                }));
              }}
              error={state.usernameErr}
              helperText={state.usernameHelperText}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <FaUser color="gray" />
                  </InputAdornment>
                ),
              }}
              inputProps={{
                autoComplete: "off",
                autoCorrect: "off",
                autoCapitalize: "none"
              }}
            />
            {activeField === "username" && (
              <Popover
                open={Boolean(anchorEl)}
                anchorEl={anchorEl}
                onClose={() => setAnchorEl(null)}
                anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
                disableAutoFocus
                disableEnforceFocus
                disableRestoreFocus
                transformOrigin={{ vertical: "top", horizontal: "center" }}
                className={classes.usernamePopover}
              >
                <Box className={classes.usernamePopoverContent}>
                  <Typography variant="body1" className={classes.usernamePopoverTitle}>
                    Username must have:
                  </Typography>
                  <Typography
                    color={/[a-z]/.test(state.username) ? "green" : "red"}
                    className={classes.usernameValidationText}
                  >
                    {/[a-zA-Z]/.test(state.username) ? <CheckCircle color="success" /> : <Cancel color="error" />}
                    Must be letters a - z
                  </Typography>
                  <Typography
                    color={state.username.length >= 8 && state.username.length <= 32 ? "green" : "red"}
                    className={classes.usernameValidationText}
                  >
                    {state.username.length >= 8 && state.username.length <= 32 ? <CheckCircle color="success" /> : <Cancel color="error" />}
                    Must be 8-32 characters long
                  </Typography>
                  <Typography
                    color={/\d/.test(state.username) ? "green" : "red"}
                    className={classes.usernameValidationText}
                  >
                    {/\d/.test(state.username) ? <CheckCircle color="success" /> : <Cancel color="error" />}
                    Can contain numbers (0-9)
                  </Typography>
                  <Typography
                    color={/[@\-_]/.test(state.username) ? "green" : "red"}
                    className={classes.usernameValidationText}
                  >
                    {/[@\-_]/.test(state.username) ? <CheckCircle color="success" /> : <Cancel color="error" />}
                    Can contain special characters (@, -, _)
                  </Typography>
                </Box>
              </Popover>
            )}
          </Box>
          <Grid container spacing={isMobile ? 0 : 2} mb={1}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type={showPassword ? "text" : "password"}
                name="password"
                label="Password"
                variant="outlined"
                margin="normal"
                value={registerDetails.password}
                onChange={(e) => {
                  handleChange(e);
                  handleRegister(e);
                }}
                onBlur={(e) => handleBlur(e, "password")}
                onFocus={(e) => {
                  setAnchorEl(e.currentTarget);
                  setActiveField("password");
                  setState((prevState) => ({
                    ...prevState,
                    passwordErr: false,
                    passwordHelperText: "",
                    checkPassword: false,
                  }));
                }}
                error={state.passwordErr}
                helperText={state.passwordHelperText}
                autoComplete="off"
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
                        className={classes.iconButton}
                      >
                        {showPassword ? (
                          <VisibilityOffIcon className={classes.toggleVisibilityIcon} />
                        ) : (
                          <VisibilityIcon className={classes.toggleVisibilityIcon} />
                        )}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}

              />
              {activeField === "password" && (
                <Popover
                  open={Boolean(anchorEl)}
                  anchorEl={anchorEl}
                  onClose={() => setAnchorEl(null)}
                  anchorOrigin={{ vertical: "bottom", horizontal: isMobile ? "left" : "center" }}
                  transformOrigin={{ vertical: "top", horizontal: "center" }}
                  disableAutoFocus
                  disableEnforceFocus
                  disableRestoreFocus
                  className={classes.passwordPopover}
                >
                  <Box className={classes.passwordPopoverContent}>
                    <Typography variant="body2" className={classes.passwordPopoverTitle}>
                      Password must have:
                    </Typography>
                    <Typography
                      color={/[A-Z]/.test(state.password) ? "green" : "red"}
                      className={classes.passwordValidationText}
                    >
                      {/[A-Z]/.test(state.password) ? <CheckCircle color="success" fontSize="small" /> : <Cancel color="error" fontSize="small" />}
                      At least one uppercase letter (A-Z)
                    </Typography>
                    <Typography
                      color={/[a-z]/.test(state.password) ? "green" : "red"}
                      className={classes.passwordValidationText}
                    >
                      {/[a-z]/.test(state.password) ? <CheckCircle color="success" fontSize="small" /> : <Cancel color="error" fontSize="small" />}
                      At least one lowercase letter (a-z)
                    </Typography>
                    <Typography
                      color={/[0-9]/.test(state.password) ? "green" : "red"}
                      className={classes.passwordValidationText}
                    >
                      {/[0-9]/.test(state.password) ? <CheckCircle color="success" fontSize="small" /> : <Cancel color="error" fontSize="small" />}
                      At least one number (0-9)
                    </Typography>
                    <Typography
                      color={/[@\-_.]/.test(state.password) ? "green" : "red"}
                      className={classes.passwordValidationText}
                    >
                      {/[@\-_.]/.test(state.password) ? <CheckCircle color="success" fontSize="small" /> : <Cancel color="error" fontSize="small" />}
                      At least one special character (@, #, $, etc.)
                    </Typography>
                    <Typography
                      color={state.password.length >= 8 ? "green" : "red"}
                      className={classes.passwordValidationText}
                    >
                      {state.password.length >= 8 ? <CheckCircle color="success" fontSize="small" /> : <Cancel color="error" fontSize="small" />}
                      Minimum 8 characters
                    </Typography>
                  </Box>
                </Popover>
              )}
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type={showConfirmPassword ? "text" : "password"}
                name="confirmpassword"
                label="Confirm Password"
                variant="outlined"
                margin="normal"
                value={registerDetails.confirmpassword}
                onChange={(e) => {
                  handleChange(e);
                  handleRegister(e);
                }}
                onBlur={(e) => handleBlur(e, "confirmpassword")}
                onFocus={() =>
                  setState((prevState) => ({
                    ...prevState,
                    confirmpasswordErr: false,
                    confirmpasswordHelperText: "",
                    checkConfirmPassword: false,
                  }))
                }
                error={state.confirmpasswordErr}
                helperText={state.confirmpasswordHelperText}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <FaLock color="gray" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowConfirmPassword((prev) => !prev)}
                        className={classes.iconButton}
                      >
                        {showConfirmPassword ? (
                          <VisibilityOffIcon className={classes.toggleVisibilityIcon} />
                        ) : (
                          <VisibilityIcon className={classes.toggleVisibilityIcon} />
                        )}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
          </Grid>
          <MobileInput
            registerDetails={registerDetails}
            handleChange={handleChange}
            handleRegister={handleRegister}
            handleBlur={handleBlur}
            setState={setState}
            state={state}
          />
          <TextField
            fullWidth
            type="email"
            name="email"
            label="Email Address"
            variant="outlined"
            autocomplete="off" 
            autocorrect="off" 
            autocapitalize="none"
            value={registerDetails.email}
            margin="normal"
            onChange={(e) => {
              handleChange(e);
              handleRegister(e);
            }}
            onBlur={(e) => handleBlur(e, "email")}
            onFocus={() =>
              setState((prevState) => ({
                ...prevState,
                emailErr: false,
                emailHelperText: "",
                checkEmail: false,
              }))
            }
            error={state.emailErr}
            helperText={state.emailHelperText}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <MailOutlineIcon color="gray" />
                </InputAdornment>
              ),
            }}
            inputProps={{
              autoComplete: "off",
              autoCorrect: "off",
              autoCapitalize: "none"
            }}
          />
          <Button
            fullWidth
            variant="contained"
            className={classes.submitButton}
            onClick={signUp}
          >
            SIGN UP
          </Button>
        </form>
        <Box className={classes.backToLoginContainer}>
          <Typography
            variant="body2"
            color="darkblue"
            component="a"
            href="/auth/login-page"
            className={classes.backToLogin}
          >
            Already have an account?
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};

export default RegisterPage;