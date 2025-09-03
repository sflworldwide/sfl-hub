import express from 'express';
import { getSecrets } from '../services/userService.js';
import CryptoJS from 'crypto-js';
import { getLocationCountry} from '../controllers/locationController.js'; 
import { getStateList} from '../controllers/locationController.js'; 
import { getPostalCodeData} from '../controllers/locationController.js'; 
import { getCityList} from '../controllers/locationController.js'; 
import { authenticateUser } from '../Middleware/AuthorizeToken.js';
import * as dotenv from "dotenv";
dotenv.config();

const conditionalMiddleware = (middleware) => {
  return (req, res, next) => {
    if (process.env.NODE_ENV === 'middleware') {
      return middleware(req, res, next);
    } else {
      return next(); // skip middleware
    }
  };
};



const router = express.Router();
router.get('/getCountry', conditionalMiddleware(authenticateUser), getLocationCountry);  
router.post('/getstate', conditionalMiddleware(authenticateUser), getStateList); 
router.post('/getstateCitybyPostalCode', conditionalMiddleware(authenticateUser), getPostalCodeData);
router.post('/getFedexCityList', conditionalMiddleware(authenticateUser), getCityList);


router.post('/:encryptedUrl', async (req, res) => {
    const { encryptedUrl } = req.params;
    const secrets = await getSecrets();
    const secretKey = secrets.SECRET_KEY;
  
    if (!secretKey) {
      return res.status(500).json({ error: 'Encryption secret key is missing from Secret Manager.' });
    }
  
    try {
      const decodedUrl = decodeURIComponent(encryptedUrl);
      const decryptedUrl = CryptoJS.AES.decrypt(decodedUrl, secretKey).toString(CryptoJS.enc.Utf8);
const runWithOptionalMiddleware = (middleware, handler) => {
  if (process.env.NODE_ENV === 'middleware') {
    middleware(req, res, function next(err) {
      if (err) return res.status(401).json({ error: 'Unauthorized' });
      return handler(req, res);
    });
  } else {
    return handler(req, res);
  }
};

  
      if (decryptedUrl === '/locations/getstate') {
  return runWithOptionalMiddleware(authenticateUser, getStateList);
}

if (decryptedUrl === '/locations/getstateCitybyPostalCode') {
  return runWithOptionalMiddleware(authenticateUser, getPostalCodeData);
}

if (decryptedUrl === '/locations/getFedexCityList') {
  return runWithOptionalMiddleware(authenticateUser, getCityList);
}

  
      return res.status(400).json({ error: 'Invalid endpoint path' });
  
    } catch (error) {
      console.error('Error decrypting URL:', error);
      return res.status(500).json({ error: 'An error occurred while processing the URL.' });
    }
  });


export default router;