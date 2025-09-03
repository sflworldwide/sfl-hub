import React, { useRef, useEffect } from "react";
import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import StateDropdown from "./Statedropdown";
import {
  Box,
  TextField,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Autocomplete,
} from "@mui/material";
import PersonIcon from "@mui/icons-material/Person";
import PublicIcon from "@mui/icons-material/Public";
import BusinessIcon from "@mui/icons-material/Business";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import EmailIcon from "@mui/icons-material/Email";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/material.css";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import CircularProgress from "@mui/material/CircularProgress";
import { api, encryptURL } from "../../../utils/api";
import {
  PhoneInputStyle,
  PrevButton,
  NextButton,
  EditButton,
  ButtonBox,
} from "../../styles/scheduleshipmentStyle";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import { useNavigate } from "react-router-dom";

const Recipient = ({
  recipientCountry,
  recipientcountrycode,
  recipientCountryId,
  setRecipientCountry,
  recipientCompanyName,
  setRecipientCompanyName,
  recipientContactName,
  setRecipientContactName,
  recipientAddressLine1,
  setRecipientAddressLine1,
  recipientAddressLine2,
  setRecipientAddressLine2,
  recipientAddressLine3,
  setRecipientAddressLine3,
  recipientZipCode,
  setRecipientZipCode,
  recipientCity,
  setRecipientCity,
  recipientState,
  setRecipientState,
  recipientPhone1,
  setRecipientPhone1,
  recipientPhone2,
  setRecipientPhone2,
  recipientEmail,
  setRecipientEmail,
  recipientLocationType,
  setRecipientLocationType,
  recipientErrors,
  setRecipientErrors,
  handleRecipientSubmit,
  handleRecipientPrevious,
  setoldrecipientphone1,
  setoldrecipientphone2,
  shipmentType,
  resiszip,
  isGetrate,
  setActiveModule,
  Gresiszip,
}) => {
  const debounceRef = useRef(null);
  const navigate = useNavigate();

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

  const validateContactName = (name) => {
    const isValid = /^[A-Za-z\s'-]+$/.test(name) && /[A-Za-z]/.test(name);
    return isValid;
  };

  const handleContactNameChange = (e) => {
    const value = e.target.value;
    setRecipientContactName(value);

    if (!value) {
      setRecipientErrors((prev) => ({
        ...prev,
        contactName: "Contact name is required",
      }));
    } else if (!validateContactName(value)) {
      setRecipientErrors((prev) => ({
        ...prev,
        contactName: "Enter a valid name (letters only)",
      }));
    } else {
      setRecipientErrors((prev) => ({ ...prev, contactName: "" }));
    }
  };

  const validateForm = () => {
    const errors = {};

    // Validate contact name
    if (!recipientContactName) {
      errors.contactName = "Contact name is required";
    } else if (!validateContactName(recipientContactName)) {
      errors.contactName = "Enter a valid name (letters only)";
    }

    // Validate phone1
    if (!recipientPhone1) {
      errors.phone1 = "Phone number is required";
    } else if (!validatePhoneNumber(recipientPhone1, recipientcountrycode)) {
      errors.phone1 = "Invalid phone number";
    }

    setRecipientErrors((prev) => ({ ...prev, ...errors }));
    return Object.keys(errors).every((key) => !errors[key]);
  };

  const onSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      handleRecipientSubmit(e);
    }
  };

  const handleZipCodeBlur = async () => {
    if (
      isGetrate ||
      !recipientZipCode ||
      recipientZipCode.length < 4 ||
      resiszip === 0 ||
      Gresiszip === 1
    ) {
      setRecipientCity("");
      setRecipientState("");
      setRecipientErrors((prev) => ({ ...prev, recipientZipCode: "" }));
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      try {
        const encodedUrl = encryptURL("/locations/getstateCitybyPostalCode");
        const response = await axios.post(
          `${api.BackendURL}/locations/${encodedUrl}`,
          {
            CountryID: recipientCountryId,
            PostalCode: recipientZipCode,
          },
          {
            withCredentials: true,
          }
        );

        const userData = response.data?.user?.[0] || [];
        if (userData.length > 0) {
          const place = userData[0];
          setRecipientCity(place.city);
          setRecipientState(place.state);
          setRecipientErrors((prev) => ({ 
            ...prev, 
            recipientZipCode: "", 
            recipientCity: "" 
          }));
          return;
        }

        throw new Error("No data from backend");
      } catch (err) {
        console.warn("Recipient API fallback triggered:", err.message);
        try {
          if (recipientcountrycode === "in") {
            const res = await axios.get(
              `https://api.postalpincode.in/pincode/${recipientZipCode}`
            );
            const data = res.data[0];
            if (data.Status === "Success" && data.PostOffice?.length > 0) {
              const place = data.PostOffice[0];
              setRecipientCity(place.District);
              setRecipientState(place.State);
              setRecipientErrors((prev) => ({ 
                ...prev, 
                recipientZipCode: "", 
                recipientCity: "" 
              }));
              return;
            } else {
              throw new Error("No records from India postal API");
            }
          } else {
            const res = await axios.get(
              `https://maps.googleapis.com/maps/api/geocode/json?key=${
                import.meta.env.VITE_GOOGLE_API_KEY
              }&components=country:${recipientcountrycode}|postal_code:${recipientZipCode}`
            );
            const components = res.data.results?.[0]?.address_components || [];
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
            setRecipientCity(city);
            setRecipientState(state);
            setRecipientErrors((prev) => ({ 
              ...prev, 
              recipientZipCode: "", 
              recipientCity: "" 
            }));
          }
        } catch (fallbackErr) {
          console.error("Recipient zip lookup failed:", fallbackErr.message);
          setRecipientCity("");
          setRecipientErrors((prev) => ({
            ...prev,
            recipientZipCode: "Invalid or unsupported zip code.",
          }));
        }
      }
    }, 500);
  };

  const rowStyle = {
    display: "flex",
    flexDirection: { xs: "column", sm: "row" },
    gap: 2,
    mb: 2,
    alignItems: "stretch",
  };

  const fieldStyle = {
    flex: 1,
    minWidth: 0,
  };

  const fetchCityList = async () => {
    const encodedUrl = encryptURL("/locations/getFedexCityList");
    const response = await axios.post(
      `${api.BackendURL}/locations/${encodedUrl}`,
      {
        countryID: recipientCountryId,
        cityType: "FedEx",
      },
      {
        withCredentials: true,
      }
    );
    // Extract city names from the response
    return response.data.user[0].map((city) => city.cityname);
  };

  const {
    data: cities,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["recipientCityList"],
    queryFn: fetchCityList,
    enabled: resiszip === 0, // Only fetch cities when resiszip === 0
  });

  const handleCityChange = (event, newValue) => {
    setRecipientCity(newValue || "");
    // Clear city error when user selects/enters a city
    if (newValue) {
      setRecipientErrors((prev) => ({ ...prev, recipientCity: "" }));
    }
    else{
      setRecipientErrors((prev) => ({ ...prev, recipientCity: "Enter city name" }));
    }
  };

  const handleCityInputChange = (e) => {
    const value = e.target.value;
    setRecipientCity(value);
    // Clear city error when user types
    if (value) {
      setRecipientErrors((prev) => ({ ...prev, recipientCity: "" }));
    }
    else{
      setRecipientErrors((prev) => ({ ...prev, recipientCity: "Enter city name" }));
    }
  };

  return (
    <Box sx={{ p: 3, bgcolor: "white", borderRadius: 2, m: 2 }}>
      <form onSubmit={onSubmit}>
        {/* Row 1: Country, Company Name, Contact Name */}
        <Box sx={rowStyle}>
          <TextField
            label="Country"
            className="custom-textfield"
            value={recipientCountry}
            inputProps={{
              autoComplete: "off",
              autoCorrect: "off",
              autoCapitalize: "none",
            }}
            onChange={(e) => setRecipientCountry(e.target.value)}
            onFocus={() =>
              setRecipientErrors((prev) => ({
                ...prev,
                country: "Can change in Schedule-pickup",
              }))
            }
            onBlur={() =>
              setRecipientErrors((prev) => ({ ...prev, country: "" }))
            }
            fullWidth
            sx={fieldStyle}
            InputProps={{
              readOnly: true,
              startAdornment: (
                <PublicIcon sx={{ color: "action.active", mr: 1 }} />
              ),
            }}
            helperText={
              recipientErrors?.country ? (
                <span style={{ color: "grey" }}>{recipientErrors.country}</span>
              ) : null
            }
          />
          <TextField
            label="Company Name"
            value={recipientCompanyName}
            className="custom-textfield"
            inputProps={{
              autoComplete: "off",
              autoCorrect: "off",
              autoCapitalize: "none",
              maxLength: 50,
            }}
            onChange={(e) => setRecipientCompanyName(e.target.value)}
            fullWidth
            sx={fieldStyle}
            InputProps={{
              startAdornment: (
                <BusinessIcon sx={{ color: "action.active", mr: 1 }} />
              ),
            }}
          />
          <TextField
            label="Contact Name"
            className="custom-textfield"
            value={recipientContactName}
            inputProps={{
              autoComplete: "off",
              autoCorrect: "off",
              autoCapitalize: "none",
              maxLength: 50,
            }}
            onChange={handleContactNameChange}
            fullWidth
            required
            error={!!recipientErrors.contactName}
            helperText={recipientErrors.contactName}
            sx={fieldStyle}
            InputProps={{
              startAdornment: <PersonIcon sx={{ color: "red", mr: 1 }} />,
            }}
          />
        </Box>

        {/* Row 2: Address Line 1, Address Line 2, Address Line 3 */}
        <Box sx={rowStyle}>
          <TextField
            label="Address Line 1"
            className="custom-textfield"
            value={recipientAddressLine1}
            inputProps={{
              autoComplete: "off",
              autoCorrect: "off",
              autoCapitalize: "none",
              maxLength: 50,
            }}
            onChange={(e) => setRecipientAddressLine1(e.target.value)}
            fullWidth
            required
            error={!!recipientErrors.addressLine1}
            helperText={recipientErrors.addressLine1}
            sx={fieldStyle}
            InputProps={{
              startAdornment: <LocationOnIcon sx={{ color: "red", mr: 1 }} />,
            }}
          />
          <TextField
            label="Address Line 2"
            className="custom-textfield"
            value={recipientAddressLine2}
            inputProps={{
              autoComplete: "off",
              autoCorrect: "off",
              autoCapitalize: "none",
              maxLength: 50,
            }}
            onChange={(e) => setRecipientAddressLine2(e.target.value)}
            fullWidth
            error={!!recipientErrors.addressLine2}
            helperText={recipientErrors.addressLine2}
            sx={fieldStyle}
            InputProps={{
              startAdornment: (
                <LocationOnIcon sx={{ color: "action.active", mr: 1 }} />
              ),
            }}
          />
          <TextField
            label="Address Line 3"
            className="custom-textfield"
            value={recipientAddressLine3}
            inputProps={{
              autoComplete: "off",
              autoCorrect: "off",
              autoCapitalize: "none",
              maxLength: 50,
            }}
            onChange={(e) => setRecipientAddressLine3(e.target.value)}
            fullWidth
            error={!!recipientErrors.addressLine3}
            helperText={recipientErrors.addressLine3}
            sx={fieldStyle}
            InputProps={{
              startAdornment: (
                <LocationOnIcon sx={{ color: "action.active", mr: 1 }} />
              ),
            }}
          />
        </Box>

        {/* Row 3: Zip Code, City, State */}
        <Box sx={rowStyle}>
          <TextField
            label="Zip Code"
            value={recipientZipCode}
            placeholder={
              resiszip === 0 || Gresiszip === 1 ? "Not required" : undefined
            }
            disabled={isGetrate}
            className="custom-textfield"
            inputProps={{
              autoComplete: "off",
              autoCorrect: "off",
              autoCapitalize: "none",
              maxLength: 15,
            }}
            onChange={(e) => setRecipientZipCode(e.target.value)}
            onBlur={handleZipCodeBlur}
            fullWidth
            required={resiszip !== 0 && Gresiszip !== 1}
            error={!!recipientErrors.recipientZipCode}
            helperText={recipientErrors.recipientZipCode}
            sx={fieldStyle}
            InputProps={{
              readOnly: resiszip === 0 || Gresiszip === 1,
              startAdornment: <EmailIcon sx={{ color: "red", mr: 1 }} />,
            }}
          />

          {/* City field - Conditional rendering based on resiszip */}
          {resiszip === 0 ? (
            // Dropdown for city selection when resiszip === 0
            <Autocomplete
              freeSolo
              disablePortal
              options={cities || []}
              loading={isLoading}
              value={recipientCity}
              onChange={handleCityChange}
              sx={fieldStyle}
              disabled={isGetrate}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="City"
                  fullWidth
                  required
                  className="custom-textfield"
                  error={!!recipientErrors.recipientCity}
                  helperText={recipientErrors.recipientCity}
                  sx={fieldStyle}
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: (
                      <>
                        <BusinessIcon sx={{ color: "red", mr: 1 }} />
                        {params.InputProps.startAdornment}
                      </>
                    ),
                    endAdornment: (
                      <>
                        {isLoading ? (
                          <CircularProgress color="inherit" size={20} />
                        ) : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                  inputProps={{
                    ...params.inputProps,
                    maxLength: 35,
                    autoComplete: "off",
                    autoCorrect: "off",
                    autoCapitalize: "none",
                  }}
                />
              )}
            />
          ) : (
            // Regular text field when resiszip !== 0
            <TextField
              label="City"
              value={recipientCity}
              onChange={handleCityInputChange}
              fullWidth
              required
              className="custom-textfield"
              error={!!recipientErrors.recipientCity}
              helperText={recipientErrors.recipientCity}
              disabled={isGetrate}
              sx={fieldStyle}
              inputProps={{
                maxLength: 35,
                autoComplete: "off",
                autoCorrect: "off",
                autoCapitalize: "none",
              }}
              InputProps={{
                startAdornment: <BusinessIcon sx={{ color: "red", mr: 1 }} />,
              }}
            />
          )}

          {recipientCountry && resiszip !== 0 && Gresiszip !== 1 ? (
            <Box sx={fieldStyle}>
              <StateDropdown
                country={recipientCountryId}
                state={recipientState}
                setState={setRecipientState}
                senderErrors={recipientErrors}
                isGetrate={isGetrate}
              />
            </Box>
          ) : (
            <Box sx={fieldStyle}>
              <TextField
                placeholder="Not required"
                value={""}
                fullWidth
                inputProps={{ readOnly: true }}
                sx={fieldStyle}
                className="custom-textfield"
              />
            </Box>
          )}
        </Box>

        {/* Row 4: Phone 1, Phone 2, Email Address */}
        <Box sx={rowStyle}>
          {/* Phone 1 */}
          <Box sx={{ ...fieldStyle, width: "100%" }}>
            <PhoneInput
              className="custom-textfield"
              country={recipientcountrycode}
              inputProps={{
                autoComplete: "off",
                autoCorrect: "off",
                autoCapitalize: "none",
              }}
              value={recipientPhone1}
              onChange={(phone, countryData) => {
                setRecipientPhone1(phone);
                const dialCode = countryData.dialCode;
                const trimmed = phone.replace(`${dialCode}`, "").trim();
                setoldrecipientphone1(trimmed);

                if (!phone) {
                  setRecipientErrors((prev) => ({
                    ...prev,
                    phone1: "Phone number is required",
                  }));
                } else if (
                  phone.length >= 3 &&
                  !validatePhoneNumber(phone, countryData.iso2)
                ) {
                  setRecipientErrors((prev) => ({
                    ...prev,
                    phone1: "Invalid phone number",
                  }));
                } else {
                  setRecipientErrors((prev) => ({ ...prev, phone1: "" }));
                }
              }}
              inputStyle={{
                ...PhoneInputStyle,
                width: "100%",
                fontSize: "0.9rem",
                fontFamily: "Roboto, sans-serif",
                borderColor: recipientErrors.phone1 ? "red" : "#c4c4c4",
              }}
              containerStyle={{ width: "100%" }}
              enableSearch
              specialLabel="Phone 1 *"
              placeholder="Phone 1"
            />
            {recipientErrors.phone1 && (
              <Typography variant="caption" color="error">
                {recipientErrors.phone1}
              </Typography>
            )}
          </Box>

          {/* Phone 2 */}
          <Box sx={{ ...fieldStyle, width: "100%" }}>
            <PhoneInput
              className="custom-textfield"
              country={recipientcountrycode}
              value={recipientPhone2}
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

                console.log("recipient phone2 onChange:", {
                  phone,
                  dialCode,
                  trimmedPhone,
                  hasDigits: /\d/.test(trimmedPhone),
                });

                if (
                  !phone ||
                  phone === dialCode ||
                  trimmedPhone === "" ||
                  !/\d/.test(trimmedPhone)
                ) {
                  console.log(
                    "Clearing recipient phone2: Input is empty or only dial code"
                  );
                  setRecipientPhone2("");
                  setoldrecipientphone2("");
                  setRecipientErrors((prev) => ({ ...prev, phone2: "" }));
                  return;
                }

                console.log("Setting recipient phone2:", phone);
                setRecipientPhone2(phone);
                const dialCodeOnly = countryData.dialCode;
                const trimmed = phone.replace(`${dialCodeOnly}`, "").trim();
                setoldrecipientphone2(trimmed);

                if (
                  phone.length >= 3 &&
                  !validatePhoneNumber(phone, countryData.iso2)
                ) {
                  setRecipientErrors((prev) => ({
                    ...prev,
                    phone2: "Invalid phone number",
                  }));
                } else {
                  setRecipientErrors((prev) => ({ ...prev, phone2: "" }));
                }
              }}
              onBlur={() => {
                const dialCode = `+${recipientcountrycode}`;
                const trimmedPhone = recipientPhone2
                  ? recipientPhone2.replace(dialCode, "").trim()
                  : "";
                if (
                  !recipientPhone2 ||
                  recipientPhone2 === dialCode ||
                  trimmedPhone === "" ||
                  !/\d/.test(trimmedPhone)
                ) {
                  console.log(
                    "onBlur: Clearing recipient phone2 as it's empty or only dial code"
                  );
                  setRecipientPhone2("");
                  setoldrecipientphone2("");
                  setRecipientErrors((prev) => ({ ...prev, phone2: "" }));
                }
              }}
              inputStyle={{
                ...PhoneInputStyle,
                width: "100%",
                fontSize: "0.9rem",
                fontFamily: "Roboto, sans-serif",
                borderColor: recipientErrors.phone2 ? "red" : "#c4c4c4",
              }}
              containerStyle={{ width: "100%" }}
              enableSearch
              specialLabel="Phone 2"
              placeholder="Phone 2"
            />
            {recipientErrors.phone2 && (
              <Typography variant="caption" color="error">
                {recipientErrors.phone2}
              </Typography>
            )}
          </Box>

          {/* Email Address */}
          <TextField
            variant="outlined"
            label="Email Address"
            value={recipientEmail}
            className="custom-textfield"
            inputProps={{
              maxLength: 100,
              autoComplete: "off",
              autoCorrect: "off",
              autoCapitalize: "none",
            }}
            onChange={(e) => setRecipientEmail(e.target.value)}
            fullWidth
            error={!!recipientErrors.email}
            helperText={recipientErrors.email}
            sx={fieldStyle}
            InputProps={{
              startAdornment: (
                <EmailIcon sx={{ color: "action.active", mr: 1 }} />
              ),
            }}
          />
        </Box>

        {/* Row 5: Location Type */}
        <Box sx={rowStyle}>
          <FormControl fullWidth sx={fieldStyle} className="custom-textfield">
            <InputLabel>Select Location Type</InputLabel>
            <Select
              value={recipientLocationType || ""}
              disabled={isGetrate}
              inputProps={{
                autoComplete: "off",
                autoCorrect: "off",
                autoCapitalize: "none",
              }}
              onChange={(e) => setRecipientLocationType(e.target.value)}
              label="Select Location Type"
            >
              <MenuItem value="Residential">Residential</MenuItem>
              <MenuItem value="Commercial">Commercial</MenuItem>
            </Select>
          </FormControl>
          <Box sx={fieldStyle} />
          <Box sx={fieldStyle} />
        </Box>

        {/* Buttons */}
        <ButtonBox>
          <PrevButton
            variant="contained"
            startIcon={<ArrowBackIcon />}
            onClick={handleRecipientPrevious}
          >
            Previous
          </PrevButton>
          <Box sx={{ display: "flex", gap: 2 }}>
            {isGetrate && (
              <EditButton
                type="button"
                variant="contained"
                onClick={() => {
                  setActiveModule("Get Rates");
                  navigate("/admin/getrate");
                }}
              >
                Edit
              </EditButton>
            )}
            <NextButton
              type="submit"
              variant="contained"
              endIcon={<ArrowForwardIcon />}
            >
              {shipmentType === "Ocean" ? "Submit" : "Next"}
            </NextButton>
          </Box>
        </ButtonBox>
      </form>
    </Box>
  );
};

export default Recipient;