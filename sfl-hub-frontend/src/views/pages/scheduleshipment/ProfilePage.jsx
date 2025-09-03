import React, { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  api,
  encryptURL,
  getUserIP,
} from "../../../utils/api";
import { toast } from "react-hot-toast";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/material.css";
import { parsePhoneNumberFromString } from "libphonenumber-js"; 
import {
  TextField,
  Button,
  InputAdornment,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  Input,
  Autocomplete,
  Paper,
  Popover,
  CircularProgress,
  Typography,
  Box,
} from "@mui/material";
import {
  PermContactCalendarOutlined as ProfileIcon,
  Lock as LockIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Business as BusinessIcon,
  MyLocation as MyLocationIcon,
  PinDrop as PinDropIcon,
  LocationCity as LocationCityIcon,
  AccountCircle as AccountCircleIcon,
  AccountBalanceWallet as AccountBalanceWalletIcon,
  PermIdentity as PermIdentityIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  CheckCircle,
  Cancel,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import CryptoJS from "crypto-js";
import axios from "axios";

import GridContainer from "../../styles/grid/GridContainer";
import GridItem from "../../styles/grid/GridItem";
import usePhoneInputStyles from "../../styles/PhoneInputStyle";

const SECRET_KEY = import.meta.env.VITE_SECRET_KEY;

const PhoneInputStyle = {
  height: "45px",
  padding: "8px 45px ",
  borderRadius: "0",
  border: "none",
  borderBottom: "1px solid #c4c4c4", 
  backgroundColor: "transparent",
  fontSize: "14px",
  fontFamily: "Roboto, sans-serif",
  outline: "none",
  "&:focus": {
    borderBottom: "2px solid #ab47bc", 
  }
};

const isRepeatedDigits = (number) => /^(\d)\1+$/.test(number);

const isFakePattern = (number) => {
  const fakeNumbers = [
    "1234567890",
    "0987654321",
    "0123456789",
    "0000000000",
    "9876543210",
  ];
  return fakeNumbers.includes(number);
};

const validatePhoneNumber = (phone, countryCode = "US") => {
  try {
    const parsed = parsePhoneNumberFromString(
      `+${phone}`,
      countryCode.toUpperCase()
    );
    if (!parsed || !parsed.isValid()) return false;

    const nationalNumber = parsed.nationalNumber;
    if (isRepeatedDigits(nationalNumber) || isFakePattern(nationalNumber)) {
      return false;
    }

    return true;
  } catch (err) {
    return false;
  }
};

const decrypt = (value) => {
  if (!value || !SECRET_KEY) return "";
  try {
    return CryptoJS.AES.decrypt(value, SECRET_KEY).toString(CryptoJS.enc.Utf8);
  } catch (err) {
    console.error("Decryption failed for value:", value);
    return "";
  }
};

const paperSizeOptions = [
  {
    id: 1,
    paperdisplayname: "8.5 X 11",
    paperpreviewlink:
      "https://hubapi.sflworldwide.com/document/PaperPreview/label_1.pdf",
  },
  {
    id: 2,
    paperdisplayname: "4 X 6",
    paperpreviewlink:
      "https://hubapi.sflworldwide.com/document/PaperPreview/label_2.pdf",
  },
  {
    id: 3,
    paperdisplayname: "4 X 6.75",
    paperpreviewlink:
      "https://hubapi.sflworldwide.com/document/PaperPreview/label_3.pdf",
  },
  {
    id: 4,
    paperdisplayname: "4 X 8",
    paperpreviewlink:
      "https://hubapi.sflworldwide.com/document/PaperPreview/label_4.pdf",
  },
  {
    id: 5,
    paperdisplayname: "4 X 9",
    paperpreviewlink:
      "https://hubapi.sflworldwide.com/document/PaperPreview/label_5.pdf",
  },
];

const formattedPaperOptions = paperSizeOptions.map((p) => ({
  value: p.paperdisplayname,
  label: p.paperdisplayname,
  previewLink: p.paperpreviewlink,
  id: p.id,
}));


const ProfilePage = () => {
  const navigate = useNavigate();
  const debounceRef = useRef(null);
  const [formData, setFormData] = useState({
    userDetailID: "",
    userName: "",
    password: "",
    accountNumber: "",
    managedBy: "",
    companyName: "",
    addressLine1: "",
    addressLine2: "",
    addressLine3: "",
    country: null,
    zip: "",
    city: "",
    state: "",
    contactName: "",
    phone1: "",
    phone2: "",
    email: "",
    paperSize: null,
  });
  const [identifiers, setIdentifiers] = useState({
    personID: "",
  });
  const [openDialog, setOpenDialog] = useState(false);
  const [passwordData, setPasswordData] = useState({
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordValidation, setPasswordValidation] = useState({
    checkUpperCase: false,
    checkLowerCase: false,
    checkNumber: false,
    checkSpecialCharacter: false,
    checkMinLength: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [countryOptions, setCountryOptions] = useState([]);
  const [errors, setErrors] = useState({
    zip: "",
    phone1: "",
  phone2: "",
  });
  const [passwordErrors, setPasswordErrors] = useState({
    newPassword: "",
    confirmPassword: "",
  });
  const phoneInputClasses = usePhoneInputStyles();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const storedUser = JSON.parse(sessionStorage.getItem("user"));
        const personID = storedUser?.personID;
        if (!personID) {
          console.error("Person ID not found in sessionStorage");
          return;
        }
        setIdentifiers({ personID });
        const requestData = {
          userId: personID,
        };
        const encodedUrl = encryptURL("/usermanagement/getProfiledetails");

        const [profileRes, countryRes] = await Promise.all([
          axios.post(
            `${api.BackendURL}/usermanagement/${encodedUrl}`,
            requestData,
            { withCredentials: true}
          ),
          axios.get(`${api.BackendURL}/locations/getCountry`, {
            withCredentials: true,
          }),
        ]);

        const data = profileRes.data;
        const countryData = countryRes.data;
        const countries = countryData.user[0].map((country) => ({
          value: country.countryCode,
          label: country.countryname,
          countryid: country.countryid,
          iszipavailable: country.iszipavailable,
        }));
        setCountryOptions(countries);
        console.log("Mapped countries (first 3):", countries.slice(0, 3));

        const decryptedPaper = data.paperDisplayName;
        const paperMatch = formattedPaperOptions.find(
          (p) => p.value === decryptedPaper
        );

        // Find the matching country from countryOptions
        const matchedCountry = countries.find(
          (country) =>
            country.countryid === data.countryid ||
            country.label === data.country
        );
        console.log("Fetched country data:", {
          country: data.country,
          countryid: data.countryid,
          matchedCountry,
          phonenum2: decrypt(data.contactPhone2)
        });

        setFormData((prev) => ({
          ...prev,
          userDetailID: data.userdetailid,
          userName: decrypt(data.userName),
          email: decrypt(data.email),
          accountNumber: decrypt(data.accountNumber),
          managedBy: decrypt(data.managedBy),
          companyName: decrypt(data.companyName),
          addressLine1: data.addressLine1,
          addressLine2: data.addressLine2,
          addressLine3: data.addressLine3,
          city: data.city,
          state: data.state,
          zip: data.zip,
          contactName: decrypt(data.contactName),
          phone1: decrypt(data.contactPhone1),
          phone2: decrypt(data.contactPhone2),
          country: matchedCountry || null,
          paperSize: paperMatch || null,
        }));
      } catch (error) {
        console.error("Failed to fetch data:", error);
      }
    };

    fetchData();
  }, []);

  // Fetch cities based on selected country
  const selectedCountry = countryOptions.find(
    (country) => country.countryid === formData.country?.countryid
  );
  const encodedUrl = encryptURL("/locations/getFedexCityList");
  const { data: cities = [], isLoading: isCitiesLoading, isError: isCitiesError } = useQuery({
    queryKey: ["cities", selectedCountry?.countryid],
    queryFn: async () => {
      if (!selectedCountry?.countryid) return [];
      const response = await axios.post(
        `${api.BackendURL}/locations/${encodedUrl}`,
        {
          countryID: selectedCountry.countryid,
          cityType: "FedEx",
        },
        { withCredentials: true }
      );
      return response.data.user[0].map((city) => city.cityname);
    },
    enabled: !!selectedCountry?.countryid,
    staleTime: 24 * 60 * 60 * 1000,
    retry: 2,
    onError: (error) => {
      console.error("Failed to fetch cities:", error);
      toast.error("Failed to load cities.");
    },
  });

  const isZipAvailable = selectedCountry?.iszipavailable !== 0;

  const handleZipCodeBlur = async () => {
    if (!formData.zip || formData.zip.length < 3 || !isZipAvailable) {
      setFormData((prev) => ({ ...prev, city: "", state: "" }));
      setErrors((prev) => ({ ...prev, zip: "" }));
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      console.log(
        "Fetching city for zip code:",
        formData.zip,
        formData.country
      );

      try {
        const encodedUrl = encryptURL("/locations/getstateCitybyPostalCode");
        const response = await axios.post(
          `${api.BackendURL}/locations/${encodedUrl}`,
          {
            CountryID: selectedCountry?.countryid,
            PostalCode: formData.zip,
          },
          { withCredentials: true }
        );

        const userData = response.data?.user?.[0] || [];
        console.log("Custom API response:", userData);

        if (userData.length > 0) {
          const place = userData[0];
          setFormData((prev) => ({
            ...prev,
            city: place.city,
            state: place.state,
          }));
          setErrors((prev) => ({ ...prev, zip: "" }));
          return;
        }

        throw new Error("No data from backend");
      } catch (err) {
        console.warn(
          "Custom API failed or returned no data. Falling back...",
          err.message
        );

        try {
          if (formData.country?.value.toLowerCase() === "india") {
            const res = await axios.get(
              `https://api.postalpincode.in/pincode/${formData.zip}`
            );
            const data = res.data[0];

            console.log("India API response:", data);
            if (data.Status === "Success" && data.PostOffice?.length > 0) {
              const place = data.PostOffice[0];
              setFormData((prev) => ({
                ...prev,
                city: place.Block || place.District,
                state: place.State,
              }));
              setErrors((prev) => ({ ...prev, zip: "" }));
              return;
            } else {
              throw new Error("No records from India API");
            }
          } else {
            const res = await axios.get(
              `https://maps.googleapis.com/maps/api/geocode/json?key=${
                import.meta.env.VITE_GOOGLE_API_KEY
              }&components=country:${formData.country?.value}|postal_code:${
                formData.zip
              }`
            );
            const components = res.data.results?.[0]?.address_components || [];
            console.log("Google API response:", components);

            let city = "";
            let state = "";

            components.forEach((component) => {
              if (
                component.types.includes("locality") ||
                component.types.includes("postal_town")
              ) {
                city = component.long_name;
              }
              if (component.types.includes("administrative_area_level_1")) {
                state = component.long_name;
              }
            });

            setFormData((prev) => ({ ...prev, city, state }));
            setErrors((prev) => ({ ...prev, zip: "" }));
          }
        } catch (fallbackErr) {
          console.error("All APIs failed:", fallbackErr.message);
          setFormData((prev) => ({ ...prev, city: "", state: "" }));
          setErrors((prev) => ({
            ...prev,
            zip: "Invalid or unsupported zip code.",
          }));
          //alert("Invalid or unsupported zip code.");
        }
      }
    }, 500);
  };

  const validatePassword = (password) => {
    const validation = {
      checkUpperCase: /[A-Z]/.test(password),
      checkLowerCase: /[a-z]/.test(password),
      checkNumber: /[0-9]/.test(password),
      checkSpecialCharacter: /[@\-_.!#$%^&*()+=<>?]/.test(password),
      checkMinLength: password.length >= 8,
    };
    const isValid = Object.values(validation).every(Boolean);
    let message = "";
    if (!validation.checkMinLength)
      message = "Password must be at least 8 characters long";
    else if (!validation.checkUpperCase)
      message = "Password must contain at least one uppercase letter";
    else if (!validation.checkLowerCase)
      message = "Password must contain at least one lowercase letter";
    else if (!validation.checkNumber)
      message = "Password must contain at least one number";
    else if (!validation.checkSpecialCharacter)
      message =
        "Password must contain at least one special character (@, -, _, .)";
    return { isValid, message, validation };
  };

  const handlePasswordChange = (field) => (event) => {
    const value = event.target.value;
    setPasswordData((prev) => ({ ...prev, [field]: value }));
    if (field === "newPassword") {
      const { validation } = validatePassword(value);
      setPasswordValidation(validation);
    }
  };

  const handlePasswordSave = async () => {
    try {
      const { newPassword, confirmPassword } = passwordData;

      setPasswordErrors({ newPassword: "", confirmPassword: "" });

      if (!newPassword || !confirmPassword) {
        setPasswordErrors({
          newPassword: !newPassword ? "Please enter new password" : "",
          confirmPassword: !confirmPassword ? "Please enter confirm password" : "",
        });
        return;
      }

      if (newPassword !== confirmPassword) {
        setPasswordErrors({
          newPassword: "",
          confirmPassword: "Passwords do not match",
        });
        return;
      }

      const { isValid, message } = validatePassword(newPassword);
      if (!isValid) {
        setPasswordErrors({
          newPassword: message,
          confirmPassword: "",
        });
        return;
      }

      const userIP = await getUserIP();
      const encodedUrl = encryptURL("/users/resetPassword");
      const encryptedPassword = CryptoJS.AES.encrypt(newPassword, SECRET_KEY).toString();
      const email = CryptoJS.AES.encrypt(formData.email, SECRET_KEY).toString();

      const res = await axios.post(`${api.BackendURL}/users/${encodedUrl}`, {
        newPassword: encryptedPassword,
        email: email,
        userIP: userIP,
      });

      if (res.status === 200) {
        toast.success("Password updated successfully.");
        setOpenDialog(false);
        setPasswordData({ newPassword: "", confirmPassword: "" });
        setPasswordValidation({
          checkUpperCase: false,
          checkLowerCase: false,
          checkNumber: false,
          checkSpecialCharacter: false,
          checkMinLength: false,
        });
      } else {
        toast.error("Password update failed.");
      }
    } catch (error) {
      console.error("Password update error:", error);
      toast.error("An error occurred while updating password.");
    }
  };

  const handleAutocompleteChange = (field) => (_, newValue) => {
    setFormData((prev) => ({
      ...prev,
      [field]: newValue,
      // Clear zip, city, and state when country changes
      ...(field === "country" ? { zip: "", city: "", state: "" } : {}),
    }));
    // Clear zip error when country changes
    if (field === "country") {
      setErrors((prev) => ({ ...prev, zip: "" }));
    }
  };

  const fieldStyle = {
    marginBottom: "16px",
    "& .MuiInputBase-root": { fontSize: "14px" },
    "& .MuiInputLabel-root": { fontSize: "14px" },
    "& .MuiInput-underline:after": { borderBottomColor: "#ab47bc" },
  };

  const handleSave = async () => {
    try {
      const payload = {
        personId: identifiers.personID,
        userdetailid: formData.userDetailID,
        userName: formData.userName,
        accountNumber: formData.accountNumber,
        managedBy: formData.managedBy,
        companyName: formData.companyName,
        addressLine1: formData.addressLine1,
        addressLine2: formData.addressLine2,
        addressLine3: formData.addressLine3,
        city: formData.city,
        state: formData.state,
        country: formData.country?.label || "",
        zipCode: formData.zip,
        contactName: formData.contactName,
        phoneNumber1: formData.phone1 && formData.phone1.trim() !== ""  ? (formData.phone1.startsWith('+') ? formData.phone1 : `+${formData.phone1}`) : "null",
        phoneNumber2: formData.phone2 && formData.phone2.trim() !== ""  ? (formData.phone2.startsWith('+') ? formData.phone2 : `+${formData.phone2}`) : "null",
        email: formData.email,
        paperSize: formData.paperSize?.id?.toString() || "",
      };
      const encodedUrl = encryptURL("/usermanagement/updateProfile");
      const res = await axios.post(
        `${api.BackendURL}/usermanagement/${encodedUrl}`,
        payload, 
        {withCredentials : true}
      );
      if (res.status === 200) {
        toast.success("Profile updated successfully!");
      } else {
        toast.error("Failed to update profile.");
      }
    } catch (error) {
      console.error("Profile update error:", error);
      toast.error("Failed to update profile.");
    }
  };

  const renderTextField = (
    label,
    icon,
    field,
    disabled = false,
    error = false,
    helperText = ""
  ) => (
    <TextField
      label={label}
      disabled={disabled}
      fullWidth
      variant="standard"
      autoComplete="off"
      value={formData[field] || ""}
      onChange={(e) =>
        setFormData((prev) => ({ ...prev, [field]: e.target.value }))
      }
      onBlur={field === "zip" ? handleZipCodeBlur : undefined}
      error={error}
      helperText={helperText}
      InputProps={{
        endAdornment: <InputAdornment position="end">{icon}</InputAdornment>,
      }}
      sx={fieldStyle}
    />
  );

  return (
    <Box sx={{ display: "flex" }}>
      <Box sx={{ flexGrow: 1, p: 3 }}>
        <GridContainer>
          <GridItem xs={12}>
            <Box sx={{ position: "relative" }}>
              <Box
                sx={{
                  position: "absolute",
                  top: -15,
                  left: 24,
                  width: 64,
                  height: 64,
                  backgroundColor: "#ab47bc",
                  borderRadius: "2px",
                  boxShadow: 3,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  zIndex: 10,
                }}
              >
                <ProfileIcon sx={{ color: "white", fontSize: 32 }} />
              </Box>

              <Paper
                elevation={2}
                sx={{ borderRadius: "8px", overflow: "hidden", pt: 4 }}
              >
                <Box sx={{ px: 3, pb: 1 }}>
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 600,
                      color: "#333",
                      fontSize: "16px",
                      ml: "72px",
                      mt: "-15px",
                    }}
                  >
                    User Profile
                  </Typography>
                </Box>

                <Box sx={{ p: 2.5 }}>
                  <GridContainer>
                    <GridItem xs={12} md={3}>
                      {renderTextField(
                        "User Name",
                        <AccountCircleIcon />,
                        "userName",
                        true
                      )}
                    </GridItem>
                    <GridItem xs={12} md={3}>
                      <FormControl fullWidth variant="standard" sx={fieldStyle}>
                        <InputLabel sx={{ fontSize: "14px" }}>
                          Password
                        </InputLabel>
                        <Input
                          type="password"
                          disabled
                          value={"**********"}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              password: e.target.value,
                            }))
                          }
                          sx={{ fontSize: "14px" }}
                          endAdornment={
                            <InputAdornment position="end">
                              <Button
                                sx={{
                                  backgroundColor: "#ab47bc",
                                  color: "white",
                                  fontSize: "10px",
                                  px: 1.5,
                                  minWidth: "auto",
                                  "&:hover": { backgroundColor: "#8e3b9d" },
                                }}
                                onClick={() => setOpenDialog(true)}
                              >
                                Update
                              </Button>
                            </InputAdornment>
                          }
                        />
                      </FormControl>
                    </GridItem>
                    <GridItem xs={12} md={3}>
                      {renderTextField(
                        "Account Number",
                        <AccountBalanceWalletIcon />,
                        "accountNumber",
                        true
                      )}
                    </GridItem>
                    <GridItem xs={12} md={3}>
                      {renderTextField(
                        "Managed By",
                        <PermIdentityIcon />,
                        "managedBy",
                        true
                      )}
                    </GridItem>
                  </GridContainer>

                  <GridContainer>
                    {[
                      "companyName",
                      "addressLine1",
                      "addressLine2",
                      "addressLine3",
                    ].map((field, i) => (
                      <GridItem xs={12} md={3} key={field}>
                        {renderTextField(
                          [
                            "Company Name",
                            "Address Line 1",
                            "Address Line 2",
                            "Address Line 3",
                          ][i],
                          i === 0 ? <LocationCityIcon /> : <MyLocationIcon />,
                          field
                        )}
                      </GridItem>
                    ))}
                  </GridContainer>

                  <GridContainer>
                    <GridItem xs={12} md={3}>
                      <Autocomplete
                        options={countryOptions}
                        getOptionLabel={(opt) => (opt?.label ? opt.label : "")}
                        isOptionEqualToValue={(option, value) =>
                          option?.value === value?.value
                        }
                        value={formData.country}
                        onChange={handleAutocompleteChange("country")}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="Country"
                            variant="standard"
                          />
                        )}
                        sx={fieldStyle}
                      />
                    </GridItem>
                    <GridItem xs={12} md={3}>
                      <TextField
                        label={formData.country && formData.country.iszipavailable === 0
                            ? "Not required"
                            : "Zip Code"}
                        fullWidth
                        variant="standard"
                        autoComplete="off"
                        value={formData.zip || ""}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, zip: e.target.value }))
                        }
                        onBlur={handleZipCodeBlur}
                        error={!!errors.zip}
                        helperText={errors.zip}
                        disabled={formData.country && formData.country.iszipavailable === 0}
                        placeholder={
                          formData.country && formData.country.iszipavailable === 0
                            ? "Not required"
                            : undefined
                        }
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position="end">
                              <PinDropIcon />
                            </InputAdornment>
                          ),
                        }}
                        sx={fieldStyle}
                      />
                    </GridItem>
                    <GridItem xs={12} md={3}>
                      <Autocomplete
                        options={cities}
                        getOptionLabel={(option) => option || ""}
                        value={formData.city || ""}
                        onChange={(_, newValue) =>
                          setFormData((prev) => ({ ...prev, city: newValue }))
                        }
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="City"
                            variant="standard"
                            helperText={isCitiesError ? "Failed to load cities" : ""}
                            disabled={isCitiesLoading || !formData.country}
                            InputProps={{
                              ...params.InputProps,
                              endAdornment: (
                                <>
                                  {isCitiesLoading ? (
                                    <CircularProgress color="inherit" size={20} />
                                  ) : null}
                                  {params.InputProps.endAdornment}
                                  <InputAdornment position="end">
                                    <LocationCityIcon />
                                  </InputAdornment>
                                </>
                              ),
                            }}
                          />
                        )}
                        sx={fieldStyle}
                      />
                    </GridItem>
                    <GridItem xs={12} md={3}>
                      <TextField
                        label={formData.country && formData.country.iszipavailable === 0
                            ? "Not required"
                            : "State"}
                        fullWidth
                        variant="standard"
                        autoComplete="off"
                        value={formData.state || ""}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, state: e.target.value }))
                        }
                        disabled={formData.country && formData.country.iszipavailable === 0}
                        placeholder={
                          formData.country && formData.country.iszipavailable === 0
                            ? "Not required"
                            : "State"
                        }
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position="end">
                              <LocationCityIcon />
                            </InputAdornment>
                          ),
                        }}
                        sx={fieldStyle}
                      />
                    </GridItem>
                  </GridContainer>

                  <GridContainer>
  <GridItem xs={12} md={3}>
    {renderTextField("Contact Name", <PersonIcon />, "contactName", false)}
  </GridItem>
  <GridItem xs={12} md={3}>
    <Box className={`${phoneInputClasses.phoneInputContainer} ${errors.phone1 ? phoneInputClasses.phoneInputError : ''}`}>
      <PhoneInput
        country={formData.country?.value?.toLowerCase()}
        className="custom-textfield"
        value={formData.phone1}
        inputProps={{
          autoComplete: "off",
          autoCorrect: "off",
          autoCapitalize: "none",
        }}
        onChange={(phone, countryData) => {
          setFormData((prev) => ({ ...prev, phone1: phone }));

          if (!phone) {
            setErrors((prev) => ({
              ...prev,
              phone1: "Phone number is required",
            }));
          } else if (
            phone.length >= 3 &&
            !validatePhoneNumber(phone, countryData.iso2)
          ) {
            setErrors((prev) => ({
              ...prev,
              phone1: "Invalid phone number",
            }));
          } else {
            setErrors((prev) => ({ ...prev, phone1: "" }));
          }
        }}
        inputStyle={{
          ...PhoneInputStyle,
          width: "100%",
          borderColor: errors.phone1 ? "red" : "#c4c4c4",
          fontSize: "14px",
          fontFamily: "Roboto, sans-serif",
        }}
        containerStyle={{ width: "100%", marginBottom: "16px" }}
        enableSearch
        specialLabel="Phone 1 "
      />
      {errors.phone1 && (
        <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
          {errors.phone1}
        </Typography>
      )}
    </Box>
  </GridItem>
  <GridItem xs={12} md={3}>
    <Box className={`${phoneInputClasses.phoneInputContainer} ${errors.phone1 ? phoneInputClasses.phoneInputError : ''}`}>
      <PhoneInput
        country={formData.country?.value?.toLowerCase() || "us"}
        value={formData.phone2}
        className="custom-textfield"
        inputProps={{
          autoComplete: "off",
          autoCorrect: "off",
          autoCapitalize: "none",
        }}
        onChange={(phone, countryData) => {
          const dialCode = `+${countryData.dialCode}`;
          const trimmedPhone = phone
            ? phone.replace(dialCode, "").trim()
            : "";

          if (
            !phone ||
            phone === dialCode ||
            trimmedPhone === "" ||
            !/\d/.test(trimmedPhone)
          ) {
            setFormData((prev) => ({ ...prev, phone2: null }));
            setErrors((prev) => ({ ...prev, phone2: "" }));
            return;
          }

          setFormData((prev) => ({ ...prev, phone2: phone }));

          if (
            phone.length >= 3 &&
            !validatePhoneNumber(phone, countryData.iso2)
          ) {
            setErrors((prev) => ({
              ...prev,
              phone2: "Invalid phone number",
            }));
          } else {
            setErrors((prev) => ({ ...prev, phone2: "" }));
          }
        }}
        onBlur={() => {
          const dialCode = `+${formData.country?.value?.toLowerCase() || "us"}`;
          const trimmedPhone = formData.phone2
            ? formData.phone2.replace(dialCode, "").trim()
            : "";
          if (
            !formData.phone2 ||
            formData.phone2 === dialCode ||
            trimmedPhone === "" ||
            !/\d/.test(trimmedPhone)
          ) {
            setFormData((prev) => ({ ...prev, phone2: null }));
            setErrors((prev) => ({ ...prev, phone2: "" }));
          }
        }}
        inputStyle={{
          ...PhoneInputStyle,
          width: "100%",
          borderColor: errors.phone2 ? "red" : "#c4c4c4",
          fontSize: "14px",
          fontFamily: "Roboto, sans-serif",
        }}
        containerStyle={{ width: "100%", marginBottom: "16px" }}
        enableSearch
        specialLabel="Phone 2"
      />
      {errors.phone2 && (
        <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
          {errors.phone2}
        </Typography>
      )}
    </Box>
  </GridItem>
  <GridItem xs={12} md={3}>
    {renderTextField("Email", <EmailIcon />, "email", true)}
  </GridItem>
