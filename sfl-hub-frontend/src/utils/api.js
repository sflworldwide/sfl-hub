import CryptoJS from "crypto-js";
import axios from "axios";

export const api = {
  //BackendURL: "http://localhost:5000",
  //BackendURL: "https://sfl-bk.trysimmer.com",
  BackendURL: "https://hub-bk.sflworldwide.com",
  //BackendURL: "https://sfl-bk-second.trysimmer.com",
  OldDatabaseURL: "https://hubapi.sflworldwide.com",
};

export const encryptURL = (url) => {
  const SECRET_KEY = import.meta.env.VITE_SECRET_KEY;
  if (!SECRET_KEY) {
    console.warn("Encryption key is missing!");
    return null;
  }
  if (url) {
    const enulr = CryptoJS.AES.encrypt(url, SECRET_KEY).toString();
    return encodeURIComponent(enulr);
  }
};

export const getStateID = async (
  countryName,
  stateName,
  setcountryid,
  setstateid
) => {
  try {
    // Step 1: Get Country ID
    const countryResponse = await axios.post(
      "https://hubapi.sflworldwide.com/location/getCountryIDByName",
      {
        CountryName: countryName,
      }
    );

    if (countryResponse.data.success && countryResponse.data.data.length > 0) {
      const countryID = countryResponse.data.data[0].CountryID;
      // console.log('Country ID:', countryID);
      setcountryid(countryID);

      // Step 2: Get State ID using Country ID
      const stateResponse = await axios.post(
        "https://hubapi.sflworldwide.com/location/getStateIDByName",
        {
          CountryID: countryID,
          StateName: stateName,
        }
      );

      if (stateResponse.data.success && stateResponse.data.data.length > 0) {
        const stateID = stateResponse.data.data[0].StateID;
        // console.log('State ID:', stateID);
        setstateid(stateID);
        return { countryID, stateID };
      } else {
        console.error("State not found or API call failed.");
        return null;
      }
    } else {
      console.error("Country not found or API call failed.");
      return null;
    }
  } catch (error) {
    console.error("Error fetching data:", error);
    return null;
  }
};

export const getUserIP = async () => {
  try {
    const res = await fetch("https://ipv4.icanhazip.com");
    return (await res.text()).trim();
  } catch {
    return "::1";
  }
};

export const getUserDetails = () => {
  const SECRET_KEY = import.meta.env.VITE_SECRET_KEY;
  const user = JSON.parse(sessionStorage.getItem("user"));
  const username = user?.username;
  const useremail = user?.email;
  const email = useremail
    ? CryptoJS.AES.encrypt(useremail, SECRET_KEY).toString()
    : "";
  return { username, email };
};
