import { Sequelize } from "sequelize";
import createSequelizeInstance from "../config/dbConnection.js";
import moment from "moment";
import nodemailer from "nodemailer";
import bcrypt from "bcrypt";
import mg from "nodemailer-mailgun-transport";
import soap from "soap";
import path from "path";
import async from "async";
import _ from "lodash";
import CryptoJS from "crypto-js";
// import {common} from '../utils/common.js';
import { formatRateDate } from "../utils/common.js";
import { currentDateTimeFormat } from "../utils/common.js";
// var url = path.join(__dirname, "./../wsdl", "RateService_v31.wsdl");
import * as dotenv from "dotenv";
dotenv.config();
// import path from 'path';
import { fileURLToPath } from "url";

const _filename = fileURLToPath(import.meta.url);
const _dirname = path.dirname(_filename);

const url = path.join(_dirname, "./../../wsdl", "RateService_v31.wsdl");

// console.log("URL = ",url);

import { SecretManagerServiceClient } from "@google-cloud/secret-manager";
import { log } from "util";
const client = new SecretManagerServiceClient();

let fetchedSecrets = null;
let initPromise = null;

// Helper to get secret value from GCP Secret Manager
async function getSecretValue(secretName) {
  try {
    // console.log(`Accessing secret version: ${secretName}`);
    const [version] = await client.accessSecretVersion({
      name: secretName,
    });
    const payload = version.payload.data.toString('utf8');
    // console.log(`Successfully accessed secret version: ${secretName}`);
    return payload;
  } catch (error) {
    console.error(`Error accessing secret version ${secretName}:`, error);
    throw new Error(`Failed to access secret: ${secretName}. Check permissions and secret existence.`);
  }
}

// Helper to parse the key-value string from the secret
const parseKeyValueString = (secretString) => {
  const config = {};
  if (!secretString) {
    console.warn('Warning: Received empty secret string for parsing.');
    return config;
  }
  const lines = secretString.split(/\r?\n/);
  for (const line of lines) {
    const trimmedLine = line.trim();
    // Skip empty lines and comments
    if (!trimmedLine || trimmedLine.startsWith('#')) continue;
    const delimiterIndex = trimmedLine.indexOf('=');
    if (delimiterIndex > 0) {
      const key = trimmedLine.substring(0, delimiterIndex).trim();
      let value = trimmedLine.substring(delimiterIndex + 1).trim();
      // Remove surrounding quotes if present
      if (value.length >= 2 && value.startsWith('"') && value.endsWith('"')) {
        value = value.substring(1, value.length - 1);
      }
       if (value.length >= 2 && value.startsWith("'") && value.endsWith("'")) {
         value = value.substring(1, value.length - 1);
       }
      config[key] = value;
    } else if (trimmedLine) { 
      console.warn(`Warning: Skipping malformed line in secret (no '=' found or key empty): "${trimmedLine.substring(0, 50)}${trimmedLine.length > 50 ? '...' : ''}"`);
    }
  }
  return config;
};

// Function to initialize secrets (fetches only once)
async function initializeSecretsInternal() {
    // console.log("Initializing secrets...");
    const GCP_PROJECT_ID = process.env.GCP_PROJECT_ID;
    const USER_SERVICE_SECRET_ID = process.env.GCP_SECRET_KEY; 

    if (!GCP_PROJECT_ID) {
        throw new Error('FATAL: GCP_PROJECT_ID environment variable is not set.');
    }
    if (!USER_SERVICE_SECRET_ID) {
        throw new Error('FATAL: GCP_SECRET_KEY environment variable is not set.');
    }

    const secretName = `projects/${GCP_PROJECT_ID}/secrets/${USER_SERVICE_SECRET_ID}/versions/latest`;
    const secretString = await getSecretValue(secretName);
    const secretData = parseKeyValueString(secretString);

    // console.log('Parsed secret keys:', Object.keys(secretData));

    // Ensure to include all required keys, including Fedex related ones
    const requiredKeys = ['FedexCAKey', 'FedexCAPassword', 'FedexCAAccountNumber', 'FedexCAMeterNumber', 'FedexKey', 'FedexPassword', 'FedexAccountNumber', 'FedexMeterNumber'];
    const missingKeys = requiredKeys.filter(key => !(key in secretData) || !secretData[key]);

    if (missingKeys.length > 0) {
        throw new Error(`FATAL: Missing required keys in secret manager data: ${missingKeys.join(', ')}`);
    }

    fetchedSecrets = {
        FedexCAKey: secretData.FedexCAKey,
        FedexCAPassword: secretData.FedexCAPassword,
        FedexCAAccountNumber: secretData.FedexCAAccountNumber,
        FedexCAMeterNumber: secretData.FedexCAMeterNumber,
        FedexKey: secretData.FedexKey,
        FedexPassword: secretData.FedexPassword,
        FedexAccountNumber: secretData.FedexAccountNumber,
        FedexMeterNumber: secretData.FedexMeterNumber,
    };
    return fetchedSecrets;
}

