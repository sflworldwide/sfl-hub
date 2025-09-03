import { Sequelize } from "sequelize";
import createSequelizeInstance from "../config/dbConnection.js";
import * as dotenv from "dotenv";
import { getSecrets } from "./userService.js";
import CryptoJS from "crypto-js";
dotenv.config();

const getUserDetailsBySearch = async (p_userdetails) => {
  try {
    const sequelize = await createSequelizeInstance(p_userdetails);

    const query = `SELECT * from  public.spgetuserlist(
:pname,
:pusername,
:pusertype,
:pemail,
:pcreatedon,
:paccountnumber,
:pmanagedby,
:pstatus
)`;
    const result = await sequelize.query(query, {
      replacements: {
        pname: p_userdetails.Name || null,
        pusername: p_userdetails.UserName || null,
        pusertype: p_userdetails.UserType || null,
        pemail: p_userdetails.Email || null,
        pcreatedon: p_userdetails.CreatedOn || null,
        paccountnumber: p_userdetails.paccountnumber || null,
        pmanagedby: p_userdetails.ManagedBy || null,
        pstatus: p_userdetails.Status || null,
        // vpersonid: null,
      },
      type: Sequelize.QueryTypes.RAW,
    });
    // const personID = result?.[0]?.[0]?.vpersonid || null;
    const resResult = result?.[0];
    return { resResult };
  } catch (error) {
    throw new Error("Error fetching person: " + error.message);
  }
};
const getUserDetailsById = async (p_userid) => {
  const secrets = await getSecrets();
  const SECRET_KEY = secrets.SECRET_KEY;
  try {
    const sequelize = await createSequelizeInstance(p_userid);

    const userDetailsQuery = `SELECT * FROM public.spgetuserdetailsdata(:p_userid, :p_entitytype);`;
    const userDetails = await sequelize.query(userDetailsQuery, {
      replacements: { p_userid: p_userid, p_entitytype: "Register" },
      type: Sequelize.QueryTypes.SELECT,
    });
    const personID = userDetails?.[0]?.vpersonid || null;

    const labelSpecQuery = `SELECT * FROM spgetlabelspecification();`;
    const labelSpec = await sequelize.query(labelSpecQuery, {
      type: Sequelize.QueryTypes.SELECT,
    });
    if (userDetails?.length > 0) {
      const selectedId = userDetails[0].selectedpapersize;

      const matchingSpec = labelSpec.find((spec) => spec.id === selectedId);

      const filteredUser = {
        userName: userDetails[0].loginid,
        email: userDetails[0].email,
        accountNumber: userDetails[0].accountnumber,
        managedByName: userDetails[0].managedbyname,
        managedBy: userDetails[0].managedby,
        companyName: userDetails[0].companyname,
        addressLine1: userDetails[0].addressline1,
        addressLine2: userDetails[0].addressline2,
        addressLine3: userDetails[0].addressline3,
        city: userDetails[0].city,
        state: userDetails[0].state,
        country: userDetails[0].countryname,
        zip: userDetails[0].zipcode,
        contactName: userDetails[0].contactname,
        contactPhone1: userDetails[0].phonenum1,
        contactPhone2: userDetails[0].phonenum2,
        paperdisplayname: matchingSpec?.paperdisplayname || null,
        paperorgname: matchingSpec?.paperorgname || null,
        name: userDetails[0].name,
        status: userDetails[0].status,
        UserType: userDetails[0].usertype,
        userTimezone: userDetails[0].usertimezone,
      };

      const userProfileDetails = {
        userdetailid: userDetails[0].userdetailid || "",
        userName:
          userDetails[0].loginid != "" && userDetails[0].loginid != null
            ? CryptoJS.AES.encrypt(
                userDetails[0].loginid.toString(),
                secrets.SECRET_KEY
              ).toString()
            : "",

        email:
          userDetails[0].email != "" && userDetails[0].email != null
            ? CryptoJS.AES.encrypt(
                userDetails[0].email.toString(),
                SECRET_KEY
              ).toString()
            : "",
        accountNumber:
          userDetails[0].accountnumber != "" &&
          userDetails[0].accountnumber != null
            ? CryptoJS.AES.encrypt(
                userDetails[0].accountnumber.toString(),
                SECRET_KEY
              ).toString()
            : "",
        managedByName:
          userDetails[0].managedbyname != null &&
          userDetails[0].managedbyname != ""
            ? CryptoJS.AES.encrypt(
                userDetails[0].managedbyname.toString(),
                SECRET_KEY
              ).toString()
            : "",
        managedBy:
          userDetails[0].managedby != null && userDetails[0].managedby != ""
            ? CryptoJS.AES.encrypt(
                userDetails[0].managedby.toString(),
                SECRET_KEY
              ).toString()
            : "",
        companyName:
          userDetails[0].companyname != "" && userDetails[0].companyname != null
            ? CryptoJS.AES.encrypt(
                userDetails[0].companyname.toString(),
                SECRET_KEY
              ).toString()
            : "",
        addressLine1: userDetails[0].addressline1 || "",
        AddressLine2: userDetails[0].addressline2 || "",
        addressLine3: userDetails[0].addressline3 || "",
        city: userDetails[0].city || "",
        state: userDetails[0].state || "",
        country: userDetails[0].countryname || "",
        zip: userDetails[0].zipcode || "",
        contactName:
          userDetails[0].contactname != "" && userDetails[0].contactname != null
            ? CryptoJS.AES.encrypt(
                userDetails[0].contactname.toString(),
                SECRET_KEY
              ).toString()
            : "",
        contactPhone1:
          userDetails[0].phonenum1 != "" && userDetails[0].phonenum1 != null
            ? CryptoJS.AES.encrypt(
                userDetails[0].phonenum1,
                SECRET_KEY
              ).toString()
            : "",
        contactPhone2:
          userDetails[0].phonenum2 != ""
            ? CryptoJS.AES.encrypt(
                userDetails[0].phonenum2,
                SECRET_KEY
              ).toString()
            : "",
        paperDisplayName: matchingSpec?.paperdisplayname || null,
        paperOrgName: matchingSpec?.paperorgname || null,
        name:
          userDetails[0].name != "" && userDetails[0].name != null
            ? CryptoJS.AES.encrypt(
                userDetails[0].name.toString(),
                SECRET_KEY
              ).toString()
            : "",
        status: userDetails[0].status || "",
        UserType:
          userDetails[0].usertype != "" && userDetails[0].usertype != null
            ? CryptoJS.AES.encrypt(
                userDetails[0].usertype.toString(),
                SECRET_KEY
              ).toString()
            : "",
      };
      return userProfileDetails;
      // return userDetails[0];
      // return filteredUser;
    } else {
      return { error: "User not found" };
    }
  } catch (error) {
    throw new Error("Error fetching data: " + error.message);
  }
};

