import createSequelizeInstance from "../config/dbConnection.js";
import moment from 'moment';
import soap from 'soap';
import path from 'path';
import { fileURLToPath } from 'url';
import { Storage } from '@google-cloud/storage';
import fs from 'fs';
import os from 'os';
import { getSecrets } from './getQuotesService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const url = path.join(__dirname, '../../wsdl/lib/wsdl', 'UploadDocumentService_v19.wsdl');
let HeaderLogoImage = "file://" + path.join(__dirname, "/logo.png");
HeaderLogoImage = path.normalize(HeaderLogoImage);

let SignImage = "file://" + path.join(__dirname, "/sign.png");
SignImage = path.normalize(SignImage);

import htmlToPDF from 'html-pdf';
const storage = new Storage({
    keyFilename: path.join(__dirname, '../config/tough-bearing-450518-f8-be272d75f65d.json'),
    projectId: 'tough-bearing-450518'
});
const bucketName = process.env.BucketName;

async function fedexETD(mainData) {
    try {
        const inpdata = mainData.Second_data;
        const trackingNumber = mainData.trackingNumber;
        if (!inpdata || !trackingNumber) {
            throw new Error("Invalid input data: Second_data or trackingNumber is missing.");
        }
        const commercialItems = inpdata.commercial || [];
        const packDiff = 5 - commercialItems.length

        let tot = 0;
        for (const item of commercialItems) {
            tot += parseInt(item.quantity || 0);
        }

        if (packDiff > 0) {
            for (let i = 0; i < packDiff; i++) {
                commercialItems.push({
                    shipments_tracking_number: "",
                    package_number: "",
                    content_description: "",
                    quantity: "",
                    value_per_qty: "",
                    total_value: "",
                    CommercialInvoiceID: "",
                    net_weight: "",
                });
            }
        }

        const html = generateCommercialInvoiceHTML(mainData);
        const fileName = trackingNumber + `.pdf`;

        const options = {
            format: "A4"
        };
        const pdfPath = await generatePdf(html, fileName, options);

        const binaryPdf = await pdfToBase64(pdfPath);
        if (!binaryPdf) {
            throw new Error("Failed to convert PDF to base64");
        }

        const uploadResult = await uploadDocumentToFedex(binaryPdf, fileName, inpdata);
        return uploadResult;

    } catch (err) {
        console.error("Error in fedexETD:", err);
        throw err
    }
}

async function generatePdf(html, fileName, options) {
    return new Promise((resolve, reject) => {
        const tempFilePath = path.join(os.tmpdir(), fileName);
        htmlToPDF.create(html, options).toFile(tempFilePath, async (err, res) => {
            if (err) {
                console.error("Error generating PDF:", err);
                reject(err);
                return;
            }

            try {
                const gcsPath = await uploadToGCS(tempFilePath, `FedexCommercialInvoice/${fileName}`);
                fs.unlinkSync(tempFilePath);
                resolve(gcsPath);
            } catch (uploadError) {
                console.error("Error uploading to GCS:", uploadError);
                reject(uploadError);
            }
        });
    });
}


async function uploadToGCS(filePath, destination) {
    try {
        const bucket = storage.bucket(bucketName);
        await bucket.upload(filePath, {
            destination: destination,
            gzip: true,
        });
        console.log(`PDF generated and uploaded to GCS: gs://${bucketName}/${destination}`);
        return `gs://${bucketName}/${destination}`;
    } catch (error) {
        console.error("Error uploading to GCS:", error);
        throw error;
    }
}

async function pdfToBase64(pdfPath) {
    try {
        const extractedFilePath = pdfPath.replace(`gs://${bucketName}/`, "");
        const bucket = storage.bucket(bucketName);
        const file = bucket.file(extractedFilePath);
        const [content] = await file.download();
        const base64String = content.toString('base64');
        return base64String;
    } catch (error) {
        console.error("Error converting PDF to base64:", error);
        return null;
    }
}


