import express from 'express';
const router = express.Router();
import { fedexLabelController} from '../controllers/FedexLabelController.js';
import { getSecrets } from '../services/userService.js';
import { authenticateUser } from '../Middleware/AuthorizeToken.js';
import CryptoJS from "crypto-js";
import * as dotenv from "dotenv";
dotenv.config();
// import { fedexETDController, insertFedexETDDataController, getEtdDetailsController, updateEtdDetailsController} from '../controllers/FedexETDController.js';


const conditionalMiddleware = (middleware) => {
  return (req, res, next) => {
    if (process.env.NODE_ENV === 'middleware') {
      return middleware(req, res, next);
    } else {
      return next();
    }
  };
};

//router.post('/fedexLabel',authenticateUser, fedexLabelController);
router.post('/fedexLabel', conditionalMiddleware(authenticateUser), fedexLabelController);
// router.post('/insertFedexETDData', insertFedexETDDataController);
// router.post('/getEtdDetails', getEtdDetailsController);
// router.post('/updateEtdDetails', updateEtdDetailsController);

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

    // ✅ Middleware runner for encrypted routes
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

    if (decryptedUrl === '/FedexLabelApi/fedexLabel') {
      return runWithOptionalMiddleware(authenticateUser, fedexLabelController);
    }

    return res.status(400).json({ error: 'Invalid endpoint path' });

  } catch (error) {
    console.error('Error decrypting URL:', error);
    return res.status(500).json({ error: 'An error occurred while processing the URL.' });
  }
});


export default router;