// Public function to get secrets, handles lazy initialization
async function getSecrets() {
    if (fetchedSecrets) {
        return fetchedSecrets; 
    }
    if (!initPromise) {
        initPromise = initializeSecretsInternal();
    }
    return await initPromise;
} 

const getFedexRatesData = async (inputData) => {
  try {
    const sequelize = await createSequelizeInstance();
    const secrets = await getSecrets(); 
    var getQuoteData = [];
    const fedexRes = await getFedexData(inputData, secrets); 
    console.log("FEDEX///", fedexRes);
    var FromCountry = JSON.parse(inputData.quoteData.UpsData.FromCountry);
let upsRes = "";
      let DHLRes = "";
    let bombinofedxRes;
    var RowData = [];
    if (
      fedexRes.HighestSeverity !== "SUCCESS" &&
      fedexRes.HighestSeverity !== "NOTE"
    ) {
      var ErrorDetail = fedexRes.Notifications;
      if (ErrorDetail.length) {
        var obj = {
          Service_Type: "Fedex Error",
          Rates: 0.0,
          MainServiceName: "FedEx",
          Delivery_Date: ErrorDetail[0].Message,
          STATUS: 1,
        };
      } else {
        var obj = {
          Service_Type: "Fedex Error",
          Rates: 0.0,
          MainServiceName: "FedEx",
          Delivery_Date: ErrorDetail.Message,
          STATUS: 1,
        };
      }
      RowData.push(obj);
    }

    if (
      upsRes.Fault &&
        bombinofedxRes.HighestSeverity !== "SUCCESS" &&
        bombinofedxRes.HighestSeverity !== "NOTE" &&
        fedexRes.HighestSeverity !== "SUCCESS" &&
        fedexRes.HighestSeverity !== "NOTE" &&
        !DHLRes
    ) {
      resolve(RowData);
    } else {
      var ToCountry = JSON.parse(inputData.quoteData.UpsData.ToCountry);
      console.log("ToCountry.CountryCode.toLowerCase() .....", bombinofedxRes);
      let mainres = await showRateReply(fedexRes, inputData);
      console.log("mainres = ", mainres);

      for (var i = 0; i < mainres.length; i++) {
        console.log("i = ", mainres[i]);
        if (FromCountry.CountryName == "India") {
          mainres[i].Rates = mainres[i].Rates * 87;
          mainres[i].BaseP = mainres[i].BaseP * 87;
        } else if (FromCountry.CountryName == "Canada") {
          mainres[i].Rates = mainres[i].Rates * 1.44;
          mainres[i].BaseP = mainres[i].BaseP * 1.44;
        } else {
          mainres[i].Rates = mainres[i].Rates;
          mainres[i].BaseP = mainres[i].BaseP;
        }

        console.log("i after = ", mainres[i]);
      }

      //console.log("main res...", mainres);
      return mainres;
    }
  } catch (error) {
    throw error;
  }
};

