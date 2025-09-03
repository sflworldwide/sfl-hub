import { getShipmentInfoWithChanges } from '../../cron-job/shipment-info.js';
import { getCustomerAndPackageDetails } from '../../cron-job/customer-package.js';
import { getCommercialInvoiceDetails } from '../../cron-job/commercial-invoice.js';
// import { getAccountDetails } from '../../cron-job/account-details.js';
import { getTrackingDetails } from '../../cron-job/tracking-details.js';
import createSequelizeInstance from '../../config/dbConnection.js';

function extractShipmentDetails(shipmentInfo) {
  const result = {};
  
  if (shipmentInfo && shipmentInfo.length > 0) {
    const info = shipmentInfo[0];
    
    result.TrackingNumber = info.TrackingNumber;
    result.ShipmentInfo = {
      ServiceName: info.ServiceName || '',
      SubServiceName: info.SubServiceName || '',
      ShipmentType: info.ShipmentType || '',
      ManagedByName: info.ManagedByName || '',
      ShipmentStatus: info.ShipmentStatus || ''
    };
  }
  
  return result;
}

function extractChangedFields(shipmentInfo, changedFields) {
  const result = {};
  
  if (shipmentInfo && shipmentInfo.length > 0 && changedFields) {
    const info = shipmentInfo[0];
    
    result.TrackingNumber = info.TrackingNumber;
    
    result.ShipmentInfo = {
      ServiceName: null,
      SubServiceName: null,
      ShipmentType: null,
      ManagedByName: null,
      ShipmentStatus: null
    };
    
    Object.keys(changedFields).forEach(key => {
      if (key in result.ShipmentInfo) {
        result.ShipmentInfo[key] = info[key] || '';
      }
    });
  }
  
  return result;
}

function transformPayloadFormat(payload) {
  const result = [];
  
  for (const key in payload) {
    const value = payload[key];
    
    if (value === null || value === undefined) {
      continue;
    }
    
    if (key === 'InvoiceData') {
      if (Array.isArray(value) && value.length > 0) {
        const dataObj = {
          Data_type: 'InvoiceData'
        };
    
        for (const itemKey in value[0]) {
          dataObj[itemKey] = value[0][itemKey];
        }
        
        result.push(dataObj);
      } else if (!Array.isArray(value) && typeof value === 'object') {
        const dataObj = {
          Data_type: 'InvoiceData',
          ...value
        };
        
        result.push(dataObj);
      }
    } else if (key === 'PaymentReceivedData') {
      if (Array.isArray(value) && value.length > 0) {
        value.forEach((item, index) => {
          const dataObj = {
            Data_type: `PaymentReceivedData`,
            ...item
          };
          
          result.push(dataObj);
        });
      } else if (!Array.isArray(value) && typeof value === 'object') {
        const dataObj = {
          Data_type: 'PaymentReceivedData',
          ...value
        };
        
        result.push(dataObj);
      } else {
        const dataObj = {
          Data_type: 'PaymentReceivedData',
          Description: null,
          InvoiceDate: null,
          ServiceDescription: null,
          Quantity: null,
          Amount: null,
          TotalAmount: null
        };
        
        result.push(dataObj);
      }
    } else if (key === 'Packages' && Array.isArray(value)) {
      // Don't process here as we'll handle these separately
      // We'll skip the array processing for packages
    } else if (Array.isArray(value)) {
      value.forEach((item, index) => {
        const dataObj = {
          Data_type: `${key}${index + 1}`
        };

        // for (const itemKey in item) {
        //   dataObj[itemKey] = item[itemKey];
        // }
        
        for (const itemKey in item) {
          const value = item[itemKey];
          dataObj[itemKey] = (value === '') ? null : value;
        }
        
        result.push(dataObj);
      });
    } else if (typeof value === 'object') {
      const dataObj = {
        Data_type: key
      };
      
      // for (const nestedKey in value) {
      //   dataObj[nestedKey] = value[nestedKey];
      // }

      for (const nestedKey in value) {
        const nestedVal = value[nestedKey];
        dataObj[nestedKey] = (nestedVal === '') ? null : nestedVal;
      }
      
      result.push(dataObj);
    } else {
      const dataObj = {
        Data_type: key,
        Value: value
      };
      
      result.push(dataObj);
    }
  }
  
  return result;
}