const getProfileDetailsByPersonid = async (p_userid) => {
  const secrets = await getSecrets();
  const SECRET_KEY = secrets.SECRET_KEY;
  try {
    const sequelize = await createSequelizeInstance(p_userid);

    const userDetailsQuery = `SELECT * FROM public.spgetuserdetailsdata(:p_userid, :p_entitytype);`;
    const userDetails = await sequelize.query(userDetailsQuery, {
      replacements: { p_userid, p_entitytype: "Register" },
      type: Sequelize.QueryTypes.SELECT,
    });
    const personID = userDetails?.[0]?.vpersonid || null;

    console.log("getProfile:", userDetails);

    const labelSpecQuery = `SELECT * FROM spgetlabelspecification();`;
    const labelSpec = await sequelize.query(labelSpecQuery, {
      type: Sequelize.QueryTypes.SELECT,
    });
    if (userDetails?.length > 0) {
      const selectedId = userDetails[0].selectedpapersize;

      const matchingSpec = labelSpec.find((spec) => spec.id === selectedId);

      const filteredUser = {
        userName: userDetails[0].loginid,
        email: userDetails[0].email,
        accountNumber: userDetails[0].accountnumber,
        managedByName: userDetails[0].managedbyname,
        managedBy: userDetails[0].managedby,
        companyName: userDetails[0].companyname,
        addressLine1: userDetails[0].addressline1,
        addressLine2: userDetails[0].addressline2,
        addressLine3: userDetails[0].addressline3,
        city: userDetails[0].city,
        state: userDetails[0].state,
        country: userDetails[0].countryname,
        zip: userDetails[0].zipcode,
        contactName: userDetails[0].contactname,
        contactPhone1: userDetails[0].phonenum1,
        contactPhone2: userDetails[0].phonenum2,
        paperdisplayname: matchingSpec?.paperdisplayname || null,
        paperorgname: matchingSpec?.paperorgname || null,
      };
      //console.log("phone2:", userDetails[1].phonenum);
      const userProfileDetails = {
        userdetailid: userDetails[0].userdetailid || "",
        userName:
          userDetails[0].loginid != "" && userDetails[0].loginid != null
            ? CryptoJS.AES.encrypt(
                userDetails[0].loginid.toString(),
                secrets.SECRET_KEY
              ).toString()
            : "",

        email:
          userDetails[0].email != "" && userDetails[0].email != null
            ? CryptoJS.AES.encrypt(
                userDetails[0].email.toString(),
                SECRET_KEY
              ).toString()
            : "",
        accountNumber:
          userDetails[0].accountnumber != "" &&
          userDetails[0].accountnumber != null
            ? CryptoJS.AES.encrypt(
                userDetails[0].accountnumber.toString(),
                SECRET_KEY
              ).toString()
            : "",
        managedByName:
          userDetails[0].managedbyname != null &&
          userDetails[0].managedbyname != ""
            ? CryptoJS.AES.encrypt(
                userDetails[0].managedbyname.toString(),
                SECRET_KEY
              ).toString()
            : "",
        managedBy:
          userDetails[0].managedby != null && userDetails[0].managedby != ""
            ? CryptoJS.AES.encrypt(
                userDetails[0].managedby.toString(),
                SECRET_KEY
              ).toString()
            : "",
        companyName:
          userDetails[0].companyname != "" && userDetails[0].companyname != null
            ? CryptoJS.AES.encrypt(
                userDetails[0].companyname.toString(),
                SECRET_KEY
              ).toString()
            : "",
        addressLine1: userDetails[0].addressline1 || "",
        addressLine2: userDetails[0].addressline2 || "",
        addressLine3: userDetails[0].addressline3 || "",
        city: userDetails[0].city || "",
        state: userDetails[0].state || "",
        country: userDetails[0].countryname || "",
        zip: userDetails[0].zipcode || "",
        contactName:
          userDetails[0].contactname != "" && userDetails[0].contactname != null
            ? CryptoJS.AES.encrypt(
                userDetails[0].contactname.toString(),
                SECRET_KEY
              ).toString()
            : "",
        contactPhone1:
          userDetails[0].phonenum1 != "" && userDetails[0].phonenum1 != null
            ? CryptoJS.AES.encrypt(
                userDetails[0].phonenum1,
                SECRET_KEY
              ).toString()
            : "",
        contactPhone2:
          userDetails[0].phonenum2 != "" && userDetails[0].phonenum2 != null
            ? CryptoJS.AES.encrypt(
                userDetails[0].phonenum2,
                SECRET_KEY
              ).toString()
            : "",
        paperDisplayName: matchingSpec?.paperdisplayname || null,
        paperOrgName: matchingSpec?.paperorgname || null,
      };
      return userProfileDetails;
      // return userDetails[0];
    } else {
      return { error: "User not found" };
    }
  } catch (error) {
    throw new Error("Error fetching data: " + error.message);
  }
};

