import { Sequelize } from "sequelize";
import  createSequelizeInstance  from "../config/dbConnection.js";
import { getSecrets } from '../services/userService.js'; 
import moment from "moment";
import nodemailer from "nodemailer";
import bcrypt from "bcrypt";
import mg from "nodemailer-mailgun-transport";
import CryptoJS from "crypto-js";

const saveshipmentData = async (shipmentdata) => {
  try {
    const secrets = await getSecrets();
    const SECRET_KEY = secrets.SECRET_KEY;
    
    const sequelize = await createSequelizeInstance();
    // console.log("here = ", shipmentdata.from_address);
    
    var fromAddress = {
      insertUpdate: "I",
      EntityType: "FromAddress",
      CompanyName: shipmentdata.from_address.company_name,
      ContactName: shipmentdata.from_address.contact_name!=""?CryptoJS.AES.decrypt(shipmentdata.from_address.contact_name, SECRET_KEY).toString(CryptoJS.enc.Utf8):"",
      AddressLine1: shipmentdata.from_address.address_1!=""?CryptoJS.AES.decrypt(shipmentdata.from_address.address_1, SECRET_KEY).toString(CryptoJS.enc.Utf8):"",
      AddressLine2: shipmentdata.from_address.address_2!=""?CryptoJS.AES.decrypt(shipmentdata.from_address.address_2, SECRET_KEY).toString(CryptoJS.enc.Utf8):"",
      AddressLine3: shipmentdata.from_address.address_3!=""?CryptoJS.AES.decrypt(shipmentdata.from_address.address_3, SECRET_KEY).toString(CryptoJS.enc.Utf8):"",
      Phone1: shipmentdata.from_address.phone1!=""?CryptoJS.AES.decrypt(shipmentdata.from_address.phone1, SECRET_KEY).toString(CryptoJS.enc.Utf8):"",
      Phone2: shipmentdata.from_address.phone2!=""?CryptoJS.AES.decrypt(shipmentdata.from_address.phone2, SECRET_KEY).toString(CryptoJS.enc.Utf8):"",
      email: shipmentdata.from_address.email!=""?CryptoJS.AES.decrypt(shipmentdata.from_address.email, SECRET_KEY).toString(CryptoJS.enc.Utf8):"",
      Email: shipmentdata.from_address.email!=""?CryptoJS.AES.decrypt(shipmentdata.from_address.email, SECRET_KEY).toString(CryptoJS.enc.Utf8):"",
      City: shipmentdata.from_address.city_name,
      FedexCity: shipmentdata.from_address.city_name,
      State: shipmentdata.from_address.state_name,
      CountryID: shipmentdata.from_address.country_id,
      ZipCode: shipmentdata.from_address.zip_code,
      MovingBack: shipmentdata.MovingBackToIndia
        ? shipmentdata.MovingBackToIndia
        : false,
      OriginalPassportAvailable: shipmentdata.from_address.OriginalPassportAvailable
        ? shipmentdata.from_address.OriginalPassportAvailable
        : false,
      EligibleForTR: shipmentdata.from_address.EligibleForTR
        ? shipmentdata.from_address.EligibleForTR
        : false,
    };
    console.log("Payload = ",fromAddress)

    let fromQuery = "CALL spaddupdateshipaddress(:pdata, :puserid, :insertid);";
    const comparePass = fromQuery;
    const resultPass = await sequelize.query(comparePass, {
      replacements: {
        pdata: JSON.stringify(fromAddress),
        puserid: shipmentdata.UserID,
        insertid: null,
      },
      type: Sequelize.QueryTypes.RAW,
    });
    console.log("fromQuery = ",fromQuery);
    console.log(JSON.stringify(fromAddress))
    
    var fromAddressdatares = resultPass[0];
    var fromAddressID = fromAddressdatares[0].insertid;
    if (fromAddressID) {
      var TOAddress = {
        insertUpdate: "I",
        EntityType: "ToAddress",
        CompanyName: shipmentdata.to_address.company_name,
      ContactName: shipmentdata.to_address.contact_name!=""?CryptoJS.AES.decrypt(shipmentdata.to_address.contact_name, SECRET_KEY).toString(CryptoJS.enc.Utf8):"",
      AddressLine1: shipmentdata.to_address.address_1!=""?CryptoJS.AES.decrypt(shipmentdata.to_address.address_1, SECRET_KEY).toString(CryptoJS.enc.Utf8):"",
      AddressLine2: shipmentdata.to_address.address_2!=""?CryptoJS.AES.decrypt(shipmentdata.to_address.address_2, SECRET_KEY).toString(CryptoJS.enc.Utf8):"",
      AddressLine3: shipmentdata.to_address.address_3!=""?CryptoJS.AES.decrypt(shipmentdata.to_address.address_3, SECRET_KEY).toString(CryptoJS.enc.Utf8):"",
      Phone1: shipmentdata.to_address.phone1!=""?CryptoJS.AES.decrypt(shipmentdata.to_address.phone1, SECRET_KEY).toString(CryptoJS.enc.Utf8):"",
      Phone2: shipmentdata.to_address.phone2!=""?CryptoJS.AES.decrypt(shipmentdata.to_address.phone2, SECRET_KEY).toString(CryptoJS.enc.Utf8):"",
      email: shipmentdata.to_address.email!=""?CryptoJS.AES.decrypt(shipmentdata.to_address.email, SECRET_KEY).toString(CryptoJS.enc.Utf8):"",
      Email: shipmentdata.to_address.email!=""?CryptoJS.AES.decrypt(shipmentdata.to_address.email, SECRET_KEY).toString(CryptoJS.enc.Utf8):"",
      City: shipmentdata.to_address.city_name,
      FedexCity: shipmentdata.to_address.city_name,
      State: shipmentdata.to_address.state_name,
      CountryID: shipmentdata.to_address.country_id,
      ZipCode: shipmentdata.to_address.zip_code,
      MovingBack: shipmentdata.MovingBackToIndia
        ? shipmentdata.MovingBackToIndia
        : false,
      OriginalPassportAvailable: shipmentdata.to_address.OriginalPassportAvailable
        ? shipmentdata.to_address.OriginalPassportAvailable
        : false,
      EligibleForTR: shipmentdata.to_address.EligibleForTR
        ? shipmentdata.to_address.EligibleForTR
        : false,
      };

      

      console.log("TOAddress = ", TOAddress);

      let toQuery = "CALL spaddupdateshipaddress(:pdata, :puserid, :insertid);";
      console.log("shipmentdata.UserID = ",shipmentdata.UserID);
      
      console.log("toQuery = ",fromQuery);
      console.log(JSON.stringify(TOAddress))
      // const comparePass = toQuery;
      const resultPassToAddress = await sequelize.query(toQuery, {
        replacements: {
          pdata: JSON.stringify(TOAddress),
          puserid: shipmentdata.UserID,
          insertid: null,
        },
        type: Sequelize.QueryTypes.RAW,
      });

      console.log(resultPassToAddress);
      var TOAddressdatares = resultPassToAddress[0];
      var TOAddressID = TOAddressdatares[0].insertid;
      console.log("TOAddressID = ", TOAddressID);
    }

    if (TOAddressID) {
      // console.log("Here");
      var shipmentData = {
        insertUpdate: "I",
        FromAddressID: fromAddressID,
        ToAddressID: TOAddressID,
        // oldShipmentID: shipmentdata.shipments.oldShipmentID,
        ShipmentDate: moment().format("YYYY-MM-DD HH:mm:ss").toString(),
        IsPickup: false,
        TotalChargableWeight: shipmentdata.shipments.total_chargable_weight,
        TotalDeclaredValue: shipmentdata.shipments.total_declared_value,
        ContainerID: null,
        TotalInsuredValue: shipmentdata.shipments.total_insured_value,
        TotalWeight: shipmentdata.shipments.total_chargable_weight,
        TotalPackages: shipmentdata.shipments.total_packages,
        PackageType: shipmentdata.shipments.package_type,
        DutiesPaidBy: "",
        ManagedBy: "",
        Old_managed_by: shipmentdata.shipments.Old_managed_by,
        ServiceName: shipmentdata.shipments.ServiceName || "",
        PromoCode: "",
        LocationType: shipmentdata.shipments.location_type,
        InvoiceDueDate: "",
        PickupDate: shipmentdata.shipments.pickup_date!=""? moment(shipmentdata.shipments.pickup_date).format("YYYY-MM-DD HH:mm:ss").toString():"",
        ReadyTime: "",
        AvailableTime: "",
        SpecialInstruction: "",
        PickupProvider: "",
        ipAddress: "",
        ipLocation: "",
        WhoSetAllClear: "",
        SubServiceName: shipmentdata.shipments.SubServiceName || "",
        CreatedByChange: shipmentdata.UserID,
        ShipmentType: shipmentdata.shipments.shipment_type,
      };

      // console.log(shipmentData)

      let shipQuery =
        "CALL spaddupdateshippingdata(:pdata, :puserid, :insertid);";
        console.log(
          shipQuery
        );
        console.log(JSON.stringify(shipmentData));
        console.log(shipmentdata.UserID);
        
        
        
      // const comparePass = toQuery;
      const resultPassShip = await sequelize.query(shipQuery, {
        replacements: {
          pdata: JSON.stringify(shipmentData),
          puserid: shipmentdata.UserID,
          insertid: null,
        },
        type: Sequelize.QueryTypes.RAW,
      });

      console.log(resultPassShip);
      var shipres = resultPassShip[0];
      var ShippingID = shipres[0].insertid;

      
    }
    if (ShippingID) {
        if (
          shipmentdata.packages != undefined &&
          shipmentdata.packages != null &&
          shipmentdata.packages.length > 0
        ) {
          // console.log("Shipping Here");
          shipmentdata.packages.forEach(async (Package) => {
            console.log(Package);


            var packdata = {
              insertUpdate: "I",
              estimetedweight: Package.weight,
              shippingid: ShippingID,
              packagenumber: Package.noOfPackages,
              length: Package.length,
              width: Package.width,
              height: Package.height,
              insuredvalue: Package.insured_value,
              chargableweight: Package.chargable_weight,
              tv: false,
              crating:false,
              repack:false,
              stretch:false,
              sequence: 0,
              packedtype: "Owner",
              packagecontent: "Box",
              cft: "",
            };

            let shipQuery =
              "CALL spaddupdatepackage(:pdata, :puserid,:insertedID);";

              console.log("JSON.stringify(packdata) = ",JSON.stringify(packdata));
              

            const resultPassPackage = await sequelize.query(shipQuery, {
              replacements: {
                pdata: JSON.stringify(packdata),
                puserid: shipmentdata.UserID,
                insertedID: null,
              },
              type: Sequelize.QueryTypes.RAW,
            });

            console.log("package data = ", resultPassPackage);
          });
        }

        // console.log("shipmentdata.commercialInvoiceData = ",shipmentdata.commercialInvoiceData);
        
        if (
          shipmentdata.commercial != undefined &&
          shipmentdata.commercial != null &&
          shipmentdata.commercial.length > 0
        ) {
          console.log("Com data");

          

          shipmentdata.commercial.forEach(async (commercial) => {
            var commercial = {
              insertUpdate: "I",
              commercialinvoiceid: "",
              shippingid: ShippingID,
              contentdescription: commercial.contentDescription,
              packagenumber: commercial.packageNumber,
              quantity: commercial.quantity,
              totalvalue: commercial.valuePerQty * commercial.quantity,
              valueperquantity: commercial.valuePerQty,
              newiplocation: "",
            };
            console.log("Comm data = ", commercial);
            let shipQueryCommecial =
              "CALL spaddupdatecommercial(:pdata, :puserid,:insertedID);";

            const resultPassCommercial = await sequelize.query(
              shipQueryCommecial,
              {
                replacements: {
                  pdata: JSON.stringify(commercial),
                  puserid: shipmentdata.UserID,insertedID:null
                },
                type: Sequelize.QueryTypes.RAW,
              }
            );

            console.log("Comm data = ", resultPassCommercial);
          });
        }

        if(shipmentdata.shipments.ShippingID == null){
            let shipQueryTracking =
              "CALL spaddtrackingnumber(:pdata, :puserid,:insertedID);";

            const resultPassTracking = await sequelize.query(
                shipQueryTracking,
              {
                replacements: {
                  pdata: ShippingID,
                  puserid: shipmentdata.UserID,insertedID:null
                },
                type: Sequelize.QueryTypes.RAW,
              }
            );
            console.log("Changes = ",resultPassTracking);
            // console.log(resultPassToAddress);
            var trackingResdata = resultPassTracking[0];
            var trackingID = trackingResdata[0].trackingnumber;
            console.log("TOAddressID = ", trackingID);
            
            
        }

        var returndata = {
            TrackingNumber: trackingID
        }

        return returndata;

    }

    //   return resultPass;
  } catch (error) {
    console.error("Error calling stored procedure:", error);
    throw error;
  }
};