async function callStoredProcedure(payload) {
  try {
    const trackingNumber = payload.TrackingNumber;
    const payloadWithoutTrackingNumber = { ...payload };
    delete payloadWithoutTrackingNumber.TrackingNumber;
    
    const transformedPayload = transformPayloadFormat(payloadWithoutTrackingNumber);
    
    const objectCount = transformedPayload.length;
    
    const sequelize = await createSequelizeInstance();
    
    const [results] = await sequelize.query(`CALL spaddupdatedatafromold(:trackingNumber, :payload, :objectCount)`, {
      replacements: {
        trackingNumber: String(trackingNumber),
        payload: JSON.stringify(transformedPayload),
        objectCount: objectCount
      }
    });
    
    return { success: true, results };
  } catch (error) {
    console.error('Error calling stored procedure:', error);
    return { success: false, error: error.message };
  }
}

async function enhancePayloadWithCustomerDetails(basePayload, shippingId, onlyUpdateChanged = false) {
    // console.log(`Starting to fetch customer details for shipment ${shippingId}`);
    
    const additionalDetails = await getCustomerAndPackageDetails(shippingId);
    // const accountDetails = await getAccountDetails(shippingId);
    const commercialInvoiceDetails = await getCommercialInvoiceDetails(shippingId);
    const trackingDetails = await getTrackingDetails(shippingId);
    
    // if (!additionalDetails && !accountDetails  && !commercialInvoiceDetails && !trackingDetails) {
    if (!additionalDetails  && !commercialInvoiceDetails && !trackingDetails) {
      console.log(`No additional details found for shipment ${shippingId}, returning base payload only`);
      return basePayload;
    }
    
    // console.log(`Retrieved customer details for shipment ${shippingId}`);

    let enhancedPayload;
    
    if (onlyUpdateChanged) {
      enhancedPayload = {
        ...basePayload,
          fromAddress: {
            ContactName: null,
            AddressLine1: null,
            AddressLine2: null,
            AddressLine3: null,
            ZipCode: null,
            City: null,
            State: null,
            CompanyName: null,
            Phone1: null,
            Phone2: null,
            Email: null
          },
          toAddress: {
            ContactName: null,
            AddressLine1: null,
            AddressLine2: null,
            AddressLine3: null,
            ZipCode: null,
            City: null,
            State: null,
            CompanyName: null,
            Phone1: null,
            Phone2: null,
            Email: null
          },
        AdditionalDetails: {
          LocationType: null,
          DutiesPaidBy: null
        },
        // Package: {
        //   PackageType: null,
        //   TotalPackages: null,
        //   TotalChargableWeight: null,
        //   TotalWeight: null,
        //   TotalInsuredValue: null
        // },
        // Add placeholder for individual package details
        Packages1: {
          PackageNumber: null,
          PackageType: null,
          EstimetedWeight: null,
          ChargableWeight: null,
          Length: null,
          Width: null,
          Height: null,
          InsuredValue: null,
          PackageContent: null
        },
        Invoice: {
          ShippingInvoiceID: null,
          InvoiceDate: null,
          ServiceDescription: null,
          Quantity: null,
          Amount: null,
          TotalAmount: null
        },
        PaymentReceivedData: {
          ShippingPaymentReceivedID: null,
          PaymentReceivedDate: null,
          PaymentType: null,
          ConfirmationNumber: null,
          Amount: null
        },
        TrackingDetails: {
          PickupDate: null,
          PickupTime: null,
          Updates: null,
          Status: null,
          CreatedByName: null
        }
      };
      if (commercialInvoiceDetails && Object.keys(commercialInvoiceDetails).length > 0) {
        Object.keys(commercialInvoiceDetails).forEach(key => {
          enhancedPayload[key] = {
            PackageNumber: null,
            ContentDescription: null,
            Quantity: null,
            ValuePerQuantity: null,
            TotalValue: null
          };
        });
      }
    
      if (!enhancedPayload.ShipmentInfo.hasOwnProperty('PackageType')) {
        enhancedPayload.ShipmentInfo.PackageType = null;
      }
      
      if (!enhancedPayload.ShipmentInfo.hasOwnProperty('TotalPackages')) {
        enhancedPayload.ShipmentInfo.TotalPackages = null;
      }
    } else {
      enhancedPayload = {
        ...basePayload,
      };
      
      if (additionalDetails) {
        enhancedPayload.fromAddress = additionalDetails.fromAddress;
        enhancedPayload.toAddress = additionalDetails.toAddress;
        enhancedPayload.AdditionalDetails = additionalDetails.additionalDetails;
        // enhancedPayload.Package = additionalDetails.packageDetails;
        
        if (additionalDetails.packageDetails && additionalDetails.packageDetails.Packages) {
          additionalDetails.packageDetails.Packages.forEach((pkg, index) => {
            const packageNumber = pkg.PackageNumber || (index + 1);
            enhancedPayload[`Packages${packageNumber}`] = pkg;
          });
          
          delete enhancedPayload.Packages;
        }
        
        if (additionalDetails.packageDetails) {
          enhancedPayload.ShipmentInfo.PackageType = additionalDetails.packageDetails.PackageType || null;
          enhancedPayload.ShipmentInfo.TotalPackages = additionalDetails.packageDetails.TotalPackages || null;
        }
      }

      // if (accountDetails) {
      //   enhancedPayload.InvoiceData = accountDetails.InvoiceData || null;
      //   enhancedPayload.PaymentReceivedData = accountDetails.PaymentReceivedData || null;
      // }

      if (commercialInvoiceDetails) {
        Object.keys(commercialInvoiceDetails).forEach(key => {
          enhancedPayload[key] = commercialInvoiceDetails[key];
        });
      }

      if (trackingDetails && trackingDetails.TrackingDetails) {
        enhancedPayload.TrackingDetails = trackingDetails.TrackingDetails;
        // console.log(`Added tracking details to payload for shipment ${shippingId}`);
      }
    }
    
    // console.log("Complete Payload:", enhancedPayload);
    return enhancedPayload;
  }