const UpdateProfile = async (updateData, userId) => {
  console.log("uuuuupdateData:", updateData);
  console.log("uuuuuserId:", userId);
  try {
    const toupdateData = {
      userdetailid: updateData.userdetailid,
      personid: updateData.personId,
      accountnumber: updateData.accountNumber,
      managedby: updateData.managedBy,
      companyname: updateData.companyName,
      addressline1: updateData.addressLine1,
      addressline2: updateData.addressLine2,
      addressline3: updateData.addressLine3,
      city: updateData.city,
      state: updateData.state,
      country: updateData.country,
      zipcode: updateData.zipCode,
      contactname: updateData.contactName,
      phonenumber1: updateData.phoneNumber1,
      phonenumber2: updateData.phoneNumber2,
      email: updateData.email,
      papersize: updateData.paperSize,
      // insertUpdate: "U",
      userstatus: updateData.userStatus || null,
      usertype: updateData.usertype || null,
      insertUpdate: "U",
    };
    const sequelize = await createSequelizeInstance();
    const query = `CALL public.spaddupdateuserdetails(:pdata, :puserid, :puserdetailid, :result_status);`;
    const pupdatedata = JSON.stringify(toupdateData);
    const result = await sequelize.query(query, {
      replacements: {
        pdata: pupdatedata,
        puserid: userId, // Assuming p_userid is part of updateData
        puserdetailid: null,
        result_status: null,
      },
      type: sequelize.QueryTypes.RAW,
    });
    const spResult = result?.[0]?.[0]; // First row of first result set

    return spResult;
  } catch (error) {
    throw new Error("Error updating data: " + error.message);
  }
};

