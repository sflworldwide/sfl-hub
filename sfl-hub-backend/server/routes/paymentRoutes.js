import express from 'express';
import { createPayment, handlePaymentSuccess, handlePaymentCancellation } from '../controllers/paymentController.js';

const router = express.Router();

router.post('/create-payment', createPayment);
router.get('/payment-success', handlePaymentSuccess);
router.post('/payment-success', handlePaymentSuccess);
router.get('/payment-cancel', handlePaymentCancellation);

export default router;