import express from 'express';
const router = express.Router();
import { fedexETDController} from '../controllers/FedexETDController.js';
import { authenticateUser } from '../Middleware/AuthorizeToken.js';
import { getSecrets } from '../services/userService.js';
import CryptoJS from "crypto-js";
import * as dotenv from "dotenv";
dotenv.config();

const conditionalMiddleware = (middleware) => {
  return (req, res, next) => {
    if (process.env.NODE_ENV === 'middleware') {
      return middleware(req, res, next);
    } else {
      return next();
    }
  };
};

router.post('/fedexETD', conditionalMiddleware(authenticateUser), fedexETDController);

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
    if (decryptedUrl === '/FedexApi/fedexETD') {
      return runWithOptionalMiddleware(authenticateUser, fedexETDController);
    }
      return res.status(400).json({ error: 'Invalid endpoint path' });
  
    } catch (error) {
      console.error('Error decrypting URL:', error);
      return res.status(500).json({ error: 'An error occurred while processing the URL.' });
    }
  });

export default router;