async function uploadDocumentToFedex(binaryPdf, fileName, inpdata) {
    try {
        const secrets = await getSecrets();
        const WebAuthenticationDetail = {
            UserCredential: {
                Key: secrets.FedexKey,
                Password: secrets.FedexPassword,
            },
        };
        const Version = {
            ServiceId: "cdus",
            Major: "19",
            Intermediate: "0",
            Minor: "0",
        };
        const ClientDetail = {
            AccountNumber: secrets.FedexAccountNumber,
            MeterNumber: secrets.FedexMeterNumber,
        };
        const Documents = {
            DocumentType: "COMMERCIAL_INVOICE",
            FileName: fileName,
            DocumentContent: binaryPdf,
        };
        const OriginCountryCode = inpdata.from_address.fromCountryCode;
        const DestinationCountryCode = inpdata.to_address.toCountryCode;

        const params = {
            WebAuthenticationDetail: WebAuthenticationDetail,
            ClientDetail: ClientDetail,
            Version: Version,
            OriginCountryCode: OriginCountryCode,
            DestinationCountryCode: DestinationCountryCode,
            Documents: Documents,
        };
        const client = await soap.createClientAsync(url);
        const result = await client.uploadDocumentsAsync(params);
        const data = {
            result: result[0].DocumentStatuses,
            Path: `gs://${bucketName}/FedexCommercialInvoice/${fileName}`,
            mainres: result[0],
        };
        return data;
    } catch (err) {
        console.error("Error uploading document to FedEx:", err);
        throw err;
    }
}