async function getFedexData(data, secrets) { // Add secrets as a parameter
  try {
    var PackagingType, DropoffType;
    var date = currentDateTimeFormat();
    var packdata2 = "";
    if (data.quoteData.PackageType == "Envelope") {
      PackagingType = "FEDEX_ENVELOPE";
      packdata2 = "ENV";
    } else {
      PackagingType = "YOUR_PACKAGING";
      packdata2 = "BOX";
    }

    if (data.quoteData.IsPickUp == true) {
      DropoffType = "REGULAR_PICKUP";
    } else {
      DropoffType = "REGULAR_PICKUP";
    }

    var FedexData = data.quoteData.UpsData;
    var FromCountry = JSON.parse(FedexData.FromCountry);
    var ToCountry = JSON.parse(FedexData.ToCountry);

    var currencyCode =
      FromCountry.CountryCode.toLowerCase() === "in" ? "INR" : "USD";

    var cntryCode = FromCountry.CountryCode;
    var newcntrcode = "";
    if (cntryCode == "CA" && packdata2 == "ENV") {
      newcntrcode = "CA";
    } else {
      newcntrcode = "US";
    }

    // Use secrets from Secret Manager
    var WebAuthenticationDetail = {
      UserCredential: {
        Key:
          newcntrcode == "CA" ? secrets.FedexCAKey : secrets.FedexKey,
        Password:
          newcntrcode == "CA"
            ? secrets.FedexCAPassword
            : secrets.FedexPassword,
      },
    };

    // console.log("dataPack2 = ", WebAuthenticationDetail.UserCredential);

    var ClientDetail = {
      AccountNumber:
        newcntrcode == "CA"
          ? secrets.FedexCAAccountNumber
          : secrets.FedexAccountNumber,
      MeterNumber:
        newcntrcode == "CA"
          ? secrets.FedexCAMeterNumber
          : secrets.FedexMeterNumber,
    };

    console.log("dataPack2 = ", ClientDetail);

    var fromAddressObj = {
      StreetLines: [""],
      City:
        FromCountry.IsUpsCity == 1
          ? FedexData.FromUPSCity.value
          : FromCountry.CountryCode == "US"
          ? FedexData.FromCity
          : "" || "",
      StateOrProvinceCode: FedexData.FromStateProvinceCode || "",
      PostalCode: FromCountry.IsUpsCity == 0 ? FedexData.FromZipCode : "" || "",
      CountryCode: FromCountry.CountryCode || "",
    };

    var toAddressObj = {
      StreetLines: [""],
      // "City": (ToCountry.IsFedexCity == 1) ? FedexData.ToFedExCity.value : (ToCountry.CountryCode == 'US') ? FedexData.ToCity : "" || "",
      City:
        ToCountry.IsFedexCity == 1 &&
        FedexData.ToFedExCity != null &&
        FedexData.ToFedExCity != undefined
          ? FedexData.ToFedExCity.value
          : FedexData.ToCity != null
          ? FedexData.ToCity
          : "",
      StateOrProvinceCode:
        ToCountry.IsFedexCity == 1 ? "" : FedexData.ToStateProvinceCode || "",
      PostalCode: ToCountry.IsFedexCity == 0 ? FedexData.ToZipCode : "" || "",
      CountryCode: ToCountry.CountryCode || "",
      Residential: data.quoteData.IsResidencial,
    };

    var Version = {
      ServiceId: "crs",
      Major: "31",
      Intermediate: "0",
      Minor: "0",
    };

    var Shipper = {
      Contact: {
        CompanyName: "SFL",
        PhoneNumber: "",
      },
      Address: fromAddressObj,
    };

    var Recipient = {
      Contact: {
        CompanyName: "SFL",
        PhoneNumber: "",
      },
      Address: toAddressObj,
    };

    var RequestedPackageLineItems = [];
    console.log("check333 = ", data.quoteData.PackageDetails.length);

    if (
      data.quoteData.PackageDetails.length == 1 &&
      data.quoteData.PackCount > 1
    ) {
      console.log("Here in if");
      for (var j = 0; j < data.quoteData.PackCount; j++) {
        var packagedata = {
          GroupPackageCount: 1,
          InsuredValue: {
            Currency: "USD",
            Amount: data.quoteData.InsuredValues[0].toString(),
          },
          Weight: {
            Units: data.quoteData.SelectedWeightType
              ? data.quoteData.SelectedWeightType
              : "LB",
            //  Units: "LB",
            Value: data.quoteData.Weight[0].toString(),
          },
          Dimensions: {
            Length: data.quoteData.DimeL[0].toString(),
            Width: data.quoteData.DimeW[0].toString(),
            Height: data.quoteData.DimeH[0].toString(),
            Units: data.quoteData.SelectedWeightType === "KG" ? "CM" : "IN",
          },
        };

        RequestedPackageLineItems.push(packagedata);
      }
    } else {
      console.log("IN ELSE");

      for (var j = 0; j < data.quoteData.PackageDetails.length; j++) {
        if (data.quoteData.PackageDetails[j].PackageNumber > 1) {
          // console.log("data.quoteData.PackageDetails[j]. = ",data.quoteData.PackageDetails[j])
          for (
            var k = 0;
            k < data.quoteData.PackageDetails[j].PackageNumber;
            k++
          ) {
            //console.log("Test Demo = ",data.quoteData.Weight)
            var packagedata = {
              GroupPackageCount: 1,
              InsuredValue: {
                Currency: "USD",
                Amount: data.quoteData.InsuredValues[0].toString(),
              },

              Weight: {
                Units: data.quoteData.SelectedWeightType
                  ? data.quoteData.SelectedWeightType
                  : "LB",
                //  Units: "LB",
                Value:
                  data.quoteData.PackageDetails[j].PackageWeight.toString(),
              },
              Dimensions: {
                Length:
                  data.quoteData.PackageDetails[j].PackageLength.toString(),
                Width: data.quoteData.PackageDetails[j].PackageWidth.toString(),
                Height:
                  data.quoteData.PackageDetails[j].PackageHeight.toString(),
                Units: data.quoteData.SelectedWeightType === "KG" ? "CM" : "IN",
              },
            };

            RequestedPackageLineItems.push(packagedata);
          }
          //console.log("RequestedPackageLineItems123 = ",RequestedPackageLineItems);
        } else {
          var packagedata = {
            GroupPackageCount:
              data.quoteData.PackageDetails[j].PackageNumber.toString(),
            InsuredValue: {
              Currency: "USD",
              Amount: data.quoteData.InsuredValues[j].toString(),
            },
            Weight: {
              Units: data.quoteData.SelectedWeightType
                ? data.quoteData.SelectedWeightType
                : "LB",
              //  Units: "LB",
              Value: data.quoteData.Weight[j].toString(),
            },
            Dimensions: {
              Length: data.quoteData.DimeL[j].toString(),
              Width: data.quoteData.DimeW[j].toString(),
              Height: data.quoteData.DimeH[j].toString(),
              Units: data.quoteData.SelectedWeightType === "KG" ? "CM" : "IN",
            },
          };

          RequestedPackageLineItems.push(packagedata);
        }
      }
    }

    var params = {
      WebAuthenticationDetail: WebAuthenticationDetail,
      ClientDetail: ClientDetail,
      Version: Version,
      ReturnTransitAndCommit: true,
      RequestedShipment: {
        ShipTimestamp: data.quoteData.ShipDate,
        DropoffType: DropoffType,
        PackagingType: PackagingType,
        TotalWeight: {
          Units: data.quoteData.SelectedWeightType
            ? data.quoteData.SelectedWeightType
            : "LB",
          //  Units: "LB",
          Value: data.quoteData.TotalWeight.toString(),
        },
        TotalInsuredValue: {
          Currency: "USD",
          ///Amount: "2",
          Amount: data.quoteData.TotalInsuredValues.toString(),
        },
        Shipper: Shipper,
        Recipient: Recipient,
        ShippingChargesPayment: {
          PaymentType: "SENDER",
          Payor: {
            ResponsibleParty: {
              AccountNumber:
                newcntrcode == "CA"
                  ? secrets.FedexCAAccountNumber
                  : secrets.FedexAccountNumber,
            },
          },
        },

        RateRequestTypes: "LIST",
        PackageCount: data.quoteData.PackCount,

        RequestedPackageLineItems,
      },
    };

    return new Promise((resolve, reject) => {
      soap.createClient(url, (error, client) => {
        if (error) {
          reject(error);
        } else {
          client.getRates(params, (error, result) => {
            if (error) {
              reject(error);
            } else {
              resolve(result);
            }
          });
        }
      });
    });
  } catch (error) {
    throw error;
  }
}