const getmyShipmentData = async (data) =>{

  try {
        const sequelize = await createSequelizeInstance();  
        // console.log("here = ",data);
        const comparePass = `select * from spgetshipmentlist(:p_personID);`;
        const resultPass = await sequelize.query(comparePass, {
          replacements: { p_personID: data.Person_ID},
          type: Sequelize.QueryTypes.RAW,
        });  
        return resultPass;  
      } catch (error) {
        console.error('Error calling stored procedure:', error);
        throw error;
      }

}

const getmyShipmentsByIDData = async (data) =>{
  
  // SELECT public.spgetshipmenttrackingdetail(<pshippingid uuid>)
  
  // SELECT public.spgetaccountdetail(<p_shipping_id uuid>)
  try {
        const sequelize = await createSequelizeInstance();  
        // console.log("here = ",data);
        const comparePass = `select * from spgetstringmap(:pStringType);`;
        const resultSHIPMENTTYPE = await sequelize.query(comparePass, {
          replacements: { pStringType: "SHIPMENTTYPE"},
          type: Sequelize.QueryTypes.RAW,
        });  
        if(resultSHIPMENTTYPE){
          const comparePassspgetstringmap = `select * from spgetstringmap(:pStringType);`;
          const resultSHIPMENTSTATUS = await sequelize.query(comparePassspgetstringmap, {
            replacements: { pStringType: "SHIPMENTSTATUS"},
            type: Sequelize.QueryTypes.RAW,
          }); 

          if(resultSHIPMENTSTATUS){
            const compareshipmentInfo = `select * from spgetshipmentinfo(:p_shippingID);`;
            const ShipmentInfo = await sequelize.query(compareshipmentInfo, {
              replacements: { p_shippingID: data.Shipping_ID},
              type: Sequelize.QueryTypes.RAW,
            });
            
            if(ShipmentInfo){
              
              const compareAdditionalDetails = `select * from spgetadditionaldetails(:p_shippingID);`;
              const ShipmentAdditionalDetails = await sequelize.query(compareAdditionalDetails, {
                replacements: { p_shippingID: data.Shipping_ID},
                type: Sequelize.QueryTypes.RAW,
              });

                if(ShipmentAdditionalDetails){
                  const comparePackagetype = `select * from spgetstringmap(:p_shippingID);`;
                  const ShipmentPadckageContent = await sequelize.query(comparePackagetype, {
                    replacements: { p_shippingID: "PACKAGECONTENT"},
                    type: Sequelize.QueryTypes.RAW,
                  });
                    if(ShipmentPadckageContent){
                      const compareInventory = `select * from spgetstringmap(:p_shippingID);`;
                      const ShipmentInventory = await sequelize.query(compareInventory, {
                        replacements: { p_shippingID: "INVENTORY"},
                        type: Sequelize.QueryTypes.RAW,
                      });

                      if(ShipmentInventory){
                        const compareShippingID = `select * from spgetshipmentbyid(:p_shippingID);`;
                        const ShipmentShippingID = await sequelize.query(compareShippingID, {
                          replacements: { p_shippingID: data.Shipping_ID},
                          type: Sequelize.QueryTypes.RAW,
                        });
                        if(ShipmentShippingID){
                          const compareShippingPackageID = `select * from spgetshipmentpackagebyid(:p_shippingID);`;
                          const ShipmentShippingPackageID = await sequelize.query(compareShippingPackageID, {
                            replacements: { p_shippingID: data.Shipping_ID},
                            type: Sequelize.QueryTypes.RAW,
                          });
                          if(ShipmentShippingPackageID){
                            const compareShippingCommercialID = `select * from spgetshipmentcommercialinvoicebyid(:p_shippingID);`;
                            const ShipmentShippingCommercialID = await sequelize.query(compareShippingCommercialID, {
                              replacements: { p_shippingID: data.Shipping_ID},
                              type: Sequelize.QueryTypes.RAW,
                            });
                              // SELECT public.spgetshipmenttrackingdetail(<pshippingid uuid>)
                            if(ShipmentShippingCommercialID){
                              const compareShippingaccountdetail = `select * from spgetaccountdetail(:p_shippingID);`;
                              const ShipmentShippingaccountdetail = await sequelize.query(compareShippingaccountdetail, {
                                replacements: { p_shippingID: data.Shipping_ID},
                                type: Sequelize.QueryTypes.RAW,
                              });
                              if(ShipmentShippingaccountdetail){

                                const compareShippingTrackingDetails = `select * from spgetshipmenttrackingdetail(:p_shippingID);`;
                                const ShipmentShippingTrackingDetails = await sequelize.query(compareShippingTrackingDetails, {
                                  replacements: { p_shippingID: data.Shipping_ID},
                                  type: Sequelize.QueryTypes.RAW,
                                }); 
                                if(ShipmentShippingaccountdetail){

                                const compareShippingAttachement = `select * from spgetshipmentattachment( :pshippingid)`;
                                const ShipmentShippingAttachment = await sequelize.query(compareShippingAttachement, {
                                  replacements: { pshippingid: data.Shipping_ID},
                                  type: Sequelize.QueryTypes.RAW,
                                }); 

                                const modifiedAttachmentDetails = ShipmentShippingAttachment[0].map(attachment => {
                            if (attachment.attachmentpath && attachment.attachmentpath.startsWith("gs://")) {
                              return {
                                ...attachment,
                                attachmentpath: attachment.attachmentpath.replace("gs://", "https://storage.googleapis.com/")
                              };
                            }
                             });
                            

                                var data = {
                                  SHIPMENTTYPE: resultSHIPMENTTYPE[0],
                                  SHIPMENTSTATUS: resultSHIPMENTSTATUS[0],
                                  SHIPMENTINFO: ShipmentInfo[0],
                                  ADDITIONALDETAILS:ShipmentAdditionalDetails[0],
                                  PACKAGECONTENT:ShipmentPadckageContent[0],
                                  INVENTORY:ShipmentInventory[0],
                                  SHIPMENTDETAILS:ShipmentShippingID[0],
                                  PACKAGE:ShipmentShippingPackageID[0],
                                  COMMERCIAL:ShipmentShippingCommercialID[0],
                                  ACCOUNTSDETAILS:ShipmentShippingaccountdetail[0],
                                  TRACKINGDETAILS:ShipmentShippingTrackingDetails[0],
                                  ATTACHMENTDETAILS:modifiedAttachmentDetails
                                }
                                return data;
  
                               }
                              }
                              
                            }
                            
                          }

                          
                        }
                        
                      }
                     
                    }
                  
                }
              

            }
            
          }

        }
        // return resultSHIPMENTTYPE;  
      } catch (error) {
        console.error('Error calling stored procedure:', error);
        throw error;
      }

}

const deleteShipmentById = async (shippingID, trackingNumber) => {
  try {
    const sequelize = await createSequelizeInstance();

    const query = `CALL spdeleteshipmentbyid(:shipping_id, :tracking_number, :result);`;

    const result = await sequelize.query(query, {
      replacements: {
        shipping_id: parseInt(shippingID, 10),
        tracking_number: trackingNumber.toString(),
        result: null,
      },
      type: Sequelize.QueryTypes.RAW,
    });

    const spMessage = result?.[0]?.[0]?.result
    return { spMessage };

  } catch (error) {
    console.error('SP error:', error);
    throw new Error('Error deleting shipment: ' + error.message);
  }
};

export { saveshipmentData, getmyShipmentData, getmyShipmentsByIDData, deleteShipmentById };