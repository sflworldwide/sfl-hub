import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, Routes, Route } from "react-router-dom";
import axios from "axios";
import {
  api,
  encryptURL,
  getStateID,
  getUserIP,
  getUserDetails,
} from "../../../utils/api";
import { toast } from "react-hot-toast";
import Myshipment from "../myshipment/Myshipment";
import { useStyles } from "../../styles/MyshipmentStyle";

// MUI Components
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import MenuItem from "@mui/material/MenuItem";
import IconButton from "@mui/material/IconButton";
import AppBar from "@mui/material/AppBar";
import Menu from "@mui/material/Menu";
import ListIcon from "@mui/icons-material/List";
import useMediaQuery from "@mui/material/useMediaQuery";
import useTheme from "@mui/material/styles/useTheme";

// MUI Icons
import MenuIcon from "@mui/icons-material/Menu";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import FlightTakeoffIcon from "@mui/icons-material/FlightTakeoff";
import MoreVertIcon from "@mui/icons-material/MoreVert";

import Sidebar from "./Sidebar";
import SectionTabs from "./SectionTabs";
import PickupForm from "./PickupForm";
import Sender from "./Sender";
import Recipient from "./Recipient";
import Package from "./Package";
import ProfilePage from "./ProfilePage";
import { useShipmentContext } from "../../ShipmentContext";
import {
  Root,
  MainContent,
  AppBarBox,
  DesktopToggleBtn,
  MobileToggleBtn,
  ContentBox,
  IconBox,
  UsernameButton,
} from "../../styles/scheduleshipmentStyle";
import Myshipmentnew from "../myshipment/MyShipmentNew";
import CryptoJS from "crypto-js";
import ScheduleConfirmation from "../scheduleconfirmation/ScheduleConfirmation";
import GetRate from "../getrate/GetRate";

const Schedule = () => {
  const {
    fromDetails,
    toDetails,
    packageDetails,
    Giszip,
    Gresiszip,
    GshipmentType,
    isGetrate,
    setIsgetrate,
    updateFromDetails,
    updateToDetails,
    setPackageDetails,
    GsetisZip,
    GsetresisZip,
    GsetShipmentType,
  } = useShipmentContext();
  const navigate = useNavigate();
  const [edit, setEdit] = useState(false);
  const [confirmation, setConfirmation] = useState(false);
  const classes = useStyles();

  const {
    data: countries = [],
    isLoading: isCountriesLoading,
    isError: isCountriesError,
  } = useQuery({
    queryKey: ["countries"],
    queryFn: async () => {
      const res = await axios.get(`${api.BackendURL}/locations/getCountry`, {
        withCredentials: true,
      });
      const countryData = res.data?.user?.[0] || [];
      return countryData.map((country) => ({
        value: country.countrycode.toLowerCase(),
        label: country.countryname,
        countryid: country.countryid,
        iszipavailable: country.iszipavailable,
      }));
    },
    staleTime: 24 * 60 * 60 * 1000,
    retry: 2,
    onError: (error) => {
      console.error("Failed to fetch countries:", error);
      toast.error("Failed to load countries.");
    },
  });

  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };
  const handleprofile = () => {
    navigate("/admin/profile", { replace: true });
    setActiveModule("");
    setActiveTab("");
    handleMenuClose();
  };

  const handleLogout = () => {
    window.location.reload();
    navigate("/auth/login-page");
    sessionStorage.removeItem("user");
    sessionStorage.removeItem("PersonID");
    sessionStorage.clear();
    handleMenuClose();
  };

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [formData, setFormData] = useState({
    // Pickup
    shipmentType: "",
    fromCountry: "",
    toCountry: "",
    // Sender
    country: "",
    countrycode: "",
    countryId: "",
    iszip: Giszip ? Giszip : 1,
    companyName: "",
    contactName: "",
    addressLine1: "",
    addressLine2: "",
    addressLine3: "",
    zipCode: "",
    fromCity: "",
    state: "",
    phone1: "",
    phone2: "",
    email: "",
    needsPickup: "No - I Will Drop Off My Package",
    pickupDate: "",
    // Recipient
    recipientCountry: "",
    recipientcountrycode: "",
    recipientCountryId: "",
    resiszip: Gresiszip ? Gresiszip : 1,
    recipientCompanyName: "",
    recipientContactName: "",
    recipientAddressLine1: "",
    recipientAddressLine2: "",
    recipientAddressLine3: "",
    recipientZipCode: "",
    recipientCity: "",
    recipientState: "",
    recipientPhone1: "",
    recipientPhone2: "",
    recipientEmail: "",
    recipientLocationType: "Residential",
  });
  const [pickupErrors, setPickupErrors] = useState({});
  const [senderErrors, setSenderErrors] = useState({});
  const [recipientErrors, setRecipientErrors] = useState({});
  const [fromoldcountryid, setfromoldcountryid] = useState("");
  const [fromoldstateid, setfromoldstateid] = useState("");
  const [recipientoldcountryid, setrecipientoldcountryid] = useState("");
  const [recipientoldstateid, setrecipientoldstateid] = useState("");
  const [loginName, setLoginName] = useState("Unknown");
  const [userId, setUserId] = useState("");
  const [userOldid, setUserOldId] = useState("");
  const [userName, setUserName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [oldphone1, setoldphone1] = useState("");
  const [oldphone2, setoldphone2] = useState("");
  const [oldrecipientphone1, setoldrecipientphone1] = useState("");
  const [oldrecipientphone2, setoldrecipientphone2] = useState("");

  // Package tab
  const [packageType, setPackageType] = useState(
    toDetails.packageType || "package"
  );
  const [noOfPackages, setNoOfPackages] = useState(packageDetails.length);
  const [dutiesPaidBy, setDutiesPaidBy] = useState("Recipient");
  const [packageData, setPackageData] = useState(() =>
    packageDetails.length > 0
      ? packageDetails.map((pkg, index) => ({
          noOfPackages: index + 1,
          weight: pkg.weight || 0,
          length: pkg.length || 0,
          width: pkg.width || 0,
          height: pkg.height || 0,
          chargable_weight: pkg.chargeableWeight || 0,
          insured_value: pkg.insuredValue || 0,
        }))
      : [
          {
            noOfPackages: 1,
            weight: 0,
            length: 0,
            width: 0,
            height: 0,
            chargable_weight: 0,
            insured_value: 0,
          },
        ]
  );
  const [samecountry, setSamecountry] = useState(false);
  const [commercialInvoiceData, setCommercialInvoiceData] = useState([
    {
      packageNumber: "1",
      contentDescription: packageType === "Envelope" ? "Document" : "",
      quantity: 0,
      valuePerQty: 0,
    },
  ]);
  const [packageErrors, setPackageErrors] = useState({});
  const [managedBy, setManagedBy] = useState("");
  const [shippingId, setShippingId] = useState("");

  const fedexservice = JSON.parse(sessionStorage.getItem("service")) || "";

  useEffect(() => {
    const storedUser = JSON.parse(sessionStorage.getItem("user"));
    if (storedUser) {
      setLoginName(storedUser.name);
      setFormData((prev) => ({
        ...prev,
        contactName: storedUser.name,
        email: storedUser.email,
      }));
      setUserId(storedUser.personID);
      setUserName(storedUser.username);
      setAccountNumber(storedUser.account_number);
    }
    const storedPersonId = sessionStorage.getItem("PersonID");
    if (storedPersonId) {
      setUserOldId(storedPersonId);
    }
  }, []);

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      fromCountry: isGetrate && fromDetails.fromCountry,
      toCountry: isGetrate && toDetails.toCountry,
      shipmentType: isGetrate && GshipmentType,
      iszip: Giszip || 1,
      resiszip: Gresiszip || 1,
      zipCode: isGetrate &&fromDetails.fromZipCode,
      fromCity: isGetrate &&fromDetails.fromCity,
      state: isGetrate &&fromDetails.fromState,
      recipientCountry: isGetrate &&countries.find((c) => c.value === toDetails.toCountry)?.label || "",
      recipientZipCode: isGetrate &&toDetails.toZipCode,
      recipientCity: isGetrate &&toDetails.toCity,
      recipientState: isGetrate &&toDetails.toState,
      pickupDate: isGetrate &&toDetails.shipDate || "",
      recipientLocationType: isGetrate ? toDetails.residential === "Yes" ? "Residential" : "Commercial" : prev.recipientLocationType || "Residential"
    }));
    setPackageType(toDetails.packageType || "Package");
    const totalPackages = packageDetails.reduce(
    (sum, pkg) => sum + Number(pkg.packageNumber || 1), 0
  ) || 1;
  setNoOfPackages(totalPackages);
    setPackageData(
      packageDetails.length > 0
        ? packageDetails.map((pkg, index) => ({
            noOfPackages: Number(pkg.packageNumber) || index + 1,
            weight: pkg.weight || 0,
            length: pkg.length || 0,
            width: pkg.width || 0,
            height: pkg.height || 0,
            chargable_weight: pkg.chargeableWeight || 0,
            insured_value: pkg.insuredValue || 0,
          }))
        : [
            {
              noOfPackages: 1,
              weight: 0,
              length: 0,
              width: 0,
              height: 0,
              chargable_weight: 0,
              insured_value: 0,
            },
          ]
    );
