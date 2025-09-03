import { generateHostedPaymentToken, processPaymentCallback } from '../services/paymentService.js';

async function createPayment(req, res) {
  try {
    const { amount, billTo, TrackingNumber } = req.body;
    if (!amount) {
      return res.status(400).json({
        success: false,
        message: 'Amount is required'
      });
    }
    if (!billTo || Object.keys(billTo).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Billing information is required'
      });
    }
    console.log('Received payment request:', { amount, billTo, TrackingNumber });

    const result = await generateHostedPaymentToken(amount, billTo, TrackingNumber);
    if (result && result.token) {
      // console.log('Token generated successfully:', result.token);
      res.json({
        success: true,
        token: result.token,
        message: 'Payment token generated successfully.'
      });
    } else {
      console.error('Failed to generate payment token');
      res.status(500).json({
        success: false,
        message: 'Failed to generate payment token.'
      });
    }
  } catch (error) {
    console.error('Payment controller error:', error);
    res.status(500).json({
      success: false,
      message: 'Error while generating payment token.',
      error: error.message
    });
  }
}
async function handlePaymentSuccess(req, res) {
  try {
    console.log('Payment success data received:', req.body);
    const transactionData = req.query || req.body;
    processPaymentCallback(transactionData);
    res.redirect('/payment-success');
  } catch (error) {
    console.error('Error handling payment success:', error);
    res.status(500).send('Error processing payment response');
  }
}
function handlePaymentCancellation(req, res) {
  console.log('Payment was cancelled by user');
  res.redirect('/payment-cancelled');
}

export { createPayment, handlePaymentSuccess, handlePaymentCancellation };