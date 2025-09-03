import axios from 'axios';
import logger from '../config/logger.js';
import { logServiceOperation, logServiceResult } from '../utils/serviceLogger.js';

const OLD_API_BASE_URL = process.env.OLD_API_BASE_URL;
const GET_SHIPPING_IDS_ENDPOINT = `${OLD_API_BASE_URL}/scheduleshipment/getShippingIdList`;

const TEST_MODE = true;

export async function getShipmentIdList(requestId = null) {
    const startTime = Date.now();
    logServiceOperation('ShipmentService', 'getShipmentIdList', requestId, { endpoint: GET_SHIPPING_IDS_ENDPOINT });
    
    try {
      logger.debug(`[${requestId || 'no-request-id'}] Fetching shipment IDs from ${GET_SHIPPING_IDS_ENDPOINT}`);
      
      const response = await axios.get(GET_SHIPPING_IDS_ENDPOINT, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data && response.data.success && 
          Array.isArray(response.data.data) && 
          response.data.data.length > 0 && 
          Array.isArray(response.data.data[0])) {       
        
        const shipments = response.data.data[0];
        const shipmentIds = shipments.map(item => item.ShippingID);

        if (TEST_MODE) {
          const testId = 27155;
          // const testId = 39982; 
          // logger.debug(`[${requestId || 'no-request-id'}] TEST MODE: Using only the first shipment ID: ${testId}`);
          return [testId];
        }
       
        logger.info(`[${requestId || 'no-request-id'}] Retrieved ${shipmentIds.length} shipment IDs`);
        
        const result = shipmentIds;
        logServiceResult('ShipmentService', 'getShipmentIdList', requestId, { success: true, count: shipmentIds.length }, startTime);
        return result;
      } else {
        logger.error(`[${requestId || 'no-request-id'}] Failed to retrieve shipment IDs or invalid response format`);
        logger.debug(`[${requestId || 'no-request-id'}] Response structure: ${JSON.stringify(response.data)}`);
        
        const result = [];
        logServiceResult('ShipmentService', 'getShipmentIdList', requestId, { 
          success: false, 
          error: 'Invalid response format',
          responseStatus: response.status
        }, startTime);
        return result;
      }
    } catch (error) {
      logger.error(`[${requestId || 'no-request-id'}] Error fetching shipment ID list: ${error.message}`, {
        stack: error.stack
      });
      
      if (error.response) {
        logger.error(`[${requestId || 'no-request-id'}] Error response: ${error.response.status}`, {
          responseData: error.response.data
        });
      }
      
      const result = [];
      logServiceResult('ShipmentService', 'getShipmentIdList', requestId, { 
        success: false, 
        error: error.message,
        statusCode: error.response?.status
      }, startTime);
      return result;
    }
  }
  
  if (import.meta.url === `file://${process.argv[1]}`) {
    (async () => {
      const requestId = `cli_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
      logger.info(`[${requestId}] Running shipment-id.js directly`);
      await getShipmentIdList(requestId); 
    })();
  }