//     setCommercialInvoiceData(
//   Array.from({ length: totalPackages }, (_, i) => ({
//     packageNumber: (i + 1).toString(),
//     contentDescription: packageType === "Envelope" ? "Document" : "",
//     quantity: 0,
//     valuePerQty: 0,
//   }))
// );
  }, [
    GshipmentType,
    Giszip,
    Gresiszip,
    fromDetails,
    toDetails,
    packageDetails,
    countries,
    isGetrate,
  ]);

  const GetrateResetData = () => {
    updateFromDetails({
      fromCountry: "us",
      fromZipCode: "",
      fromCity: "",
      fromState: "",
    });

    updateToDetails({
      toCountry: "us",
      toZipCode: "",
      toCity: "",
      toState: "",
      shipDate: new Date().toISOString().split("T")[0],
      residential: "No",
      packageType: "Package",
    });

    setPackageDetails([
      {
        packageNumber: "",
        weight: "",
        length: "",
        width: "",
        height: "",
        chargeableWeight: "",
        insuredValue: "",
      },
    ]);
    GsetisZip(0), GsetresisZip(0), GsetShipmentType("AIR");
  };
const splitPackageDataForOldSystem = (packageData, trackingNumber = "") => {
  // If packageData is empty, return a default package
  if (!packageData || packageData.length === 0) {
    return [{
      shipments_tracking_number: trackingNumber,
      PackageNumber: 1,
      weight: "0.00",
      unit_of_weight: "LBS",
      length: "0",
      width: "0",
      height: "0",
      TV: false,
      Crating: false,
      Repack: false,
      Stretch: false,
      chargable_weight: "0.00",
      insured_value: "0"
    }];
  }

  // Generate packages for each packageData entry
  let packageNumber = 1;
  const result = packageData.flatMap((pkg) => {
    const numPackages = Number(pkg.noOfPackages || 1);
    const weightPerPackage = (Number(pkg.weight || 0));
    const chargableWeightPerPackage = (Number(pkg.chargable_weight || 0) / numPackages).toFixed(2);

    return Array.from({ length: numPackages }, () => ({
      shipments_tracking_number: trackingNumber,
      PackageNumber: packageNumber++,
      weight: weightPerPackage,
      unit_of_weight: "LBS",
      length: Number(pkg.length || 0).toString(),
      width: Number(pkg.width || 0).toString(),
      height: Number(pkg.height || 0).toString(),
      TV: false,
      Crating: false,
      Repack: false,
      Stretch: false,
      chargable_weight: chargableWeightPerPackage,
      insured_value: Number(pkg.insured_value || 0).toString()
    }));
  });

  return result;
};

