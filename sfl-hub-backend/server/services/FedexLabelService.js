import createSequelizeInstance from "../config/dbConnection.js";
import { Sequelize } from "sequelize";
import moment from "moment";
import soap from "soap";
import path from "path";
import { fileURLToPath } from "url";
import { Storage } from "@google-cloud/storage";
import fs from "fs";
import os from "os";
import axios from "axios";
import PDFMerger from "pdf-merger-js";
import { getSecrets } from "./getQuotesService.js";
import base64 from "base64topdf";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const url = path.join(__dirname, "../../wsdl/lib/wsdl", "ShipService_v26.wsdl");
let HeaderLogoImage = "file://" + path.join(__dirname, "/logo.png");
HeaderLogoImage = path.normalize(HeaderLogoImage);

let SignImage = "file://" + path.join(__dirname, "/sign.png");
SignImage = path.normalize(SignImage);

import htmlToPDF from "html-pdf";
const storage = new Storage({
  keyFilename: path.join(
    __dirname,
    "../config/tough-bearing-450518-f8-be272d75f65d.json"
  ),
  projectId: "tough-bearing-450518",
});
const bucketName = process.env.BucketName;

async function uploadToGCS(filePath, destination) {
  try {
    const bucket = storage.bucket(bucketName);
    await bucket.upload(filePath, {
      destination: destination,
      gzip: true,
    });
    return `gs://${bucketName}/${destination}`;
  } catch (error) {
    console.error("Error uploading to GCS:", error);
    throw error;
  }
}

const currentDateTimeFormat = function () {
  return moment().format("YYYY-MM-DD HH:mm:ss");
};

const currentDateTimeFormatTMSDate = function () {
  return moment().tz("America/Chicago").format("YYYY-MM-DD");
};

const currentDateTimeFormatTMSTimeFull = function () {
  return moment().tz("America/Chicago").format("HH:mm:ss");
};

const currentDateTimeFormatFrom = function () {
  return moment().tz("America/Chicago").format("YYYY-MM-DD HH:mm:ss");
};

const getrootPath = "https://storage.googleapis.com/";

