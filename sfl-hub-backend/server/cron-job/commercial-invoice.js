import axios from 'axios';
import cron from 'node-cron';
import { getShipmentIdList } from './shipment-id.js';

const OLD_API_BASE_URL = process.env.OLD_API_BASE_URL;
const GET_SHIPMENT_COMMERCIAL_INVOICE_ENDPOINT = `${OLD_API_BASE_URL}/scheduleshipment/getShipmentCommercialInvoiceByID`;

export async function fetchShipmentCommercialInvoice(shippingId) {
  try {
    // console.log(`Fetching commercial invoice data for ShippingID: ${shippingId}`);
    
    const response = await axios.post(GET_SHIPMENT_COMMERCIAL_INVOICE_ENDPOINT, {
      ShippingID: shippingId
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (response.data.success && response.data.data && Array.isArray(response.data.data)) {
      // console.log(`Successfully fetched commercial invoice data for ShippingID: ${shippingId}`);
      return { success: true, data: response.data.data };
    } else {
      console.log(`No commercial invoices found for shipment ID: ${shippingId}`);
      return { success: false, message: 'No data found' };
    }
  } catch (error) {
    console.error(`Error fetching commercial invoice for shipment ID ${shippingId}:`, error.message);
    return { success: false, message: error.message };
  }
}

export function extractCommercialInvoiceDetails(commercialInvoiceData) {
  const result = {};

  if (!commercialInvoiceData || commercialInvoiceData.length === 0) {
    return result;
  }

  commercialInvoiceData.forEach((invoice, index) => {
    result[`CommercialInvoice${index + 1}`] = {
      PackageNumber: invoice.PackageNumber || '',
      ContentDescription: invoice.ContentDescription || '',
      Quantity: invoice.Quantity || '',
      ValuePerQuantity: invoice.ValuePerQuantity || '',
      TotalValue: invoice.TotalValue || ''
    };
  });

  return result;
}

export async function getCommercialInvoiceDetails(shippingId) {
  const { success, data, message } = await fetchShipmentCommercialInvoice(shippingId);

  if (!success) {
    console.error(`Error fetching commercial invoice details: ${message}`);
    return null;
  }

  return extractCommercialInvoiceDetails(data);
}

async function processAllCommercialInvoices() {
  try {
    const shipmentIds = await getShipmentIdList();
    
    if (shipmentIds.length === 0) {
      console.log('No shipment IDs to process for commercial invoices');
      return;
    }
    
    // console.log(`Processing ${shipmentIds.length} shipment IDs for commercial invoices`);
    
    const batchSize = 25;
    
    for (let i = 0; i < shipmentIds.length; i += batchSize) {
      const batch = shipmentIds.slice(i, i + batchSize);
      // console.log(`Processing batch ${Math.floor(i/batchSize) + 1} of ${Math.ceil(shipmentIds.length/batchSize)}`);
      
      await Promise.all(
        batch.map(async (shipmentId) => {
          try {
            const details = await getCommercialInvoiceDetails(shipmentId);
            
            if (details && Object.keys(details).length > 0) {
              // console.log(`Processed commercial invoice for shipment ID: ${shipmentId}`);
            } else {
              console.log(`No commercial invoice found for shipment ID: ${shipmentId}`);
            }
          } catch (error) {
            console.error(`Error processing commercial invoice for shipment ID ${shipmentId}:`, error);
          }
        })
      );
      
      if (i + batchSize < shipmentIds.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    console.log('Finished processing all commercial invoices');
  } catch (error) {
    console.error('Error processing all commercial invoices:', error);
  }
}

export function initializeCommercialInvoiceSyncJob() {
  try {
    cron.schedule('0 22 * * *', () => {
          console.log('Running scheduled sync at', new Date().toISOString());
          executeSyncProcess();
        }, {
          scheduled: true,
          timezone: "America/Chicago"
        });
    
    console.log('Commercial invoice sync job - running every day 10pm CST');
    
    processAllCommercialInvoices(); 
    
    return true;
  } catch (error) {
    console.error('Error initializing commercial invoice sync:', error);
    return false;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  (async () => {
      initializeCommercialInvoiceSyncJob();
  })();
}