async function showRateReply(fedexResponse, data) {
  return new Promise(async (resolve, reject) => {
    var FromCountry = JSON.parse(data.quoteData.UpsData.FromCountry);
    var ToCountry = JSON.parse(data.quoteData.UpsData.ToCountry);
    var TotalchargableWeight = 0;
    var FinalCount = 0;
    var FWeight = 0;
    var DimeWeight = 0;
    var OverSize = 0;
    var Dimension = 0;
    var Fpickup = 0;
    var TotalInsuredValue = 0;
    var objShowRateDetails = {};
    var dtRate = [];
    var dtRate1 = [];
    // console.log("Test = ", bomBinofedxResponse);

    for (var i = 0; i < data.quoteData.PackageDetails.length; i++) {
      var chargableWeight = 0;
      var PackageData = data.quoteData.PackageDetails[i];

      FinalCount = FinalCount + 1;

      if (
        PackageData.PackageWeight !== "" &&
        PackageData.PackageLength !== "" &&
        PackageData.PackageWidth !== "" &&
        PackageData.PackageHeight !== ""
      ) {
        if (FromCountry.CountryCode == "US" && ToCountry.CountryCode == "US") {
          chargableWeight = Math.ceil(
            (parseFloat(PackageData.PackageLength) *
              parseFloat(PackageData.PackageWidth) *
              parseFloat(PackageData.PackageHeight)) /
              166
          );
        } else if (
          FromCountry.CountryCode == "IN" &&
          ToCountry.CountryCode == "US"
        ) {
          chargableWeight = Math.ceil(
            parseFloat(chargableWeight) / parseFloat("2.2")
          );
        } else {
          chargableWeight = Math.ceil(
            (parseFloat(PackageData.PackageLength) *
              parseFloat(PackageData.PackageWidth) *
              parseFloat(PackageData.PackageHeight)) /
              139
          );
        }

        if (parseFloat(PackageData.PackageWeight) > chargableWeight) {
          TotalchargableWeight =
            TotalchargableWeight + parseFloat(PackageData.PackageWeight);
        } else {
          TotalchargableWeight = TotalchargableWeight + chargableWeight;
        }
      }
    }

    for (var k = 0; k < FinalCount; k++) {
      if (parseFloat(data.quoteData.Weight[k]) > 70) {
        FWeight += 1;
      }
      if (FromCountry.CountryCode == "US" && ToCountry.CountryCode == "US") {
        DimeWeight = Math.ceil(
          (parseFloat(data.quoteData.DimeL[k]) *
            parseFloat(data.quoteData.DimeW[k]) *
            parseFloat(data.quoteData.DimeH[k])) /
            166
        );
      } else if (
        FromCountry.CountryCode == "IN" &&
        ToCountry.CountryCode == "US"
      ) {
        DimeWeight = Math.ceil(parseFloat(DimeWeight) / parseFloat("2.2"));
      } else {
        DimeWeight = Math.ceil(
          (parseFloat(data.quoteData.DimeL[k]) *
            parseFloat(data.quoteData.DimeW[k]) *
            parseFloat(data.quoteData.DimeH[k])) /
            139
        );
      }

      if (DimeWeight > 100 && DimeWeight <= 130) {
        Dimension += 1;
      } else if (DimeWeight > 130) {
        OverSize += 1;
      }
    }

    if (data.quoteData.IsPickUp == true && FromCountry.CountryCode != "IN") {
      var PickupCount = 0;
      PickupCount = parseInt(data.quoteData.PackageDetailsCount);
      if (PickupCount > FinalCount) {
        Fpickup = PickupCount;
      } else {
        Fpickup = FinalCount;
      }
    } else {
      Fpickup = 0;
    }

    if (
      data.quoteData.EnvelopeWeightLBSText != "" &&
      data.quoteData.PackageDetailsText == "1" &&
      TotalchargableWeight == 0
    ) {
      if (data.quoteData.PackageType == "Envelope") {
        objShowRateDetails.objWeight = parseFloat("0.5");
        objShowRateDetails.PackageType = "Envelope";
        if (data.quoteData.Weight[0] == null) {
          data.quoteData.Weight[0] = "0.5";
        }
      } else {
        objShowRateDetails.PackageType = "Pakage";
        objShowRateDetails.objWeight = parseFloat(
          data.quoteData.EnvelopeWeightLBSText
        );
        if (data.quoteData.Weight[0] == null) {
          data.quoteData.Weight[0] = data.quoteData.EnvelopeWeightLBSText;
        }
      }
    } else {
      if (data.quoteData.PackageType == "Envelope") {
        objShowRateDetails.objWeight = parseFloat("0.5");
        objShowRateDetails.PackageType = "Envelope";
      } else {
        objShowRateDetails.objWeight = TotalchargableWeight;
        objShowRateDetails.PackageType = "Pakage";
      }
    }

    if (TotalInsuredValue > 0) {
      var StartValue = 0;
      var EndValue = 0;
      var k = 0;
      for (var j = 1; j < j + 1; j++) {
        StartValue = k * 100 + 1;
        EndValue = j * 100;
        if (StartValue <= TotalInsuredValue && TotalInsuredValue <= EndValue) {
          TotalInsuredValue = EndValue;
          break;
        }
        k = j;
      }
    }

    var num = 1;

    if (
      fedexResponse &&
      (fedexResponse.HighestSeverity === "SUCCESS" ||
        (fedexResponse.HighestSeverity === "WARNING" &&
          fedexResponse.RateReplyDetails) ||
        fedexResponse.HighestSeverity === "NOTE")
    ) {
      var RatedShipment = fedexResponse.RateReplyDetails;
      console.log("FedexFromCountry = ");
      var FedexFromCountry = JSON.parse(data.quoteData.UpsData.FromCountry);
      console.log("FedexFromCountry = ", FedexFromCountry);
      var FedexToCountry = JSON.parse(data.quoteData.UpsData.ToCountry);
      var datapackType = JSON.parse(data.quoteData.EnvelopeWeightLBSText);
      console.log("datapackType = ", datapackType);
      console.log(
        "data.quoteData.SelectedWeightType = ",
        data.quoteData.WeightType
      );
      var weiType = data.quoteData.WeightType;
      var identical = data.quoteData.identical;
      var PackCount = data.quoteData.PackCount;

      console.log("weiType = ", identical);

      var delhiveryRate = 0;

      if (RatedShipment.length) {
        for (var i = 0; i < RatedShipment.length; i++) {
          var Rate = {};
          Rate.ID = num;
          Rate.Service_Type = RatedShipment[i].ServiceType;

          if (
            fedexResponse.HighestSeverity === "SUCCESS" &&
            RatedShipment[i].RatedShipmentDetails[0].RatedPackages &&
            RatedShipment[i].ServiceType != "FEDEX_GROUND" &&
            RatedShipment[i].ServiceType != "GROUND_HOME_DELIVERY"
          ) {
            var demRate =
              RatedShipment[i].RatedShipmentDetails[0].RatedPackages[0]
                .PackageRateDetail.NetCharge.Amount;

            var telRate = demRate + delhiveryRate;

            console.log("demRate = ", demRate, "telRate = ", telRate);

            Rate.Rates = telRate;

            Rate.BaseCharge =
              RatedShipment[
                i
              ].RatedShipmentDetails[0].RatedPackages[0].PackageRateDetail.NetFreight.Amount;
          } else if (
            RatedShipment[i].RatedShipmentDetails[0].ShipmentRateDetail
          ) {
            var demRate =
              RatedShipment[i].RatedShipmentDetails[0].ShipmentRateDetail
                .TotalNetCharge.Amount;
            var telRate = demRate + delhiveryRate;
            console.log("demRate = ", demRate, "telRate = ", telRate);
            Rate.Rates = telRate;

            var disCar =
              RatedShipment[i].RatedShipmentDetails[0].ShipmentRateDetail
                .TotalBaseCharge.Amount;

            var RatestoDisFuel =
              RatedShipment[i].RatedShipmentDetails[0].ShipmentRateDetail
                .FuelSurchargePercent;

            var FinalDiscounts = (disCar * RatestoDisFuel) / 100;

            FinalDiscounts =
              FinalDiscounts +
              RatedShipment[i].RatedShipmentDetails[0].ShipmentRateDetail
                .Surcharges[0].Amount.Amount;

            Rate.BaseCharge =
              RatedShipment[i].RatedShipmentDetails[0].ShipmentRateDetail
                .TotalBaseCharge.Amount + FinalDiscounts;

            var totalValue =
              ((Rate.BaseCharge - Rate.Rates) / Rate.BaseCharge) * 100;

            Rate.DiscountPercentage = totalValue.toFixed(2);
          } else {
            Rate.Rates = 0;
            Rate.BaseCharge = 0;
          }
          Rate.Delivery_Date = formatRateDate(
            moment(RatedShipment[i].DeliveryTimestamp).format(
              "MM/DD/YYYY hh:mm:ss a"
            )
          );
          Rate.AgentCode = data.quoteData.AgentCode;
          Rate.Status = 1;
          dtRate.push(Rate);

          num++;
        }
      } else {
        var Rate = {};
        var demRate =
          RatedShipment.RatedShipmentDetails[0].RatedPackages[0]
            .PackageRateDetail.NetCharge.Amount;
        var telRate = demRate + delhiveryRate;
        console.log("demRate = ", demRate, "telRate = ", telRate);
        Rate.ID = num;
        Rate.Service_Type = RatedShipment.ServiceType;
        Rate.Rates = telRate;
        RatedShipment.RatedShipmentDetails[0].RatedPackages[0].PackageRateDetail
          .NetCharge.Amount;
        Rate.Delivery_Date = formatRateDate(
          moment(RatedShipment.DeliveryTimestamp).format(
            "MM/DD/YYYY hh:mm:ss a"
          )
        );
        Rate.AgentCode = data.quoteData.AgentCode;
        Rate.Status = 1;
        Rate.BaseCharge =
          RatedShipment.RatedShipmentDetails[0].RatedPackages[0].PackageRateDetail.NetFreight.Amount;
        dtRate.push(Rate);
        num++;
      }
    }

    objShowRateDetails.RateTable = dtRate;
    //console.log("bobmino.....", objShowRateDetails);

    if (FromCountry.CountryCode == "IN" && ToCountry.CountryCode == "US") {
      objShowRateDetails.IU_Status = "Yes";
      objShowRateDetails.IU_Carrier = null;
      objShowRateDetails.IU_DropZipCode = data.quoteData.UpsData.ToZipCode;
    } else {
      objShowRateDetails.IU_Status = "No";
      objShowRateDetails.IU_Carrier = null;
      objShowRateDetails.IU_DropZipCode = "";
    }
    objShowRateDetails.objDimension = parseInt(Dimension);
    objShowRateDetails.objInsured = TotalInsuredValue;
    objShowRateDetails.objOverSize = parseInt(OverSize);
    objShowRateDetails.objOverWeight = parseInt(FWeight);
    objShowRateDetails.objPickup = parseInt(Fpickup);
    objShowRateDetails.AgentCode = data.quoteData.AgentCode;
    objShowRateDetails.CountryCode = ToCountry.CountryCode;
    objShowRateDetails.Pick_Country_Code = FromCountry.CountryCode;
    objShowRateDetails.Economy = null;
    objShowRateDetails.IsPickUp = data.quoteData.IsPickUp;
    objShowRateDetails.IsResidencial = data.quoteData.IsResidencial;
    objShowRateDetails.WeightType = data.quoteData.WeightType;

    var fromCountryData = JSON.parse(data.quoteData.UpsData.FromCountry);
    if (fromCountryData.CountryName == "India") {
      objShowRateDetails.fromCountry = "341168f9-1ba3-4511-8c84-aa3bdd3cf349";
    } else if (fromCountryData.CountryName == "United States") {
      objShowRateDetails.fromCountry = "9257e508-9115-4600-aa5b-79f21cc59820";
    } else if (fromCountryData.CountryName == "Canada") {
      objShowRateDetails.fromCountry = "b91d30fc-2c19-4d09-9f51-d108affa901b";
    } else {
      objShowRateDetails.fromCountry = 0;
    }

    let calculateRate = await CalculateRate(objShowRateDetails);

    if (calculateRate.length > 0) {
      var finalRatesData = calculateRate[0];
    } else {
      var finalRatesData = calculateRate;
    }

    // var newFinalArray = []

    // for (let index = 0; index < finalRatesData.length; index++) {
    //     // const element = array[index];

    //     var obgNew = {
    //         Service_Type: finalRatesData[i].r_service_type,
    //         Rates: finalRatesData[i].r_rates,
    //         Delivery_Date: finalRatesData[i].r_delivery_date,
    //         AgentCode: finalRatesData[i].r_agentcode,
    //         STATUS: finalRatesData[i].r_status,
    //         BaseP: finalRatesData[i].r_basep
    //     }

    //     newFinalArray.push(obgNew)

    // }

    // console.log("obgNew = ",newFinalArray);

    var identical = data.quoteData.identical;
    var PackCount = data.quoteData.PackCount;

    var FedexFromCountry = JSON.parse(data.quoteData.UpsData.FromCountry);

    var FedexToCountry = JSON.parse(data.quoteData.UpsData.ToCountry);
    var datapackType = JSON.parse(data.quoteData.EnvelopeWeightLBSText);

    var weiType = data.quoteData.WeightType;
    var identical = data.quoteData.identical;
    var PackCount = data.quoteData.PackCount;

    var ratestoAdd = 0;

    if (FedexFromCountry.CountryName == "India") {
      if (identical == "yes") {
        if (weiType == "KG") {
          datapackType = datapackType;
        } else {
          datapackType = datapackType * 0.45;
        }

        var datapackTypeRate = datapackType * 30;

        var delhiveryRate = 550;

        if (datapackTypeRate > 550) {
          delhiveryRate = datapackTypeRate;
        }
        delhiveryRate = delhiveryRate / 87;
        ratestoAdd = delhiveryRate;
      } else {
        delhiveryRate = 0;
        ratestoAdd = delhiveryRate;
      }
    } else if (FedexFromCountry.CountryName == "United States") {
      if (identical == "yes") {
        var datapackTypeRate = PackCount * 15;
        var delhiveryRate = 0;
        delhiveryRate = datapackTypeRate;
        ratestoAdd = delhiveryRate;
      } else {
        delhiveryRate = 0;
        ratestoAdd = delhiveryRate;
      }
    } else {
      delhiveryRate = 0;
      ratestoAdd = delhiveryRate;
    }

    for (var i = 0; i < finalRatesData.length; i++) {
      if (
        finalRatesData[i].Service_Type != "DHL" ||
        finalRatesData[i].Service_Type != "SFL Saver"
      ) {
        finalRatesData[i].Rates = finalRatesData[i].Rates + ratestoAdd;
      }
    }

    if (
      fedexResponse != "" &&
      fedexResponse.HighestSeverity !== "SUCCESS" &&
      fedexResponse.HighestSeverity === "WARNING" &&
      fedexResponse.Notifications.length &&
      fedexResponse.HighestSeverity !== "NOTE"
    ) {
      var ErrorDetail = fedexResponse.Notifications;
      if (ErrorDetail.length) {
        var obj = {
          Service_Type: "Fedex Error",
          Rates: 0.0,
          MainServiceName: "FedEx",
          Delivery_Date: ErrorDetail[0].Message,
          AgentCode: data.quoteData.AgentCode,
          STATUS: 1,
          IsError: true,
          BaseP: 0.0,
        };
      } else {
        var obj = {
          Service_Type: "Fedex Error",
          Rates: 0.0,
          MainServiceName: "FedEx",
          Delivery_Date: ErrorDetail.Message,
          AgentCode: data.quoteData.AgentCode,
          STATUS: 1,
          IsError: true,
          BaseP: 0.0,
        };
      }
      finalRatesData.push(obj);
    }
    finalRatesData = _.orderBy(finalRatesData, ["Rates"]);
    try {
      const sequelize = await createSequelizeInstance();
      let arr = [];
      let newarr = []

      for (const obj of finalRatesData) {
        console.log("obj = ",obj)
        if(obj.Rates>0){
          const comparePass = `SELECT * FROM spgetserviceinfo(:YourServiceName);`;
          const resultPass = await sequelize.query(comparePass, {
            replacements: { YourServiceName: obj.Service_Type },
            type: Sequelize.QueryTypes.SELECT,
          });

          console.log("resultPass[0] = ",resultPass)
          console.log("resultPass[0] = ",resultPass[0])
          var newres = resultPass[0];

          if (newres) {
            obj.ServiceDisplayName = newres.displayname;
            obj.ServiceType = newres.servicetype;
            obj.MainServiceName = newres.mainservicename;
          } else {
            return reject(new Error("Something went wrong"));
          }
          arr.push(obj);
        }else{
          newarr.push(obj);
        }
        

        
      }

      arr = _.orderBy(arr, [obj => parseFloat(obj.Rates.replace(/[^\d\.]/g, ''))], ['asc']);
      if(newarr.length>0){
        arr.push(newarr)
      }
      // console.log("arr2 = ", arr);
      resolve(arr);
    } catch (error) {
      reject(error);
    }

  });
}