async function fedexLabel(ShipmentData) {
  return new Promise(async (resolve, reject) => {
    try {
      if (!ShipmentData.TrackingNumber) {
        console.log("Error tracking number not found");
        return reject({
          data: "tracking number not found",
          success: false,
          message: "Tracking number is required.",
        });
      }

      const sequelize = await createSequelizeInstance();
      console.log("ShipmentData Test = ", ShipmentData);
      const comparePass = `SELECT * FROM spgetshipmentpickupdetailbytrackingnumber(:ptrackingnumber,:pfcountry);`;
      let shipRes;
      try {
        const resultPass = await sequelize.query(comparePass, {
          replacements: {
            ptrackingnumber: ShipmentData.TrackingNumber,
            pfcountry: ShipmentData.fCountry,
          },
          type: Sequelize.QueryTypes.SELECT,
        });

        //console.log("resultPass[0] = ", resultPass);
        shipRes = resultPass;
        console.log("resultPass[0] = ", shipRes);
      } catch (dbError) {
        console.error("Error fetching shipment pickup details:", dbError);
        return reject({
          error: "Database error",
          message: "Failed to retrieve shipment details from the database.",
          success: false,
          details: dbError,
        });
      }

      if (!shipRes || shipRes.length === 0) {
        return reject({
          error: "No shipment found",
          message: "No shipment details found for the given tracking number.",
          success: false,
        });
      }

      var MasterTrackingId = {};
      var LinkArray = []; // Collect all individual label links here
      var Id = ""; // Master Tracking ID
      var promises = []; // To hold promises for each CreateFedexLable call
      let firstLabelFedexResult = null;
      let firstLabelOriginalPackageData = null;

      for (let index = 0; index < shipRes.length; index++) {
        const element = shipRes[index]; // Use const
       //onsole.log("Here  = ", element);

        var domastic = element.fromcountrycode === element.tocountrycode;
        let shipPRes = [];
       //onst comparePassP = `SELECT * FROM spgetshippingcommercialinvoice(:pshippingid);`;
        if (!domastic) { // Line 109: Start of the block for INTERNATIONAL shipments
          const comparePassP = `SELECT * FROM spgetshippingcommercialinvoice(:pshippingid);`;
          try {
            const resultPassP = await sequelize.query(comparePassP, {
              replacements: {
                pshippingid: element.shippingid,
              },
              type: Sequelize.QueryTypes.SELECT,
            });
            shipPRes = resultPassP;
            console.log("shipPresTest (International):", shipPRes );
          } catch (dbError) {
            console.error("Error fetching commercial invoice details:", dbError);
            return reject({
              error: "Database error",
              message: "Failed to retrieve commercial invoice details from the database.",
              success: false,
              details: dbError,
            });
          }

          // --- Start of commercial invoice validation and assignment for INTERNATIONAL shipments ---
          // This block (originally lines 129-145) is moved INSIDE the `if (!domastic)` block
          if (!shipPRes || shipPRes.length === 0) {
            return reject({
              error: "Label not generated",
              message: "No commercial invoice details found for international shipment.", // Updated message for clarity
              success: false,
            });
          }

          const currentPackageCommercialInvoiceItems = shipPRes.filter(
              ciItem => ciItem.packagenumber === element.packagenumber
          );

          if (currentPackageCommercialInvoiceItems.length === 0) {
            console.warn(`No commercial invoice items found in shipPRes matching package number ${element.packagenumber} for shippingid ${element.shippingid}. This international package might not get commodities.`);
            element.shipPRes = []; // Set to empty if no specific items for this package
            } else {
            element.shipPRes = currentPackageCommercialInvoiceItems;
          }
          console.log(`Assigned CI items for international package ${element.packagenumber}:`, element.shipPRes);
          // --- End of commercial invoice validation and assignment for INTERNATIONAL shipments ---

        } else { // Line 109's ELSE block: For DOMESTIC shipments
          // For domestic shipments, no commercial invoice is needed.
          // Explicitly set element.shipPRes to an empty array.
          element.shipPRes = [];
          console.log(`Domestic shipment, skipping commercial invoice lookup for package ${element.packagenumber}.`);
        }

        // var newarr = [];
        // newarr.push(shipPRes);
        // element.shipPRes = newarr;
       //ar domastic = element.fromcountrycode === element.tocountrycode;

        // Push a promise for each label creation to the array
        promises.push(
          // No setTimeout here. Let them run as concurrently as possible
          // The merging will happen after all promises resolve.
          CreateFedexLable(
            domastic,
            element.shipmenttype,
            element,
            ShipmentData,
            index + 1, // Current package index (1-based)
            shipRes.length, // Total package count
            Id, // Master tracking ID
            LinkArray, // Pass LinkArray to collect individual links
            shipRes,
            ShipmentData.isSendEmail,
            ShipmentData.UserID,
            ShipmentData.Rates ? ShipmentData.Rates : [],
            shipRes.length > 1 // Pass flag to indicate if this is part of multi-package shipment
            // The 'flag' parameter is no longer needed in CreateFedexLable's signature
          )
        );

        // Update MasterTrackingId after the first successful call
        if (index === 0) {
          try {
            const firstLabelResult = await promises[0]; // Await the first label to get the MasterTrackingId
            if (firstLabelResult && firstLabelResult.success) {
              Id = firstLabelResult.trackingNumber; // Store the master tracking number
              MasterTrackingId = firstLabelResult.fedexResult.CompletedShipmentDetail.MasterTrackingId;
            } else {
              return reject(firstLabelResult); // If first label fails, reject
            }
          } catch (fedexError) {
            console.error("Error creating first FedEx label:", fedexError);
            return reject(fedexError);
          }
        }
      }

      // Wait for all individual label creation promises to resolve
      const allLabelResults = await Promise.all(promises);

      // Now, after all labels are generated, perform the merge if multiple packages
      if (shipRes.length > 1) {
        const tempDir = os.tmpdir();
        const finalMasterTrackingNumber = Id; // Use the stored master tracking ID
        const mergedFileName = `${finalMasterTrackingNumber}-${shipRes.length + 1}.pdf`;
        const mergedFilePath = path.join(tempDir, mergedFileName);
        const mergedGcsPath = `FedexPrepaidLabel/${mergedFileName}`;

        var merger = new PDFMerger();

        try {
          // Sort LinkArray by index before merging to ensure correct order
          LinkArray = LinkArray.sort((a, b) => a.index - b.index);

          for (let i = 0; i < LinkArray.length; i++) {
            const { link } = LinkArray[i];
            const tempPdfPath = path.join(tempDir, `label-${i}.pdf`);
            try {
              const response = await axios.get(link, {
                responseType: "arraybuffer",
              });
              fs.writeFileSync(tempPdfPath, response.data);
              await merger.add(tempPdfPath);
            } catch (error) {
              console.error(`Error processing label ${i} for merging:`, error);
              // Decide if you want to reject here or just skip the problematic PDF
              // For now, let's just log and continue for other PDFs
            } finally {
              if (fs.existsSync(tempPdfPath)) {
                fs.unlinkSync(tempPdfPath); // Clean up individual temp PDFs
              }
            }
          }

          await merger.save(mergedFilePath);
          console.log("PDFs merged successfully!");

          const uploadedPath = await uploadToGCS(mergedFilePath, mergedGcsPath);
          console.log("Merged PDF uploaded to:", uploadedPath);

          fs.unlinkSync(mergedFilePath); // Clean up merged temp PDF

          const mergedGcsFileUrl = await getGCSFileUrl(uploadedPath);

          // Now, perform database operations for the *merged* label
          // Use the data from the *first* package's result for database operations,
          // as it typically holds the overall shipment details.
          const firstPackageResult = allLabelResults[0].fedexResult; // Assuming first element has master tracking details
          const dbResult = await executeDatabaseOperations(
            sequelize,
            shipRes[0], // Use the first shipment's data for DB ops related to the overall shipment
            ShipmentData,
            firstPackageResult, // Pass the result from the first label to extract master tracking etc.
            mergedFileName,
            uploadedPath,
            mergedGcsFileUrl,
            true // Indicate it's a merged file
          );

          resolve({
            success: true,
            message: "FedEx labels generated and merged successfully",
            attachmentData: dbResult.attachmentData,
            FedexLabel: dbResult.FedexLabel,
            trackingNumber: finalMasterTrackingNumber // Return the final master tracking number
          });

        } catch (mergeError) {
          console.error("Error during PDF merging or GCS upload:", mergeError);
          reject({
            error: "PDF merging or GCS upload failed",
            message: "An error occurred while merging or uploading PDF labels.",
            success: false,
            details: mergeError,
          });
        }
      } else {
        // Single package scenario: just return the result of the single label
        if (allLabelResults[0] && allLabelResults[0].success) {
          resolve(allLabelResults[0]);
        } else {
          reject({
            success: false,
            message: allLabelResults[0].message || "An error occurred during single label generation.",
            error: allLabelResults[0].error || 'Unknown error',
          });
        }
      }

    } catch (error) {
      console.log("Error Catch (fedexLabel):");
      console.log(error);
      if (error && typeof error === 'object' && error.success === false && error.message) { 
        reject(error);
      } else {
        reject({
          error: "Label generation failed",
          message: "An unexpected error occurred during the process.",
          success: false,
          details: error,
        });
      }
    }
  });
}