function generateCommercialInvoiceHTML(mainData) {
    const inpdata = mainData.Second_data;
    const tot = inpdata.commercial.reduce((sum, item) => sum + parseInt(item.quantity || 0), 0);

    return `<!doctype html>
    <html lang="en">
      <head>
        <!-- Required meta tags -->
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,400;0,500;0,700;1,400;1,500;1,700&display=swap" rel="stylesheet">
        <title>SFL Worldwide</title>
        <style type="text/css">
          tr , td { margin: 0; padding: 0; }
          body { font-size: 10px; font-family: 'Roboto', sans-serif; color: #000; font-style: normal !important; }
          table { border-collapse: collapse; }
        </style>
      </head>
      <body>
    
        <table style="width: 100%; max-width: 100%; margin: 0 auto;">
          <tr>
            <td>
              <table style="width: 100%;">
                <tr>
                  <td>
                   
                    <a href="#"><img style="width: 100px;" src=${HeaderLogoImage} alt="" /></a><br>
                    
                  </td>
                  <td style="width: 50%; text-align: right; font-style: normal !important; ">
                    3364 Garden Brook Drive, Farmers Branch, Texas – 75234<br>
                    Phone: 972-255-7447 Fax: 877-741-3134<br>
                    contact@sflworldwide.com | www.SFLWorldwide.com
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 5px 0; text-align: center;">
              <h3 style="margin: 0; font-size:15px; color: #000; font-weight: bold;">Commercial Invoice</h3>
            </td>
          </tr>
          <tr>
            <td>
              <table style="width: 100%; max-width: 100%;">
                <tr>
                  <td style="border: 1px solid #000; padding: 0 5px 0px 5px; width: 50%; vertical-align: top;">
                    <table style="width: 100%; max-width: 100%;">
                      <tr>
                        <td>EXPORTER:</td>
                        <td>Tax ID#:</td>
                      </tr>
                      <tr>
                        <td >Contact Name: ${inpdata.from_address.contact_name || ''}</td>
                        <td>Phone No.: ${inpdata.from_address.phone1 || ''}</td>
                      </tr>
                      <tr>
                        <td colspan="2">E-Mail: ${inpdata.from_address.email || ''}</td>
                      </tr>
                      <tr>
                        <td colspan="2">
                          Company Name/Address:<br>
                          ${inpdata.from_address.company_name || ''}<br>
                          ${inpdata.from_address.address_1 || ''} ${inpdata.from_address.address_2 || ''} ${inpdata.from_address.address_3 || ''}<br><br>
                          ${inpdata.from_address.city_name || ''} ${inpdata.from_address.zip_code || ''}
                        </td>
                      </tr>
                      <tr>
                        <td colspan="2">Country/Territory: ${inpdata.from_address.country_name || ''}</td>
                      </tr>
                      <tr>
                        <td colspan="2">Parties to Transaction:</td>
                      </tr>
                      <tr>
                        <td>
                          <table style="width: 100%;">
                            <tr>
                              <td>
                                <span style="border: 1px solid #000;padding: 0 3px; width: 12px; height: 15px; display: inline-block;vertical-align: middle;"></span> Related
                              </td>
                              <td>
                                <span style="border: 1px solid #000;padding: 0 3px; width: 12px; height: 15px; display: inline-block;vertical-align: middle;">✘</span> Non-Related
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>      
                  </td>
                  <td style="border: 1px solid #000; padding: 0 5px; width: 50%; vertical-align: top;">
                    <table style="width: 100%; max-width: 100%;">
                      <tr>
                        <td>Ship Date:<br>${moment(inpdata.pickup_date).format("Do MMMM, YYYY")}</td>
                      </tr>
                      <tr>
                        <td>Air Waybill No. / Tracking No.: ${inpdata.TrackingNumber || ''}<br></td>
                      </tr>
                      <tr>
                        <td>
                          <table style="width: 100%;">
                            <tr>
                              <td style="width: 50%;">Invoice No.:</td>
                              <td style="width: 50%;">Purchase Order No.:</td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td style="height: 10px;"></td>
                      </tr>
                      <tr>
                        <td>
                          <table style="width: 100%;">
                            <tr>
                              <td style="width: 50%;">Payment Terms:</td>
                              <td style="width: 50%;">Bill of Lading:</td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td style="height: 10px;"></td>
                      </tr>
                      <tr>
                        <td>
                          Purpose of Shipment:<br>
                          GIFT
                        </td>
                      </tr>
                    </table>      
                  </td>
                </tr>
                <tr>
                  <td style="border: 1px solid #000; padding: 0 5px; width: 50%; vertical-align: top;">
                    <table style="width: 100%; max-width: 100%;">
                      <tr>
                        <td>CONSIGNEE:</td>
                        <td>Tax ID#:</td>
                      </tr>
                      <tr>
                        <td>Contact Name: ${inpdata.to_address.contact_name || ''}</td>
                        <td>Phone No.: ${inpdata.to_address.phone1 || ''}</td>
                      </tr>
                      <tr>
                        <td colspan="2">E-Mail: ${inpdata.to_address.email || ''}</td>
                      </tr>
                      <tr>
                        <td colspan="2">
                          Company Name/Address:<br>
                          ${inpdata.to_address.company_name || ''}<br>
                          ${inpdata.to_address.address_1 || ''} ${inpdata.to_address.address_2 || ''}<br>
                          ${inpdata.to_address.address_3 || ''}<br><br>
                          ${inpdata.to_address.city_name || ''} ${inpdata.to_address.zip_code || ''}
                        </td>
                      </tr>
                      <tr>
                        <td colspan="2">Country/Territory: ${inpdata.to_address.country_name || ''}</td>
                      </tr>
                    </table>      
                  </td>
                  <td style="border: 1px solid #000; padding: 0 5px; width: 50%; vertical-align: top;">
                    <table style="width: 100%; max-width: 100%;">
                      <tr>
                        <td>
                          SOLD TO / IMPORTER (if different from Consignee):<br>
                          <span style="border: 1px solid #000;padding: 0 3px; width: 12px; height: 15px; display: inline-block;vertical-align: middle;">✘</span> Same as CONSIGNEE:
                        </td>
                      </tr>
                      <tr>
                        <td style="height: 10px;"></td>
                      </tr>
                      <tr>
                        <td>Tax ID#:</td>
                      </tr>
                      <tr>
                        <td style="height: 10px;"></td>
                      </tr>
                      <tr>
                        <td>
                          Company Name/Address:
                        </td>
                      </tr>
                      <tr>
                        <td style="height: 10px;"></td>
                      </tr>
                      <tr>
                        <td>
                          Country/Territory: INDIA
                        </td>
                      </tr>
                    </table>      
                  </td>
                </tr>
                <tr>
                  <td colspan="2" style="border: 1px solid #000; padding: 0 5px 0px 5px; vertical-align: top;">
                    <table style="width: 100%;">
                      <tr>
                        <td colspan="3">If there is a designated broker for this shipment, please provide contact information.</td>
                      </tr>
                      <tr>
                        <td style="height: 4px;"></td>
                      </tr>
                      <tr>
                        <td>Name of Broker</td>
                        <td>Tel. No.</td>
                        <td>Contact Name</td>
                      </tr>
                      <tr>
                        <td style="height: 4px;"></td>
                      </tr>
                      <tr>
                        <td colspan="3">
                          Duties and Taxes Payable by  
                          <span style="border: 1px solid #000;padding: 0 3px; width: 12px; height: 15px; display: inline-block;vertical-align: middle;"></span> Exporter 
                          <span style="border: 1px solid #000;padding: 0 3px; width: 12px; height: 15px; display: inline-block;vertical-align: middle;">✘</span> Consignee
                          <span style="border: 1px solid #000;padding: 0 3px; width: 12px; height: 15px; display: inline-block;vertical-align: middle;"></span> Other
                          If Other, please specify
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td>
              <table style="width: 100%;">
              <tr>
                  <td style="border: 1px solid #000; text-align: center; padding: 0px 3px;">No. of<br>Packages</td>
                  <td style="border: 1px solid #000; text-align: center; padding: 0px 3px;">No. of<br>Units</td>
                  <td style="border: 1px solid #000; text-align: center; padding: 0px 3px;">Net Weight<br>(LBS / KGS)</td>
                  <td style="border: 1px solid #000; text-align: center; padding: 0px 3px;">Unit of<br>Measure</td>
                  <td style="border: 1px solid #000; text-align: center; padding: 0px 3px;">Description of Goods</td>
                  <td style="border: 1px solid #000; text-align: center; padding: 0px 3px;">Harmonized<br>Tariff Number</td>
                  <td style="border: 1px solid #000; text-align: center; padding: 0px 3px;">Country of<br>Manufacture</td>
                  <td style="border: 1px solid #000; text-align: center; padding: 0px 3px;">Unit<br>Value</td>
                  <td style="border: 1px solid #000; text-align: center; padding: 0px 3px;">Total<br>Value</td>
                </tr>
                ${inpdata.commercial.map(value => `
                  <tr>
                    <td style="border: 1px solid #000; text-align: center; padding: 0px 3px; height: 15px;">${value.package_number || ''}</td>
                    <td style="border: 1px solid #000; text-align: center; padding: 0px 3px; height: 15px;">${value.quantity || ''}</td>
                    <td style="border: 1px solid #000; text-align: right; padding: 0px 3px; height: 15px;">${value.net_weight || ''}</td>
                    <td style="border: 1px solid #000; text-align: center; padding: 0px 3px; height: 15px;">${value.package_number ? "PCS" : ""}</td>
                    <td style="border: 1px solid #000; text-align: left; padding: 0px 3px; height: 15px;">${value.content_description || ''}</td>
                    <td style="border: 1px solid #000; text-align: center; padding: 0px 3px; height: 15px;"></td>
                    <td style="border: 1px solid #000; text-align: center; padding: 0px 3px; height: 15px;">${value.package_number ? "US" : ""}</td>
                    <td style="border: 1px solid #000; text-align: right; padding: 0px 3px;height: 15px; ">${value.value_per_qty || ''}</td>
                    <td style="border: 1px solid #000; text-align: right; padding: 0px 3px; height: 15px;">${value.total_value || ''}</td>
                  </tr>
                `).join('')}
                <tr>
                  <td style="border: 1px solid #000; text-align: center; padding: 0px 3px;">Total<br>Pkgs</td>
                  <td style="border: 1px solid #000; text-align: center; padding: 0px 3px;">Total<br>Units</td>
                  <td style="border: 1px solid #000; border-right: none; text-align: center; padding: 0px 3px;">Total Net<br>Weight</td>
                  <td style="border: 1px solid #000; border-left: none; text-align: center; padding: 0px 3px;">(Indicate<br>LBS/KGS)</td>
                  <td style="border: 1px solid #000; text-align: center; border-right: none; padding: 0px 3px;">Total Gross<br>Weight</td>
                  <td style="border: 1px solid #000; text-align: center; border-left: none; padding: 0px 3px;">(Indicate<br>LBS/KGS)</td>
                  <td style="border: 1px solid #000; text-align: left; padding: 0px 3px; vertical-align: top;" rowspan="2">Terms of Sale: FCA</td>
                  <td style="border: 1px solid #000; text-align: left; padding: 0px 3px;">Subtotal:</td>
                  <td style="border: 1px solid #000; text-align: right; padding: 0px 3px;">${inpdata.TotalCommercialvalue || ''}</td>
                </tr>
                <tr>
                  <td style="border: 1px solid #000; text-align: center; padding: 0px 3px;">${inpdata.packages.length || ''}</td>
                  <td style="border: 1px solid #000; text-align: center; padding: 0px 3px;">${tot}</td>
                  <td style="border: 1px solid #000; border-right: none; text-align: center; padding: 0px 3px;" colspan="2">${inpdata.TotalWeight || ''} LB</td>
                  <td style="border: 1px solid #000; text-align: center; border-right: none; padding: 0px 3px;" colspan="2">${inpdata.TotalWeight || ''} LB</td>
                  <td style="border: 1px solid #000; text-align: left; padding: 0px 3px;">Insurance:</td>
                  <td style="border: 1px solid #000; text-align: right; padding: 0px 3px;">${inpdata.shipments.total_insured_value || ''}</td>
                </tr>
                <tr>
                  <td colspan="7" style="border: 1px solid #000; padding: 0px 3px; text-align: left; vertical-align: top" rowspan="2">
                    Special Instructions:<br>${mainData.trackingNumber || ''}
                  </td>
                  <td style="border: 1px solid #000; text-align: left; padding: 0px 3px;">Freight:</td>
                  <td style="border: 1px solid #000; text-align: right; padding: 0px 3px;">0.00</td>
                </tr>
                <tr>
                  <td style="border: 1px solid #000; text-align: left; padding: 0px 3px; height: 15px;">Packing:</td>
                  <td style="border: 1px solid #000; text-align: right; padding: 0px 3px; height: 15px;">0.00</td>
                </tr>
                <tr>
                  <td colspan="7" style="border: 1px solid #000; padding: 0px 3px; text-align: left; vertical-align: top" rowspan="2">
                    Declaration Statement(s):
                  </td>
                  <td style="border: 1px solid #000; text-align: left; padding: 0px 3px; height: 15px;">Handling:</td>
                  <td style="border: 1px solid #000; text-align: right; padding: 0px 3px; height: 15px;">0.00</td>
                </tr>
                <tr>
                  <td style="border: 1px solid #000; text-align: left; padding: 0px 3px; height: 15px;">Other:</td>
                  <td style="border: 1px solid #000; text-align: right; padding: 0px 3px; height: 15px;">0.00</td>
                </tr>
                <tr>
                  <td colspan="7" style="border: 1px solid #000; padding: 0px 3px; text-align: left; vertical-align: top">
                    I declare that all the information contained in this invoice to be true and correct.
                  </td>
                  <td style="border: 1px solid #000; text-align: left; padding: 0px 3px;">Invoice Total:</td>
                  <td style="border: 1px solid #000; text-align: right; padding: 0px 3px;">${inpdata.TotalCommercialvalue || ''}</td>
                </tr>
                <tr>
                  <td colspan="7" style="border: 1px solid #000; padding: 0px 3px; text-align: left; vertical-align: top">
                    Originator or Name of Company Representative if the invoice is being completed on behalf of a company or individual:<br>
                    praveen madakasira ramakrishna
                  </td>
                  <td style="border: 1px solid #000; text-align: left; padding: 0px 3px;">Currency Code:</td>
                  <td style="border: 1px solid #000; text-align: center; padding: 0px 3px;">USD</td>
                </tr>
                <tr>
                  <td colspan="2" style="border: 1px solid #000; border-right: none; padding: 0px 3px; text-align: left; vertical-align: bottom">Signature / Title / Date:</td>
                  <td colspan="5" style="border: 1px solid #000; border-left: none; border-right: none; padding: 0px 3px; text-align: left; vertical-align: top"><a href="#"><img style="width: 100px;" src=${SignImage} alt="" /></a><br></td>
                  <td colspan="2" style="borgin-top: rder: 1px solid #000; border-left: none; padding: 0px 3px; text-align: right; vertical-align: bottom">${moment().format("Do MMMM, YYYY")}</td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
    
      </body>
    </html>`;
}


