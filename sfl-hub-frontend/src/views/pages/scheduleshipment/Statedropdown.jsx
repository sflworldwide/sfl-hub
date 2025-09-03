import React, { useState, useEffect } from "react";
import axios from "axios";
import { Autocomplete, TextField, FormControl } from "@mui/material";
import { api, encryptURL } from "../../../utils/api";

const StateDropdown = ({ country, setState, senderErrors, state: selectedState ,isGetrate}) => {
  const [states, setStates] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!country) return;

    const fetchStates = async () => {
      try {
        setLoading(true);
        const encodedUrl= encryptURL("/locations/getstate");
        const response = await axios.post(`${api.BackendURL}/locations/${encodedUrl}`, {
        // const response = await axios.post(`${api.BackendURL}/locations/getstate`, {
          CountryID: country,
        },
        {
          withCredentials: true,
        }
      );
        const stateList = response.data.user?.[0] || [];
        const stateNames = stateList.map((state) => state.statename);
        setStates(stateNames);
      } catch (error) {
        console.error("Failed to fetch states:", error);
        setStates([]);
      } finally {
        setLoading(false);
      }
    };

    fetchStates();
  }, [country]);

  return (
    <FormControl fullWidth>
      <Autocomplete
        freeSolo
        disablePortal
        id="state-autocomplete"
        options={states}
        loading={loading}
        getOptionLabel={(option) => option}
        disabled={isGetrate}
        onChange={(event, newValue) => {
          setState(newValue); // when selected from dropdown
        }}
        onInputChange={(event, newInputValue) => {
          if (event) setState(newInputValue); // when typed manually
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            className="custom-textfield"
            label="Select State"
            error={!!senderErrors.state}
            helperText={senderErrors.state}
            required
          />
        )}
        value={states.find((s) => s === selectedState) || selectedState || ""} // set the selected state
      />
      {senderErrors.state && (
        <Typography color="error" variant="caption">
          {senderErrors.state}
        </Typography>
      )}
    </FormControl>
  );
};

export default StateDropdown;