async function executeDatabaseOperations(
  sequelize,
  FedexLabledata,
  ShipmentData,
  result,
  fileName,
  gcsPath,
  gcsFileUrl,
  isMerged = false
) {
  try {
    const managedById = FedexLabledata.managedby || "54db5656-db99-494d-aad1-16c37f1ed892";
    const fedexLabelData = {
      shippingid: FedexLabledata.shippingid,
      trackingnumber: ShipmentData.TrackingNumber,
      fedextrakingnumber:
        result.CompletedShipmentDetail.MasterTrackingId.TrackingNumber,
      imagetype:
        result.CompletedShipmentDetail.CompletedPackageDetails[0].Label
          .ImageType,
      carriercode: result.CompletedShipmentDetail.CarrierCode,
      fedexstatus: result.HighestSeverity,
      status: "Active",
      createdon: currentDateTimeFormat(),
    };

    const [resultFedexLabel] = await sequelize.query(
      `CALL spaddupdatefedexlabel(:shippingid,:trackingnumber,:fedextrackingnumber,:imagetype,:carriercode,:fedexstatus,:status,:createdon,:puserid,:p_success)`,
      {
        replacements: {
          shippingid: FedexLabledata.shippingid,
          trackingnumber: ShipmentData.TrackingNumber,
          fedextrackingnumber:
            result.CompletedShipmentDetail.MasterTrackingId.TrackingNumber,
          imagetype:
            result.CompletedShipmentDetail.CompletedPackageDetails[0].Label
              .ImageType,
          carriercode: result.CompletedShipmentDetail.CarrierCode,
          fedexstatus: result.HighestSeverity,
          status: "Active",
          createdon: currentDateTimeFormat(),
          puserid: null,
          p_success: null,
        },
        type: Sequelize.QueryTypes.RAW,
      }
    );

    const attachmentData = {
      EntityID: FedexLabledata.shippingid,
      EntityType: "Shipment",
      AttachmentType: "application/pdf",
      AttachmentName: fileName,
      AttachmentPath: gcsFileUrl,
      SortOrder: 0,
      Status: "Active",
      Description: fileName,
      DocumentType: "Prepaid Labels",
      AttachmentPathToOld: gcsPath,
    };

    const attachmentQuery = `CALL public.spaddupdateattachmentshipment(:pdata, :puserid, :iuid)`;
    const [resultAttachment] = await sequelize.query(attachmentQuery, {
      replacements: {
        pdata: JSON.stringify({
          entityid: FedexLabledata.shippingid,
          entitytype: "Shipment",
          attachmenttype: "application/pdf",
          attachmentname: fileName,
          attachmentpath: gcsPath,
          sortorder: 0,
          status: "Active",
          description: fileName,
          documenttype: "Prepaid Labels",
          insertUpdate: "I",
        }),
        puserid: managedById,
        iuid: null,
      },
      type: sequelize.QueryTypes.RAW,
    });

    const PickupTable = {
      pshippingid: FedexLabledata.shippingid,
      ptrackingid:
        result.CompletedShipmentDetail.MasterTrackingId.TrackingNumber,
      puserid: managedById,
    };

    const [resultPickupConfirmation] = await sequelize.query(
      `CALL spaddupdateshippingpickupconfirmation(:pshippingid, :ptrackingid, :puserid, :result_status)`,
      {
        replacements: {
          ...PickupTable,
          result_status: null,
        },
        type: Sequelize.QueryTypes.RAW,
      }
    );

    console.log("resultPickupConfirmation:", resultPickupConfirmation);

    const trackingData1 = {
      pshippingid: FedexLabledata.shippingid,
      ptrackingid:
        result.CompletedShipmentDetail.MasterTrackingId.TrackingNumber,
      pcarrier: "FedEx",
      ptrackingstatus: "Active",
      pcomments: "MTN",
      pstatus: "Active",
      ptrackingdate: currentDateTimeFormat(),
      puserid: managedById,
    };

    const [resultTrackingMaster] = await sequelize.query(
      `CALL spaddupdateshippingtrackingmaster(:pshippingid, :ptrackingid, :pcarrier, :ptrackingstatus, :pcomments, :pstatus, :ptrackingdate, :puserid, :result_status)`,
      {
        replacements: {
          ...trackingData1,
          result_status: null,
        },
        type: Sequelize.QueryTypes.RAW,
      }
    );
    console.log("resultTrackingMaster:", resultTrackingMaster)

    const trackingData11 = {
      pshippingid: FedexLabledata.shippingid,
      ppickupdate: currentDateTimeFormatTMSDate(),
      ppickuptime: currentDateTimeFormatTMSTimeFull(),
      pupdates:
        "Track on Fedex.com - Your tracking number: " +
        result.CompletedShipmentDetail.MasterTrackingId.TrackingNumber,
      pstatus: "Active",
      pcreatedOn: currentDateTimeFormatFrom(),
      pstartdate: currentDateTimeFormatTMSDate(),
      puserid: managedById,
    };

    const [resultManualTracking1] = await sequelize.query(
      `CALL spaddupdateshippingmanualtracking(:pshippingid, :ppickupdate, :ppickuptime, :pupdates, :pstatus, :puserid, :result_status)`,
      {
        replacements: {
          ...trackingData11,
          result_status: null,
        },
        type: Sequelize.QueryTypes.RAW,
      }
    );
    console.log("resultManualTracking1:", resultManualTracking1)
    const trackingData12 = {
      pshippingid: FedexLabledata.shippingid,
      ppickupdate: currentDateTimeFormatTMSDate(),
      ppickuptime: currentDateTimeFormatTMSTimeFull(),
      pupdates: "For further update contact FedEx at 1 (800) 463-3339",
      pstatus: "Active",
      pcreatedOn: currentDateTimeFormatFrom(),
      pstartdate: currentDateTimeFormatTMSDate(),
      puserid: managedById,
    };

    const [resultManualTracking2] = await sequelize.query(
      `CALL spaddupdateshippingmanualtracking(:pshippingid, :ppickupdate, :ppickuptime, :pupdates, :pstatus, :puserid, :result_status)`,
      {
        replacements: {
          ...trackingData12,
          result_status: null,
        },
        type: Sequelize.QueryTypes.RAW,
      }
    );
    console.log("resultManualTracking2", resultManualTracking2)
    return {
      success: true,
      message: isMerged
        ? "FedEx labels generated and merged successfully"
        : "FedEx label generated and data inserted successfully",
      attachmentData,
      FedexLabel: fedexLabelData,
    };
  } catch (error) {
    console.error("Error in executeDatabaseOperations:", error);
    throw error;
  }
}