export async function updateShipmentDetails(shippingId) {
    try { 
      const { success, data, changedFields, isNewData, hasChanges } = 
        await getShipmentInfoWithChanges(shippingId);
      
      if (!success || !data) {
        console.error(`Failed to get shipment info for ID ${shippingId}`);
        return { success: false, message: 'Failed to get shipment info' };
      }
      
      let basePayload;
      let onlyUpdateChanged = false;
      
      if (isNewData) {
        basePayload = extractShipmentDetails(data);
        // console.log(`Extracted base payload for new shipment ${shippingId}`);
        onlyUpdateChanged = false;
      } else if (hasChanges) {
        basePayload = extractChangedFields(data, changedFields);
        // console.log(`Extracted base payload for changed shipment ${shippingId}`);
        onlyUpdateChanged = true;
      } else {
        console.log(`No changes for shipment ${shippingId}`);
        return { success: true, message: 'No changes to update' };
      }
      
      const completePayload = await enhancePayloadWithCustomerDetails(basePayload, shippingId, onlyUpdateChanged);
      
      // console.log(`Preparing to call stored procedure for shipment ${shippingId}`);
      
      const spResult = await callStoredProcedure(completePayload);
      
      if (spResult.success) {
        console.log(`Successfully updated database for shipment ${shippingId}`);
        return { 
          success: true, 
          message: 'Data updated successfully in database',
          payload: completePayload
        };
      } else {
        console.error(`Failed to update database for shipment ${shippingId}: ${spResult.error}`);
        return {
          success: false,
          message: `Failed to update database: ${spResult.error}`,
          payload: completePayload
        };
      }
    } catch (error) {
      console.error(`Error updating shipment details for ID ${shippingId}:`, error);
      return { success: false, message: error.message };
    }
  }