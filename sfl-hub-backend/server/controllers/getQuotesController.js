// import { User } from '../models/User.js';
import { getFedexRatesData } from '../services/getQuotesService.js';
import CryptoJS from 'crypto-js';
import jwt from "jsonwebtoken";
import logger from '../utils/logger.js';

const GetRatesQuotes = async (req, res) => {
  try {
    const userId = req.body;
    console.log(userId);
    
     if (!userId) {
        return res.status(400).json({ error: 'User ID parameter is required' });
     }
    // console.log(`fetchUserById: Fetching user with ID: ${userId}`);
    const user = await getFedexRatesData(userId); 
    res.status(200).json({ message: "Data fetched", data: user });
  } catch (error) {
    console.error(`Error in fetch rates:`, error);
    res.status(500).json({ error: 'Error fetching rates' });
  }
};



export { GetRatesQuotes};