const splitPackageDataForNewSystem = (packageData) => {
  // If packageData is empty, return a default package
  if (!packageData || packageData.length === 0) {
    return [{
      noOfPackages: 1,
      weight: "0.00",
      unit_of_weight: "LBS",
      length: "0",
      width: "0",
      height: "0",
      TV: false,
      Crating: false,
      Repack: false,
      Stretch: false,
      chargable_weight: "0.00",
      insured_value: "0"
    }];
  }

  // Generate packages for each packageData entry
  let packageNumber = 1;
  const result = packageData.flatMap((pkg) => {
    const numPackages = Number(pkg.noOfPackages || 1);
    const weightPerPackage = (Number(pkg.weight || 0) );
    const chargableWeightPerPackage = (Number(pkg.chargable_weight || 0) / numPackages).toFixed(2);

    return Array.from({ length: numPackages }, () => ({
      noOfPackages: packageNumber++,
      weight: weightPerPackage,
      unit_of_weight: "LBS",
      length: Number(pkg.length || 0).toString(),
      width: Number(pkg.width || 0).toString(),
      height: Number(pkg.height || 0).toString(),
      TV: false,
      Crating: false,
      Repack: false,
      Stretch: false,
      chargable_weight: chargableWeightPerPackage,
      insured_value: Number(pkg.insured_value || 0).toString()
    }));
  });

  return result;
};

  const resetForm = () => {
    setFormData({
      shipmentType: "",
      fromCountry: "",
      toCountry: "",
      country: "",
      countrycode: "",
      countryId: "",
      iszip: 1,
      companyName: "",
      contactName: "",
      addressLine1: "",
      addressLine2: "",
      addressLine3: "",
      zipCode: "",
      fromCity: "",
      state: "",
      phone1: "",
      phone2: "",
      email: "",
      needsPickup: "No - I Will Drop Off My Package",
      pickupDate: "",
      recipientCountry: "",
      recipientcountrycode: "",
      recipientCountryId: "",
      resiszip: 1,
      recipientCompanyName: "",
      recipientContactName: "",
      recipientAddressLine1: "",
      recipientAddressLine2: "",
      recipientAddressLine3: "",
      recipientZipCode: "",
      recipientCity: "",
      recipientState: "",
      recipientPhone1: "",
      recipientPhone2: "",
      recipientEmail: "",
      recipientLocationType: "Residential",
    });
    setfromoldcountryid("");
    setfromoldstateid("");
    setrecipientoldcountryid("");
    setrecipientoldstateid("");
    setoldphone1("");
    setoldphone2("");
    setoldrecipientphone1("");
    setoldrecipientphone2("");
    setPackageType("package");
    setNoOfPackages(1);
    setDutiesPaidBy("Recipient");
    setPackageData([
      {
        noOfPackages: 1,
        weight: 0,
        length: 0,
        width: 0,
        height: 0,
        chargable_weight: 0,
        insured_value: 0,
      },
    ]);
    setSamecountry(false);
    setCommercialInvoiceData([
      {
        packageNumber: "1",
        contentDescription: "",
        quantity: 0,
        valuePerQty: 0,
      },
    ]);
    setPackageErrors({});
    setManagedBy("");
    setShippingId("");
  };

  const getManagedBy = async () => {
    console.log("Fetching ManagedBy...");
    try {
      const response = await axios.post(
        "https://hubapi.sflworldwide.com/scheduleshipment/getManagedByPhoneOREmailShipment",
        {
          FromEmail: formData.email,
          FromPhone1: oldphone1,
          FromPhone2: oldphone2,
          ToEmail: formData.recipientEmail,
          ToPhone1: oldrecipientphone1,
          ToPhone2: oldrecipientphone2,
        }
      );
      const managedby = response.data?.data?.[0]?.ManagedBy || "";
      setManagedBy(managedby);
      console.log("ManagedBy fetched successfully", {
        position: "top-right",
        autoClose: 3000,
      });
      console.log("ManagedBy:", managedby);
      return managedby;
    } catch (error) {
      console.error("Failed to fetch ManagedBy", error);
      toast.error("Failed to fetch ManagedBy", {
        position: "top-right",
        autoClose: 3000,
      });
      throw error;
    }
  };

  const SendOldDb = async (trackingNumber, managedByResult) => {
    const loadingToast = toast.loading("Sending shipment...");
    try {
      const transformedPackages = splitPackageDataForOldSystem(packageData, trackingNumber);

      const transformedCommercial = commercialInvoiceData.map((item) => ({
        shipments_tracking_number: trackingNumber || "",
        package_number: Number(item.packageNumber || 1),
        content_description: item.contentDescription || "",
        quantity: String(item.quantity || 0),
        value_per_qty: Number(item.valuePerQty || 0).toString(),
        total_value: (
          Number(item.quantity || 0) * Number(item.valuePerQty || 0)
        ).toString(),
        CommercialInvoiceID: null,
      }));

      const oldDbPackageType = packageType === "Envelope" ? "Envelop" : packageType;

      const payload = {
        UserID: userOldid,
        ipAddress: "",
        TrackingNumber: null,
        NewTrackingNumber: trackingNumber || null,
        shipments: {
          tracking_number: "",
          shipment_type: formData.shipmentType,
          location_type: formData.recipientLocationType,
          is_pickup: formData.needsPickup === "Yes - I Need Pickup Service" ? true : false,
          pickup_date: formData.needsPickup === "Yes - I Need Pickup Service" ? formData.pickupDate : '',
          pickupProvider: formData.needsPickup === "Yes - I Need Pickup Service"? 671 : "NULL",
          package_type: oldDbPackageType,
          total_packages: noOfPackages,
          is_pay_online: 0,
          is_pay_bank: 0,
          promo_code: "",
          is_agree: "",
          total_weight: transformedPackages
            .reduce((sum, pkg) => sum + Number(pkg.weight || 0), 0)
            .toString(),
          total_chargable_weight: transformedPackages
            .reduce((sum, pkg) => sum + Number(pkg.chargable_weight || 0), 0)
            .toString(),
          total_insured_value: transformedPackages
            .reduce((sum, pkg) => sum + Number(pkg.insured_value || 0), 0)
            .toString(),
          duties_paid_by: !samecountry ? dutiesPaidBy :null,
          total_declared_value: transformedCommercial
            .reduce((sum, item) => sum + Number(item.total_value || 0), 0)
            .toString(),
          userName: userName,
          ServiceName: (isGetrate && fedexservice.MainServiceName) || "",
          SubServiceName: (isGetrate && fedexservice.service) || "",
          managed_by: managedByResult || "0",
          ShippingID: null,
          InvoiceDueDate: null,
        },
        MovingBackToIndia: false,
        from_address: {
          AddressID: null,
          country_id: fromoldcountryid ? fromoldcountryid : 202,
          country_name: formData.fromCountry,
          fromCountryCode: formData.countrycode,
          company_name: formData.companyName,
          contact_name: formData.contactName,
          address_1: formData.addressLine1,
          address_2: formData.addressLine2,
          address_3: formData.addressLine3,
          MovingBack: false,
          OriginalPassportAvailable: false,
          EligibleForTR: false,
          city_id: 1,
          city_name: formData.fromCity,
          fedex_city: "",
          state_id: fromoldstateid ? fromoldstateid : 1,
          state_name: formData.state,
          zip_code: formData.zipCode,
          phone1: formData.phone1,
          phone2: formData.phone2,
          email: formData.email,
        },
        to_address: {
          AddressID: null,
          country_id: recipientoldcountryid ? recipientoldcountryid : 89,
          country_name: formData.recipientCountry,
          toCountryCode: formData.recipientcountrycode,
          company_name: formData.recipientCompanyName,
          contact_name: formData.recipientContactName,
          address_1: formData.recipientAddressLine1,
          address_2: formData.recipientAddressLine2,
          address_3: formData.recipientAddressLine3,
          city_id: 1,
          city_name: formData.recipientCity,
          fedex_city: "",
          state_id: recipientoldstateid ? recipientoldstateid : 1,
          state_name: formData.recipientState,
          zip_code: formData.recipientZipCode,
          phone1: formData.recipientPhone1,
          phone2: formData.recipientPhone2,
          email: formData.recipientEmail,
        },
        packages: transformedPackages,
        commercial: transformedCommercial,
        invoiceData: [],
        PaymentData: [],
        TotalCommercialvalue: transformedCommercial
          .reduce((sum, item) => sum + Number(item.total_value || 0), 0)
          .toString(),
        TotalWeight: transformedPackages
          .reduce((sum, pkg) => sum + Number(pkg.weight || 0), 0)
          .toString(),
      };

      const response = await axios.post(
        "https://hubapi.sflworldwide.com/scheduleshipment/addshipments",
        payload,
        {
          // withCredentials: true,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.status === 200 && response.data.success) {
        toast.dismiss(loadingToast);
        toast.success("Shipment added successfully", {
          position: "top-right",
          autoClose: 3000,
        });
        console.log("Shipment added successfully:", response.data);
        const sid = response.data.data?.ShippingID;
        setShippingId(sid);
        return sid;
      } else {
        throw new Error("Something went wrong with shipment addition");
      }
    } catch (error) {
      console.error("Error in SendOldDb:", error);
      toast.dismiss(loadingToast);
      toast.error("Error adding shipment", {
        position: "top-right",
        autoClose: 3000,
      });
      throw error;
    }
  };

  const handleSubmit = async () => {
    const { username, email } = getUserDetails();
    const userIP = await getUserIP();
    console.log("Submitting data...");
    const SECRET_KEY = import.meta.env.VITE_SECRET_KEY;
    if (!SECRET_KEY) {
      toast.error("Encryption key is missing!");
      return;
    }

    try {
      const managedByResult = await getManagedBy();
      console.log("managedByResult:", managedByResult);

      const currentPackageType = packageType === "Envelope" ? "Envelop" : packageType;
      const encrypt = (value) =>
        value ? CryptoJS.AES.encrypt(value, SECRET_KEY).toString() : "";


      const requestData = {
        UserID: userId,
        ipAddress: "",
        ip: userIP,
        username: username,
        emailLogger: email,
        TrackingNumber: null,
        shipments: {
          tracking_number: "",
          shipment_type: formData.shipmentType,
          location_type: formData.recipientLocationType,
          is_pickup: formData.needsPickup === "Yes - I Need Pickup Service" ? true : false,
          pickup_date: formData.needsPickup === "Yes - I Need Pickup Service" ? formData.pickupDate : '',
          package_type: currentPackageType,
          total_packages: noOfPackages,
          is_pay_online: 0,
          is_pay_bank: 0,
          promo_code: "",
          is_agree: "",
          total_weight: packageData
            .reduce((sum, pkg) => sum + Number(pkg.weight || 0), 0)
            .toString(),
          total_chargable_weight: packageData
            .reduce((sum, pkg) => sum + Number(pkg.chargable_weight || 0), 0)
            .toString(),
          total_insured_value: packageData
            .reduce((sum, pkg) => sum + Number(pkg.insured_value || 0), 0)
            .toString(),
          duties_paid_by: !samecountry ? dutiesPaidBy : null,
          total_declared_value: commercialInvoiceData
            ? commercialInvoiceData
                .reduce(
                  (sum, _, index) =>
                    sum + Number(calculateTotalValue(index) || 0),
                  0
                )
                .toFixed(2)
            : "",
          userName: userName,
          ServiceName: (isGetrate && fedexservice.MainServiceName) || "",
          SubServiceName: (isGetrate && fedexservice.service) || "",
          managed_by: "",
          Old_managed_by: managedByResult || "0",
          ShippingID: null,
          InvoiceDueDate: null,
        },
        MovingBackToIndia: false,
        from_address: {
          AddressID: null,
          country_id: formData.countryId,
          country_name: formData.fromCountry,
          fromCountryCode: formData.countrycode,
          company_name: formData.companyName,
          contact_name: encrypt(formData.contactName),
          address_1: encrypt(formData.addressLine1),
          address_2: encrypt(formData.addressLine2),
          address_3: encrypt(formData.addressLine3),
          MovingBack: false,
          OriginalPassportAvailable: false,
          EligibleForTR: false,
          city_id: "",
          city_name: formData.fromCity,
          fedex_city: "",
          state_id: "",
          state_name: formData.state,
          zip_code: formData.zipCode,
          phone1: encrypt(formData.phone1),
          phone2: encrypt(formData.phone2),
          email: encrypt(formData.email),
        },
        to_address: {
          AddressID: null,
          country_id: formData.recipientCountryId,
          country_name: formData.recipientCountry,
          toCountryCode: formData.recipientcountrycode,
          company_name: formData.recipientCompanyName,
          contact_name: encrypt(formData.recipientContactName),
          address_1: encrypt(formData.recipientAddressLine1),
          address_2: encrypt(formData.recipientAddressLine2),
          address_3: encrypt(formData.recipientAddressLine3),
          city_id: "",
          city_name: formData.recipientCity,
          fedex_city: "",
          state_id: "",
          state_name: formData.recipientState,
          zip_code: formData.recipientZipCode,
          phone1: encrypt(formData.recipientPhone1),
          phone2: encrypt(formData.recipientPhone2),
          email: encrypt(formData.recipientEmail),
        },
        packages: splitPackageDataForNewSystem(packageData),
        commercial: commercialInvoiceData ? commercialInvoiceData : [],
        invoiceData: [],
        TotalCommercialvalue: commercialInvoiceData
          ? commercialInvoiceData
              .reduce(
                (sum, _, index) =>
                  sum + Number(calculateTotalValue(index) || 0),
                0
              )
              .toFixed(2)
          : "",
        TotalWeight: packageData
          .reduce((sum, pkg) => sum + Number(pkg.weight || 0), 0)
          .toString(),
      };

      console.log(requestData);

      const toastId = toast.loading("Scheduling your shipment...");
      const encodedUrl = encryptURL("/shipment/addShipments");

      const response = await axios.post(
        `${api.BackendURL}/shipment/${encodedUrl}`,
        { data: requestData },
        {
          withCredentials: true,
          credentials: "include",
        }
      );
      if (response.data?.error) {
        toast.dismiss(toastId);
        throw new Error(response.data.error);
      }

      const { shipments, from_address, to_address } = requestData;
      const trackingNumber = response.data?.user?.TrackingNumber;

      console.log("Tracking Number:", trackingNumber);

      const shippingId = await SendOldDb(trackingNumber, managedByResult);
      if (!shippingId) {
        throw new Error("Failed to obtain ShippingID");
      }
      if (trackingNumber) {
        toast.success(
          `Shipment scheduled successfully! Tracking Number: ${trackingNumber}`,
          { id: toastId }
        );
        if (isGetrate) {
          try {
            const conversionRateINRtoUSD = 1 / 87;
            const conversionRateCADtoUSD = 1.44;

            let rate = Number(fedexservice.rate);

            if (fedexservice.fromcountry.toLowerCase() === "in") {
              rate *= conversionRateINRtoUSD;
            } else if (fedexservice.fromcountry.toLowerCase() === "ca") {
              rate *= conversionRateCADtoUSD;
            } else if (fedexservice.fromcountry.toLowerCase() !== "us") {
              console.warn("conversion rate is not known");
            }

            const roundedRate =
              fedexservice.fromcountry.toLowerCase() === "us"
                ? rate
                : Math.ceil(rate);
            const encodedUrl = encryptURL(
              "/generateInvoice/generateInvoiceGetRate"
            );
            const invoiceres = await axios.post(
              `${api.BackendURL}/generateInvoice/${encodedUrl}`,
              {
                TrackingNumber: trackingNumber,
                UserID: userId,
                Rates: roundedRate,
              },
              {
                withCredentials: true,
              }
            );
            if (
              invoiceres.data?.success &&
              invoiceres.data?.message === "Data saved successfully"
            ) {
              console.log("getrate invoice: Data saved successfully");
            } else {
              console.log("Unexpected response:", invoiceres);
            }

            const oldinvoiceres = await axios.post(
              `${api.OldDatabaseURL}/scheduleshipment/GenerateInvoiceGetRate`,
              {
                TrackingNumber: trackingNumber,
                UserID: userOldid,
                Rates: roundedRate,
              }
            );
            if (
              oldinvoiceres.data?.success &&
              oldinvoiceres.data?.message === "Data saved successfully"
            ) {
              console.log("getrate invoice(Old db): Data saved successfully");
            } else {
              console.log("Unexpected response: (Old db)", oldinvoiceres);
            }
          } catch (error) {
            console.error("API call failed:", error);
          }
        }

        sessionStorage.removeItem("service");
        setConfirmation(true);
        navigate("/admin/ScheduleConfirmation", {
          replace: true,
          state: {
            trackingNumber: trackingNumber,
            shipment: shipments,
            sender: from_address,
            recipient: to_address,
            packageData: packageData,
            commercialInvoiceData: commercialInvoiceData,
          },
        });
        resetForm();
        GetrateResetData();
        setIsgetrate(false);
      } else {
        toast.dismiss(toastId);
        throw new Error("Failed to obtain TrackingNumber");
      }
    } catch (error) {
      console.error("Error in handleSubmit:", error);
      toast.dismiss();
      toast.error("Failed to schedule shipment. Please try again.", {
        position: "top-right",
        autoClose: 3000,
      });
      throw error;
    }
  };

  const [completedTabs, setCompletedTabs] = useState({
    "schedule-pickup": false,
    sender: false,
    recipient: false,
    package: formData.shipmentType !== "Ocean",
    payment: false,
  });

  const [activeTab, setActiveTab] = useState("schedule-pickup");
  const [activeModule, setActiveModule] = useState("Schedule Shipment");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerwidth, setDrawerWidth] = useState(250);

  useEffect(() => {
    if (
      activeModule === "My Shipment" &&
      activeTab === "my-shipment" &&
      edit === false &&
      !location.pathname.endsWith("/ShipmentList")
    ) {
      navigate("/admin/ShipmentList", { replace: true });
    } else if (activeModule === "Schedule Shipment") {
      if (activeTab === "schedule-pickup") {
        setEdit(false);
        navigate("/admin/Scheduleshipment", { replace: true });
      }
    }
  }, [activeModule, activeTab, navigate]);

 const updatePackageRows = (num) => {
  const newNum = Number(num);
  const currentLength = packageData.length;

  if (newNum > currentLength) {
    const newRows = Array.from({ length: newNum - currentLength }, () => ({
      noOfPackages: 1,
      weight: 0,
      length: 0,
      width: 0,
      height: 0,
      chargable_weight: 0,
      insured_value: 0,
    }));
    const newData = [...packageData, ...newRows];
    setPackageData(newData);
    recalculateNoOfPackages(newData);
  } else if (newNum < currentLength) {
    const newData = packageData.slice(0, newNum);
    setPackageData(newData);
    recalculateNoOfPackages(newData);
  } else {
    recalculateNoOfPackages(packageData);
  }
};
  const recalculateNoOfPackages = (data) => {
  const total = data.reduce((sum, pkg) => sum + Number(pkg.noOfPackages || 0), 0);
  setNoOfPackages(total || 1);
};

