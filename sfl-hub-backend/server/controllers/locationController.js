import { getcountry } from '../services/locationService.js';
import { getStateListbycountry } from '../services/locationService.js';
import { getpostadatabyCountry } from '../services/locationService.js';
import { getCityListByCountry } from '../services/locationService.js';


const getLocationCountry = async (req, res) => {
    try {
      
      const user = await getcountry();
    //   console.log("uSER = ",user)
      res.status(200).json({ user });
    } catch (error) {
      res.status(500).json({ error: 'Error in getting country' });
    }
  };

  const getStateList = async (req, res) => {
    try {
      const countryData = req.body;
      // console.log("countryData = ",countryData)
      const user = await getStateListbycountry(countryData);
      // console.log("uSER = ",user)
      res.status(200).json({ user });
    } catch (error) {
      res.status(500).json({ error: 'Error in getting state list' });
    }
  };

  const getPostalCodeData = async (req, res) => {
    try {
      const countryData = req.body;
      // console.log("countryData = ",countryData)
      const user = await getpostadatabyCountry(countryData);
      // console.log("uSER = ",user)
      res.status(200).json({ user });
    } catch (error) {
      res.status(500).json({ error: 'Error in getting state list' });
    }
  };

const getCityList = async (req, res) => {
  try{
    const {countryID, cityType} = req.body;
    const user = await getCityListByCountry(countryID, cityType);
    res.status(200).json({ user });
  }catch (error) {
    res.status(500).json({ error: 'Error in getting FedEx City list' });
  }
}


export { getLocationCountry,getStateList,getPostalCodeData,getCityList };