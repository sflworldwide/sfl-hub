import axios from 'axios';
import crypto from 'crypto';
import cron from 'node-cron';
import { getShipmentIdList } from './shipment-id.js';
import { updateShipmentDetails } from '../services/sync/updateShipment.js';

const dataCache = new Map();

const OLD_API_BASE_URL = process.env.OLD_API_BASE_URL;
const GET_SHIPMENT_INFO_ENDPOINT = `${OLD_API_BASE_URL}/scheduleshipment/getShipmentInfo`;

function generateDataHash(data) {
  return crypto.createHash('md5').update(JSON.stringify(data)).digest('hex');
}

function findDataChanges(oldData, newData) {
  if (!oldData || !newData) return { isChanged: true, changes: 'Initial data fetch' };
  
  const changes = {};
  let isChanged = false;
  
  Object.keys(newData[0]).forEach(key => {
    const oldValue = oldData[0][key];
    const newValue = newData[0][key];
    
    if (oldValue && newValue && 
        typeof oldValue === 'object' && 
        typeof newValue === 'object' && 
        oldValue.type === 'Buffer' && 
        newValue.type === 'Buffer') {
      
      const oldBuffer = oldValue.data;
      const newBuffer = newValue.data;
      
      if (oldBuffer.length !== newBuffer.length) {
        changes[key] = { old: oldValue, new: newValue };
        isChanged = true;
      } else {
        const bufferChanged = oldBuffer.some((val, index) => val !== newBuffer[index]);
        if (bufferChanged) {
          changes[key] = { old: oldValue, new: newValue };
          isChanged = true;
        }
      }
    } 
    else if (oldValue !== newValue) {
      changes[key] = { old: oldValue, new: newValue };
      isChanged = true;
    }
  });
  
  return { isChanged, changes };
}

async function fetchShipmentInfo(shippingId) {
  try {
    const response = await axios.post(GET_SHIPMENT_INFO_ENDPOINT, {
      ShippingID: shippingId
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (response.data.success && response.data.data.length > 0) {
      return response.data.data;
    } else {
      console.log(`No data found: ${shippingId}`);
      return null;
    }
  } catch (error) {
    console.error(`Error fetching data for ShippingID ${shippingId}:`, error.message);
    return null;
  }
}

export async function getShipmentInfoWithChanges(shippingId) {
  try {
    const shipmentInfo = await fetchShipmentInfo(shippingId);
    
    if (!shipmentInfo) {
      return { success: false, message: 'No shipment info found' };
    }
    
    const previousCacheEntry = dataCache.get(shippingId);
    const currentHash = generateDataHash(shipmentInfo);
    
    let changedFields = null;
    
    if (!previousCacheEntry || previousCacheEntry.hash !== currentHash) {
      const changeResult = findDataChanges(
        previousCacheEntry?.data, 
        shipmentInfo
      );
      
      if (changeResult.isChanged) {
        
        dataCache.set(shippingId, {
          hash: currentHash,
          data: shipmentInfo,
          lastUpdated: new Date()
        });
        if (previousCacheEntry) {
          changedFields = changeResult.changes;
        }
      }
    }
    
    return { 
      success: true, 
      data: shipmentInfo,
      changedFields: changedFields,
      isNewData: !previousCacheEntry,
      hasChanges: !!changedFields
    };
  } catch (error) {
    console.error(`Error getting shipment info for ID ${shippingId}:`, error);
    return { success: false, message: error.message };
  }
}

async function executeSyncProcess() {
  try {
    const shipmentIds = await getShipmentIdList();
    
    if (shipmentIds.length === 0) {
      console.log('No shipment IDs to process');
      return;
    }
    
    console.log(`Processing ${shipmentIds.length} shipment IDs`);
    
    const batchSize = 25;
    
    for (let i = 0; i < shipmentIds.length; i += batchSize) {
      const batch = shipmentIds.slice(i, i + batchSize);
      
      const results = await Promise.all(
        batch.map(async (shipmentId) => {
          try {
            const result = await updateShipmentDetails(shipmentId);
            
            if (result.success && result.payload) {
              return { shipmentId, success: true, payload: result.payload };
            } else {
              return { shipmentId, success: result.success, message: result.message };
            }
          } catch (error) {
            console.error(`Error processing shipment ID ${shipmentId}:`, error.message);
            return { shipmentId, success: false, message: error.message };
          }
        })
      );
      
      const successful = results.filter(r => r.success && r.payload).length;
      // console.log(`Batch ${Math.floor(i/batchSize) + 1}: Processed ${batch.length} shipments, ${successful} updated`);
      
      if (i + batchSize < shipmentIds.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  } catch (error) {
    console.error('Error executing sync process:', error);
  }
}

export function initializeShipmentInfoSync() {
  try {
    cron.schedule('0 22 * * *', () => {
      console.log('Running scheduled sync at', new Date().toISOString());
      executeSyncProcess();
    }, {
      scheduled: true,
      timezone: "America/Chicago"
    });
    
    console.log('Shipmnet Info sync - running every day 10pm CST');
    
    executeSyncProcess();
    
    return true;
  } catch (error) {
    console.error('Error initializing shipment sync:', error);
    return false;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  (async () => {
     initializeShipmentInfoSync();
  })();
}