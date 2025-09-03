import axios from 'axios';
import cron from 'node-cron';
import { getShipmentIdList } from './shipment-id.js';

const OLD_API_BASE_URL = process.env.OLD_API_BASE_URL;
const GET_SHIPMENT_BY_ID_ENDPOINT = `${OLD_API_BASE_URL}/scheduleshipment/getShipmentByID`;
const GET_PACKAGE_BY_ID_ENDPOINT = `${OLD_API_BASE_URL}/scheduleshipment/getShipmentPackageByID`;

export async function fetchShipmentDetailsById(shippingId) {
  try {    
    const response = await axios.post(GET_SHIPMENT_BY_ID_ENDPOINT, {
      ShippingID: shippingId
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (response.data.success && response.data.data.length > 0) {
      // console.log(`Successfully fetched detailed data for ShippingID: ${shippingId}`);
      return { success: true, data: response.data.data };
    } else {
      console.log(`No detailed data found for shipment ID: ${shippingId}`);
      return { success: false, message: 'No data found' };
    }
  } catch (error) {
    console.error(`Error fetching detailed shipment data for ID ${shippingId}:`, error.message);
    return { success: false, message: error.message };
  }
}

export async function fetchPackageDetailsById(shippingId) {
  try {    
    const response = await axios.post(GET_PACKAGE_BY_ID_ENDPOINT, {
      ShippingID: shippingId
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (response.data.success && response.data.data.length > 0) {
      // console.log(`Successfully fetched package data for ShippingID: ${shippingId}`);
      return { success: true, data: response.data.data };
    } else {
      console.log(`No package data found for shipment ID: ${shippingId}`);
      return { success: false, message: 'No package data found' };
    }
  } catch (error) {
    console.error(`Error fetching package data for ID ${shippingId}:`, error.message);
    return { success: false, message: error.message };
  }
}

export function extractPackageDetails(packageData) {
  const packageDetails = [];
  
  if (!packageData || packageData.length === 0) {
    return packageDetails;
  }
  
  packageData.forEach(pkg => {
    packageDetails.push({
      PackageNumber: pkg.PackageNumber || '',
      PackageType: pkg.PackageType || '',
      EstimetedWeight: pkg.EstimetedWeight || '',
      ChargableWeight: pkg.ChargableWeight || '',
      Length: pkg.Length || '',
      Width: pkg.Width || '',
      Height: pkg.Height || '',
      InsuredValue: pkg.InsuredValue || '',
      PackageContent: pkg.PackageContent || '',
      TotalPackages: pkg.TotalPackages || ''
    });
  });
  
  return packageDetails;
}

export function extractCustomerAndPackageDetails(shipmentData, packageData) {
  const result = {
      fromAddress: {},
      toAddress: {},
      packageDetails: {},
      additionalDetails: {}
  };
  
  if (!shipmentData || shipmentData.length === 0) {
    return result;
  }
  
  const fromAddressRecord = shipmentData.find(item => item.EntityType === 'FromAddress');
  const toAddressRecord = shipmentData.find(item => item.EntityType === 'ToAddress');
  
  if (fromAddressRecord) {
    result.fromAddress = {
      ContactName: fromAddressRecord.ContactName || '',
      AddressLine1: fromAddressRecord.AddressLine1 || '',
      AddressLine2: fromAddressRecord.AddressLine2 || '',
      AddressLine3: fromAddressRecord.AddressLine3 || '',
      ZipCode: fromAddressRecord.ZipCode || '',
      City: fromAddressRecord.City || '',
      State: fromAddressRecord.State || '',
      CompanyName: fromAddressRecord.CompanyName || '',
      Phone1: fromAddressRecord.Phone1 || '',
      Phone2: fromAddressRecord.Phone2 || '',
      Email: fromAddressRecord.Email || ''
    };
  }
  
  if (toAddressRecord) {
    result.toAddress = {
      ContactName: toAddressRecord.ContactName || '',
      AddressLine1: toAddressRecord.AddressLine1 || '',
      AddressLine2: toAddressRecord.AddressLine2 || '',
      AddressLine3: toAddressRecord.AddressLine3 || '',
      ZipCode: toAddressRecord.ZipCode || '',
      City: toAddressRecord.City || '',
      State: toAddressRecord.State || '',
      CompanyName: toAddressRecord.CompanyName || '',
      Phone1: toAddressRecord.Phone1 || '',
      Phone2: toAddressRecord.Phone2 || '',
      Email: toAddressRecord.Email || ''
    };
  }
  
  if (packageData && packageData.length > 0) {
    // Get package details from the new endpoint
    const packageItems = extractPackageDetails(packageData);
    
    // Calculate totals from all packages
    let totalPackages = packageData.length || 0;
    let totalWeight = 0;
    let totalChargableWeight = 0;
    let totalInsuredValue = 0;
    
    packageData.forEach(pkg => {
      totalWeight += parseFloat(pkg.EstimetedWeight || 0);
      totalChargableWeight += parseFloat(pkg.ChargableWeight || 0);
      totalInsuredValue += parseFloat(pkg.InsuredValue || 0);
    });
    
    result.packageDetails = {
      PackageType: packageData[0].PackageType || '',
      TotalPackages: totalPackages.toString(),
      TotalChargableWeight: totalChargableWeight.toString(),
      TotalWeight: totalWeight.toString(),
      TotalInsuredValue: totalInsuredValue.toString(),
      Packages: packageItems // Keep the array for internal use
    };
    
    // Also add individual package details as separate properties
    packageItems.forEach((pkg, index) => {
      const packageNumber = pkg.PackageNumber || (index + 1);
      result[`Packages${packageNumber}`] = pkg;
    });
  } else if (fromAddressRecord) {
    // Fallback to old method if no package data is available
    result.packageDetails = {
      PackageType: fromAddressRecord.PackageType || '',
      TotalPackages: fromAddressRecord.TotalPackages || '',
      TotalChargableWeight: fromAddressRecord.TotalChargableWeight || '',
      TotalWeight: fromAddressRecord.TotalWeight || '',
      TotalInsuredValue: fromAddressRecord.TotalInsuredValue || ''
    };
  }
  
  if (fromAddressRecord) {
    result.additionalDetails = {
      LocationType: fromAddressRecord.LocationType || '',
      DutiesPaidBy: fromAddressRecord.DutiesPaidBy || ''
    };
  }
  
  return result;
}

export async function getCustomerAndPackageDetails(shippingId) {
  try {
    // Fetch shipment details from original endpoint
    const shipmentResult = await fetchShipmentDetailsById(shippingId);
    
    // Fetch package details from new endpoint
    const packageResult = await fetchPackageDetailsById(shippingId);
    
    if (!shipmentResult.success) {
      console.error(`Error fetching detailed shipment data: ${shipmentResult.message}`);
      return null;
    }
    
    // Extract combined data (will use package data if available, otherwise fall back to shipment data)
    return extractCustomerAndPackageDetails(
      shipmentResult.data, 
      packageResult.success ? packageResult.data : null
    );
  } catch (error) {
    console.error(`Error getting customer and package details for ID ${shippingId}:`, error.message);
    return null;
  }
}

async function processAllShipmentDetails() {
  try {
    const shipmentIds = await getShipmentIdList();
    
    if (shipmentIds.length === 0) {
      console.log('No shipment IDs to process');
      return;
    }
    
    // console.log(`Processing ${shipmentIds.length} shipment IDs for customer details`);
    
    const batchSize = 25;
    
    for (let i = 0; i < shipmentIds.length; i += batchSize) {
      const batch = shipmentIds.slice(i, i + batchSize);
      // console.log(`Processing batch ${Math.floor(i/batchSize) + 1} of ${Math.ceil(shipmentIds.length/batchSize)}`);
      
      await Promise.all(
        batch.map(async (shipmentId) => {
          try {
            const details = await getCustomerAndPackageDetails(shipmentId);
            
            if (details) {
              // console.log(`Processed customer details for shipment ID: ${shipmentId}`);
            } else {
              console.log(`No customer details found for shipment ID: ${shipmentId}`);
            }
          } catch (error) {
            console.error(`Error processing customer details for shipment ID ${shipmentId}:`, error);
          }
        })
      );
      
      if (i + batchSize < shipmentIds.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    console.log('Finished processing all shipment customer details');
  } catch (error) {
    console.error('Error processing all shipment customer details:', error);
  }
}

export function initializeCustomerDetailsSyncJob() {
  try {
    cron.schedule('0 22 * * *', () => {
      console.log('Running scheduled sync at', new Date().toISOString());
      processAllShipmentDetails(); 
    }, {
      scheduled: true,
      timezone: "America/Chicago"
    });
    
    console.log('Customer Details sync job - running every day 10pm CST');
    
    // console.log('Running initial customer details sync');
    processAllShipmentDetails();
    
    return true;
  } catch (error) {
    console.error('Error initializing customer details sync job:', error);
    return false;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  (async () => {
    initializeCustomerDetailsSyncJob();
  })();
}