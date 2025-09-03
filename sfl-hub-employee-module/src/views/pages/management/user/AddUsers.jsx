import React, { useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import {
  Box,
  Button,
  TextField,
  MenuItem,
  Typography,
  Select,
  FormControl,
  InputLabel,
  Autocomplete,
  Paper,
  Popper,
  CircularProgress,
} from "@mui/material";
import EditUserTabs from "./EditUserTabs";
import { ContentBox, IconBox } from "../../../styles/scheduleshipmentStyle";
import { useStyles } from "../../../styles/MyshipmentStyle";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import LockIcon from "@mui/icons-material/Lock";
import PersonIcon from "@mui/icons-material/Person";
import LocationCityIcon from "@mui/icons-material/LocationCity";
import EmailIcon from "@mui/icons-material/Email";
import PhoneIcon from "@mui/icons-material/Phone";
import { api,encryptURL } from "../../../../utils/api";
import { toast } from "react-hot-toast";
import AccessTable from "./AccessDetails";
import Documentation from "./Documentation";
import MarkupDetails from "./MarkupDetails";
const AddUsers = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const classes = useStyles();
  const debounceRef = useRef(null);
  const [activeTab, setActiveTab] = useState("user-details");
  const [completedTabs, setCompletedTabs] = useState({
    "user-details": true,
    "access-details": false,
    "markup-details": false,
    "documentation": false,
  });
  const [errors, setErrors] = useState({ zip: "" });

  const [formData, setFormData] = useState(() => {
    const user = location.state?.user;
    return user
      ? {
          username: user.loginid,
          password: user.password,
          accountNumber: user.accountnumber,
          managedBy: user.managedbyname,
          companyName: user.companyname,
          addressLine1: user.addressline1,
          addressLine2: user.addressline2,
          addressLine3: user.addressline3,
          country: user.country ? user.country.toLowerCase() : "",
          zip: user.zipcode,
          city: user.city,
          state: user.state,
          contactName: user.name,
          phone1: user.phonenum,
          phone2: "",
          email: user.email,
          paperSize: "4 x 6",
          paperSizePreview: "Default",
          userStatus: user.status === "Active" || user.status === "Enable" ? "Enable" : "Disable",
          userType: user.usertype,
        }
      : {
          username: "",
          password: "",
          accountNumber: "",
          managedBy: "",
          companyName: "",
          addressLine1: "",
          addressLine2: "",
          addressLine3: "",
          country: "",
          zip: "",
          city: "",
          state: "",
          contactName: "",
          phone1: "",
          phone2: "",
          email: "",
          paperSize: "4 x 6",
          paperSizePreview: "Default",
          userStatus: "",
          userType: "",
        };
  });

  // Fetch countries using useQuery
  const { data: countries = [], isLoading: isCountriesLoading, isError: isCountriesError } = useQuery({
    queryKey: ["countries"],
    queryFn: async () => {
      const res = await axios.get(`${api.BackendURL}/locations/getCountry`, { withCredentials: true });
      const countryData = res.data?.user?.[0] || [];
      return countryData.map(country => ({
        value: country.countrycode.toLowerCase(),
        label: country.countryname,
        countryid: country.countryid,
        iszipavailable: country.iszipavailable,
      }));
    },
    staleTime: 24 * 60 * 60 * 1000,
    retry: 2,
    onError: (error) => {
      console.error("Failed to fetch countries:", error);
      toast.error("Failed to load countries.");
    },
  });

  // Fetch cities based on selected country
  const selectedCountry = countries.find((country) => country.value === formData.country);
  const { data: cities = [], isLoading: isCitiesLoading, isError: isCitiesError } = useQuery({
    queryKey: ["cities", selectedCountry?.countryid],
    queryFn: async () => {
      if (!selectedCountry?.countryid) return [];
      const response = await axios.post(`${api.BackendURL}/locations/getFedexCityList`, {
        countryID: selectedCountry.countryid,
        cityType: "FedEx",
      }, { withCredentials: true });
      return response.data.user[0].map(city => city.cityname);
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

  const handleTabChange = (newTab) => {
    setActiveTab(newTab);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCountryChange = (event, newValue) => {
    setFormData((prev) => ({
      ...prev,
      country: newValue ? newValue.value : "",
      city: "",
      state: "",
      zip: "",
    }));
    setErrors((prev) => ({ ...prev, zip: "" }));
  };

  const handleCityChange = (event, newValue) => {
    setFormData((prev) => ({ ...prev, city: newValue || "" }));
  };

  const handleZipCodeBlur = async () => {
    if (!formData.zip || formData.zip.length < 3 || !isZipAvailable) {
      setFormData((prev) => ({ ...prev, city: "", state: "" }));
      setErrors((prev) => ({ ...prev, zip: "" }));
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      console.log("Fetching city for zip code:", formData.zip, formData.country);

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
        console.warn("Custom API failed or returned no data. Falling back...", err.message);

        try {
          if (formData.country === "in") {
            const res = await axios.get(`https://api.postalpincode.in/pincode/${formData.zip}`);
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
              `https://maps.googleapis.com/maps/api/geocode/json?key=${import.meta.env.VITE_GOOGLE_API_KEY}&components=country:${formData.country}|postal_code:${formData.zip}`
            );
            const components = res.data.results?.[0]?.address_components || [];
            console.log("Google API response:", components);

            let city = "";
            let state = "";

            components.forEach(component => {
              if (component.types.includes("locality") || component.types.includes("postal_town")) {
                city = component.long_name;
              }
              if (component.types.includes("administrative_area_level_1")) {
                state = component.long_name;
              }
            });

            setFormData((prev) => ({
              ...prev,
              city,
              state,
            }));
            setErrors((prev) => ({ ...prev, zip: "" }));
          }
        } catch (fallbackErr) {
          console.error("All APIs failed:", fallbackErr.message);
          setFormData((prev) => ({ ...prev, city: "", state: "" }));
          setErrors((prev) => ({
            ...prev,
            zip: "Invalid or unsupported zip code.",
          }));
          toast.error("Invalid or unsupported zip code.");
        }
      }
    }, 500);
  };

  const handleSave = () => {
    console.log("Form saved:", formData);
    if (activeTab === "user-details") {
      setCompletedTabs((prev) => ({ ...prev, "user-details": true }));
    }
  };

  const handleDelete = () => {
    console.log("User deleted");
  };

  const isMobile = window.innerWidth < 600;

  // Custom Paper component for scrollable dropdown
  const CustomPaper = (props) => (
    <Paper
      {...props}
      sx={{
        maxHeight: 200,
        overflowY: "auto",
        mt: -30,
      }}
    />
  );

  // Custom Popper component to position dropdown above
  const CustomPopper = (props) => (
    <Popper
      {...props}
      placement="top-start"
      modifiers={[
        {
          name: "offset",
          options: {
            offset: [0, -8],
          },
        },
      ]}
    />
  );

  return (
    <Box sx={{ p: 3, backgroundColor: "#f5f5f5", minHeight: "100vh" }}>
      <EditUserTabs
        activeTab={activeTab}
        handleTabClick={handleTabChange}
        isMobile={isMobile}
        completedTabs={completedTabs}
        hideMarkup={ true} // Hide Markup tab
      />

      {activeTab === "user-details" && (
        <ContentBox sx={{ margin: "3rem", width: "100%", marginLeft: "0rem" }}>
          <Typography variant="h5" sx={{ mb: 3, fontSize: "1.3rem" }}>
            <IconBox className="card-icon">
              <AccountCircleIcon className={classes.iconBox} />
            </IconBox>
            User Management
          </Typography>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(4, 1fr)" }, gap: 2, p: 1 }}>
            {/* Row 1 */}
            <TextField
              label="User Name"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              fullWidth
              className="custom-textfield"
              inputProps={{
                maxLength: 30,
                autoComplete: "off",
                autoCorrect: "off",
                autoCapitalize: "none",
              }}
              InputProps={{
                startAdornment: <AccountCircleIcon sx={{ color: "grey", mr: 1 }} />,
              }}
            />
            <TextField
              label="Password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleInputChange}
              fullWidth
              className="custom-textfield"
              inputProps={{
                maxLength: 20,
                autoComplete: "off",
                autoCorrect: "off",
                autoCapitalize: "none",
              }}
              InputProps={{
                startAdornment: <LockIcon sx={{ color: "grey", mr: 1 }} />,
              }}
            />
            <TextField
              label="Account Number"
              name="accountNumber"
              value={formData.accountNumber}
              onChange={handleInputChange}
              fullWidth
              className="custom-textfield"
              inputProps={{
                maxLength: 30,
                autoComplete: "off",
                autoCorrect: "off",
                autoCapitalize: "none",
              }}
              InputProps={{
                startAdornment: <PersonIcon sx={{ color: "grey", mr: 1 }} />,
              }}
            />
            <FormControl fullWidth className="custom-textfield">
              <InputLabel id="managed-by-label" shrink sx={{ fontSize: "11px", transform: "translate(14px, -6px) scale(0.75)" }}>
                Managed By
              </InputLabel>
              <Select
                labelId="managed-by-label"
                label="Managed By"
                name="managedBy"
                value={formData.managedBy}
                onChange={handleInputChange}
                fullWidth
                sx={{ fontSize: "11px", padding: "2px 0px" }}
                size="small"
                notched
              >
                <MenuItem value="" sx={{ fontSize: "11px" }}>
                  <em>None</em>
                </MenuItem>
                {/* Add MenuItem options as needed */}
              </Select>
            </FormControl>
            {/* Row 2 */}
            <TextField
              label="Company Name"
              name="companyName"
              className="custom-textfield"
              value={formData.companyName}
              onChange={handleInputChange}
              fullWidth
              inputProps={{
                maxLength: 30,
                autoComplete: "off",
                autoCorrect: "off",
                autoCapitalize: "none",
              }}
              InputProps={{
                startAdornment: <PersonIcon sx={{ color: "grey", mr: 1 }} />,
              }}
            />
            <TextField
              label="Address Line 1"
              name="addressLine1"
              value={formData.addressLine1}
              onChange={handleInputChange}
              className="custom-textfield"
              fullWidth
              inputProps={{
                maxLength: 50,
                autoComplete: "off",
                autoCorrect: "off",
                autoCapitalize: "none",
              }}
              InputProps={{
                startAdornment: <PersonIcon sx={{ color: "grey", mr: 1 }} />,
              }}
            />
            <TextField
              label="Address Line 2"
              name="addressLine2"
              className="custom-textfield"
              value={formData.addressLine2}
              onChange={handleInputChange}
              fullWidth
              inputProps={{
                maxLength: 50,
                autoComplete: "off",
                autoCorrect: "off",
                autoCapitalize: "none",
              }}
              InputProps={{
                startAdornment: <PersonIcon sx={{ color: "grey", mr: 1 }} />,
              }}
            />
            <TextField
              label="Address Line 3"
              name="addressLine3"
              className="custom-textfield"
              value={formData.addressLine3}
              onChange={handleInputChange}
              fullWidth
              inputProps={{
                maxLength: 50,
                autoComplete: "off",
                autoCorrect: "off",
                autoCapitalize: "none",
              }}
              InputProps={{
                startAdornment: <PersonIcon sx={{ color: "grey", mr: 1 }} />,
              }}
            />
            {/* Row 3 */}
            <FormControl fullWidth className="custom-textfield">
              <Autocomplete
                id="country-autocomplete"
                options={countries}
                getOptionLabel={(option) => option.label || ""}
                value={countries.find((country) => country.value === formData.country) || null}
                onChange={handleCountryChange}
                disabled={isCountriesLoading || isCountriesError}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Country"
                    fullWidth
                    className="custom-textfield"
                    InputLabelProps={{
                      shrink: true,
                      sx: { fontSize: "11px", transform: "translate(14px, -6px) scale(0.75)" },
                    }}
                    inputProps={{
                      ...params.inputProps,
                      autoComplete: "off",
                      autoCorrect: "off",
                      autoCapitalize: "none",
                    }}
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: <PersonIcon sx={{ color: "grey", mr: 1 }} />,
                      endAdornment: (
                        <>
                          {isCountriesLoading && <CircularProgress size={20} />}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    }}
                  />
                )}
                renderOption={(props, option) => (
                  <li {...props} key={option.countryid} style={{ fontSize: "11px" }}>
                    {option.label}
                  </li>
                )}
                noOptionsText={isCountriesError ? "Error loading countries" : "No countries found"}
              />
            </FormControl>
            <TextField
              label="Zip"
              name="zip"
              className="custom-textfield"
              value={formData.zip}
              onChange={handleInputChange}
              onBlur={handleZipCodeBlur}
              fullWidth
              disabled={!isZipAvailable}
              placeholder={!isZipAvailable ? "Not required" : undefined}
              error={!!errors.zip}
              helperText={errors.zip}
              inputProps={{
                maxLength: 50,
                autoComplete: "off",
                autoCorrect: "off",
                autoCapitalize: "none",
              }}
              InputProps={{
                startAdornment: <PersonIcon sx={{ color: "grey", mr: 1 }} />,
              }}
            />
            <FormControl fullWidth className="custom-textfield">
              <Autocomplete
                id="city-autocomplete"
                options={cities}
                getOptionLabel={(option) => option || ""}
                value={formData.city || null}
                onChange={handleCityChange}
                disabled={isCitiesLoading || isCitiesError || !selectedCountry}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="City"
                    fullWidth
                    className="custom-textfield"
                    InputLabelProps={{
                      shrink: true,
                      sx: { fontSize: "11px", transform: "translate(14px, -6px) scale(0.75)" },
                    }}
                    inputProps={{
                      ...params.inputProps,
                      autoComplete: "off",
                      autoCorrect: "off",
                      autoCapitalize: "none",
                    }}
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: <LocationCityIcon sx={{ color: "grey", mr: 1 }} />,
                      endAdornment: (
                        <>
                          {isCitiesLoading && <CircularProgress size={20} />}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    }}
                  />
                )}
                renderOption={(props, option) => (
                  <li {...props} key={option} style={{ fontSize: "11px" }}>
                    {option}
                  </li>
                )}
                noOptionsText={isCitiesError ? "Error loading cities" : "No cities found"}
              />
            </FormControl>
            <TextField
              label="State"
              name="state"
              value={formData.state}
              onChange={handleInputChange}
              fullWidth
              className="custom-textfield"
              disabled={!isZipAvailable}
              placeholder={!isZipAvailable ? "Not required" : undefined}
              inputProps={{
                maxLength: 50,
                autoComplete: "off",
                autoCorrect: "off",
                autoCapitalize: "none",
              }}
              InputProps={{
                startAdornment: <LocationCityIcon sx={{ color: "grey", mr: 1 }} />,
              }}
            />
            {/* Row 4 */}
            <TextField
              label="Contact Name"
              name="contactName"
              className="custom-textfield"
              value={formData.contactName}
              onChange={handleInputChange}
              fullWidth
              inputProps={{
                maxLength: 50,
                autoComplete: "off",
                autoCorrect: "off",
                autoCapitalize: "none",
              }}
              InputProps={{
                startAdornment: <PersonIcon sx={{ color: "grey", mr: 1 }} />,
              }}
            />
            <TextField
              label="Phone 1"
              name="phone1"
              value={formData.phone1}
              className="custom-textfield"
              onChange={handleInputChange}
              fullWidth
              inputProps={{
                maxLength: 15,
                autoComplete: "off",
                autoCorrect: "off",
                autoCapitalize: "none",
              }}
              InputProps={{
                startAdornment: <PhoneIcon sx={{ color: "grey", mr: 1 }} />,
              }}
            />
            <TextField
              label="Phone 2"
              name="phone2"
              className="custom-textfield"
              value={formData.phone2}
              onChange={handleInputChange}
              fullWidth
              inputProps={{
                maxLength: 15,
                autoComplete: "off",
                autoCorrect: "off",
                autoCapitalize: "none",
              }}
              InputProps={{
                startAdornment: <PhoneIcon sx={{ color: "grey", mr: 1 }} />,
              }}
            />
            <TextField
              label="Email"
              name="email"
              className="custom-textfield"
              value={formData.email}
              onChange={handleInputChange}
              fullWidth
              inputProps={{
                maxLength: 50,
                autoComplete: "off",
                autoCorrect: "off",
                autoCapitalize: "none",
              }}
              InputProps={{
                startAdornment: <EmailIcon sx={{ color: "grey", mr: 1 }} />,
              }}
            />
            {/* Row 5 */}
            <FormControl fullWidth className="custom-textfield">
              <InputLabel id="paper-size-label" shrink sx={{ fontSize: "11px", transform: "translate(14px, -6px) scale(0.75)" }}>
                Paper Size
              </InputLabel>
              <Select
                labelId="paper-size-label"
                label="Paper Size"
                name="paperSize"
                value={formData.paperSize}
                onChange={handleInputChange}
                fullWidth
                sx={{ fontSize: "11px", padding: "2px 0px" }}
                size="small"
                notched
              >
                <MenuItem value="4 x 6" sx={{ fontSize: "11px" }}>4 x 6</MenuItem>
                <MenuItem value="4 x 6.75" sx={{ fontSize: "11px" }}>4 x 6.75</MenuItem>
                <MenuItem value="4 x 8" sx={{ fontSize: "11px" }}>4 x 8</MenuItem>
                <MenuItem value="4 x 9" sx={{ fontSize: "11px" }}>4 x 9</MenuItem>
                <MenuItem value="8.5 x 11" sx={{ fontSize: "11px" }}>8.5 x 11</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth className="custom-textfield">
              <InputLabel id="paper-size-preview-label" shrink sx={{ fontSize: "11px", transform: "translate(14px, -6px) scale(0.75)" }}>
                Paper Size Preview
              </InputLabel>
              <Select
                labelId="paper-size-preview-label"
                label="Paper Size Preview"
                name="paperSizePreview"
                value={formData.paperSizePreview}
                onChange={handleInputChange}
                fullWidth
                sx={{ fontSize: "11px", padding: "2px 0px" }}
                size="small"
                notched
              >
                <MenuItem value="4 x 6" sx={{ fontSize: "11px" }}>4 x 6</MenuItem>
                <MenuItem value="4 x 6.75" sx={{ fontSize: "11px" }}>4 x 6.75</MenuItem>
                <MenuItem value="4 x 8" sx={{ fontSize: "11px" }}>4 x 8</MenuItem>
                <MenuItem value="4 x 9" sx={{ fontSize: "11px" }}>4 x 9</MenuItem>
                <MenuItem value="8.5 x 11" sx={{ fontSize: "11px" }}>8.5 x 11</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth className="custom-textfield">
              <InputLabel id="user-status-label" shrink sx={{ fontSize: "11px", transform: "translate(14px, -6px) scale(0.75)" }}>
                User Status
              </InputLabel>
              <Select
                labelId="user-status-label"
                label="User Status"
                name="userStatus"
                value={formData.userStatus}
                onChange={handleInputChange}
                fullWidth
                sx={{ fontSize: "11px", padding: "2px 0px" }}
                size="small"
                notched
              >
                <MenuItem value="Enable" sx={{ fontSize: "11px" }}>Enable</MenuItem>
                <MenuItem value="Disable" sx={{ fontSize: "11px" }}>Disable</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth className="custom-textfield">
              <InputLabel id="user-type-label" shrink sx={{ fontSize: "11px", transform: "translate(14px, -6px) scale(0.75)" }}>
                User Type
              </InputLabel>
              <Select
                labelId="user-type-label"
                label="User Type"
                name="userType"
                value={formData.userType}
                onChange={handleInputChange}
                fullWidth
                sx={{ fontSize: "11px", padding: "2px 0px" }}
                size="small"
                notched
              >
                <MenuItem value="Employee" sx={{ fontSize: "11px" }}>Employee</MenuItem>
                <MenuItem value="Customer" sx={{ fontSize: "11px" }}>Customer</MenuItem>
                <MenuItem value="Contractor" sx={{ fontSize: "11px" }}>Contractor</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </ContentBox>
      )}
      {activeTab === "access-details" && (
  <ContentBox sx={{ margin: "3rem", width: "100%", marginLeft: "0rem" }}>
    <Typography variant="h5" sx={{ mb: 3, fontSize: "1.3rem" }}>
      <IconBox className="card-icon">
        <AccountCircleIcon className={classes.iconBox} />
      </IconBox>
      Access Details
    </Typography>
    <AccessTable user={location.state?.user} />
  </ContentBox>
)}    

  {/* {activeTab === "markup-details" && (
  <ContentBox sx={{ margin: "3rem", width: "100%", marginLeft: "0rem" }}>
    <Typography variant="h5" sx={{ mb: 3, fontSize: "1.3rem" }}>
      <IconBox className="card-icon">
        <AccountCircleIcon className={classes.iconBox} />
      </IconBox>
      Markup Details
    </Typography>
    <MarkupDetails user={location.state?.user} />
  </ContentBox>
)}
   */}

      {activeTab === "documentation" && (
  <ContentBox sx={{ margin: "3rem", width: "100%", marginLeft: "0rem" }}>
    <Typography variant="h5" sx={{ mb: 3, fontSize: "1.3rem" }}>
      <IconBox className="card-icon">
        <AccountCircleIcon className={classes.iconBox} />
      </IconBox>
      Documentation
    </Typography>
    <Documentation user={location.state?.user} />
  </ContentBox>
)}

      <Box sx={{ mt: 2, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Box>
          <Button variant="contained" color="error" onClick={handleDelete} sx={{ padding: "10px 16px", fontSize: "12px" }}>
            DELETE
          </Button>
        </Box>
        <Box sx={{ display: "flex", gap: 2 }}>
          <Button variant="contained" onClick={handleSave} sx={{ padding: "10px 20px", fontSize: "12px", background: "#E91E63" }}>
            SAVE
          </Button>
          <Button
            variant="contained"
            color="secondary"
            onClick={() => console.log("Save & Exit")}
            sx={{ padding: "10px 16px", fontSize: "12px" }}
          >
            SAVE & EXIT
          </Button>
          <Button
            variant="contained"
            onClick={() => navigate(-1)}
            sx={{ padding: "10px 16px", fontSize: "12px", background: "grey", color: "white" }}
          >
            CANCEL
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default AddUsers;