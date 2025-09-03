import express from 'express';
import { GetRatesQuotes } from '../controllers/getQuotesController.js'; 
import CryptoJS from 'crypto-js';
import { authenticateUser } from '../Middleware/AuthorizeToken.js';
import { getSecrets } from '../services/userService.js';
import * as dotenv from "dotenv";
dotenv.config();

const router = express.Router();

// ✅ Conditional middleware function
const conditionalMiddleware = (middleware) => {
  return (req, res, next) => {
    if (process.env.NODE_ENV === 'middleware') {
      return middleware(req, res, next);
    } else {
      return next();
    }
  };
};

// ✅ Static route with conditional middleware
router.post('/getRatesData', conditionalMiddleware(authenticateUser), GetRatesQuotes);

// ✅ Encrypted URL route
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

    // ✅ Conditional middleware runner for dynamic route
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

    if (decryptedUrl === '/getRates/getRatesData') {
      return runWithOptionalMiddleware(authenticateUser, GetRatesQuotes);
    }

    return res.status(400).json({ error: 'Invalid endpoint path' });

  } catch (error) {
    console.error('Error decrypting URL:', error);
    return res.status(500).json({ error: 'An error occurred while processing the URL.' });
  }
});

export default router;