async function CreateFedexLable(
  domastic,
  shipmenttype,
  FedexLabledata,
  ShipmentData,
  index,
  PackageCount,
  MasterTrackingId, // This will be passed as the actual master tracking string
  LinkArray, // Still passed to collect individual links
  shipPResAll,
  isSendEmail,
  UserID,
  getrate,
  isMultiPackage = false // New parameter to indicate if this is part of multi-package shipment
  // The 'flag' parameter is removed
) {
  // ... (Keep all the existing FedEx request preparation logic: secrets, WebAuthenticationDetail, Version, ClientDetail, Shipper, Recipient, CustomsClearanceDetail, PackagingType, RequestedPackageLineItems, RequestedShipment) ...
  // All the logic up to client.processShipment(params, async (error, result) => { ... } remains the same.

  if (
    FedexLabledata.shipmenttype === "Ocean" &&
    FedexLabledata.subservicename === "Texas Console"
  ) {
    FedexLabledata.servicename = "INTERNATIONAL_ECONOMY";
    FedexLabledata.subservicename = "Fedex International Economy";
  }

  var cntryCode = "";
  var newcntrcode = "";

  if (
    FedexLabledata.fromcountrycode == "CA" &&
    FedexLabledata.packagetype.toString() == "Envelop"
  ) {
    newcntrcode = "CA";
  } else {
    newcntrcode = "US";
  }

  try {
    // No Promise wrapper here, since fedexLabel will handle the Promise.all
      const sequelize = await createSequelizeInstance();

      let secrets;
      try {
        secrets = await getSecrets();
      } catch (secretError) {
        console.error("Error fetching secrets:", secretError);
        throw { // Throw, don't return reject directly here
          success: false,
          message: "Failed to retrieve secrets.",
          error: secretError,
        };
      }

      var date = new Date();
      var WebAuthenticationDetail = {
        UserCredential: {
          Key: newcntrcode === "CA" ? secrets.FedexCAKey : secrets.FedexKey,
          Password:
            newcntrcode === "CA"
              ? secrets.FedexCAPassword
              : secrets.FedexPassword,
        },
      };

      var currencyType = newcntrcode === "CA" ? "CAD" : "USD";

      var Version = {
        ServiceId: "ship",
        Major: "26",
        Intermediate: "0",
        Minor: "0",
      };

      var ClientDetail = {
        AccountNumber:
          newcntrcode === "CA"
            ? secrets.FedexCAAccountNumber
            : secrets.FedexAccountNumber,
        MeterNumber:
          newcntrcode === "CA"
            ? secrets.FedexCAMeterNumber
            : secrets.FedexMeterNumber,
      };

      var Shipper = {
        Contact: {
          PersonName: FedexLabledata.fromcontactname.toString(),
          CompanyName: FedexLabledata.fromcompanyname.toString(),
          PhoneNumber: FedexLabledata.fromphone1.toString(),
        },
        Address: {
          StreetLines: [
            FedexLabledata.fromaddressline1,
            FedexLabledata.fromaddressline2,
            FedexLabledata.fromaddressline3,
          ],
          City: FedexLabledata.fromcity.toString(),
          StateOrProvinceCode:
            FedexLabledata.fromstate === null
              ? ""
              : FedexLabledata.fromstate.toString(),
          PostalCode: FedexLabledata.fromzipcode.toString(),
          CountryCode: FedexLabledata.fromcountrycode.toString(),
        },
      };

      var Recipient = {};
      var CustomsClearanceDetail = {};
      var PackagingType = "";
      var RequestedPackageLineItems = [];
      var packagedata = {};
      var RequestedShipment = {};
      let finalTotal = 0;

      if (FedexLabledata.shipPRes && FedexLabledata.shipPRes.length > 0 && FedexLabledata.shipPRes[0].finaltotal) {
        finalTotal = Number(FedexLabledata.shipPRes[0].finaltotal);
      } else {
        console.warn(
          "shipPRes[0] is undefined. Using default value of 0 for finalTotal."
        );
      }

      if (FedexLabledata.packagetype.toString() == "Envelop") {
        PackagingType = "FEDEX_ENVELOPE";
        if (!domastic) {
          var Description = "";
          var Quantity = 0;
          var TotalValue = 0;
          var ValuePerQuantity = 0;
          FedexLabledata.shipPRes.forEach((element) => {
            Description = Description + element.contentdescription;
            Quantity = Quantity + Number(element.quantity);
            TotalValue = TotalValue + Number(element.totalvalue);
            ValuePerQuantity =
              ValuePerQuantity + Number(element.valueperquantity);
          });

          var data = {
            DutiesPayment: {
              PaymentType:
                FedexLabledata.dutiespaidby.toString() === "Sender"
                  ? "SENDER"
                  : "RECIPIENT",
              Payor: {
                ResponsibleParty: {
                  AccountNumber:
                    FedexLabledata.dutiespaidby.toString() === "Sender"
                      ? newcntrcode === "CA"
                        ? secrets.FedexCAAccountNumber
                        : secrets.FedexAccountNumber
                      : "",
                },
              },
            },
            DocumentContent: "DOCUMENTS_ONLY",
            CustomsValue: {
              Currency: currencyType,
              Amount: FedexLabledata.shipPRes[0].FinalTotal
                ? Number(FedexLabledata.shipPRes[0].FinalTotal)
                : 0,
            },
            Commodities: [
              {
                NumberOfPieces: 1,
                Description: "Correspondence/No Customs Value",
                CountryOfManufacture: "US",
                Weight: {
                  Units: "LB",
                  Value: Number(FedexLabledata.estimatedweight).toString(),
                },
                Quantity: 4,
                QuantityUnits: "EA",
                UnitPrice: {
                  Currency: currencyType,
                  Amount: 0.0,
                },
                CustomsValue: {
                  Currency: currencyType,
                  Amount: Number(FedexLabledata.shipPRes[0].FinalTotal),
                },
              },
            ],
            ExportDetail: {
              B13AFilingOption: "NOT_REQUIRED",
            },
          };
          CustomsClearanceDetail = data;
        }
      } else {
        PackagingType = "YOUR_PACKAGING";
        if (!domastic) {
          // var Description = [];
          // var Quantity = [];
          // var TotalValue = 0;
          // var ValuePerQuantity = [];
          const Commodities = [];
          let aggregatedValueForPackage = 0;
          // var conunt = 1;

          if (FedexLabledata.shipPRes && FedexLabledata.shipPRes.length > 0) {
          const aggregatedDescription = FedexLabledata.shipPRes
            .map((item) => item.contentdescription)
            .join(", ");
          const aggregatedQuantity = FedexLabledata.shipPRes.reduce(
            (sum, item) => sum + Number(item.quantity), 0
          );
          aggregatedValueForPackage = FedexLabledata.shipPRes.reduce(
            (sum, item) => sum + Number(item.totalvalue), 0
          );

          const commodityForThisPackage = {
            NumberOfPieces: 1,
            Description: aggregatedDescription,
            CountryOfManufacture: "US",
            Weight: {
              Units: "LB",
              Value: Number(FedexLabledata.estimatedweight).toString(),
            },
            Quantity: aggregatedQuantity,
            QuantityUnits: "EA",
            UnitPrice: {
              Currency: currencyType,
              Amount:
                aggregatedQuantity > 0
                  ? (aggregatedValueForPackage / aggregatedQuantity).toFixed(2)
                  : "0.00",
            },
            CustomsValue: {
              Currency: currencyType,
              Amount: aggregatedValueForPackage.toFixed(2),
            },
          };
          Commodities.push(commodityForThisPackage);
        }  

          // for (let index = 0; index < PackageCount; index++) {
          //   for (let j = 0; j < FedexLabledata.shipPRes.length; j++) {
          //     const element = FedexLabledata.shipPRes[j];
          //     if (element.packagenumber === index + 1) {
          //       if (Description[element.packagenumber] != undefined) {
          //         Description[element.packagenumber] =
          //           Description[element.packagenumber] +
          //           "," +
          //           element.contentdescription;
          //         Quantity[element.packagenumber] =
          //           Number(Quantity[element.packagenumber]) +
          //           Number(element.quantity);
          //         ValuePerQuantity[element.packagenumber] =
          //           Number(ValuePerQuantity[element.packagenumber]) +
          //           Number(element.valueperquantity);
          //         TotalValue[element.packagenumber] =
          //           Number(TotalValue[element.packagenumber]) +
          //           Number(element.totalvalue);
          //       } else {
          //         Description[element.packagenumber] =
          //           element.contentdescription;
          //         Quantity[element.packagenumber] = Number(element.quantity);
          //         ValuePerQuantity[element.packagenumber] = Number(
          //           element.valueperquantity
          //         );
          //       }
          //     }
          //   }
          // }

          // for (let index = 0; index < FedexLabledata.shipPRes.length; index++) {
          //   const element = FedexLabledata.shipPRes[index];
          //   if (element.packagenumber == conunt) {
          //     var data123 = {
          //       NumberOfPieces: 1,
          //       Description: Description[element.packagenumber],
          //       CountryOfManufacture: "US",
          //       Weight: {
          //         Units: "LB",
          //         Value: Number(
          //           shipPResAll[conunt - 1].estimatedweight
          //         ).toString(),
          //       },
          //       Quantity: Quantity[element.packagenumber],
          //       QuantityUnits: "EA",
          //       UnitPrice: {
          //         Currency: currencyType,
          //         Amount:
          //           FedexLabledata.shipPRes[0].finaltotal == 0 &&
          //           Quantity[element.packagenumber] == 0
          //             ? 0
          //             : Number(FedexLabledata.shipPRes[0].finaltotal) /
          //               Number(Quantity[element.packagenumber]),
          //       },
          //     };
          //     Commodities.push(data123);
          //     conunt += 1;
          //   }
          // }
          
          var data = {
            DutiesPayment: {
              PaymentType:
                FedexLabledata.dutiespaidby.toString() === "Sender"
                  ? "SENDER"
                  : "RECIPIENT",
              Payor: {
                ResponsibleParty: {
                  AccountNumber:
                        FedexLabledata.dutiespaidby.toString() === "Sender"
                          ? newcntrcode === "CA"
                            ? secrets.FedexCAAccountNumber
                            : secrets.FedexAccountNumber
                          : "",
                    },
                  },
                },
                DocumentContent: "NON_DOCUMENTS",
                CustomsValue: {
                  Currency: currencyType,
                  //Amount: finalTotal,
                  Amount: aggregatedValueForPackage.toFixed(2),
                },
                Commodities: Commodities,
                ExportDetail: {
                  B13AFilingOption: "NOT_REQUIRED",
                },
              };
              CustomsClearanceDetail = data;
            }
          }

          if (
            !domastic &&
            FedexLabledata.shipmenttype.toString() === "Ocean" &&
            FedexLabledata.subservicename.toString() === "Texas Console"
          ) {
            var Recipientdata = {
              Contact: {
                PersonName: FedexLabledata.managedbyname.toString(),
                CompanyName: "SFL Worldwide",
                PhoneNumber: "972-255-7447",
              },
              Address: {
                StreetLines: ["3364 Garden Brook Drive"],
                City: "Farmers Branch",
                StateOrProvinceCode: "TX",
                PostalCode: "75234",
                CountryCode: "US",
                Residential:
                  FedexLabledata.locationtype == "Residential" ? true : false,
              },
            };
            Recipient = Recipientdata;
          } else {
            var Recipientdata = {
              Contact: {
                PersonName: FedexLabledata.tocontactname.toString(),
                CompanyName: FedexLabledata.tocompanyname.toString(),
                PhoneNumber: FedexLabledata.tophone1.toString(),
              },
              Address: {
                StreetLines: [
                  FedexLabledata.toaddressline1,
                  FedexLabledata.toaddressline2,
                  FedexLabledata.toaddressline3,
                ],
                City: FedexLabledata.tocity.toString(),
                StateOrProvinceCode:
                  FedexLabledata.tostate != null ? FedexLabledata.tostate : "",
                PostalCode: FedexLabledata.tozipcode.toString(),
                CountryCode: FedexLabledata.tocountrycode.toString(),
                Residential:
                  FedexLabledata.locationtype == "Residential" ? true : false,
              },
            };
            Recipient = Recipientdata;
          }

          if (PackageCount == 1) {
            if (FedexLabledata.packagetype.toString() == "Envelop") {
              var pd = {
                GroupPackageCount: index.toString(),
                InsuredValue: {
                  Currency: currencyType,
                  Amount:
                    FedexLabledata.totalinsuredvalue != 0
                      ? Number(FedexLabledata.insuredvalue).toString()
                      : "0",
                },
                Weight: {
                  Units: "LB",
                  Value: Number(FedexLabledata.estimatedweight).toString(),
                },
                CustomerReferences: {
                  CustomerReferenceType: "CUSTOMER_REFERENCE",
                  Value: ShipmentData.TrackingNumber,
                },
              };
              packagedata = pd;
            } else {
              var pd = {
                GroupPackageCount: index.toString(),
                InsuredValue: {
                  Currency: currencyType,
                  Amount:
                    FedexLabledata.totalinsuredvalue != 0
                      ? Number(FedexLabledata.insuredvalue).toString()
                      : "0.00",
                },
                Weight: {
                  Units: "LB",
                  Value: Number(FedexLabledata.estimatedweight).toString(),
                },
                Dimensions: {
                  Length: Number(FedexLabledata.length).toString(),
                  Width: Number(FedexLabledata.width).toString(),
                  Height: Number(FedexLabledata.height).toString(),
                  Units: "IN",
                },
                CustomerReferences: {
                  CustomerReferenceType: "CUSTOMER_REFERENCE",
                  Value: ShipmentData.TrackingNumber,
                },
              };
              packagedata = pd;
            }
          } else {
            if (index >= 2) {
              var pd = {
                SequenceNumber: index.toString(),
                InsuredValue: {
                  Currency: currencyType,
                  Amount:
                    FedexLabledata.insuredvalue != 0
                      ? Number(FedexLabledata.insuredvalue).toString()
                      : "0",
                },
                Weight: {
                  Units: "LB",
                  Value: Number(FedexLabledata.estimatedweight).toString(),
                },
                Dimensions: {
                  Length: Number(FedexLabledata.length).toString(),
                  Width: Number(FedexLabledata.width).toString(),
                  Height: Number(FedexLabledata.height).toString(),
                  Units: "IN",
                },
                CustomerReferences: {
                  CustomerReferenceType: "CUSTOMER_REFERENCE",
                  Value: ShipmentData.TrackingNumber,
                },
              };
              packagedata = pd;
            } else {
              var pd = {
                SequenceNumber: index.toString(),
                InsuredValue: {
                  Currency: currencyType,
                  Amount:
                    FedexLabledata.insuredvalue != 0
                      ? Number(FedexLabledata.insuredvalue).toString()
                      : "0.00",
                },
                Weight: {
                  Units: "LB",
                  Value: FedexLabledata.estimatedweight,
                },
                Dimensions: {
                  Length: Number(FedexLabledata.length).toString(),
                  Width: Number(FedexLabledata.width).toString(),
                  Height: Number(FedexLabledata.height).toString(),
                  Units: "IN",
                },
                CustomerReferences: {
                  CustomerReferenceType: "CUSTOMER_REFERENCE",
                  Value: ShipmentData.TrackingNumber,
                },
              };
              packagedata = pd;
            }
          }
          RequestedPackageLineItems.push(packagedata);

          if (
            domastic ||
            (!domastic &&
              FedexLabledata.shipmenttype.toString() === "Ocean" &&
              FedexLabledata.subservicename.toString() === "Texas Console")
          ) {
            if (PackageCount == 1 || index == 1) {
              var dca = {
                ShipTimestamp: new Date(date.getTime()).toISOString(),
                DropoffType: "REGULAR_PICKUP",
                ServiceType: FedexLabledata.servicename,
                PackagingType: PackagingType,
                TotalWeight: {
                  Units: "LB",
                  //Value: Number(FedexLabledata.totalweight).toString(),
                  Value: Number(FedexLabledata.estimatedweight).toString(),
                },
                TotalInsuredValue: {
                  Currency: currencyType,
                  //Amount: Number(FedexLabledata.totalinsuredvalue).toString(),
                  Amount: Number(FedexLabledata.insuredvalue || 0).toString(),
                },
                Shipper: Shipper,
                Recipient: Recipient,
                ShippingChargesPayment: {
                  PaymentType: "SENDER",
                  Payor: {
                    ResponsibleParty: {
                      AccountNumber:
                        newcntrcode === "CA"
                          ? secrets.FedexCAAccountNumber
                          : secrets.FedexAccountNumber,
                    },
                  },
                },
                LabelSpecification: {
                  LabelFormatType: "COMMON2D",
                  ImageType: "PDF",
                  LabelStockType: ShipmentData.LabelSpecification,
                },
                PackageCount: PackageCount.toString(),
                RequestedPackageLineItems: RequestedPackageLineItems,
              };
              RequestedShipment = dca;
            } else {
              var mastertrack = {
                TrackingIdType: "FEDEX",
                TrackingNumber: MasterTrackingId, // Pass the master tracking ID received from the first package
              };
              var dca = {
                ShipTimestamp: new Date(date.getTime()).toISOString(),
                DropoffType: "REGULAR_PICKUP",
                ServiceType: FedexLabledata.servicename,
                PackagingType: PackagingType,
                TotalWeight: {
                  Units: "LB",
                  Value: FedexLabledata.totalweight.toString(),
                },
                TotalInsuredValue: {
                  Currency: currencyType,
                  Amount:
                    FedexLabledata.totalinsuredvalue == 0
                      ? "0.00"
                      : Number(FedexLabledata.totalinsuredvalue).toString(),
                },
                Shipper: Shipper,
                Recipient: Recipient,
                ShippingChargesPayment: {
                  PaymentType: "SENDER",
                  Payor: {
                    ResponsibleParty: {
                      AccountNumber:
                        newcntrcode === "CA"
                          ? secrets.FedexCAAccountNumber
                          : secrets.FedexAccountNumber,
                    },
                  },
                },
                LabelSpecification: {
                  LabelFormatType: "COMMON2D",
                  ImageType: "PDF",
                  LabelStockType: ShipmentData.LabelSpecification,
                },
                RateRequestTypes: "ACCOUNT",
                MasterTrackingId: mastertrack,
                PackageCount: PackageCount.toString(),
                RequestedPackageLineItems: RequestedPackageLineItems,
              };
              RequestedShipment = dca;
            }
          } else if (!domastic) {
            if (PackageCount == 1 || index == 1) {
              var dca = {
                ShipTimestamp: new Date(date.getTime()).toISOString(),
                DropoffType: "REGULAR_PICKUP",
                ServiceType: FedexLabledata.servicename,
                PackagingType: PackagingType,
                TotalWeight: {
                  Units: "LB",
                  Value: Number(FedexLabledata.totalweight).toString(),
                },
                TotalInsuredValue: {
                  Currency: currencyType,
                  Amount:
                    FedexLabledata.totalinsuredvalue == 0
                      ? "0.00"
                      : Number(FedexLabledata.totalinsuredvalue).toString(),
                },
                Shipper: Shipper,
                Recipient: Recipient,
                ShippingChargesPayment: {
                  PaymentType: "SENDER",
                  Payor: {
                    ResponsibleParty: {
                      AccountNumber:
                        newcntrcode === "CA"
                          ? secrets.FedexCAAccountNumber
                          : secrets.FedexAccountNumber,
                    },
                  },
                },
                SpecialServicesRequested: {
                  SpecialServiceTypes: "ELECTRONIC_TRADE_DOCUMENTS",
                  EtdDetail: {
                    Confirmation: "CONFIRMED",
                    RequestedDocumentCopies: "LABEL",
                    DocumentReferences: {
                      LineNumber: 0,
                      DocumentType: "COMMERCIAL_INVOICE",
                      DocumentId: ShipmentData.EtdDocumentId,
                    },
                  },
                },
                CustomsClearanceDetail: CustomsClearanceDetail,
                LabelSpecification: {
                  LabelFormatType: "COMMON2D",
                  ImageType: "PDF",
                  LabelStockType: ShipmentData.LabelSpecification,
                },
                PackageCount: PackageCount.toString(),
                RequestedPackageLineItems: RequestedPackageLineItems,
              };
              RequestedShipment = dca;
            } else {
              var mastertrack = {
                TrackingIdType: "FEDEX",
                TrackingNumber: MasterTrackingId,
              };
              var dca = {
                ShipTimestamp: new Date(date.getTime()).toISOString(),
                DropoffType: "REGULAR_PICKUP",
                ServiceType: FedexLabledata.servicename,
                PackagingType: PackagingType,
                TotalWeight: {
                  Units: "LB",
                  Value: Number(FedexLabledata.totalweight).toString(),
                },
                TotalInsuredValue: {
                  Currency: currencyType,
                  Amount:
                    FedexLabledata.totalinsuredvalue == 0
                      ? "0"
                      : Number(FedexLabledata.totalinsuredvalue).toString(),
                },
                Shipper: Shipper,
                Recipient: Recipient,
                ShippingChargesPayment: {
                  PaymentType: "SENDER",
                  Payor: {
                    ResponsibleParty: {
                      AccountNumber:
                        newcntrcode === "CA"
                          ? secrets.FedexCAAccountNumber
                          : secrets.FedexAccountNumber,
                    },
                  },
                },
                SpecialServicesRequested: {
                  SpecialServiceTypes: "ELECTRONIC_TRADE_DOCUMENTS",
                },
                CustomsClearanceDetail: CustomsClearanceDetail,
                LabelSpecification: {
                  LabelFormatType: "COMMON2D",
                  ImageType: "PDF",
                  LabelStockType: ShipmentData.LabelSpecification,
                },
                RateRequestTypes: "ACCOUNT",
                MasterTrackingId: mastertrack,
                PackageCount: PackageCount.toString(),
                RequestedPackageLineItems: RequestedPackageLineItems,
              };
              RequestedShipment = dca;
            }
          }

          console.log("RequestedPackageLineItems = ", RequestedShipment);
          console.log(
            "RequestedPackageLineItems = ",
            RequestedShipment.RequestedPackageLineItems
          );

          var params = {
            WebAuthenticationDetail: WebAuthenticationDetail,
            ClientDetail: ClientDetail,
            Version: Version,
            RequestedShipment: RequestedShipment,
          };
          console.log("payloadforchina...", params);

          let client;
          try {
            client = await new Promise((resolve, reject) => {
              soap.createClient(url, (error, client) => {
                if (error) {
                  console.log(" soap.createClient error", error);
                  return reject({
                      success: false,
                      message: "SOAP client creation error",
                      error: error,
                  });
                }
                resolve(client);
              });
            });
          } catch (soapClientError) {
            console.error("Error creating SOAP client:", soapClientError);
            throw {
                success: false,
                message: "Failed to create SOAP client.",
                error: soapClientError,
            };
          }

          const result = await new Promise((resolve, reject) => {
            client.processShipment(params, (error, result) => {
              if (error) {
                console.log("client.processShipment error", error);
                return reject({
                    success: false,
                    message: "FedEx processShipment error",
                    error: error,
                });
              }
              resolve(result);
            });
          });

          if (
            result.HighestSeverity === "ERROR" ||
            result.HighestSeverity === "WARNING"
          ) {
            let errorMessage = "FedEx returned an error: ";
            if (result.Notifications && Array.isArray(result.Notifications)) {
              errorMessage += result.Notifications.map(
                (notification) => notification.Message
              ).join(", ");
            } else if (result.Notifications) {
              errorMessage += result.Notifications.Message;
            }
            throw { // Throw the error so fedexLabel can catch it
                success: false,
                message: errorMessage,
                fedexResponse: result,
            };
          }

          // Generate individual PDF label and upload to GCS
          const fileName =
            result.CompletedShipmentDetail.MasterTrackingId.TrackingNumber +
            "-" +
            index +
            ".pdf";
          const tempFilePath = path.join(os.tmpdir(), fileName);
          const pdfBuffer = Buffer.from(
            result.CompletedShipmentDetail.CompletedPackageDetails[0].Label
              .Parts[0].Image,
            "base64"
          );
          fs.writeFileSync(tempFilePath, pdfBuffer);
          const gcsPath = await uploadToGCS(
            tempFilePath,
            `FedexPrepaidLabel/${fileName}`
          );
          const gcsFileUrl = await getGCSFileUrl(gcsPath);
          LinkArray.push({ link: gcsFileUrl, index: index }); // Add to LinkArray for merging later
          fs.unlinkSync(tempFilePath);

          // For multi-package scenarios, DO NOT call executeDatabaseOperations here
          // It will be called only once after merging
          if (PackageCount === 1) {
            // Single package: perform database operations immediately
            const dbResult = await executeDatabaseOperations(
              sequelize,
              FedexLabledata,
              ShipmentData,
              result,
              fileName,
              `gs://${bucketName}/FedexPrepaidLabel/${fileName}`,
              gcsFileUrl,
              false // It's a single label, not merged
            );

            return {
              success: true,
              message: "FedEx label generated successfully",
              trackingNumber: result.CompletedShipmentDetail.MasterTrackingId.TrackingNumber,
              fedexResult: result,
              attachmentData: dbResult.attachmentData,
              FedexLabel: dbResult.FedexLabel,
            };
          } else {
            // Multi-package: only return the FedEx result without DB operations
            // DB operations will be performed once after merging in fedexLabel function
            return {
              success: true,
              message: "Individual FedEx label generated.",
              trackingNumber: result.CompletedShipmentDetail.MasterTrackingId.TrackingNumber,
              fedexResult: result, // Return the full FedEx result for master tracking
              gcsFileUrl: gcsFileUrl, // Include this for potential future use
              fileName: fileName, // Include this for potential future use
            };
          }

    } catch (error) {
      console.error("Error in CreateFedexLable:", error);
      // Re-throw to be caught by fedexLabel's Promise.all
      throw {
        success: false,
        message: error.message || "An error occurred during FedEx label creation for a package.",
        error: error,
      };
    }
}

async function getGCSFileUrl(gcsPath) {
  try {
    return gcsPath.replace("gs://", "https://storage.googleapis.com/");
  } catch (error) {
    console.error("Error reading file: ", error);
    return null;
  }
}

export { fedexLabel, getGCSFileUrl };