</GridContainer>

                  <GridContainer>
                    <GridItem xs={12} md={3}>
                      <Autocomplete
                        options={formattedPaperOptions}
                        getOptionLabel={(opt) => opt.label}
                        value={formData.paperSize}
                        onChange={(_, newValue) =>
                          setFormData((prev) => ({ ...prev, paperSize: newValue }))
                        }
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="Paper Size"
                            variant="standard"
                          />
                        )}
                        sx={fieldStyle}
                      />
                    </GridItem>
                  </GridContainer>

                  <GridContainer sx={{ mt: 3 }}>
                    <GridItem xs={12}>
                      <Typography
                        variant="h6"
                        sx={{
                          fontWeight: 500,
                          color: "#333",
                          mb: 2,
                          fontSize: "25px",
                        }}
                      >
                        Page Size Preview
                      </Typography>
                    </GridItem>
                    {formattedPaperOptions.map(({ value, label, previewLink }) => (
                      <GridItem key={value}>
                        <Typography
                          component="a"
                          href={previewLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          sx={{
                            color: "#ab47bc",
                            textDecoration: "underline",
                            fontSize: "14px",
                          }}
                        >
                          {label}
                        </Typography>
                      </GridItem>
                    ))}
                  </GridContainer>
                </Box>
              </Paper>
            </Box>

            <Box sx={{ display: "flex", justifyContent: "flex-end", p: 2 }}>
              <Button
                onClick={handleSave}
                sx={{
                  backgroundColor: "#ec407a",
                  color: "white",
                  "&:hover": { backgroundColor: "#d81b60" },
                  fontSize: "14px",
                }}
              >
                Save
              </Button>
            </Box>
          </GridItem>

          <Dialog
            sx={{ "& .MuiDialog-paper": { width: "590px" } }}
            open={openDialog}
            onClose={() => setOpenDialog(false)}
          >
            <DialogTitle sx={{ fontSize: "16px" }}>Update Password</DialogTitle>
            <DialogContent>
              <FormControl fullWidth variant="standard" sx={fieldStyle}>
                <InputLabel sx={{ fontSize: "14px" }}>New Password</InputLabel>
                <Input
                  type={showPassword ? "text" : "password"}
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange("newPassword")}
                  onFocus={(e) => setAnchorEl(e.currentTarget)}
                  onBlur={() => setTimeout(() => setAnchorEl(null), 100)}
                  sx={{}}
                  error={!!passwordErrors.newPassword}
                  endAdornment={
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword((prev) => !prev)}
                      >
                        {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
                    </InputAdornment>
                  }
                />
                {passwordErrors.newPassword && (
                  <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                    {passwordErrors.newPassword}
                  </Typography>
                )}
              </FormControl>
              {/* <Popover
                open={Boolean(anchorEl)}
                anchorEl={anchorEl}
                onClose={() => setAnchorEl(null)}
                anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
                transformOrigin={{ vertical: "top", horizontal: "center" }}
                disableAutoFocus
                disableEnforceFocus
                disableRestoreFocus
              >
                <Box sx={{ p: 2, width: 250 }}>
                  <Typography variant="body2" sx={{ fontWeight: 500, mb: 1 }}>
                    Password must have:
                  </Typography>
                  {[
                    {
                      key: "checkUpperCase",
                      text: "At least one uppercase letter (A-Z)",
                    },
                    {
                      key: "checkLowerCase",
                      text: "At least one lowercase letter (a-z)",
                    },
                    { key: "checkNumber", text: "At least one number (0-9)" },
                    {
                      key: "checkSpecialCharacter",
                      text: "At least one special character (@, -, _, .)",
                    },
                    { key: "checkMinLength", text: "Minimum 8 characters" },
                  ].map(({ key, text }) => (
                    <Typography
                      key={key}
                      sx={{
                        color: passwordValidation[key] ? "green" : "",
                        display: "flex",
                        alignItems: "center",
                        mb: 0.5,
                      }}
                    >
                      {passwordValidation[key] ? (
                        <CheckCircle fontSize="small" sx={{ mr: 1 }} />
                      ) : (
                        <Cancel fontSize="small" sx={{ mr: 1 }} />
                      )}
                      {text}
                    </Typography>
                  ))}
                </Box>
              </Popover> */}
              <FormControl fullWidth variant="standard" sx={fieldStyle}>
                <InputLabel sx={{ fontSize: "14px" }}>
                  Confirm Password
                </InputLabel>
                <Input
                  type={showConfirmPassword ? "text" : "password"}
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange("confirmPassword")}
                  sx={{ fontSize: "14px" }}
                  error={!!passwordErrors.confirmPassword}
                  endAdornment={
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowConfirmPassword((prev) => !prev)}
                      >
                        {showConfirmPassword ? (
                          <VisibilityOffIcon />
                        ) : (
                          <VisibilityIcon />
                        )}
                      </IconButton>
                    </InputAdornment>
                  }
                />
                {passwordErrors.confirmPassword && (
                  <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                    {passwordErrors.confirmPassword}
                  </Typography>
                )}
              </FormControl>
            </DialogContent>
            <DialogActions>
              <Button
                color="secondary"
                onClick={() => setOpenDialog(false)}
                sx={{ fontSize: "14px" }}
              >
                Cancel
              </Button>
              <Button
                color="primary"
                onClick={handlePasswordSave}
                autoFocus
                sx={{ fontSize: "14px" }}
              >
                Save
              </Button>
            </DialogActions>
          </Dialog>
        </GridContainer>
      </Box>
    </Box>
  );
};

export default ProfilePage;