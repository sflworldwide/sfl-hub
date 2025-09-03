import React, { useRef,useEffect } from "react";
import axios from "axios";
import { useQuery } from '@tanstack/react-query';
import { Box, TextField, Typography, MenuItem, FormControl, InputLabel, Select, Autocomplete } from "@mui/material";
import PersonIcon from "@mui/icons-material/Person";
import PublicIcon from "@mui/icons-material/Public";
import BusinessIcon from "@mui/icons-material/Business";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import EmailIcon from "@mui/icons-material/Email";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/material.css";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import CircularProgress from '@mui/material/CircularProgress';
import StateDropdown from "./Statedropdown";
import { api, encryptURL } from "../../../utils/api";
import { PhoneInputStyle, PrevButton, EditButton, NextButton, ButtonBox } from "../../styles/scheduleshipmentStyle";
import { parsePhoneNumberFromString } from 'libphonenumber-js';
import { useNavigate } from "react-router-dom";

const Sender = ({
  country,
  countrycode,
  countryId,
  setCountry,
  companyName,
  setCompanyName,
  contactName,
  setContactName,
  addressLine1,
  setAddressLine1,
  addressLine2,
  setAddressLine2,
  addressLine3,
  setAddressLine3,
  zipCode,
  setZipCode,
  fromCity,
  setFromCity,
  state,
  setState,
  phone1,
  setPhone1,
  phone2,
  setPhone2,
  email,
  setEmail,
  needsPickup,
  setNeedsPickup,
  pickupDate,
  setPickupDate,
  senderErrors,
  setSenderErrors,
  handleSenderSubmit,
  handlePrevious,
  setoldphone1,
  setoldphone2,
  iszip,
  isGetrate,
  setActiveModule,
  Giszip,
}) => {
  const debounceRef = useRef(null);
  const navigate = useNavigate();

  const isRepeatedDigits = (number) => /^(\d)\1+$/.test(number);
  const isFakePattern = (number) => {
    const fakeNumbers = [
      '1234567890',
      '0987654321',
      '0123456789',
      '0000000000',
      '9876543210',
    ];
    return fakeNumbers.includes(number);
  };

  const validatePhoneNumber = (phone, countryCode = 'US') => {
    try {
      const parsed = parsePhoneNumberFromString(`+${phone}`, countryCode.toUpperCase());
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

  const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleContactNameChange = (e) => {
    const value = e.target.value;
    setContactName(value);

    if (!value) {
      setSenderErrors(prev => ({ ...prev, contactName: "Contact name is required" }));
    } else if (!validateContactName(value)) {
      setSenderErrors(prev => ({ ...prev, contactName: "Enter a valid name (letters only)" }));
    } else {
      setSenderErrors(prev => ({ ...prev, contactName: "" }));
    }
  };

  const validateForm = () => {
    const errors = {};

    // Validate contact name
    if (!contactName) {
      errors.contactName = "Contact name is required";
    } else if (!validateContactName(contactName)) {
      errors.contactName = "Enter a valid name (letters only)";
    } else {
      errors.contactName = "";
    }

    // Validate phone1
    if (!phone1) {
      errors.phone1 = "Phone number is required";
    } else if (!validatePhoneNumber(phone1, countrycode)) {
      errors.phone1 = "Invalid phone number";
    } else {
      errors.phone1 = "";
    }

    // Validate addressLine1
    if (!addressLine1) {
      errors.addressLine1 = "Address Line 1 is required";
    } else {
      errors.addressLine1 = "";
    }

    // Validate fromCity
    if (!fromCity) {
      errors.fromCity = "City is required";
    } else {
      errors.fromCity = "";
    }

    // Validate email
    if (!email) {
      errors.email = "Email is required";
    } else if (!validateEmail(email)) {
      errors.email = "Invalid email format";
    } else {
      errors.email = "";
    }

    // Validate needsPickup
    if (!needsPickup) {
      errors.needsPickup = "Please select whether pickup is needed";
    } else {
      errors.needsPickup = "";
    }

    // Validate pickupDate if needsPickup is "Yes"
    if (needsPickup === "Yes - I Need Pickup Service" && !pickupDate) {
      errors.pickupDate = "Pickup date is required";
    } else {
      errors.pickupDate = "";
    }

    setSenderErrors(prev => ({ ...prev, ...errors }));
    console.log("Validation errors:", errors);
    return Object.keys(errors).every(key => !errors[key]);
  };

  const onSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      console.log("Form is valid, submitting...");
      handleSenderSubmit(e);
    } else {
      console.log("Form validation failed");
    }
  };

  const handleZipCodeBlur = async () => {
    if (isGetrate || !zipCode || zipCode.length < 3 || iszip === 0 || Giszip === 1) {
      setFromCity("");
      setState("");
      setSenderErrors((prev) => ({ ...prev, zipCode: "" }));
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      console.log("Fetching city for zip code:", zipCode, countrycode);

      try {
        const encodedUrl = encryptURL("/locations/getstateCitybyPostalCode");
        const response = await axios.post(`${api.BackendURL}/locations/${encodedUrl}`, {
          CountryID: countryId,
          PostalCode: zipCode,
        });

        const userData = response.data?.user?.[0] || [];
        console.log("Custom API response:", userData);

        if (userData.length > 0) {
          const place = userData[0];
          setFromCity(place.city);
          setState(place.state);
          setSenderErrors((prev) => ({ ...prev, zipCode: "" }));
          return;
        }

        throw new Error("No data from backend");
      } catch (err) {
        console.warn("Custom API failed or returned no data. Falling back...", err.message);

        try {
          if (countrycode === "in") {
            const res = await axios.get(`https://api.postalpincode.in/pincode/${zipCode}`);
            const data = res.data[0];

            console.log("India API response:", data);
            if (data.Status === "Success" && data.PostOffice?.length > 0) {
              const place = data.PostOffice[0];
              setFromCity(place.Block || place.District);
              setState(place.State);
              setSenderErrors((prev) => ({ ...prev, zipCode: "" }));
              return;
            } else {
              throw new Error("No records from India API");
            }
          } else {
            const res = await axios.get(
              `https://maps.googleapis.com/maps/api/geocode/json?key=${import.meta.env.VITE_GOOGLE_API_KEY}&components=country:${countrycode}|postal_code:${zipCode}`
            );
            const components = res.data.results?.[0]?.address_components || [];
            console.log("Google API response:", components);

            let city = '';
            let state = '';

            components.forEach(component => {
              if (component.types.includes('locality') || component.types.includes('postal_town')) {
                city = component.long_name;
              }
              if (component.types.includes('administrative_area_level_1')) {
                state = component.long_name;
              }
            });

            setFromCity(city);
            setState(state);
            setSenderErrors(prev => ({ ...prev, zipCode: "" }));
          }
        } catch (fallbackErr) {
          console.error("All APIs failed:", fallbackErr.message);
          setFromCity("");
          setSenderErrors((prev) => ({
            ...prev,
            zipCode: "Invalid or unsupported zip code.",
          }));
        }
      }
    }, 500);
  };

  useEffect(() => {
    if (phone1 && countrycode) {
      const input = document.querySelector(".react-tel-input input");
      const dialCode = input?.value.match(/^\+(\d{1,4})/);
      const rawDialCode = dialCode ? dialCode[1] : "";
      if (rawDialCode && phone1.startsWith(`+${rawDialCode}`)) {
        setoldphone1(phone1.replace(`+${rawDialCode}`, '').trim());
        console.log(phone1.replace(`+${rawDialCode}`, '').trim());
      }
    }
  }, [phone1, countrycode, setoldphone1]);

  const today = new Date().toISOString().split("T")[0];

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
    const response = await axios.post(`${api.BackendURL}/locations/getFedexCityList`, {
      countryID: countryId,
      cityType: 'FedEx',
    });
    return response.data.user[0].map(city => city.cityname);
  };

  const { data: cities, isLoading, error } = useQuery({
    queryKey: ['cityList'],
    queryFn: fetchCityList,
  });

  const handleCityChange = (event, newValue) => {
    setFromCity(newValue || '');
    if (!newValue) {
      setSenderErrors({ fromCity: 'Please select a city' });
    } else {
      setSenderErrors({ fromCity: '' });
    }
  };

  return (
    <Box sx={{ p: 3, bgcolor: "white", borderRadius: 2, m: 2 }}>
      <form onSubmit={onSubmit}>
        {/* Row 1: Country, Company Name, Contact Name */}
        <Box sx={rowStyle}>
          <TextField
            label="Country"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            onFocus={() =>
              setSenderErrors((prev) => ({ ...prev, country: "Can change in Schedule-pickup" }))
            }
            onBlur={() => {
              setSenderErrors((prev) => ({ ...prev, country: "" }));
            }}
            fullWidth
            className="custom-textfield"
            sx={fieldStyle}
            InputProps={{
              readOnly: true,
              startAdornment: <PublicIcon sx={{ color: "action.active", mr: 1 }} />,
            }}
            helperText={
              senderErrors.country ? (
                <span style={{ color: "grey" }}>{senderErrors.country}</span>
              ) : null
            }
            inputProps={{
              autoComplete: "off",
              autoCorrect: "off",
              autoCapitalize: "none"
            }}
          />
          <TextField
            label="Company Name"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            fullWidth
            className="custom-textfield"
            sx={fieldStyle}
            inputProps={{
              maxLength: 50,
              autoComplete: "off",
              autoCorrect: "off",
              autoCapitalize: "none"
            }}
            InputProps={{
              startAdornment: <BusinessIcon sx={{ color: "action.active", mr: 1 }} />,
            }}
          />
          <TextField
            label="Contact Name"
            value={contactName}
            onChange={handleContactNameChange}
            fullWidth
            required
            className="custom-textfield"
            error={!!senderErrors.contactName}
            helperText={senderErrors.contactName}
            sx={fieldStyle}
            inputProps={{
              maxLength: 50,
              autoComplete: "off",
              autoCorrect: "off",
              autoCapitalize: "none"
            }}
            InputProps={{
              startAdornment: <PersonIcon sx={{ color: "red", mr: 1 }} />,
            }}
          />
        </Box>

        {/* Row 2: Address Lines */}
        <Box sx={rowStyle}>
          <TextField
            label="Address Line 1"
            value={addressLine1}
            onChange={(e) => setAddressLine1(e.target.value)}
            fullWidth
            required
            className="custom-textfield"
            error={!!senderErrors.addressLine1}
            helperText={senderErrors.addressLine1}
            sx={fieldStyle}
            inputProps={{
              maxLength: 50,
              autoComplete: "off",
              autoCorrect: "off",
              autoCapitalize: "none"
            }}
            InputProps={{
              startAdornment: <LocationOnIcon sx={{ color: "red", mr: 1 }} />,
            }}
          />
          <TextField
            label="Address Line 2"
            value={addressLine2}
            onChange={(e) => setAddressLine2(e.target.value)}
            fullWidth
            className="custom-textfield"
            error={!!senderErrors.addressLine2}
            helperText={senderErrors.addressLine2}
            sx={fieldStyle}
            inputProps={{
              maxLength: 50,
              autoComplete: "off",
              autoCorrect: "off",
              autoCapitalize: "none"
            }}
            InputProps={{
              startAdornment: <LocationOnIcon sx={{ color: "action.active", mr: 1 }} />,
            }}
          />
          <TextField
            label="Address Line 3"
            value={addressLine3}
            onChange={(e) => setAddressLine3(e.target.value)}
            fullWidth
            className="custom-textfield"
            error={!!senderErrors.addressLine3}
            helperText={senderErrors.addressLine3}
            sx={fieldStyle}
            inputProps={{
              maxLength: 50,
              autoComplete: "off",
              autoCorrect: "off",
              autoCapitalize: "none"
            }}
            InputProps={{
              startAdornment: <LocationOnIcon sx={{ color: "action.active", mr: 1 }} />,
            }}
          />
        </Box>

        {/* Row 3: Zip Code, City, State */}
        <Box sx={rowStyle}>
          <TextField
            label="Zip Code"
            value={zipCode}
            placeholder={iszip === 0 || Giszip === 1 ? "Not required" : undefined}
            onChange={(e) => setZipCode(e.target.value)}
            onBlur={handleZipCodeBlur}
            fullWidth
            required={iszip !== 0 && Giszip !== 1}
            className="custom-textfield"
            error={!!senderErrors.zipCode}
            helperText={senderErrors.zipCode}
            disabled={isGetrate}
            sx={fieldStyle}
            inputProps={{
              maxLength: 15,
              autoComplete: "off",
              autoCorrect: "off",
              autoCapitalize: "none",
            }}
            InputProps={{
              readOnly: iszip === 0 || Giszip === 1,
              startAdornment: <EmailIcon sx={{ color: "red", mr: 1 }} />,
            }}
          />

          <Autocomplete
            disablePortal
            options={cities || []}
            loading={isLoading}
            value={fromCity}
            onChange={handleCityChange}
            sx={fieldStyle}
            disabled={isGetrate}
            renderInput={(params) => (
              <TextField
                {...params}
                label="From City"
                fullWidth
                required
                className="custom-textfield"
                error={!!senderErrors.fromCity}
                helperText={senderErrors.fromCity}
                sx={fieldStyle}
                InputProps={{
                  ...params.InputProps,
                  startAdornment: (
                    <>
                      <BusinessIcon sx={{ color: 'red', mr: 1 }} />
                      {params.InputProps.startAdornment}
                    </>
                  ),
                  endAdornment: (
                    <>
                      {isLoading ? <CircularProgress color="inherit" size={20} /> : null}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
                inputProps={{
                  ...params.inputProps,
                  maxLength: 35,
                  autoComplete: 'off',
                  autoCorrect: 'off',
                  autoCapitalize: 'none',
                }}
              />
            )}
          />

          {country && iszip !== 0 && Giszip !== 1 ? (
            <Box sx={fieldStyle} >
              <StateDropdown
                country={countryId}
                state={state}
                setState={setState}
                senderErrors={senderErrors}
                isGetrate={isGetrate}
              />
            </Box>
          ) : (
            <Box sx={fieldStyle}>
              <TextField
                placeholder="Not required"
                value=""
                fullWidth
                inputProps={{ readOnly: true }}
                sx={fieldStyle}
                className="custom-textfield"
              />
            </Box>
          )}
        </Box>

        {/* Row 4: Phone 1, Phone 2, Email */}
        <Box sx={rowStyle}>
          {/* Phone 1 */}
          <Box sx={{ ...fieldStyle, width: '100%' }}>
            <PhoneInput
              className="custom-textfield"
              country={countrycode}
              value={phone1}
              inputProps={{
                autoComplete: "off",
                autoCorrect: "off",
                autoCapitalize: "none",
              }}
              onChange={(phone, countryData) => {
                setPhone1(phone);
                const dialCode = countryData.dialCode;
                const trimmed = phone.replace(`${dialCode}`, '').trim();
                setoldphone1(trimmed);

                if (!phone) {
                  setSenderErrors(prev => ({ ...prev, phone1: "Phone number is required" }));
                } else if (phone.length >= 3 && !validatePhoneNumber(phone, countryData.iso2)) {
                  setSenderErrors(prev => ({ ...prev, phone1: "Invalid phone number" }));
                } else {
                  setSenderErrors(prev => ({ ...prev, phone1: "" }));
                }
              }}
              inputStyle={{
                ...PhoneInputStyle,
                width: '100%',
                borderColor: senderErrors.phone1 ? 'red' : '#c4c4c4',
                fontSize: '0.9rem',
                fontFamily: 'Roboto, sans-serif',
              }}
              containerStyle={{ width: '100%' }}
              enableSearch
              specialLabel="Phone 1 *"
            />
            {senderErrors.phone1 && (
              <Typography variant="caption" color="error">
                {senderErrors.phone1}
              </Typography>
            )}
          </Box>
          {/* Phone 2 */}
          <Box sx={{ ...fieldStyle, width: '100%' }}>
            <PhoneInput
              className="custom-textfield"
              country={countrycode}
              value={phone2}
              inputProps={{
                autoComplete: "off",
                autoCorrect: "off",
                autoCapitalize: "none",
              }}
              onChange={(phone, countryData) => {
                const dialCode = `+${countryData.dialCode}`;
                const trimmedPhone = phone ? phone.replace(dialCode, '').trim() : '';

                console.log('phone2 onChange:', {
                  phone,
                  dialCode,
                  trimmedPhone,
                  hasDigits: /\d/.test(trimmedPhone)
                });

                if (!phone || phone === dialCode || trimmedPhone === '' || !/\d/.test(trimmedPhone)) {
                  console.log('Clearing phone2: Input is empty or only dial code');
                  setPhone2('');
                  setoldphone2('');
                  setSenderErrors(prev => ({ ...prev, phone2: '' }));
                  return;
                }

                console.log('Setting phone2:', phone);
                setPhone2(phone);
                setoldphone2(trimmedPhone);

                if (phone.length >= 3 && !validatePhoneNumber(phone, countryData.iso2)) {
                  setSenderErrors(prev => ({ ...prev, phone2: 'Invalid phone number' }));
                } else {
                  setSenderErrors(prev => ({ ...prev, phone2: '' }));
                }
              }}
              onBlur={() => {
                const dialCode = `+${countrycode}`;
                const trimmedPhone = phone2 ? phone2.replace(dialCode, '').trim() : '';
                if (!phone2 || phone2 === dialCode || trimmedPhone === '' || !/\d/.test(trimmedPhone)) {
                  console.log('onBlur: Clearing phone2 as it’s empty or only dial code');
                  setPhone2('');
                  setoldphone2('');
                  setSenderErrors(prev => ({ ...prev, phone2: '' }));
                }
              }}
              inputStyle={{
                ...PhoneInputStyle,
                width: '100%',
                borderColor: senderErrors.phone2 ? 'red' : '#c4c4c4',
                fontSize: '0.9rem',
                fontFamily: 'Roboto, sans-serif',
              }}
              containerStyle={{ width: '100%' }}
              enableSearch
              specialLabel="Phone 2"
            />
            {senderErrors.phone2 && (
              <Typography variant="caption" color="error">
                {senderErrors.phone2}
              </Typography>
            )}
          </Box>

          {/* Email Address */}
          <TextField
            variant="outlined"
            label="Email Address"
            value={email}
            className="custom-textfield"
            onChange={(e) => setEmail(e.target.value)}
            fullWidth
            required
            error={!!senderErrors.email}
            helperText={senderErrors.email}
            sx={fieldStyle}
            inputProps={{
              maxLength: 100,
              autoComplete: "off",
              autoCorrect: "off",
              autoCapitalize: "none"
            }}
            InputProps={{
              startAdornment: <EmailIcon sx={{ color: "red", mr: 1 }} />,
            }}
          />
        </Box>

        {/* Row 5: Needs Pickup, Pickup Date */}
        <Box sx={rowStyle}>
          <FormControl fullWidth sx={fieldStyle} className="small-textfield">
            <InputLabel>Do You Need Pickup?</InputLabel>
            <Select
              value={needsPickup || ""}
              onChange={(e) => setNeedsPickup(e.target.value)}
              label="Do You Need Pickup?"
              inputProps={{
                autoComplete: "off",
                autoCorrect: "off",
                autoCapitalize: "none"
              }}
              startAdornment={<LocalShippingIcon sx={{ color: "action.active", mr: 1 }} />}
              error={!!senderErrors.needsPickup}
            >
              <MenuItem value="No - I Will Drop Off My Package">No - I Will Drop Off My Package</MenuItem>
              <MenuItem value="Yes - I Need Pickup Service">Yes - I Need Pickup Service</MenuItem>
            </Select>
            {senderErrors.needsPickup && (
              <Typography variant="caption" color="error">
                {senderErrors.needsPickup}
              </Typography>
            )}
          </FormControl>
          {needsPickup === "Yes - I Need Pickup Service" ? (
            <TextField
              label="Pickup Date"
              className="custom-textfield"
              type="date"
              value={pickupDate || ""}
              onChange={(e) => setPickupDate(e.target.value)}
              fullWidth
              required
              error={!!senderErrors.pickupDate}
              helperText={senderErrors.pickupDate}
              sx={fieldStyle}
              InputLabelProps={{ shrink: true }}
              InputProps={{
                startAdornment: <CalendarTodayIcon sx={{ color: "red", mr: 1 }} />,
              }}
              inputProps={{
                min: today,
                autoComplete: "off",
                autoCorrect: "off",
                autoCapitalize: "none"
              }}
            />
          ) : (
            <Box sx={fieldStyle} />
          )}
          <Box sx={fieldStyle} />
        </Box>

        {/* Buttons */}
        <ButtonBox>
          <PrevButton
            variant="contained"
            startIcon={<ArrowBackIcon />}
            onClick={handlePrevious}
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
                          navigate('/admin/getrates')
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
              Next
            </NextButton>
          </Box>
        </ButtonBox>
      </form>
    </Box>
  );
};

export default Sender;