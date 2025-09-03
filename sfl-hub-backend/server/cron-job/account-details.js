// import axios from 'axios';
// import cron from 'node-cron';
// import { getShipmentIdList } from './shipment-id.js';

// const OLD_API_BASE_URL = process.env.OLD_API_BASE_URL;
// const GET_ACCOUNT_DETAIL_ENDPOINT = `${OLD_API_BASE_URL}/scheduleshipment/getAccountDetail`;

// export async function fetchAccountDetails(shippingId) {
//   try {
//     console.log(`Fetching account details for ShippingID: ${shippingId}`);
    
//     const response = await axios.post(GET_ACCOUNT_DETAIL_ENDPOINT, {
//       ShippingID: shippingId
//     }, {
//       headers: {
//         'Content-Type': 'application/json'
//       }
//     });
    
//     if (response.data && response.data.success && response.data.data && response.data.data.success) {
//       console.log(`Successfully fetched account details for ShippingID: ${shippingId}`);
//       return { success: true, data: response.data.data };
//     } else {
//       console.log(`No account details found for shipment ID: ${shippingId}`);
//       return { success: false, message: 'No data found' };
//     }
//   } catch (error) {
//     console.error(`Error fetching account details for ID ${shippingId}:`, error.message);
//     return { success: false, message: error.message };
//   }
// }

// export function extractAccountDetails(accountData) {
//   const result = {
//     InvoiceData: {
//       ShippingInvoiceID: '',
//       Description: '',
//       InvoiceDate: '',
//       ServiceDescription: '',
//       Quantity: 0,
//       Amount: 0,
//       TotalAmount: 0
//     },
//     PaymentReceivedData: {
//       ShippingPaymentReceivedID: '',
//       Number: '',
//       PaymentReceivedDate: '',
//       PaymentType: '',
//       ConfirmationNumber: '',
//       Amount: 0,
//       CreatedByName: ''
//     }
//   };
  
//   if (!accountData) {
//     return result;
//   }
  
//   if (accountData.InvoiceData && Array.isArray(accountData.InvoiceData) && accountData.InvoiceData.length > 0) {
//     const invoice = accountData.InvoiceData[0];
//     result.InvoiceData = {
//       ShippingInvoiceID: invoice.ShippingInvoiceID || '',
//       Description: invoice.Description || '',
//       InvoiceDate: invoice.InvoiceDate || '',
//       ServiceDescription: invoice.ServiceDescription || '',
//       Quantity: invoice.Quantity || 0,
//       Amount: invoice.Amount || 0,
//       TotalAmount: invoice.TotalAmount || 0
//     };
//   } else if (accountData.InvoiceData && !Array.isArray(accountData.InvoiceData)) {
//     const invoice = accountData.InvoiceData;
//     result.InvoiceData = {
//       ShippingInvoiceID: invoice.ShippingInvoiceID || '',
//       Description: invoice.Description || '',
//       InvoiceDate: invoice.InvoiceDate || '',
//       ServiceDescription: invoice.ServiceDescription || '',
//       Quantity: invoice.Quantity || 0,
//       Amount: invoice.Amount || 0,
//       TotalAmount: invoice.TotalAmount || 0
//     };
//   }
  
//   if (accountData.PaymentReceivedData && Array.isArray(accountData.PaymentReceivedData) && accountData.PaymentReceivedData.length > 0) {
//     const payment = accountData.PaymentReceivedData[0];
//     result.PaymentReceivedData = {
//       ShippingPaymentReceivedID: payment.ShippingPaymentReceivedID || '',
//       Number: payment.Number || '',
//       PaymentReceivedDate: payment.PaymentReceivedDate || '',
//       PaymentType: payment.PaymentType || '',
//       ConfirmationNumber: payment.ConfirmationNumber || '',
//       Amount: payment.Amount || 0,
//       CreatedByName: payment.CreatedByName || ''
//     };
//   } else if (accountData.PaymentReceivedData && !Array.isArray(accountData.PaymentReceivedData)) {
//     const payment = accountData.PaymentReceivedData;
//     result.PaymentReceivedData = {
//       ShippingPaymentReceivedID: payment.ShippingPaymentReceivedID || '',
//       Number: payment.Number || '',
//       PaymentReceivedDate: payment.PaymentReceivedDate || '',
//       PaymentType: payment.PaymentType || '',
//       ConfirmationNumber: payment.ConfirmationNumber || '',
//       Amount: payment.Amount || 0,
//       CreatedByName: payment.CreatedByName || ''
//     };
//   }
  
//   return result;
// }

// export async function getAccountDetails(shippingId) {
//   const { success, data, message } = await fetchAccountDetails(shippingId);
  
//   if (!success) {
//     console.error(`Error fetching account details: ${message}`);
//     return null;
//   }
  
//   return extractAccountDetails(data);
// }

// async function processAllAccountDetails() {
//   try {
//     const shipmentIds = await getShipmentIdList();
    
//     if (shipmentIds.length === 0) {
//       console.log('No shipment IDs to process');
//       return;
//     }
    
//     console.log(`Processing ${shipmentIds.length} shipment IDs for account details`);
    
//     const batchSize = 50;
    
//     for (let i = 0; i < shipmentIds.length; i += batchSize) {
//       const batch = shipmentIds.slice(i, i + batchSize);
//       console.log(`Processing batch ${Math.floor(i/batchSize) + 1} of ${Math.ceil(shipmentIds.length/batchSize)}`);
      
//       await Promise.all(
//         batch.map(async (shipmentId) => {
//           try {
//             const details = await getAccountDetails(shipmentId);
            
//             if (details) {
//               console.log(`Processed account details for shipment ID: ${shipmentId}`);
//             } else {
//               console.log(`No account details found for shipment ID: ${shipmentId}`);
//             }
//           } catch (error) {
//             console.error(`Error processing account details for shipment ID ${shipmentId}:`, error);
//           }
//         })
//       );
      
//       if (i + batchSize < shipmentIds.length) {
//         await new Promise(resolve => setTimeout(resolve, 1000));
//       }
//     }
    
//     console.log('Finished processing all account details');
//   } catch (error) {
//     console.error('Error processing all account details:', error);
//   }
// }
  
// export function initializeAccountDetailsSyncJob() {
//   try {
//     cron.schedule('* * * * *', () => {
//           console.log('Running scheduled sync at', new Date().toISOString());
//           executeSyncProcess();
//         }, {
//           scheduled: true,
//           timezone: "America/Chicago"
//         });
      
//     console.log('Running initial account details sync');
//     processAllAccountDetails();
    
//     return true;
//   } catch (error) {
//     console.error('Error initializing account details sync job:', error);
//     return false;
//   }
// }

// if (import.meta.url === `file://${process.argv[1]}`) {
//   (async () => {
//     initializeAccountDetailsSyncJob();
//   })();
// }