async function insertFedexETDData(inpdata, userId) {
    try {
        const sequelize = await createSequelizeInstance();
        const spData = {
            insertUpdate: inpdata.insertUpdate || "Insert",  
            id: inpdata.id || null, 
            sfltrackingnumber: inpdata.SFLTrackingNumber,
            linenumber: inpdata.LineNumber,
            documentproducer: inpdata.DocumentProducer,
            documenttype: inpdata.DocumentType,
            filename: inpdata.FileName,
            status: inpdata.Status,
            documentid: inpdata.DocumentId,
            path: inpdata.Path,
        };

        const pdata = JSON.stringify(spData); 

        const results = await sequelize.query(
            `CALL public.spaddupdateedtcommercialinvoice(:pdata, :puserid, :iuid)`, {  
                replacements: { 
                    pdata: pdata,
                    puserid: userId || null,
                    iuid: null   
                   
                },
                 type: sequelize.QueryTypes.RAW  ,   
                },
        );
        // console.log("insert result:", results);
        return results;

    } catch (error) {
        console.error("Error in insertFedexETDData:", error);
        throw error;
    }
}
// async function getEtdDetails(inpdata) {
//     try {
//         const sequelize = await createSequelizeInstance();
//         const [results, metadata] = await sequelize.query(`CALL GetEtdCommercialInvoiceDetails(?)`, {
//             replacements: [inpdata.trackingNumber]
//         });

