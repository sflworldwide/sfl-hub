import React, { useState, useEffect,useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import FlightTakeoffIcon from "@mui/icons-material/FlightTakeoff";
import { api, encryptURL } from '../../../utils/api';
import axios from "axios";
import Tooltip from '@mui/material/Tooltip';
import {
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  InputAdornment,
  Box,
  IconButton,
  Typography,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  useMediaQuery,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  CircularProgress,
} from "@mui/material";
import PersonIcon from "@mui/icons-material/Person";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import PublicIcon from "@mui/icons-material/Public";
import EmailIcon from "@mui/icons-material/Email";
import BusinessIcon from "@mui/icons-material/Business";
import BusinessCenterIcon from "@mui/icons-material/BusinessCenter";
import LocalPhoneIcon from "@mui/icons-material/LocalPhone";
import InfoIcon from '@mui/icons-material/Info';
import {
  IconBox,
  SectionPaper,
  GridContainer,
  TableStyled,
  ButtonContainer,
  ResponsiveTypography,
  ResponsiveButton,
} from "../../styles/myshipmentnew";
import TabNavigation from "./TabNavigation";

// import { api, encryptURL, getUserIP, getUserDetails} from "../../../utils/api";


// Define StyledTextField if not already defined in styles
const StyledTableTextField = ({ sx, ...props }) => (
  <TextField
    {...props}
    sx={{
      ...sx,
      "& .MuiInputBase-root": {
        height: 36,
        fontSize: "0.8rem",
      },
      "& .MuiInputBase-input": {
        padding: "6px",
        fontSize: "0.8rem",

      },
      "& .MuiInputLabel-root": {
        fontSize: "0.8rem",
        transform: "translate(14px, 9px) scale(1)",
      },
      "& .MuiInputLabel-shrink": {
        transform: "translate(14px, -6px) scale(0.75)",
      },
      "& .MuiFormHelperText-root": {
        marginTop: "2px",
      },
    }}
  />
);
const StyledTextField = ({ sx, ...props }) => (
  <TextField
    {...props}
    sx={{
      ...sx,
      "& .MuiInputBase-input": { fontSize: "0.875rem" },
      "& .MuiInputLabel-root": { fontSize: "0.875rem" },
    }}
  />
);

const ResponsiveTable = ({ columns, rows, columnWidths = {} }) => {
  const isMobile = useMediaQuery("(max-width:600px)");

  if (isMobile) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
        {rows.map((row, rowIndex) => (
          <SectionPaper key={rowIndex} sx={{ p: 1.5 }}>
            {columns.map((col, colIndex) => (
              <Box
                key={colIndex}
                sx={{ mb: 1, display: "flex", alignItems: "center" }}
              >
                <Typography
                  variant="caption"
                  sx={{ minWidth: 120, fontWeight: "bold", fontSize: "0.75rem" }}
                >
                  {col}:
                </Typography>
                <StyledTableTextField
                  fullWidth
                  value={row[col.toLowerCase().replace(/\(|\)/g, "")] || ""}
                  variant="outlined"
                  InputProps={{ readOnly: true }}
                  size="small"
                />
              </Box>
            ))}
          </SectionPaper>
        ))}
      </Box>
    );
  }

  return (
    <TableStyled>
      <TableHead>
        <TableRow>
          {columns.map((col) => (
            <TableCell key={col} sx={{ width: columnWidths[col] || "auto", fontSize: "0.75rem" }}>
              {col}
            </TableCell>
          ))}
        </TableRow>
      </TableHead>
      <TableBody>
        {rows.map((row, rowIndex) => (
          <TableRow key={rowIndex}>
            {columns.map((col) => (
              <TableCell key={col} sx={{ width: columnWidths[col] || "auto", fontSize: "0.75rem" }}>
                <StyledTableTextField
                  fullWidth
                  value={row[col.toLowerCase().replace(/\(|\)/g, "")] || ""}
                  variant="outlined"
                  InputProps={{ readOnly: true }}
                />
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </TableStyled>
  );
};
import { useStyles } from "../../styles/MyshipmentStyle";
import toast from "react-hot-toast";

const Myshipmentnew = ({ setEdit }) => {
  const classes = useStyles();
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("customer");
  const [errorDialogOpen, setErrorDialogOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const { shipment } = location.state || {};
  const isMobile = useMediaQuery("(max-width:600px)");

  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [page, setPage] = useState(0);
  const [openDialog, setOpenDialog] = useState(false);
  const shipmentInfo = shipment?.SHIPMENTINFO?.[0] || {};
  const fromAddress =
    shipment?.SHIPMENTDETAILS?.find((d) => d.entitytype === "FromAddress") ||
    {};
  const toAddress =
    shipment?.SHIPMENTDETAILS?.find((d) => d.entitytype === "ToAddress") || {};
  const packages = shipment?.PACKAGE || [];
  const commercialItems = shipment?.COMMERCIAL || [];
  const trackingDetails = shipment?.TRACKINGDETAILS || [];
  const invoiceData = shipment?.ACCOUNTSDETAILS || [];
  const paymentData = shipment?.ACCOUNTSDETAILS?.[0]?.PaymentReceivedData || [];
  const attachmentData=shipment?.ATTACHMENTDETAILS?.[0];
 

  const isSameCountry =
    fromAddress.countryid && toAddress.countryid
      ? fromAddress.countryid === toAddress.countryid
      : false;

  useEffect(() => {
    if (isSameCountry && activeTab === "commercial") {
      setActiveTab("customer");
    }
  }, [isSameCountry, activeTab]);
  const date = new Date();
  const formattedDate = `${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}/${date.getFullYear()}`;

  //console.log(date)

  const [documents, setDocuments] = useState(() => {
    const baseDocuments = [
      {
        type: "Commercial Invoice",
        documentName: "",
        createdOn: new Date().toLocaleDateString("en-US", {
          month: "2-digit",
          day: "2-digit",
          year: "numeric",
        }),
        attachment: "VIEW FILE",
        status: "ACTIVE",
      },
      {
        type: "Invoice",
        documentName: "",
        createdOn: new Date().toLocaleDateString("en-US", {
          month: "2-digit",
          day: "2-digit",
          year: "numeric",
        }),
        attachment: "VIEW FILE",
        status: "ACTIVE",
      },
    ];
     return isSameCountry
      ? baseDocuments.filter((doc) => doc.type !== "Commercial Invoice")
      : baseDocuments;
  });
  const userdata = JSON.parse(sessionStorage.getItem("user"));
   const [hasGeneratedLabel, setHasGeneratedLabel] = useState(false);
   const hasAddedDocument = useRef(false);

   useEffect(() => {
    if(attachmentData && !hasAddedDocument.current &&
      !documents.some((doc) => doc.type === "Prepaid Labels")){
       setDocuments((prevDocuments) => [
          ...prevDocuments,
          {
            type: attachmentData.documenttype,
            documentName: attachmentData.description,
            createdOn: attachmentData.createdon
              ? new Date(attachmentData.createdon).toLocaleDateString("en-US", {
                  month: "2-digit",
                  day: "2-digit",
                  year: "numeric",
                })
              : new Date().toLocaleDateString("en-US", {
                  month: "2-digit",
                  day: "2-digit",
                  year: "numeric",
                }),
            attachment: attachmentData.attachmentpath,
            status: attachmentData.status.toUpperCase(),
          },
        ]);
    setHasGeneratedLabel(true);
    hasAddedDocument.current = true;
    }
    
  },[attachmentData, documents])
   
  if (!shipment || !shipmentInfo) {
    return (
      <Box sx={{ p: isMobile ? 1.5 : 2.5, color: "error.main", fontSize: "0.75rem" }}>
        No shipment data available.
      </Box>
    );
  }

  const handleBack = () => {
    setEdit(false);
    navigate("/admin/ShipmentList", { replace: true });
  };

  const handleTabClick = (tab) => {
    if (tab !== activeTab) {
      setActiveTab(tab);
    }
  };

  const handleRowsPerPageChange = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handlePreviousPage = () => {
    setPage((prev) => Math.max(prev - 1, 0));
  };

  const handleNextPage = () => {
    setPage((prev) => Math.min(prev + 1, Math.ceil(documents.length / rowsPerPage) - 1));
  };
  const [documentId, setDocumentID] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
 


  const handleConfirmGenerate = async () => {
    setOpenDialog(false);

    const payload = {
      TrackingNumber: shipmentInfo.trackingnumber || "",
      isSendEmail: false,
      UserID: shipmentInfo.personid,
      LabelSpecification: userdata.p_paper_originalname,
      EtdDocumentId: documentId || null,
      fCountry: fromAddress.countryid,
    };

    try {
      // toast.loading("Generating...");
       setIsLoading(true)
      const encodedUrl = encryptURL("/FedexLabelApi/fedexLabel");
      const response = await axios.post(`${api.BackendURL}/FedexLabelApi/${encodedUrl}`, payload,{
          withCredentials: true,
        });
      const fedexData = response?.data;

      console.log("Label generated successfully:", fedexData);

      if (fedexData?.success) {
        setHasGeneratedLabel(true);
        const attachment = fedexData.attachmentData;
        const label = fedexData.FedexLabel;
        // Add new row to documents state
        setDocuments((prevDocuments) => [
          ...prevDocuments,
          {
            type: attachment.DocumentType,
            documentName: attachment.Description,
            createdOn: label.createdon
              ? new Date(label.createdon).toLocaleDateString("en-US", {
                  month: "2-digit",
                  day: "2-digit",
                  year: "numeric",
                })
              : new Date().toLocaleDateString("en-US", {
                  month: "2-digit",
                  day: "2-digit",
                  year: "numeric",
                }),
            attachment: attachment.AttachmentPath,
            status: attachment.Status.toUpperCase(),
          },
        ]);

        const secondPayload = {
          trackingnumber: label.trackingnumber,
          fedextrakingnumber: label.fedextrakingnumber,
          imagetype: label.imagetype,
          carriercode: label.carriercode,
          fedexstatus: label.fedexstatus,
          status: label.status,
          EntityType: attachment.EntityType,
          AttachmentType: attachment.AttachmentType,
          AttachmentName: attachment.AttachmentName,
          Description: attachment.Description,
          DocumentType: attachment.DocumentType,
          AttachmentPath: attachment.AttachmentPathToOld,
        };

        const res = await axios.post("https://hubapi.sflworldwide.com/contactus/addFedexData", secondPayload);
        console.log("FedEx data submitted successfully.", res.data);
        setIsLoading(false);
      } else {
        throw new Error(fedexData?.message);
      }
    } catch (error) {
      setIsLoading(false);
      const rawMessage = error?.response?.data?.message || "Something went wrong";
      if (rawMessage.toLowerCase().includes("commodity")) {
        setErrorMessage(`
          <p style="color: #d32f2f; font-weight: bold; margin-bottom: 16px;">
            X The commodity description is vague and requires clarification.
          </p>
          <table style="width: 100%; border-collapse: collapse;">
            <tr style="background-color: #f5f5f5;">
              <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">Bad description</th>
              <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">Good description</th>
            </tr>
            <tr>
              <td style="border: 1px solid #ddd; padding: 12px;">Parts</td>
              <td style="border: 1px solid #ddd; padding: 12px;">Two steel springs for woodworking machine</td>
            </tr>
            <tr>
              <td style="border: 1px solid #ddd; padding: 12px;">Gift</td>
              <td style="border: 1px solid #ddd; padding: 12px;">One men's knitted sweater (100% cotton)</td>
            </tr>
            <tr>
              <td style="border: 1px solid #ddd; padding: 12px;">Samples</td>
              <td style="border: 1px solid #ddd; padding: 12px;">200cm x 400cm nylon carpet samples</td>
            </tr>
            <tr>
              <td style="border: 1px solid #ddd; padding: 12px;">Documents</td>
              <td style="border: 1px solid #ddd; padding: 12px;">30 pages of legal documents</td>
            </tr>
          </table>
        `);
        setErrorDialogOpen(true);
      } else {
        toast.error(rawMessage);
      }
      console.error("Error handling FedEx operations:", rawMessage);
    }
  };
  // Handler for "Generate" button click
  const handleGenerateClick = async () => {

    let documentId = "";
    if (isSameCountry === false && shipmentInfo.shipmenttype === "Air") {
      const objectdata = {
        UserID: shipmentInfo.personid || "",
        ipAddress: shipmentInfo.ipaddress || "",
        ip: shipmentInfo.iplocation || "",
        username: shipmentInfo.createdbyname || "",
        emailLogger: fromAddress.email || "",
        TrackingNumber: shipmentInfo.trackingnumber || "",
        shipments: {
          tracking_number: shipmentInfo.trackingnumber || "",
          shipment_type: shipmentInfo.shipmenttype || "",
          location_type: fromAddress.locationtype || "",
          is_pickup: fromAddress.ispickup || false,
          pickup_date: fromAddress.pickupdate || "",
          package_type: fromAddress.packagetype || "",
          total_packages: fromAddress.totalpackages || 0,
          is_pay_online: 0,
          is_pay_bank: 0,
          promo_code: fromAddress.promocode || "",
          is_agree: "",
          total_weight: fromAddress.totalweight || packages.reduce((sum, pkg) => sum + Number(pkg.estimetedweight || 0), 0).toString(),
          total_chargable_weight: fromAddress.totalchargableweight || packages.reduce((sum, pkg) => sum + Number(pkg.chargableweight || 0), 0).toString(),
          total_insured_value: fromAddress.totalinsuredvalue || packages.reduce((sum, pkg) => sum + Number(pkg.insuredvalue || 0), 0).toString(),
          duties_paid_by: fromAddress.dutiespaidby || "",
          total_declared_value: fromAddress.totaldeclaredvalue || commercialItems.reduce((sum, item) => sum + Number(item.totalvalue || 0), 0).toFixed(2),
          userName: shipmentInfo.createdbyname || "",
          ServiceName: fromAddress.servicename || "",
          SubServiceName: fromAddress.subservicename || "",
          managed_by: fromAddress.managedby || "",
          Old_managed_by: shipmentInfo.managedbyname || "0",
          ShippingID: fromAddress.shippingid || "",
          InvoiceDueDate: shipmentInfo.invoiceduedate || null
        },
        MovingBackToIndia: fromAddress.movingback === "true",
        from_address: {
          AddressID: fromAddress.fromaddressid || "",
          country_id: fromAddress.countryid || "",
          country_name: fromAddress.countryname || "",
          fromCountryCode: fromAddress.countrycode || "",
          company_name: fromAddress.companyname || "",
          contact_name: fromAddress.contactname || "",
          address_1: fromAddress.addressline1 || "",
          address_2: fromAddress.addressline2 || "",
          address_3: fromAddress.addressline3 || "",
          MovingBack: fromAddress.movingback === "true",
          OriginalPassportAvailable: fromAddress.originalpassportavailable === "true",
          EligibleForTR: fromAddress.eligiblefortr === "true",
          city_id: "",
          city_name: fromAddress.city || "",
          fedex_city: fromAddress.fedexcity || "",
          state_id: "",
          state_name: fromAddress.state || "",
          zip_code: fromAddress.zipcode || "",
          phone1: fromAddress.phone1 || "",
          phone2: fromAddress.phone2 || "",
          email: fromAddress.email || ""
        },
        to_address: {
          AddressID: toAddress.toaddressid || "",
          country_id: toAddress.countryid || "",
          country_name: toAddress.countryname || "",
          toCountryCode: toAddress.countrycode || "",
          company_name: toAddress.companyname || "",
          contact_name: toAddress.contactname || "",
          address_1: toAddress.addressline1 || "",
          address_2: toAddress.addressline2 || "",
          address_3: toAddress.addressline3 || "",
          city_id: "",
          city_name: toAddress.city || "",
          fedex_city: toAddress.fedexcity || "",
          state_id: "",
          state_name: toAddress.state || "",
          zip_code: toAddress.zipcode || "",
          phone1: toAddress.phone1 || "",
          phone2: toAddress.phone2 || "",
          email: toAddress.email || ""
        },
        packages: packages,
        commercial: commercialItems,
        invoiceData: invoiceData,
        TotalCommercialvalue: commercialItems.reduce((sum, item) => sum + Number(item.totalvalue || 0), 0).toFixed(2),
        TotalWeight: packages.reduce((sum, pkg) => sum + Number(pkg.estimetedweight || 0), 0).toString(),
        isSameCountry: isSameCountry
      };

      const fedexETD_payload = {
        Second_data: objectdata,
        trackingNumber: shipmentInfo.trackingnumber,
        ShippingID: fromAddress.shippingid,
        Attachments: [],
        showGetrate: false,
        showGetrateError: false,
        data: {},
      };

      console.log(fedexETD_payload);
      try {
        // toast.loading("Wait...")
         setIsLoading(true)

               const encodedUrl = encryptURL("/FedexApi/fedexETD");
     const generate_response = await axios.post(
  `${api.BackendURL}/FedexApi/${encodedUrl}`,
  fedexETD_payload,
  {
    withCredentials: true,
  }
);
        documentId = generate_response?.data?.data?.result[0]?.DocumentId || null;

      } catch (error) {
        toast.dismiss();
         setIsLoading(false);
        toast.error(error)
        console.error("Error fetching document ID:", error);
      }
    }
     setIsLoading(false)
    toast.dismiss();
    console.log("Document ID:", documentId);
    setDocumentID(documentId);
    setOpenDialog(true);
  };



  // Handler for "No" action
  const handleCancelGenerate = () => {
    setOpenDialog(false);
  };

  const handleErrorDialogClose = () => {
    setErrorDialogOpen(false);
    setErrorMessage("");
  };

  const displayedRows = documents.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Box
      sx={{
        p: isMobile ? 1.5 : 2.5,
        fontFamily: "Arial, sans-serif",
        width: "100%",
      }}
    >
      <SectionPaper>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            mb: isMobile ? 1.5 : 2.5,
            position: "relative",
            pl: 6,
          }}
        >
          <IconBox>
            <FlightTakeoffIcon
              sx={{ fontSize: isMobile ? 20 : 23, color: "white" }}
            />
          </IconBox>
          <ResponsiveTypography variant="h5" sx={{ pl: 1.5, mt: -1.5, mb: 3 }}>
            Shipment Information
          </ResponsiveTypography>
        </Box>

        <GridContainer>
          <FormControl fullWidth variant="outlined" className="small-textfield">
            <InputLabel sx={{ fontSize: "0.875rem" }}>Shipment Status</InputLabel>
            <Select
              value={shipmentInfo.shipmentstatus || ""}
              label="Shipment Status"
              disabled
              sx={{ "& .MuiSelect-select": { fontSize: "0.875rem" } }}
            >
              {shipment?.SHIPMENTSTATUS?.map((status) => (
                <MenuItem key={status.stringmapid} value={status.description} sx={{ fontSize: "0.75rem" }}>
                  {status.description}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <StyledTextField
            fullWidth
            className="custom-textfield"
            label="Tracking Number"
            disabled
            value={shipmentInfo.trackingnumber || ""}
            InputProps={{ readOnly: true }}
            variant="outlined"
          />

          {/* <FormControl fullWidth variant="outlined">
            <InputLabel sx={{ fontSize: "0.875rem" }}>Package Type</InputLabel>
            <Select
              value={fromAddress.packagetype || "Package"}
              label="Package Type"
              disabled
              sx={{ "& .MuiSelect-select": { fontSize: "0.875rem" } }}
            >
              <MenuItem value="Package" sx={{ fontSize: "0.75rem" }}>Package</MenuItem>
              <MenuItem value="Document" sx={{ fontSize: "0.75rem" }}>Document</MenuItem>
            </Select>
          </FormControl> */}
          <TextField
            fullWidth
            label="Package Type"
            disabled
            className="custom-textfield"
            value={packages && packages.length > 0 ? packages[0].packagetype || "" : ""}
            InputProps={{ readOnly: true }}
            variant="outlined"
            sx={{ fontSize: "0.875rem" }} // You can adjust the overall font size here if needed
            InputLabelProps={{ style: { fontSize: "0.875rem" } }} // Style the label
            inputProps={{ style: { fontSize: "0.875rem" } }} // Style the input text
          />
          <StyledTextField
            fullWidth
            label="No. of Packages"
            className="custom-textfield"
            disabled
            value={fromAddress.totalpackages || "0"}
            InputProps={{ readOnly: true }}
            variant="outlined"
          />
        </GridContainer>
        <GridContainer>
          <StyledTextField
            fullWidth
            disabled
            className="custom-textfield"
            label="Managed By"
            value={shipmentInfo.managedbyname || ""}
            InputProps={{ readOnly: true }}
            variant="outlined"
          />

          <FormControl fullWidth variant="outlined" className="small-textfield">
            <InputLabel sx={{ fontSize: "0.875rem" }}>Shipment Type</InputLabel>
            <Select
              disabled
              value={shipmentInfo.shipmenttype || "Ocean"}
              label="Shipment Type"
              sx={{ "& .MuiSelect-select": { fontSize: "0.875rem" } }}
            >
              {shipment?.SHIPMENTTYPE?.map((type) => (
                <MenuItem key={type.stringmapid} value={type.description} sx={{ fontSize: "0.75rem" }}>
                  {type.description}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth variant="outlined" className="small-textfield" >
            {/* <InputLabel sx={{ fontSize: "0.875rem" }}>Service Type</InputLabel> */}
            <StyledTextField
              fullWidth
              disabled
              className="custom-textfield"
              label="Service Type"
              value={shipmentInfo.servicename || ""}
              InputProps={{ readOnly: true }}
              variant="outlined"
            />
            {/* <Select
              value={shipmentInfo.servicename || ""}
              label="Service Type"
              disabled
              sx={{ "& .MuiSelect-select": { fontSize: "0.875rem" } }}
            >
              <MenuItem value="" sx={{ fontSize: "0.75rem" }}>Select</MenuItem>
              <MenuItem value="Standard" sx={{ fontSize: "0.75rem" }}>Standard</MenuItem>
              <MenuItem value="Express" sx={{ fontSize: "0.75rem" }}>Express</MenuItem>
            </Select> */}
          </FormControl>

          <FormControl fullWidth variant="outlined" className="small-textfield">
            <StyledTextField
              fullWidth
              disabled
              className="custom-textfield"
              label="Sub Service Type"
              value={shipmentInfo.subservicename || ""}
              InputProps={{ readOnly: true }}
              variant="outlined"
            />
            {/* <InputLabel sx={{ fontSize: "0.875rem" }}>Sub Service Type</InputLabel>
            <Select
              value={shipmentInfo.subservicename || ""}
              label="Sub Service Type"
              disabled
              sx={{ "& .MuiSelect-select": { fontSize: "0.875rem" } }}
            >
              <MenuItem value="" sx={{ fontSize: "0.75rem" }}>Select</MenuItem>
            </Select> */}
          </FormControl>
        </GridContainer>
      </SectionPaper>

      <TabNavigation
        activeTab={activeTab}
        handleTabClick={handleTabClick}
        isSameCountry={isSameCountry}
      />

      {activeTab === "customer" && (
        <>
          <SectionPaper>
            <ResponsiveTypography
              variant="h6"
              sx={{ mb: isMobile ? 1.5 : 2.5 }}
            >
              Sender Information
            </ResponsiveTypography>
            <GridContainer>
              <StyledTextField
                fullWidth
                className="custom-textfield"
                label="Contact Name"
                value={fromAddress.contactname || ""}
                InputProps={{
                  readOnly: true,
                  endAdornment: (
                    <InputAdornment position="end">
                      <PersonIcon sx={{ fontSize: isMobile ? 18 : 24 }} />
                    </InputAdornment>
                  ),
                }}
                variant="outlined"
              />
              <StyledTextField
                fullWidth
                className="custom-textfield"
                label="Address Line 1"
                value={fromAddress.addressline1 || ""}
                InputProps={{
                  readOnly: true,
                  endAdornment: (
                    <InputAdornment position="end">
                      <LocationOnIcon sx={{ fontSize: isMobile ? 18 : 24 }} />
                    </InputAdornment>
                  ),
                }}
                variant="outlined"
              />
              <StyledTextField
                fullWidth
                label="Address Line 2"
                className="custom-textfield"
                value={fromAddress.addressline2 || ""}
                InputProps={{
                  readOnly: true,
                  endAdornment: (
                    <InputAdornment position="end">
                      <LocationOnIcon sx={{ fontSize: isMobile ? 18 : 24 }} />
                    </InputAdornment>
                  ),
                }}
                variant="outlined"
              />
              <StyledTextField
                fullWidth
                label="Address Line 3"
                className="custom-textfield"
                value={fromAddress.addressline3 || ""}
                InputProps={{
                  readOnly: true,
                  endAdornment: (
                    <InputAdornment position="end">
                      <PublicIcon sx={{ fontSize: isMobile ? 18 : 24 }} />
                    </InputAdornment>
                  ),
                }}
                variant="outlined"
              />
            </GridContainer>
            <GridContainer>
              <StyledTextField
                fullWidth
                label="Country"
                className="custom-textfield"
                value={fromAddress.countryname || ""}
                InputProps={{
                  readOnly: true,
                }}
                variant="outlined"
              />
              <StyledTextField
                fullWidth
                className="custom-textfield"
                label="Zip"
                value={fromAddress.zipcode || ""}
                InputProps={{
                  readOnly: true,
                  endAdornment: (
                    <InputAdornment position="end">
                      <EmailIcon sx={{ fontSize: isMobile ? 18 : 24 }} />
                    </InputAdornment>
                  ),
                }}
                variant="outlined"
              />
              <StyledTextField
                fullWidth
                className="custom-textfield"
                label="City"
                value={fromAddress.city || ""}
                InputProps={{
                  readOnly: true,
                  endAdornment: (
                    <InputAdornment position="end">
                      <BusinessIcon sx={{ fontSize: isMobile ? 18 : 24 }} />
                    </InputAdornment>
                  ),
                }}
                variant="outlined"
              />
              <StyledTextField
                fullWidth
                className="custom-textfield"
                label="State"
                value={fromAddress.state || ""}
                InputProps={{
                  readOnly: true,
                }}
                variant="outlined"
              />
            </GridContainer>
            <GridContainer>
              <StyledTextField
                fullWidth
                className="custom-textfield"
                label="Company Name"
                value={fromAddress.companyname}
                InputProps={{
                  readOnly: true,
                  endAdornment: (
                    <InputAdornment position="end">
                      <BusinessCenterIcon sx={{ fontSize: isMobile ? 18 : 24 }} />
                    </InputAdornment>
                  ),
                }}
                variant="outlined"
              />
              <StyledTextField
                fullWidth
                label="Phone 1"
                className="custom-textfield"
                value={fromAddress.phone1 || ""}
                InputProps={{
                  readOnly: true,
                  endAdornment: (
                    <InputAdornment position="end">
                      <LocalPhoneIcon sx={{ fontSize: isMobile ? 18 : 24 }} />
                    </InputAdornment>
                  ),
                }}
                variant="outlined"
              />
              <StyledTextField
                fullWidth
                label="Phone 2"
                className="custom-textfield"
                value={fromAddress.phone2 || ""}
                InputProps={{
                  readOnly: true,
                  endAdornment: (
                    <InputAdornment position="end">
                      <LocalPhoneIcon sx={{ fontSize: isMobile ? 18 : 24 }} />
                    </InputAdornment>
                  ),
                }}
                variant="outlined"
              />
              <StyledTextField
                fullWidth
                className="custom-textfield"
                label="Email"
                value={fromAddress.email || ""}
                InputProps={{
                  readOnly: true,
                  endAdornment: (
                    <InputAdornment position="end">
                      <EmailIcon sx={{ fontSize: isMobile ? 18 : 24 }} />
                    </InputAdornment>
                  ),
                }}
                variant="outlined"
              />
            </GridContainer>
          </SectionPaper>

          <SectionPaper>
            <ResponsiveTypography
              variant="h6"
              sx={{ mb: isMobile ? 1.5 : 2.5 }}
            >
              Recipient Details
            </ResponsiveTypography>
            <GridContainer>
              <StyledTextField
                fullWidth
                label="Contact Name"
                className="custom-textfield"
                value={toAddress.contactname || ""}
                InputProps={{
                  readOnly: true,
                  endAdornment: (
                    <InputAdornment position="end">
                      <PersonIcon sx={{ fontSize: isMobile ? 18 : 24 }} />
                    </InputAdornment>
                  ),
                }}
                variant="outlined"
              />
              <StyledTextField
                fullWidth
                label="Address Line 1"
                className="custom-textfield"
                value={toAddress.addressline1 || ""}
                InputProps={{
                  readOnly: true,
                  endAdornment: (
                    <InputAdornment position="end">
                      <LocationOnIcon sx={{ fontSize: isMobile ? 18 : 24 }} />
                    </InputAdornment>
                  ),
                }}
                variant="outlined"
              />
              <StyledTextField
                fullWidth
                label="Address Line 2"
                className="custom-textfield"
                value={toAddress.addressline2 || ""}
                InputProps={{
                  readOnly: true,
                  endAdornment: (
                    <InputAdornment position="end">
                      <LocationOnIcon sx={{ fontSize: isMobile ? 18 : 24 }} />
                    </InputAdornment>
                  ),
                }}
                variant="outlined"
              />
              <StyledTextField
                fullWidth
                label="Address Line 3"
                className="custom-textfield"
                value={toAddress.addressline3 || ""}
                InputProps={{
                  readOnly: true,
                  endAdornment: (
                    <InputAdornment position="end">
                      <PublicIcon sx={{ fontSize: isMobile ? 18 : 24 }} />
                    </InputAdornment>
                  ),
                }}
                variant="outlined"
              />
            </GridContainer>
            <GridContainer>
              <StyledTextField
                fullWidth
                label="Country"
                className="custom-textfield"
                value={toAddress.countryname || ""}
                InputProps={{
                  readOnly: true,
                }}
                variant="outlined"
              />
              <StyledTextField
                fullWidth
                className="custom-textfield"
                label="Zip"
                value={toAddress.zipcode || ""}
                InputProps={{
                  readOnly: true,
                  endAdornment: (
                    <InputAdornment position="end">
                      <EmailIcon sx={{ fontSize: isMobile ? 18 : 24 }} />
                    </InputAdornment>
                  ),
                }}
                variant="outlined"
              />
              <StyledTextField
                fullWidth
                className="custom-textfield"
                label="City"
                value={toAddress.city || ""}
                InputProps={{
                  readOnly: true,
                  endAdornment: (
                    <InputAdornment position="end">
                      <BusinessIcon sx={{ fontSize: isMobile ? 18 : 24 }} />
                    </InputAdornment>
                  ),
                }}
                variant="outlined"
              />
              <StyledTextField
                fullWidth
                label="State"
                className="custom-textfield"
                value={toAddress.state || ""}
                InputProps={{
                  readOnly: true,
                }}
                variant="outlined"
              />
            </GridContainer>
            <GridContainer>
              <StyledTextField
                fullWidth
                className="custom-textfield"
                label="Company Name"
                value={toAddress.companyname || ""}
                InputProps={{
                  readOnly: true,
                  endAdornment: (
                    <InputAdornment position="end">
                      <BusinessCenterIcon sx={{ fontSize: isMobile ? 18 : 24 }} />
                    </InputAdornment>
                  ),
                }}
                variant="outlined"
              />
              <StyledTextField
                fullWidth
                className="custom-textfield"
                label="Phone 1"
                value={toAddress.phone1 || ""}
                InputProps={{
                  readOnly: true,
                  endAdornment: (
                    <InputAdornment position="end">
                      <LocalPhoneIcon sx={{ fontSize: isMobile ? 18 : 24 }} />
                    </InputAdornment>
                  ),
                }}
                variant="outlined"
              />
              <StyledTextField
                fullWidth
                className="custom-textfield"
                label="Phone 2"
                value={toAddress.phone2 || ""}
                InputProps={{
                  readOnly: true,
                  endAdornment: (
                    <InputAdornment position="end">
                      <LocalPhoneIcon sx={{ fontSize: isMobile ? 18 : 24 }} />
                    </InputAdornment>
                  ),
                }}
                variant="outlined"
              />
              <StyledTextField
                fullWidth
                label="Email"
                className="custom-textfield"
                value={toAddress.email || ""}
                InputProps={{
                  readOnly: true,
                  endAdornment: (
                    <InputAdornment position="end">
                      <EmailIcon sx={{ fontSize: isMobile ? 18 : 24 }} />
                    </InputAdornment>
                  ),
                }}
                variant="outlined"
              />
            </GridContainer>
          </SectionPaper>

          <SectionPaper>
            <ResponsiveTypography
              variant="h6"
              sx={{ mb: isMobile ? 1.5 : 2.5 }}
            >
              Additional Details
            </ResponsiveTypography>
            <GridContainer>
              <StyledTextField
                fullWidth
                label="Ship Date"
                className="custom-textfield"
                value={shipmentInfo.shipmentdate || ""}
                InputProps={{
                  readOnly: true,
                  endAdornment: (
                    <InputAdornment position="end">
                      <PersonIcon sx={{ fontSize: isMobile ? 18 : 24 }} />
                    </InputAdornment>
                  ),
                }}
                variant="outlined"
              />
              <FormControl fullWidth variant="outlined" className="small-textfield">
                <InputLabel sx={{ fontSize: "0.875rem" }}>Location Type</InputLabel>
                <Select
                  disabled
                  value={fromAddress.locationtype || ""}
                  label="Location Type"
                  sx={{ "& .MuiSelect-select": { fontSize: "0.875rem" } }}
                >
                  <MenuItem value="Residential" sx={{ fontSize: "0.75rem" }}>Residential</MenuItem>
                  <MenuItem value="Commercial" sx={{ fontSize: "0.75rem" }}>Commercial</MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth variant="outlined" className="small-textfield">
                <InputLabel sx={{ fontSize: "0.875rem" }}>Duties & Taxes Paid By</InputLabel>
                <Select
                  disabled
                  value={fromAddress.dutiespaidby || ""}
                  label="Duties & Taxes Paid By"
                  sx={{ "& .MuiSelect-select": { fontSize: "0.875rem" } }}
                >
                  <MenuItem value="" sx={{ fontSize: "0.75rem" }}>Select</MenuItem>
                  <MenuItem value="Recipient" sx={{ fontSize: "0.75rem" }}>Recipient</MenuItem>
                  <MenuItem value="Sender" sx={{ fontSize: "0.75rem" }}>Sender</MenuItem>
                </Select>
              </FormControl>
              <StyledTextField
                fullWidth
                label="Username"
                className="custom-textfield"
                value={shipmentInfo.createdbyname || ""}
                InputProps={{ readOnly: true }}
                variant="outlined"
              />
              <StyledTextField
                fullWidth
                label="Pickup Date"
                className="custom-textfield"
                value={fromAddress.pickupdate || ""}
                InputProps={{
                  readOnly: true,
                  endAdornment: (
                    <InputAdornment position="end">
                      <PersonIcon sx={{ fontSize: isMobile ? 18 : 24 }} />
                    </InputAdornment>
                  ),
                }}
                variant="outlined"
              />
            </GridContainer>
          </SectionPaper>
        </>
      )}

      {activeTab === "package" && (
        <SectionPaper>
          <ResponsiveTypography variant="h6" sx={{ mb: isMobile ? 1.5 : 2.5 }}>
            Package
          </ResponsiveTypography>
          <TableContainer sx={{ overflowX: "auto" }}>
            <ResponsiveTable
              columns={[
                "Number",
                "Weight",
                "Dim(L)",
                "Dim(W)",
                "Dim(H)",
                "ChargeWeight",
                "Insurance",
              ]}
              rows={packages.map((pkg) => ({
                number: pkg.packagenumber.toString() || "1",
                weight: pkg.estimetedweight || "0.00",
                diml: pkg.length || "0.00",
                dimw: pkg.width || "0.00",
                dimh: pkg.height || "0.00",
                chargeweight: pkg.chargableweight || "0.00",
                insurance: pkg.insuredvalue || "0.00",
              }))}
            />
          </TableContainer>
          <Box
            sx={{
              display: "flex",
              justifyContent: "flex-end",
              mt: 1.25,
              flexDirection: isMobile ? "column" : "row",
              gap: isMobile ? 1 : 2.5,
            }}
          >
            <StyledTextField
              className="custom-textfield"
              label="Total Packages"
              value={fromAddress.totalpackages || "0"}
              variant="outlined"
              InputProps={{ readOnly: true }}
              sx={{ width: isMobile ? "100%" : "auto" }}
            />
            <StyledTextField
              className="custom-textfield"
              label="Total Insured Value"
              value={fromAddress.totalinsuredvalue || "0.00"}
              variant="outlined"
              InputProps={{ readOnly: true }}
              sx={{ width: isMobile ? "100%" : "auto" }}
            />
          </Box>
        </SectionPaper>
      )}

      {activeTab === "commercial" && !isSameCountry && (
        <SectionPaper>
          <ResponsiveTypography variant="h6" sx={{ mb: isMobile ? 1.5 : 2.5 }}>
            Commercial Invoice
          </ResponsiveTypography>
          <TableContainer sx={{ overflowX: "auto" }}>
            <ResponsiveTable
              columns={[
                "PackageNumber",
                "PackageContent",
                "Quantity",
                "ValuePerQty",
                "TotalValue",
              ]}
              rows={commercialItems.map((item) => ({
                packagenumber: item.packagenumber.toString() || "1",
                packagecontent: item.contentdescription || "",
                quantity: item.quantity.toString() || "0",
                valueperqty: item.valueperquantity || "0.00",
                totalvalue: item.totalvalue || "0.00",
              }))}
            />
          </TableContainer>
          <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 1.25 }}>
            <StyledTextField
              className="custom-textfield"
              label="Total Cost:"
              value={commercialItems
                .reduce(
                  (sum, item) => sum + parseFloat(item.totalvalue || 0),
                  0
                )
                .toFixed(2) || "0.00"}
              variant="outlined"
              InputProps={{ readOnly: true }}
              sx={{ width: isMobile ? "100%" : "auto" }}
            />
          </Box>
        </SectionPaper>
      )}

      {activeTab === "tracking" && (
        <SectionPaper>
          <ResponsiveTypography variant="h6" sx={{ mb: isMobile ? 1.5 : 2.5 }}>
            Tracking
          </ResponsiveTypography>
          <TableContainer sx={{ overflowX: "auto" }}>
            <ResponsiveTable
              columns={["Date", "Time", "Updates"]}
              columnWidths={{
                Date: "15%",
                Time: "15%",
                Updates: "70%",
              }}
              rows={
                trackingDetails.length > 0
                  ? trackingDetails.map((track) => ({
                    date: track.trackingdate || "",
                    time: track.createdon
                      ? new Date(track.createdon).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })
                      : "",
                    updates: track.comments
                      ? `${track.comments} (${track.carrier})`
                      : `${track.trackingstatus} (${track.carrier})`,
                  }))
                  : [
                    {
                      date: "",
                      time: "",
                      updates: "No tracking details available",
                    },
                  ]
              }
            />
          </TableContainer>
        </SectionPaper>
      )}

      {activeTab === "accounts" && (
        <SectionPaper>
          <ResponsiveTypography variant="h6" sx={{ mb: isMobile ? 1.5 : 2.5 }}>
            Invoice
          </ResponsiveTypography>
          <TableContainer sx={{ overflowX: "auto" }}>
            <ResponsiveTable
              columns={["Date", "Service", "Description", "Qty", "Cost", "Total"]}
              columnWidths={{
                Date: "11%",
                Service: "25%",
                Description: "30%",
                Qty: "9%",
                Cost: "10%",
                Total: "15%",
              }}
              rows={
                invoiceData.length > 0
                  ? invoiceData.map((inv) => ({
                    date: inv.invoicedate || "",
                    service: inv.servicedescription || "",
                    description: inv.description || "",
                    qty: inv.quantity || "0",
                    cost: inv.amount || "0.00",
                    total: inv.totalamount || "0.00",
                  }))
                  : [
                    {
                      date: "",
                      service: "",
                      description: "",
                      qty: "",
                      cost: "",
                      total: "No invoice",
                    },
                  ]
              }
            />
          </TableContainer>
          <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 1.25 }}>
            <StyledTextField
              className="custom-textfield"
              label="Total Cost:"
              value={invoiceData
                .reduce((sum, inv) => sum + parseFloat(inv.totalamount || 0), 0)
                .toFixed(2)}
              variant="outlined"
              InputProps={{ readOnly: true }}
              sx={{ width: isMobile ? "100%" : "auto" }}
            />
          </Box>
          <ResponsiveTypography
            variant="h6"
            sx={{ mt: isMobile ? 1.5 : 2.5, mb: isMobile ? 1.5 : 2.5 }}
          >
            Payment Made
          </ResponsiveTypography>
          <TableContainer sx={{ overflowX: "auto" }}>
            <ResponsiveTable
              columns={["Date", "Payment Type", "Number", "Confirmation", "Amount"]}
              columnWidths={{
                Date: "11%",
                "Payment Type": "29%",
                Number: "20%",
                Confirmation: "20%",
                Amount: "20%",
              }}
              rows={
                paymentData.length > 0
                  ? paymentData.map((pay) => ({
                    date: pay.PaymentDate || "",
                    "payment type": pay.PaymentType || "",
                    number: pay.PaymentNumber || "",
                    confirmation: pay.Confirmation || "",
                    amount: pay.Amount || "0.00",
                  }))
                  : [
                    {
                      date: "",
                      "payment type": "",
                      number: "",
                      confirmation: "",
                      amount: "No payment",
                    },
                  ]
              }
            />
          </TableContainer>
          <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 1.25 }}>
            <StyledTextField
              className="custom-textfield"
              label="Total Cost:"
              value={paymentData
                .reduce((sum, pay) => sum + parseFloat(pay.Amount || 0), 0)
                .toFixed(2)}
              variant="outlined"
              InputProps={{ readOnly: true }}
              sx={{ width: isMobile ? "100%" : "auto" }}
            />
          </Box>
        </SectionPaper>
      )}

      {activeTab === "documentation" && (
        <SectionPaper>
          <TableContainer sx={{ overflowX: "auto" }}>
            <TableStyled>
              <TableHead>
                <TableRow>
                  <TableCell>Document Type</TableCell>
                  <TableCell>Document Name</TableCell>
                  <TableCell>CreatedOn</TableCell>
                  <TableCell>Attachment</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {displayedRows.length > 0 ? (
                  displayedRows.map((doc, index) => (
                    <React.Fragment key={index}>
                      <TableRow className="custom-textfield">
                        <TableCell>
                          <FormControl fullWidth variant="outlined">
                            <InputLabel>Document Type</InputLabel>
                            <Select value={doc.type} label="Document Type" disabled>
                              <MenuItem value="Commercial Invoice">Commercial Invoice</MenuItem>
                              <MenuItem value="Invoice">Invoice</MenuItem>
                              <MenuItem value="Contract">Contract</MenuItem>
                              <MenuItem value="Prepaid Labels">Prepaid Labels</MenuItem>
                            </Select>
                          </FormControl>
                        </TableCell>
                        <TableCell>
                          <TextField
                            fullWidth
                            value={doc.documentName || ""}
                            variant="outlined"
                            InputProps={{ readOnly: true }}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            fullWidth
                            value={doc.createdOn || ""}
                            variant="outlined"
                            InputProps={{ readOnly: true }}
                          />
                        </TableCell>
                        <TableCell>
                          <ResponsiveButton
                            onClick={() => {
                              sessionStorage.setItem("shipmentData", JSON.stringify(shipment));
                              let url = "";
                              if (doc.type === "Commercial Invoice") {
                                url = "/auth/printcommercialinvoice";
                              } else if (doc.type === "Invoice") {
                                url = "/auth/printinvoice";
                              }
                              else if (doc.type === "Prepaid Labels"){
                                url=doc.attachment;
                              }
                              if (url) {
                                window.open(url, "_blank");
                              }
                            }}
                            variant="contained"
                            color="error"
                            sx={{
                              textTransform: "none",
                              fontSize: isMobile ? "0.75rem" : "0.875rem",
                            }}
                          >
                            {/* {doc.attachment} */}
                            VIEW FILE
                          </ResponsiveButton>
                        </TableCell>
                        <TableCell>
                          <ResponsiveButton
                            variant="contained"
                            sx={{
                              backgroundColor: "#ff9800",
                              textTransform: "none",
                              fontSize: isMobile ? "0.75rem" : "0.875rem",
                            }}
                          >
                            {doc.status}
                          </ResponsiveButton>
                        </TableCell>
                        <TableCell>
                          <Tooltip title="Auto" arrow>
                            <IconButton
                              variant="contained"
                              color="primary"
                              sx={{
                                textTransform: "none",
                                fontSize: isMobile ? "0.75rem" : "0.875rem",
                              }}
                            >
                              <InfoIcon />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>

                      {/* Add Prepaid Label row below the Invoice row */}
                      {doc.type === "Invoice" && fromAddress.servicename && userdata.p_prepaid_label !== 0 && (
                        <TableRow className="custom-textfield">
                          <TableCell>
                            <FormControl fullWidth variant="outlined">
                              <InputLabel>Document Type</InputLabel>
                              <Select value="Prepaid Label" label="Document Type" disabled>
                                <MenuItem value="Prepaid Label">Prepaid Label</MenuItem>
                              </Select>
                            </FormControl>
                          </TableCell>
                          <TableCell>
                            <TextField
                              fullWidth
                              // value="Prepaid_Label.pdf"
                              variant="outlined"
                              InputProps={{ readOnly: true }}
                            />
                          </TableCell>
                          <TableCell>
                            <TextField
                              fullWidth
                              value={doc.createdOn || ""}
                              variant="outlined"
                              InputProps={{ readOnly: true }}
                            />
                          </TableCell>
                          <TableCell>
                            <ResponsiveButton
                            disabled={hasGeneratedLabel}
                              onClick={handleGenerateClick} // Updated to open dialog
                              variant="contained"
                              color="error"
                              sx={{
                                textTransform: "none",
                                fontSize: isMobile ? "0.75rem" : "0.875rem",
                              }}
                            >
                              GENERATE
                            </ResponsiveButton>
                          </TableCell>
                          <TableCell>
                            <ResponsiveButton
                              variant="contained"
                              sx={{
                                backgroundColor: "#ff9800",
                                textTransform: "none",
                                fontSize: isMobile ? "0.75rem" : "0.875rem",
                              }}
                            >
                              {doc.status}
                            </ResponsiveButton>
                          </TableCell>
                          <TableCell>
                            <Tooltip title="Auto" arrow>
                              <IconButton
                                variant="contained"
                                color="primary"
                                sx={{
                                  textTransform: "none",
                                  fontSize: isMobile ? "0.75rem" : "0.875rem",
                                }}
                              >
                                <InfoIcon />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6}>
                      <TextField
                        fullWidth
                        value="No documents available"
                        variant="outlined"
                        InputProps={{ readOnly: true }}
                      />
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </TableStyled>
          </TableContainer>

          {/* Confirmation Dialog */}
          <Dialog
            open={openDialog}
            onClose={handleCancelGenerate}
            aria-labelledby="confirm-dialog-title"
            aria-describedby="confirm-dialog-description"
          >
            <DialogTitle id="confirm-dialog-title" sx={{ fontWeight: "550" }}>Confirm you want to generate label</DialogTitle>
            <DialogContent>
              <DialogContentText id="confirm-dialog-description">
                Are you sure want to generate label for this service?
              </DialogContentText>
            </DialogContent>
            <DialogActions>
              <ResponsiveButton
                onClick={handleCancelGenerate}
                variant="contained"
                sx={{ textTransform: "none", background: "grey" }}
              >
                Cancel
              </ResponsiveButton>
              <ResponsiveButton
                onClick={handleConfirmGenerate}
                variant="contained"
                sx={{ textTransform: "none", background: "#C30AC9" }}
              >
                Yes
              </ResponsiveButton>
            </DialogActions>
          </Dialog>
          <Dialog
            open={errorDialogOpen}
            onClose={handleErrorDialogClose}
            aria-labelledby="error-dialog-title"
            aria-describedby="error-dialog-description"
            sx={{
              "& .MuiDialog-paper": {
                borderRadius: "8px",
                width: "500px",
                maxWidth: "90vw",
                padding: "24px",
                boxSizing: "border-box",
              },
            }}
          >
            <DialogContent sx={{ padding: 0 }}>
              <Box sx={{ mb: 2 }}>
                <Typography
                  sx={{
                    color: "#d32f2f",
                    fontWeight: "bold",
                    fontSize: "1rem",
                    mb: 2,
                  }}
                >
                  X The commodity description is vague and requires clarification.
                </Typography>
                <DialogTitle
                  id="error-dialog-title"
                  sx={{ fontWeight: "550", fontSize: "1.25rem", padding: 0, mb: 2 }}
                >
                  Tips for accurate descriptions
                </DialogTitle>
                <Box
                  id="error-dialog-description"
                  sx={{ overflowX: "auto" }}
                >
                  <table
                    style={{
                      width: "100%",
                      borderCollapse: "collapse",
                      fontSize: "0.875rem",
                    }}
                  >
                    <thead>
                      <tr style={{ backgroundColor: "#f5f5f5" }}>
                        <th
                          style={{
                            border: "1px solid #ddd",
                            padding: "12px",
                            textAlign: "left",
                            fontWeight: "bold",
                          }}
                        >
                          Bad description
                        </th>
                        <th
                          style={{
                            border: "1px solid #ddd",
                            padding: "12px",
                            textAlign: "left",
                            fontWeight: "bold",
                          }}
                        >
                          Good description
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td style={{ border: "1px solid #ddd", padding: "12px" }}>
                          Parts
                        </td>
                        <td style={{ border: "1px solid #ddd", padding: "12px" }}>
                          Two steel springs for woodworking machine
                        </td>
                      </tr>
                      <tr>
                        <td style={{ border: "1px solid #ddd", padding: "12px" }}>
                          Gift
                        </td>
                        <td style={{ border: "1px solid #ddd", padding: "12px" }}>
                          One men's knitted sweater (100% cotton)
                        </td>
                      </tr>
                      <tr>
                        <td style={{ border: "1px solid #ddd", padding: "12px" }}>
                          Samples
                        </td>
                        <td style={{ border: "1px solid #ddd", padding: "12px" }}>
                          200cm x 400cm nylon carpet samples
                        </td>
                      </tr>
                      <tr>
                        <td style={{ border: "1px solid #ddd", padding: "12px" }}>
                          Documents
                        </td>
                        <td style={{ border: "1px solid #ddd", padding: "12px" }}>
                          30 pages of legal documents
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </Box>
              </Box>
            </DialogContent>
            <DialogActions sx={{ justifyContent: "flex-end", padding: 0, mt: 2 }}>
              <ResponsiveButton
                onClick={handleErrorDialogClose}
                variant="contained"
                sx={{ textTransform: "none", background: "#C30AC9" }}
              >
                OK
              </ResponsiveButton>
            </DialogActions>
          </Dialog>
          {/* Loading Spinner */}
          {isLoading && (
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              zIndex: 1300,
              width: '100%',
              height: '100%',
              backdropFilter: 'blur(1px)',
              backgroundColor: 'rgba(0,0,0,0.3)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
            }}>
              <CircularProgress size={60} thickness={4}  sx={{color:"#fff"}}/>
            </div>
          )}


          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              mt: 1.25,
              alignItems: "center",
              flexDirection: isMobile ? "column" : "row",
              gap: isMobile ? 1 : 0,
            }}
          >
            <ResponsiveButton
              variant="contained"
              onClick={handlePreviousPage}
              disabled={page === 0}
              sx={{
                backgroundColor: page === 0 ? "#e0e0e0" : undefined,
                color: page === 0 ? "#757575" : undefined,
                textTransform: "none",
              }}
            >
              Previous
            </ResponsiveButton>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: isMobile ? 1 : 1.25,
                flexDirection: isMobile ? "column" : "row",
              }}
            >
              <ResponsiveTypography sx={{ fontSize: "14px" }}>
                Page {page + 1} of {Math.ceil(documents.length / rowsPerPage)}
              </ResponsiveTypography>
              <Select
                value={rowsPerPage}
                onChange={handleRowsPerPageChange}
                sx={{ width: isMobile ? "100%" : "100px", height: "2rem", fontSize: "0.75rem" }}
              >
                {[5, 10, 20, 25, 50, 100].map((value) => (
                  <MenuItem key={value} value={value} sx={{ fontSize: "0.75rem" }}>
                    {value} rows
                  </MenuItem>
                ))}
              </Select>
            </Box>
            <ResponsiveButton
              variant="contained"
              onClick={handleNextPage}
              disabled={page >= Math.ceil(documents.length / rowsPerPage) - 1}
              sx={{
                backgroundColor:
                  page >= Math.ceil(documents.length / rowsPerPage) - 1
                    ? "#e0e0e0"
                    : undefined,
                color:
                  page >= Math.ceil(documents.length / rowsPerPage) - 1
                    ? "#757575"
                    : undefined,
                textTransform: "none",
              }}
            >
              Next
            </ResponsiveButton>
          </Box>
        </SectionPaper>
      )}


      <ButtonContainer>
        <ResponsiveButton
          variant="contained"
          color="error"
          onClick={handleBack}
          sx={{ textTransform: "none" }}
        >
          BACK TO MY SHIPMENT
        </ResponsiveButton>
      </ButtonContainer>
      <Box className="footer-box">
        <Typography className={classes.footerTypography} sx={{ mt: 2, fontSize: "0.75rem", textAlign: { xs: "center", sm: "right" }, }}>
          All Rights Reserved. Site Powered by{" "}
          <span
            className={`${classes.sflLink} sfl-link`}
            onClick={() => window.open("https://sflworldwide.com/", "_blank")}
          >
            SFL Worldwide
          </span>
        </Typography>
      </Box>
    </Box>
  );
};

export default Myshipmentnew;