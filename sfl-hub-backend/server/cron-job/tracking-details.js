import axios from 'axios';
import cron from 'node-cron';
import { getShipmentIdList } from './shipment-id.js';

const OLD_API_BASE_URL = process.env.OLD_API_BASE_URL;
const GET_TRACKING_DETAILS_ENDPOINT = `${OLD_API_BASE_URL}/scheduleshipment/getShipmentManualTracking`;

export async function fetchTrackingDetails(shippingId) {
  try {
    // console.log(`Fetching tracking details for ShippingID: ${shippingId}`);
    
    const response = await axios.post(GET_TRACKING_DETAILS_ENDPOINT, {
      ShippingID: shippingId
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (response.data && response.data.success && response.data.data && response.data.data.length > 0) {
      // console.log(`Successfully fetched tracking details for ShippingID: ${shippingId}`);
      return { success: true, data: response.data.data };
    } else {
      console.log(`No tracking details found for shipment ID: ${shippingId}`);
      return { success: false, message: 'No data found' };
    }
  } catch (error) {
    console.error(`Error fetching tracking details for ID ${shippingId}:`, error.message);
    return { success: false, message: error.message };
  }
}

export function extractTrackingDetails(trackingData) {
  const result = {
    TrackingDetails: {}
  };
  
  if (!trackingData || !Array.isArray(trackingData) || trackingData.length === 0) {
    return result;
  }
  
  const latestTracking = trackingData[0];
  
  result.TrackingDetails = {
    PickupDate: latestTracking.PickupDate || '',
    PickupTime: latestTracking.PickupTime || '',
    Updates: latestTracking.Updates || '',
    Status: latestTracking.Status || '',
    CreatedByName: latestTracking.CreatedByName || ''
  };
  
  return result;
}

export async function getTrackingDetails(shippingId) {
  try {
    const { success, data, message } = await fetchTrackingDetails(shippingId);
    
    if (!success) {
      console.error(`Error fetching tracking details: ${message}`);
      return null;
    }
    
    return extractTrackingDetails(data);
  } catch (error) {
    console.error(`Error processing tracking details for ID ${shippingId}:`, error);
    return null;
  }
}

async function processAllTrackingDetails() {
  try {
    const shipmentIds = await getShipmentIdList();
    
    if (shipmentIds.length === 0) {
      console.log('No shipment IDs to process for tracking details');
      return;
    }
    
    // console.log(`Processing ${shipmentIds.length} shipment IDs for tracking details`);
    
    const batchSize = 25;
    
    for (let i = 0; i < shipmentIds.length; i += batchSize) {
      const batch = shipmentIds.slice(i, i + batchSize);
      // console.log(`Processing batch ${Math.floor(i/batchSize) + 1} of ${Math.ceil(shipmentIds.length/batchSize)}`);
      
      await Promise.all(
        batch.map(async (shipmentId) => {
          try {
            const details = await getTrackingDetails(shipmentId);
            
            if (details && details.TrackingDetails) {
              // console.log(`Processed tracking details for shipment ID: ${shipmentId}`);
            } else {
              console.log(`No tracking details found for shipment ID: ${shipmentId}`);
            }
          } catch (error) {
            console.error(`Error processing tracking details for shipment ID ${shipmentId}:`, error);
          }
        })
      );
      
      if (i + batchSize < shipmentIds.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    console.log('Finished processing all tracking details');
  } catch (error) {
    console.error('Error processing all tracking details:', error);
  }
}
  
export function initializeTrackingDetailsSyncJob() {
  try {
    cron.schedule('0 22 * * *', () => {
          console.log('Running scheduled sync at', new Date().toISOString());
          executeSyncProcess();
        }, {
          scheduled: true,
          timezone: "America/Chicago"
        });
    
    console.log('Tracking Details Sync - running every day 10pm CST');
    processAllTrackingDetails();
    
    return true;
  } catch (error) {
    console.error('Error initializing tracking details sync job:', error);
    return false;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  (async () => {
    initializeTrackingDetailsSyncJob();
  })();
}