//         if (Array.isArray(results) && results.length > 0) {
//             return results[0];
//         } else {
//             return null;
//         }
//     } catch (error) {
//         console.error("Error in getEtdDetails:", error);
//         throw error;
//     }
// }

// async function updateEtdDetails(inpdata) {
//     try {
//         const sequelize = await createSequelizeInstance();
//         const [checkResults, checkMetadata] = await sequelize.query(`SELECT * FROM EtdCommercialInvoice WHERE SFLTrackingNumber = ?`, {
//             replacements: [inpdata.SFLTrackingNumber]
//         });


//         if (checkResults && checkResults.length > 0) {
//             const [updateResults, updateMetadata] = await sequelize.query(
//                 `CALL UpdateEtdCommercialInvoice(?, ?, ?, ?, ?, ?, ?, ?)`, {
//                     replacements: [
//                         inpdata.SFLTrackingNumber,
//                         inpdata.etdUpdateData.LineNumber,
//                         inpdata.etdUpdateData.DocumentProducer,
//                         inpdata.etdUpdateData.DocumentType,
//                         inpdata.etdUpdateData.FileName,
//                         inpdata.etdUpdateData.Status,
//                         inpdata.etdUpdateData.DocumentId,
//                         inpdata.etdUpdateData.Path
//                     ]
//                 }
//             );
//             return updateResults;
//         } else {
//             const [insertResults, insertMetadata] = await sequelize.query(
//                 `CALL InsertEtdCommercialInvoice(?, ?, ?, ?, ?, ?, ?, ?)`, {
//                     replacements: [
//                         inpdata.ETDDocInsert.SFLTrackingNumber,
//                         inpdata.ETDDocInsert.LineNumber,
//                         inpdata.ETDDocInsert.DocumentProducer,
//                         inpdata.ETDDocInsert.DocumentType,
//                         inpdata.ETDDocInsert.FileName,
//                         inpdata.ETDDocInsert.Status,
//                         inpdata.ETDDocInsert.DocumentId,
//                         inpdata.ETDDocInsert.Path
//                     ]
//                 }
//             );
//             return insertResults;
//         }
//     } catch (error) {
//         console.error("Error in updateEtdDetails:", error);
//         throw error;
//     }
// }


async function getGCSFileUrl(gcsPath) {
    try {
        return gcsPath.replace("gs://", "https://storage.googleapis.com/");
    } catch (error) {
        console.error("Error reading file: ", error);
        return null;
    }

}

export { fedexETD, getGCSFileUrl };

// export { fedexETD, insertFedexETDData, getEtdDetails, updateEtdDetails, getGCSFileUrl };