const handlePackageChange = (index, event) => {
  const { name, value } = event.target;
  const updatedPackageData = [...packageData];

  if (packageType === "Envelope") {
    updatedPackageData[index] = {
      ...updatedPackageData[index],
      weight: 0.5,
      length: 10,
      width: 13,
      height: 1,
      chargable_weight: 0.5,
      insured_value: name === "insured_value" ? value : 0,
    };
  } else {
    updatedPackageData[index] = {
      ...updatedPackageData[index],
      [name]: value,
    };

    if (["weight", "length", "width", "height"].includes(name)) {
      const pkg = updatedPackageData[index];
      const weight = parseInt(pkg.weight) || 0;
      const length = parseInt(pkg.length) || 0;
      const width = parseInt(pkg.width) || 0;
      const height = parseInt(pkg.height) || 0;
      const packagesCount = parseInt(pkg.noOfPackages) || 1;

      const dimensionalWeight = Math.floor(
        formData.fromCountry === formData.toCountry
          ? (length * width * height) / 166
          : (length * width * height) / 139
      );

      updatedPackageData[index].chargable_weight = (Math.max(
        weight,
        dimensionalWeight
      )) * packagesCount;
    }
  }

  setPackageData(updatedPackageData);
  recalculateNoOfPackages(updatedPackageData);
};

  const handleAddPackage = () => {
    const newData = [
      ...packageData,
      {
        noOfPackages: 1,
        weight: 0,
        length: 0,
        width: 0,
        height: 0,
        chargable_weight: 0,
        insured_value: 0,
      },
    ];
    setPackageData(newData);
    recalculateNoOfPackages(newData);
    setNoOfPackages(Math.min(newData.length, 10));
  };

  const handleRemovePackage = (index) => {
  const newData = packageData.filter((_, i) => i !== index);
  setPackageData(newData);
  recalculateNoOfPackages(newData);
};

  const handleInvoiceChange = (index, event) => {
    const { name, value } = event.target;
    const updatedInvoiceData = [...commercialInvoiceData];
    updatedInvoiceData[index] = {
      ...updatedInvoiceData[index],
      [name]: value,
    };
    setCommercialInvoiceData(updatedInvoiceData);
  };

  const handleAddInvoiceRow = () => {
    setCommercialInvoiceData([
      ...commercialInvoiceData,
      {
        packageNumber: "1",
        contentDescription: "",
        quantity: 0,
        valuePerQty: 0,
      },
    ]);
  };

  const handleRemoveInvoiceRow = (index) => {
    const updatedInvoiceData = [...commercialInvoiceData];
    updatedInvoiceData.splice(index, 1);
    setCommercialInvoiceData(updatedInvoiceData);
  };

  const calculateTotalValue = (index) => {
    const invoice = commercialInvoiceData[index];
    return ((invoice.quantity || 0) * (invoice.valuePerQty || 0)).toFixed(2);
  };

  const validatePickupForm = () => {
    const newErrors = {};
    if (!formData.shipmentType)
      newErrors.shipmentType = "Please select shipment type";
    if (!formData.fromCountry)
      newErrors.fromCountry = "Please select from country";
    if (!formData.toCountry) newErrors.toCountry = "Please select to country";
    setPickupErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateSenderForm = () => {
    const newErrors = {};
    if (!formData.country?.trim()) {
      newErrors.country = "Country name is required";
    }
    if (!formData.contactName?.trim()) {
      newErrors.contactName = "Contact name is required";
    }

    const addressRegex = /^[\u0400-\u04FFa-zA-Z0-9\s.,\-\/()#'&]+$/;
    const hasAlphanumeric = /[a-zA-Z0-9]/;

    if (!formData.addressLine1?.trim()) {
      newErrors.addressLine1 = "Address Line 1 is required";
    } else if (!addressRegex.test(formData.addressLine1.trim())) {
      newErrors.addressLine1 = "Address Line 1 contains unsupported characters";
    } else if (!hasAlphanumeric.test(formData.addressLine1.trim())) {
      newErrors.addressLine1 =
        "Address Line 1 must include at least one letter or number";
    } else if (formData.addressLine1.trim().length > 60) {
      newErrors.addressLine1 = "Address Line 1 must be 60 characters or fewer";
    }
    if (formData.addressLine2?.trim()) {
      if (!addressRegex.test(formData.addressLine2.trim())) {
        newErrors.addressLine2 =
          "Address Line 2 contains unsupported characters";
      } else if (formData.addressLine2.trim().length > 60) {
        newErrors.addressLine2 =
          "Address Line 2 must be 60 characters or fewer";
      }
    }
    if (formData.addressLine3?.trim()) {
      if (!addressRegex.test(formData.addressLine3.trim())) {
        newErrors.addressLine3 =
          "Address Line 3 contains unsupported characters";
      } else if (formData.addressLine3.trim().length > 60) {
        newErrors.addressLine3 =
          "Address Line 3 must be 60 characters or fewer";
      }
    }
    if (formData.iszip !== 0 && Giszip !== 1) {
      if (!formData.zipCode?.trim()) {
        newErrors.zipCode = "Zip Code is required";
      } else if (!/^[A-Za-z0-9\- ]+$/.test(formData.zipCode.trim())) {
        newErrors.zipCode =
          "Zip Code should contain only letters, numbers, hyphens, and spaces";
      } else if (formData.zipCode.trim().length > 15) {
        newErrors.zipCode = "Zip Code should not exceed 15 characters";
      }
    }

    if (!formData.fromCity?.trim()) {
      newErrors.fromCity = "City is required";
    } else if (formData.fromCity.trim().length > 35) {
      newErrors.fromCity = "City name must be 35 characters or fewer";
    }

    if (formData.iszip !== 0 && Giszip !== 1) {
      if (!formData.state?.trim()) {
        newErrors.state = "State is required";
      } else if (formData.state.trim().length > 35) {
        newErrors.state = "State name must be 35 characters or fewer";
      }
    }
    if (!formData.phone1?.trim()) {
      newErrors.phone1 = "Phone 1 is required";
    } else if (!/^\+?[1-9]\d{8,14}$/.test(formData.phone1.trim())) {
      newErrors.phone1 = "Please enter a valid phone number";
    }

    if (!formData.email?.trim()) {
      newErrors.email = "Email address is required";
    } else if (
      !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(
        formData.email.trim()
      )
    ) {
      newErrors.email = "Please enter a valid email address";
    } else if (formData.email.trim().length > 100) {
      newErrors.email = "Email address must be 100 characters or fewer";
    }

    if (
      formData.needsPickup === "Yes - I Need Pickup Service" &&
      !formData.pickupDate
    ) {
      newErrors.pickupDate = "Pickup Date is required";
    }
    setSenderErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateRecipientForm = () => {
    const newErrors = {};
    const addressRegex = /^[\u0400-\u04FFa-zA-Z0-9\s.,\-\/()#'&]+$/;
    const hasAlphanumeric = /[a-zA-Z0-9]/;
    const zipCodeRegex = /^[A-Za-z0-9\- ]+$/;

    if (!formData.recipientContactName?.trim()) {
      newErrors.contactName = "Contact Name is required";
    }

    if (!formData.recipientAddressLine1?.trim()) {
      newErrors.addressLine1 = "Address Line 1 is required";
    } else if (!addressRegex.test(formData.recipientAddressLine1.trim())) {
      newErrors.addressLine1 = "Address Line 1 contains unsupported characters";
    } else if (!hasAlphanumeric.test(formData.recipientAddressLine1.trim())) {
      newErrors.addressLine1 =
        "Address Line 1 must include at least one letter or number";
    } else if (formData.recipientAddressLine1.trim().length > 60) {
      newErrors.addressLine1 = "Address Line 1 must be 60 characters or fewer";
    }

    if (formData.recipientAddressLine2?.trim()) {
      if (!addressRegex.test(formData.recipientAddressLine2.trim())) {
        newErrors.addressLine2 =
          "Address Line 2 contains unsupported characters";
      } else if (formData.recipientAddressLine2.trim().length > 60) {
        newErrors.addressLine2 =
          "Address Line 2 must be 60 characters or fewer";
      }
    }

    if (formData.recipientAddressLine3?.trim()) {
      if (!addressRegex.test(formData.recipientAddressLine3.trim())) {
        newErrors.addressLine3 =
          "Address Line 3 contains unsupported characters";
      } else if (formData.recipientAddressLine3.trim().length > 60) {
        newErrors.addressLine3 =
          "Address Line 3 must be 60 characters or fewer";
      }
    }

    if (formData.resiszip !== 0 && Gresiszip !== 1) {
      if (!formData.recipientZipCode?.trim()) {
        newErrors.recipientZipCode = "Zip Code is required";
      } else if (!zipCodeRegex.test(formData.recipientZipCode.trim())) {
        newErrors.recipientZipCode =
          "Zip Code should contain only letters, numbers, hyphens, and spaces";
      } else if (formData.recipientZipCode.trim().length > 15) {
        newErrors.recipientZipCode = "Zip Code must be 15 characters or fewer";
      }
    }

    if (!formData.recipientCity?.trim()) {
      newErrors.recipientCity = "City is required";
    } else if (formData.recipientCity.trim().length > 35) {
      newErrors.recipientCity = "City must be 35 characters or fewer";
    }

    if (formData.resiszip !== 0 && Gresiszip !== 1) {
      if (!formData.recipientState?.trim()) {
        newErrors.state = "State is required";
      } else if (formData.recipientState.trim().length > 35) {
        newErrors.state = "State must be 35 characters or fewer";
      }
    }
    if (!formData.recipientPhone1?.trim()) {
      newErrors.phone1 = "Phone 1 is required";
    } else if (!/^\+?[1-9]\d{8,14}$/.test(formData.recipientPhone1.trim())) {
      newErrors.phone1 =
        "Please enter a valid phone number (9-15 digits, optional + prefix)";
    }

    if (formData.recipientEmail?.trim()) {
      if (
        !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(
          formData.recipientEmail.trim()
        )
      ) {
        newErrors.email = "Please enter a valid email address";
      }
    }

    setRecipientErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

const validatePackageForm = () => {
  console.log("starting to validate");
  const newErrors = {};

  if (!packageType) {
    newErrors.packageType = "Package Type is required";
  }

  const totalPackages = packageData.reduce(
    (sum, pkg) => sum + Number(pkg.noOfPackages || 0), 0
  );
  if (!totalPackages || totalPackages < 1) {
    newErrors.noOfPackages = "Total number of packages must be at least 1";
  }

  if (!dutiesPaidBy) {
    newErrors.dutiesPaidBy = "Duties & Taxes Paid By is required";
  }

  if (packageType !== "Envelope") {
    packageData.forEach((pkg, index) => {
      if (!pkg.noOfPackages || pkg.noOfPackages <= 0) {
        newErrors[`noOfPackages_${index}`] =
          "Number of packages is required and must be greater than 0";
      }
      if (!pkg.weight || pkg.weight <= 0) {
        newErrors[`weight_${index}`] =
          "Weight is required and must be greater than 0";
      }
      if (!pkg.length || pkg.length <= 0) {
        newErrors[`length_${index}`] =
          "Length is required and must be greater than 0";
      }
      if (!pkg.width || pkg.width <= 0) {
        newErrors[`width_${index}`] =
          "Width is required and must be greater than 0";
      }
      if (!pkg.height || pkg.height <= 0) {
        newErrors[`height_${index}`] =
          "Height is required and must be greater than 0";
      }
      if (pkg.insured_value === undefined || pkg.insured_value < 0) {
        newErrors[`insured_value_${index}`] =
          "Insured value is required and must be 0 or greater";
      }
    });
  }

  if (
    samecountry === false &&
    Array.isArray(commercialInvoiceData) &&
    packageType !== "Envelope"
  ) {
    commercialInvoiceData.forEach((invoice, index) => {
      const hasAnyField =
        invoice.packageNumber ||
        invoice.contentDescription ||
        invoice.quantity ||
        invoice.valuePerQty;

      if (hasAnyField) {
        if (!invoice.packageNumber) {
          newErrors[`packageNumber_${index}`] = "Package number is required";
        }
        if (!invoice.contentDescription) {
          newErrors[`contentDescription_${index}`] =
            "Content description is required";
        }
        if (!invoice.quantity || invoice.quantity <= 0) {
          newErrors[`quantity_${index}`] =
            "Quantity is required and must be greater than 0";
        }
        if (!invoice.valuePerQty || invoice.valuePerQty <= 0) {
          newErrors[`valuePerQty_${index}`] =
            "Value per quantity is required and must be greater than 0";
        }
      }
    });
  }

  setPackageErrors(newErrors);
  return Object.keys(newErrors).length === 0;
};

  const handlePickupSubmit = (e) => {
    e.preventDefault();
    if (validatePickupForm()) {
      console.log("Schedule Pickup Form submitted:", {
        shipmentType: formData.shipmentType,
        fromCountry: formData.fromCountry,
        toCountry: formData.toCountry,
      });
      setCompletedTabs((prev) => ({
        ...prev,
        "schedule-pickup": true,
        package: formData.shipmentType !== "Ocean",
      }));
      setActiveTab("sender");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      toast.error("Please fill with Valid Information", {
        position: "top-right",
        autoClose: 3000,
      });
    }
  };

  const handleSenderSubmit = (e) => {
    e.preventDefault();
    if (validateSenderForm()) {
      console.log("Sender Form submitted:", {
        country: formData.country,
        companyName: formData.companyName,
        contactName: formData.contactName,
        addressLine1: formData.addressLine1,
        addressLine2: formData.addressLine2,
        addressLine3: formData.addressLine3,
        zipCode: formData.zipCode,
        fromCity: formData.fromCity,
        state: formData.state,
        phone1: formData.phone1,
        phone2: formData.phone2,
        email: formData.email,
        needsPickup: formData.needsPickup,
        pickupDate: formData.pickupDate,
      });
      setCompletedTabs((prev) => ({
        ...prev,
        sender: true,
        package: formData.shipmentType !== "Ocean",
      }));
      setActiveTab("recipient");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      toast.error("Please fill with Valid Information", {
        position: "top-right",
        autoClose: 3000,
      });
    }
  };

  const handleRecipientSubmit = (event) => {
    event.preventDefault();
    if (validateRecipientForm()) {
      console.log("Recipient form submitted", {
        recipientCountry: formData.recipientCountry,
        recipientCompanyName: formData.recipientCompanyName,
        recipientContactName: formData.recipientContactName,
        recipientAddressLine1: formData.recipientAddressLine1,
        recipientAddressLine2: formData.recipientAddressLine2,
        recipientAddressLine3: formData.recipientAddressLine3,
        recipientZipCode: formData.recipientZipCode,
        recipientCity: formData.recipientCity,
        recipientState: formData.recipientState,
        recipientPhone1: formData.recipientPhone1,
        recipientPhone2: formData.recipientPhone2,
        recipientEmail: formData.recipientEmail,
        recipientLocationType: formData.recipientLocationType,
      });
      setCompletedTabs((prev) => {
        const updatedTabs = { ...prev, recipient: true };
        console.log("Updated completedTabs:", updatedTabs);
        return updatedTabs;
      });
      if (formData.shipmentType === "Ocean") {
        handleSubmit();
      } else {
        const nextTab = "package";
        setActiveTab(nextTab);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
      getStateID(
        formData.country,
        formData.state,
        setfromoldcountryid,
        setfromoldstateid
      );
      getStateID(
        formData.recipientCountry,
        formData.recipientState,
        setrecipientoldcountryid,
        setrecipientoldstateid
      );
    } else {
      toast.error("Please fill with Valid Information", {
        position: "top-right",
        autoClose: 3000,
      });
    }
  };

  const handlePackageSubmit = () => {
    if (validatePackageForm()) {
      console.log("Package Form submitted:", {
        packageData,
        commercialInvoiceData,
      });
      setCompletedTabs((prev) => ({ ...prev, package: true }));
      window.scrollTo({ top: 0, behavior: "smooth" });
      handleSubmit();
    }
  };

  const handleTabChange = (newTab) => {
    const tabOrder =
      formData.shipmentType === "Ocean"
        ? ["schedule-pickup", "sender", "recipient", "payment"]
        : ["schedule-pickup", "sender", "recipient", "package", "payment"];
    const currentIndex = tabOrder.indexOf(activeTab);
    const newIndex = tabOrder.indexOf(newTab);

    if (newIndex < currentIndex) {
      setActiveTab(newTab);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    let isValid = false;
    switch (activeTab) {
      case "schedule-pickup":
        isValid = validatePickupForm();
        break;
      case "sender":
        isValid = validateSenderForm();
        break;
      case "recipient":
        isValid = validateRecipientForm();
        break;
      case "package":
        isValid = validatePackageForm();
        break;
      case "payment":
        isValid = true;
        break;
      default:
        isValid = false;
    }

    if (isValid) {
      setCompletedTabs((prev) => ({ ...prev, [activeTab]: true }));
      setActiveTab(newTab);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handlePrevious = () => {
    setActiveTab("schedule-pickup");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleRecipientPrevious = () => {
    setActiveTab("sender");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handlepackagePrevious = () => {
    setActiveTab("recipient");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const toggleDrawer = (open) => () => {
    setDrawerOpen(open);
  };

  const halfopen = () => {
    setDrawerWidth((prevWidth) => (prevWidth === 250 ? 70 : 250));
  };

  const handleModuleClick = (module) => {
    setActiveModule(module);
    if (module === "Schedule Shipment") {
      navigate("/admin/Scheduleshipment", { replace: true });
      setConfirmation(false);
      setActiveTab("schedule-pickup");
      setCompletedTabs({
        "schedule-pickup": false,
        sender: false,
        recipient: false,
        package: formData.shipmentType !== "Ocean",
        payment: false,
      });
    } else if (module === "My Shipment") {
      setEdit(false);
      setActiveTab("my-shipment");
      navigate("/admin/ShipmentList", { replace: true });
    } else if (module === "Get Rates") {
      navigate("/admin/GetRate", { replace: true });
    }
    setDrawerOpen(false);
  };

  useEffect(() => {
    const fromCountryObj = countries.find(
      (c) => c.value === formData.fromCountry
    );
    const toCountryObj = countries.find((c) => c.value === formData.toCountry);
    setFormData((prev) => ({
      ...prev,
      country: fromCountryObj ? fromCountryObj.label : "",
      countrycode: fromCountryObj ? fromCountryObj.value.toLowerCase() : "",
      countryId: fromCountryObj ? fromCountryObj.countryid : "",
      recipientCountry: toCountryObj ? toCountryObj.label : "",
      recipientCountryId: toCountryObj ? toCountryObj.countryid : "",
      recipientcountrycode: toCountryObj
        ? toCountryObj.value.toLowerCase()
        : "",
    }));
    setSamecountry(
      fromCountryObj &&
        toCountryObj &&
        fromCountryObj.value === toCountryObj.value
    );
  }, [formData.fromCountry, formData.toCountry, countries, isGetrate]);

  return (
    <Root>
      <Sidebar
        drawerOpen={drawerOpen}
        Loginname={loginName}
        toggleDrawer={toggleDrawer}
        handleMenuOpen={handleMenuOpen}
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        handleMenuClose={handleMenuClose}
        activeModule={activeModule}
        handleModuleClick={handleModuleClick}
        drawerWidth={drawerwidth}
        setDrawerWidth={setDrawerWidth}
        account_number={accountNumber}
      />

      <MainContent>
        <AppBar
          position="static"
          color="default"
          elevation={1}
          sx={{ boxShadow: "none" }}
        >
          <AppBarBox>
            <DesktopToggleBtn>
              <IconButton edge="start" color="primary" onClick={halfopen}>
                {drawerwidth === 70 ? <ListIcon /> : <MoreVertIcon />}
              </IconButton>
            </DesktopToggleBtn>

            <MobileToggleBtn>
              <IconButton
                edge="start"
                color="inherit"
                onClick={() => setDrawerOpen(true)}
              >
                <MenuIcon />
              </IconButton>
            </MobileToggleBtn>

            <Box sx={{ flexGrow: 1 }} />

            <UsernameButton
              startIcon={<AccountCircleIcon />}
              onClick={handleMenuOpen}
            >
              {loginName}
            </UsernameButton>

            <Menu
              anchorEl={anchorEl}
              open={open}
              onClose={handleMenuClose}
              anchorOrigin={{
                vertical: "bottom",
                horizontal: "right",
              }}
              transformOrigin={{
                vertical: "top",
                horizontal: "right",
              }}
            >
              <MenuItem onClick={handleprofile}>Profile</MenuItem>
              <MenuItem onClick={handleLogout}>Logout</MenuItem>
            </Menu>
          </AppBarBox>
        </AppBar>
        {activeModule === "Schedule Shipment" && !confirmation && (
          <ContentBox>
            <Typography variant="h5" sx={{ mb: 3, fontSize: "1.3rem" }}>
              <IconBox className="card-icon">
                <FlightTakeoffIcon className={classes.iconBox} />
              </IconBox>
              Schedule Shipment
            </Typography>

            {activeModule === "Schedule Shipment" && (
              <SectionTabs
                activeTab={activeTab}
                setActiveTab={handleTabChange}
                isMobile={isMobile}
                completedTabs={completedTabs}
                shipmentType={formData.shipmentType}
              />
            )}

            {activeModule === "Schedule Shipment" &&
              activeTab === "schedule-pickup" && (
                <PickupForm
                  shipmentType={formData.shipmentType}
                  setShipmentType={(value) =>
                    setFormData((prev) => ({ ...prev, shipmentType: value }))
                  }
                  fromCountry={formData.fromCountry}
                  setFromCountry={(value) =>
                    setFormData((prev) => ({ ...prev, fromCountry: value }))
                  }
                  toCountry={formData.toCountry}
                  setToCountry={(value) =>
                    setFormData((prev) => ({ ...prev, toCountry: value }))
                  }
                  setFromCity={(value) =>
                    setFormData((prev) => ({ ...prev, fromCity: value }))
                  }
                  setRecipientCity={(value) =>
                    setFormData((prev) => ({ ...prev, recipientCity: value }))
                  }
                  pickupErrors={pickupErrors}
                  countries={countries}
                  handlePickupSubmit={handlePickupSubmit}
                  iszip={formData.iszip}
                  setisZip={(value) =>
                    setFormData((prev) => ({ ...prev, iszip: value }))
                  }
                  resiszip={formData.resiszip}
                  setresisZip={(value) =>
                    setFormData((prev) => ({ ...prev, resiszip: value }))
                  }
                  setZipCode={(value) =>
                    setFormData((prev) => ({ ...prev, zipCode: value }))
                  }
                  setRecipientZipCode={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      recipientZipCode: value,
                    }))
                  }
                  setPhone1={(value) =>
                    setFormData((prev) => ({ ...prev, phone1: value }))
                  }
                  setPhone2={(value) =>
                    setFormData((prev) => ({ ...prev, phone2: value }))
                  }
                  setRecipientPhone1={(value) =>
                    setFormData((prev) => ({ ...prev, recipientPhone1: value }))
                  }
                  setRecipientPhone2={(value) =>
                    setFormData((prev) => ({ ...prev, recipientPhone2: value }))
                  }
                  isGetrate={isGetrate}
                  setActiveModule={setActiveModule}
                />
              )}

            {activeModule === "Schedule Shipment" && activeTab === "sender" && (
              <Sender
                country={formData.country}
                countrycode={formData.countrycode}
                countryId={formData.countryId}
                setCountry={(value) =>
                  setFormData((prev) => ({ ...prev, country: value }))
                }
                companyName={formData.companyName}
                setCompanyName={(value) =>
                  setFormData((prev) => ({ ...prev, companyName: value }))
                }
                contactName={formData.contactName}
                setContactName={(value) =>
                  setFormData((prev) => ({ ...prev, contactName: value }))
                }
                addressLine1={formData.addressLine1}
                setAddressLine1={(value) =>
                  setFormData((prev) => ({ ...prev, addressLine1: value }))
                }
                addressLine2={formData.addressLine2}
                setAddressLine2={(value) =>
                  setFormData((prev) => ({ ...prev, addressLine2: value }))
                }
                addressLine3={formData.addressLine3}
                setAddressLine3={(value) =>
                  setFormData((prev) => ({ ...prev, addressLine3: value }))
                }
                zipCode={formData.zipCode}
                setZipCode={(value) =>
                  setFormData((prev) => ({ ...prev, zipCode: value }))
                }
                fromCity={formData.fromCity}
                setFromCity={(value) =>
                  setFormData((prev) => ({ ...prev, fromCity: value }))
                }
                state={formData.state}
                setState={(value) =>
                  setFormData((prev) => ({ ...prev, state: value }))
                }
                phone1={formData.phone1}
                setPhone1={(value) =>
                  setFormData((prev) => ({ ...prev, phone1: value }))
                }
                phone2={formData.phone2}
                setPhone2={(value) =>
                  setFormData((prev) => ({ ...prev, phone2: value }))
                }
                email={formData.email}
                setEmail={(value) =>
                  setFormData((prev) => ({ ...prev, email: value }))
                }
                needsPickup={formData.needsPickup}
                setNeedsPickup={(value) =>
                  setFormData((prev) => ({ ...prev, needsPickup: value }))
                }
                pickupDate={formData.pickupDate}
                setPickupDate={(value) =>
                  setFormData((prev) => ({ ...prev, pickupDate: value }))
                }
                senderErrors={senderErrors}
                setSenderErrors={setSenderErrors}
                handleSenderSubmit={handleSenderSubmit}
                handlePrevious={handlePrevious}
                setoldphone1={setoldphone1}
                setoldphone2={setoldphone2}
                iszip={formData.iszip}
                setisZip={(value) =>
                  setFormData((prev) => ({ ...prev, iszip: value }))
                }
                isGetrate={isGetrate}
                setActiveModule={setActiveModule}
                Giszip={Giszip}
              />
            )}
            {activeModule === "Schedule Shipment" &&
              activeTab === "recipient" && (
                <Recipient
                  recipientCountry={formData.recipientCountry}
                  recipientcountrycode={formData.recipientcountrycode}
                  recipientCountryId={formData.recipientCountryId}
                  setRecipientCountry={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      recipientCountry: value,
                    }))
                  }
                  recipientCompanyName={formData.recipientCompanyName}
                  setRecipientCompanyName={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      recipientCompanyName: value,
                    }))
                  }
                  recipientContactName={formData.recipientContactName}
                  setRecipientContactName={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      recipientContactName: value,
                    }))
                  }
                  recipientAddressLine1={formData.recipientAddressLine1}
                  setRecipientAddressLine1={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      recipientAddressLine1: value,
                    }))
                  }
                  recipientAddressLine2={formData.recipientAddressLine2}
                  setRecipientAddressLine2={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      recipientAddressLine2: value,
                    }))
                  }
                  recipientAddressLine3={formData.recipientAddressLine3}
                  setRecipientAddressLine3={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      recipientAddressLine3: value,
                    }))
                  }
                  recipientZipCode={formData.recipientZipCode}
                  setRecipientZipCode={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      recipientZipCode: value,
                    }))
                  }
                  recipientCity={formData.recipientCity}
                  setRecipientCity={(value) =>
                    setFormData((prev) => ({ ...prev, recipientCity: value }))
                  }
                  recipientState={formData.recipientState}
                  setRecipientState={(value) =>
                    setFormData((prev) => ({ ...prev, recipientState: value }))
                  }
                  recipientPhone1={formData.recipientPhone1}
                  setRecipientPhone1={(value) =>
                    setFormData((prev) => ({ ...prev, recipientPhone1: value }))
                  }
                  recipientPhone2={formData.recipientPhone2}
                  setRecipientPhone2={(value) =>
                    setFormData((prev) => ({ ...prev, recipientPhone2: value }))
                  }
                  recipientEmail={formData.recipientEmail}
                  setRecipientEmail={(value) =>
                    setFormData((prev) => ({ ...prev, recipientEmail: value }))
                  }
                  recipientLocationType={formData.recipientLocationType}
                  setRecipientLocationType={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      recipientLocationType: value,
                    }))
                  }
                  recipientErrors={recipientErrors}
                  setRecipientErrors={setRecipientErrors}
                  handleRecipientSubmit={handleRecipientSubmit}
                  handleRecipientPrevious={handleRecipientPrevious}
                  setoldrecipientphone1={setoldrecipientphone1}
                  setoldrecipientphone2={setoldrecipientphone2}
                  shipmentType={formData.shipmentType}
                  resiszip={formData.resiszip}
                  setresisZip={(value) =>
                    setFormData((prev) => ({ ...prev, resiszip: value }))
                  }
                  isGetrate={isGetrate}
                  setActiveModule={setActiveModule}
                  Gresiszip={Gresiszip}
                />
              )}
            {activeModule === "Schedule Shipment" &&
              activeTab === "package" &&
              formData.shipmentType !== "Ocean" && (
                <Package
                  packageData={packageData}
                  setPackageData={setPackageData}
                  handlePackageChange={handlePackageChange}
                  handleAddPackage={handleAddPackage}
                  handleRemovePackage={handleRemovePackage}
                  handlePackageSubmit={handlePackageSubmit}
                  commercialInvoiceData={commercialInvoiceData}
                  setCommercialInvoiceData={setCommercialInvoiceData}
                  handleInvoiceChange={handleInvoiceChange}
                  handleAddInvoiceRow={handleAddInvoiceRow}
                  handleRemoveInvoiceRow={handleRemoveInvoiceRow}
                  calculateTotalValue={calculateTotalValue}
                  handlepackagePrevious={handlepackagePrevious}
                  packageErrors={packageErrors}
                  packageType={packageType}
                  setPackageType={setPackageType}
                  noOfPackages={noOfPackages}
                  setNoOfPackages={setNoOfPackages}
                  dutiesPaidBy={dutiesPaidBy}
                  setDutiesPaidBy={setDutiesPaidBy}
                  updatePackageRows={updatePackageRows}
                  samecountry={samecountry}
                  isGetrate={isGetrate}
                  setActiveModule={setActiveModule}
                />
              )}
          </ContentBox>
        )}

        <Routes>
          <Route
            path="ShipmentList"
            element={<Myshipment edit={edit} setEdit={setEdit} />}
          />
          <Route
            path="MyShipmentNew"
            element={<Myshipmentnew setEdit={setEdit} />}
          />
          <Route
            path="ScheduleConfirmation"
            element={<ScheduleConfirmation />}
          />
          {activeModule === "Get Rates" && (
            <Route
              path="getrate"
              element={
                <GetRate
                  setActiveModule={setActiveModule}
                  setActiveTab={setActiveTab}
                  setConfirmation={setConfirmation}
                />
              }
            />
          )}
          <Route path="profile" element={<ProfilePage />} />
        </Routes>
        {activeModule !== "My Shipment" && (
          <Box
            className="footer-box"
            sx={{
              justifySelf: isMobile ? "center" : "flex-end",
              marginRight: 3,
              marginTop: 1,
              marginBottom: 1,
            }}
          >
            <Typography
              align="center"
              className={classes.footerTypography}
              sx={{ fontSize: isMobile ? "12px" : "12px" }}
            >
              All Rights Reserved. Site Powered by{" "}
              <span
                className={`${classes.sflLink} sfl-link`}
                onClick={() =>
                  window.open("https://sflworldwide.com/", "_blank")
                }
              >
                SFL Worldwide
              </span>
            </Typography>
          </Box>
        )}
      </MainContent>
    </Root>
  );
};

export default Schedule;