// async function CalculateRate(objShowRateDetails) {
const CalculateRate = async (objShowRateDetails) => {
  return new Promise(async (resolve, reject) => {
    // const db = connection;
    if (
      objShowRateDetails.RateTable.length > 0 &&
      objShowRateDetails.RateTable != undefined
    ) {
      let i = 1;
      var temquery = "";
      async.each(objShowRateDetails.RateTable, function (obj, callback) {
        if (i === 1) {
          if (i === objShowRateDetails.RateTable.length) {
            temquery = `INSERT INTO TempRateTable(Service_Type, Rates, Delivery_Date,AgentCode,Status,BaseCharge) VALUES ('${obj.Service_Type}','${obj.Rates}','${obj.Delivery_Date}','${obj.AgentCode}','${obj.Status}','${obj.BaseCharge}');`;
          } else {
            temquery = `INSERT INTO TempRateTable(Service_Type, Rates, Delivery_Date,AgentCode,Status,BaseCharge) VALUES ('${obj.Service_Type}','${obj.Rates}','${obj.Delivery_Date}','${obj.AgentCode}','${obj.Status}','${obj.BaseCharge}'),`;
          }
        } else if (i === objShowRateDetails.RateTable.length) {
          temquery += ` ('${obj.Service_Type}','${obj.Rates}','${obj.Delivery_Date}','${obj.AgentCode}','${obj.Status}','${obj.BaseCharge}'); `;
        } else {
          temquery += ` ('${obj.Service_Type}','${obj.Rates}','${obj.Delivery_Date}','${obj.AgentCode}','${obj.Status}','${obj.BaseCharge}'), `;
        }
        i++;
      });
      console.log("temquery = ", temquery);
      const sequelize = await createSequelizeInstance();
      console.log("objShowRateDetails = ", objShowRateDetails);

      const comparePass = `SELECT   r_service_type AS "Service_Type", r_rates AS "Rates", r_delivery_date AS "Delivery_Date", r_agentcode AS "AgentCode", r_status AS "STATUS", r_basep AS "BaseP" from public.calculaterate(:objpickup,:objoverweight,:objoversize,:objdimension,:objinsured,:objweight,:ragentcode,:countrycode,:iu_status,:iu_carrier,:iu_dropzipcode,:pick_country_code,:packagetype,:pcountry,:tempquery )`;
      const resultPass = await sequelize.query(comparePass, {
        replacements: {
          objpickup: objShowRateDetails.objPickup,
          objoverweight: objShowRateDetails.objOverWeight,
          objoversize: objShowRateDetails.objOverSize,
          objdimension: objShowRateDetails.objDimension,
          objinsured: objShowRateDetails.objInsured,
          objweight: objShowRateDetails.objWeight,
          ragentcode: "",
          countrycode: objShowRateDetails.CountryCode,
          iu_status: objShowRateDetails.IU_Status,
          iu_carrier: objShowRateDetails.IU_Carrier,
          iu_dropzipcode: objShowRateDetails.IU_DropZipCode,
          pick_country_code: objShowRateDetails.Pick_Country_Code,
          packagetype: objShowRateDetails.PackageType,
          pcountry: objShowRateDetails.fromCountry,
          tempquery: temquery,
        },
        type: Sequelize.QueryTypes.RAW,
      });

      if (resultPass) {
        // console.log("CalculateRate = Result = ", resultPass);
        resolve(resultPass);
      } else {
        reject(err);
      }
    } else {
      var result = [];
      resolve(result);
    }
  });
};

export { getFedexRatesData, getSecrets };