const UpdateUserProfile = async (updateData, userId) => {
  try {
    const toupdateData = {
      userdetailid: updateData.userdetailid,
      personid: updateData.personid,
      accountnumber: updateData.accountNumber,
      managedby: updateData.managedBy,
      companyname: updateData.companyName,
      addressline1: updateData.addressLine1,
      addressline2: updateData.addressLine2,
      addressline3: updateData.addressLine3,
      city: updateData.city,
      state: updateData.state,
      country: updateData.country,
      zipcode: updateData.zipCode,
      contactname: updateData.contactName,
      phonenumber1: updateData.phoneNumber1,
      phoneNumber2: updateData.phoneNumber2,
      email: updateData.email,
      papersize: updateData.paperSize,
      userstatus: updateData.userStatus,
      usertype: updateData.userType,
      insertUpdate: "U",
    };
    const sequelize = await createSequelizeInstance();
    const query = `CALL public.spaddupdateuserdetails(:pdata, :puserid, :puserdetailid, :result_status);`;
    const pupdatedata = JSON.stringify(toupdateData);
    const result = await sequelize.query(query, {
      replacements: {
        pdata: pupdatedata,
        puserid: userId,
        puserdetailid: null,
        result_status: null,
      },
      type: sequelize.QueryTypes.RAW,
    });
    const spResult = result?.[0]?.[0]; // First row of first result set

    return spResult;
  } catch (error) {
    throw new Error("Error updating data: " + error.message);
  }
};
export {
  getUserDetailsBySearch,
  getUserDetailsById,
  getProfileDetailsByPersonid,
  UpdateProfile,
  UpdateUserProfile,
};
// CALL public.spaddupdateuserdetails('{"userdetailid":"0ed83f7c-38c8-47dd-b963-e57354f6fed3","personid":"75cecbc9-a178-4ade-9e14-f8060e7cbe30","managedby":"","companyname":"SFL","addressline1":"140","addressline2":"Bharathi nagar","addressline3":"Chitlapakam","city":"Chennai","state":"tamilnadu","country":"india","zipcode":"600028","contactname":"pooarasan","phonenumber1":" 96003 18735","email":"","papersize":"2","insertupdate":"U"}','75cecbc9-a178-4ade-9e14-f8060e7cbe30', null)

// CALL public.spaddupdateuserdetails('{"userdetailid":"0ed83f7c-38c8-47dd-b963-e57354f6fed3","personid":"75cecbc9-a178-4ade-9e14-f8060e7cbe30","managedby":"","companyname":"SFL","addressline1":"140","addressline2":"Bharathi nagar","addressline3":"Chitlapakam","city":"Chennai","state":"tamilnadu","country":"india","zipcode":"600028","contactname":"pooarasan","phonenumber1":" 96003 18735","email":"","papersize":"2","userstatus":"active",  "usertype":"employee","insertupdate":"U"}','75cecbc9-a178-4ade-9e14-f8060e7cbe30', null)
