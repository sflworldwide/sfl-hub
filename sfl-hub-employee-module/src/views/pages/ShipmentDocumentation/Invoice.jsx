import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import {
  Box,
  Typography,
  Table,
  TableContainer,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Paper,
  Link,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import { format, addDays, isValid } from "date-fns";

// Styled components (unchanged)
const InvoiceContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(3),
  maxWidth: "800px",
  margin: "0 auto",
  border: "1px solid #000",
  fontFamily: "Arial, sans-serif",
}));

const Header = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: theme.spacing(2),
}));

const Logo = styled("img")({
  width: "250px",
  // Responsive styling for mobile screens
  "@media (max-width: 600px)": {
    width: "150px", // Logo width for smaller screens (mobile)
  },
});

const CompanyDetails = styled(Box)(({ theme }) => ({
  textAlign: "right",
  "& p": {
    margin: 0,
    fontSize: "0.8rem",
  },
}));

const TableStyled = styled(Table)({
  "& th, & td": {
    border: "1px solid #000",
    padding: "4px 8px",
    fontSize: "0.8rem",
  },
  "& th": {
    backgroundColor: "#f0f0f0",
    fontWeight: "bold",
  },
});

const PaymentTerms = styled(Box)(({ theme }) => ({
  marginTop: theme.spacing(2),
  fontSize: "0.75rem",
  "& p": {
    margin: "2px 0",
  },
}));

const PaymentMethods = styled(Box)(({ theme }) => ({
  marginTop: theme.spacing(1),
  border: "1px solid #000",
  padding: theme.spacing(1),
  "& table": {
    width: "100%",
    borderCollapse: "collapse",
  },
  "& th, & td": {
    // border: "1px solid #000",
    padding: "4px",
    fontSize: "0.75rem",
    textAlign: "left",
    width: "25%", 
    boxSizing: "border-box",
  },
  "& th": {
    backgroundColor: "#f0f0f0",
    fontWeight: "bold",
    border: "1px solid #000"
  },
  "& a": {
    color: "red",
    textDecoration: "none",
  },
}));
const Footer = styled(Box)(({ theme }) => ({
  marginTop: theme.spacing(2),
  border: "1px solid #000",
  padding: theme.spacing(1),
  fontSize: "0.7rem",
  textAlign: "center",
}));

const PrintInvoice = () => {
  const location = useLocation();
  const shipment = JSON.parse(sessionStorage.getItem("shipmentData"));

  // Local state to hold processed data
  const [state, setState] = useState({
    shipmentInfo: {},
    fromAddress: {},
    toAddress: {},
    packageDetails: {},
    services: [],
    grossAmount: 0,
    paidAmount: 0,
    balance: 0,
  });

  useEffect(() => {
    const shipment = JSON.parse(sessionStorage.getItem("shipmentData"));
    if (shipment) {
      const shipmentInfo = shipment?.SHIPMENTINFO?.[0] || {};
      const shipmentDetails = shipment?.SHIPMENTDETAILS || []; // Corrected from SHIP_DETAILS
      const commercial = shipment?.COMMERCIAL || [];
      const packageDetails = shipment?.PACKAGE?.[0] || {};
      const accountsDetails = shipment?.ACCOUNTSDETAILS || [];

      // From and To addresses
      const fromAddress = shipmentDetails.find((detail) => detail.entitytype === "FromAddress") || {};
      const toAddress = shipmentDetails.find((detail) => detail.entitytype === "ToAddress") || {};

      // Service data
      const services = accountsDetails.length > 0
        ? accountsDetails.map((inv) => ({
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
              qty: "0",
              cost: "0.00",
              total: "No invoice",
            },
          ];

      // Financial calculations
      const grossAmount = accountsDetails.reduce(
        (sum, inv) => sum + parseFloat(inv.totalamount || 0),
        0
      );
      const paidAmount = accountsDetails.reduce(
        (sum, acc) => sum + (acc.PaymentReceivedData?.reduce((s, p) => s + parseFloat(p.Amount || 0), 0) || 0),
        0
      );
      const balance = grossAmount - paidAmount;

setState({
        shipmentInfo: {
          trackingNumber: shipmentInfo.trackingnumber || "",
          shipmentDate: shipmentInfo.shipmentdate || "",
          shipmentType: shipmentInfo.shipmenttype || "",
          managedByName: shipmentInfo.managedbyname || "",
          invoiceDueDate: shipmentInfo.invoiceduedate || "",
        },
        fromAddress: {
          contactName: fromAddress.contactname || "",
          addressLine1: fromAddress.addressline1 || "",
          city: fromAddress.city || "",
          state: fromAddress.state || "",
          countryName: fromAddress.countryname || "",
          postalCode: fromAddress.zipcode || "",
          phone1: fromAddress.phone1 || "",
        },
        toAddress: {
          contactName: toAddress.contactname || "",
          addressLine1: toAddress.addressline1 || "",
          city: toAddress.city || "",
          state: toAddress.state || "",
          countryName: toAddress.countryname || "",
          postalCode: toAddress.zipcode || "",
          phone1: toAddress.phone1 || "",
        },
        packageDetails: {
          packagecontent: packageDetails.packagecontent || "",
          totalpackages: packageDetails.totalpackages || 0,
        },
        services,
        grossAmount,
        paidAmount,
        balance,
      });

      // Debug: Log the shipment data
      console.log("PrintInvoice - Shipment Data:", shipment);
    }
  }, [shipment]);

  // Format address
  const formatAddress = (address) =>
    `${address.addressLine1 || ""}, ${address.city || ""}, ${address.state || ""}, ${address.countryName || ""
    } - ${address.postalCode || ""}`;

  // Format date
  const formatDate = (date) => {
    if (!date) return "N/A";
    const parsedDate = new Date(date);
    return isValid(parsedDate) ? format(parsedDate, "MM/dd/yyyy") : "N/A";
  };

  // Calculate due date
  const dueDate = state.shipmentInfo.invoiceDueDate
    ? formatDate(state.shipmentInfo.invoiceDueDate)
    : state.shipmentInfo.shipmentDate
      ? format(addDays(new Date(state.shipmentInfo.shipmentDate), 7), "MM/dd/yyyy")
      : "N/A";

  // If no shipment data, show error
  if (!shipment) {
    return (
      <Box sx={{ p: 2, color: "error.main", textAlign: "center" }}>
        <Typography variant="h6">No shipment data available for invoice.</Typography>
      </Box>
    );
  }

  const { shipmentInfo, fromAddress, toAddress, packageDetails, services, grossAmount, paidAmount, balance } = state;

  return (
    <InvoiceContainer>
      {/* Header */}
      <Header>
        <Box>
          <Logo src="/SFL_logo.png" alt="SFL Worldwide Logo" />
        </Box>
        <CompanyDetails>
          <Typography variant="h6" fontSize="0.85rem">
            SFL Worldwide LLC
          </Typography>
          <Typography>3364 Garden Brook Drive, Farmers Branch, TX 75234</Typography>
          <Typography>Phone: 972-255-7447 Fax: 1-868-609-0778</Typography>
        </CompanyDetails>
      </Header>

      <Typography variant="h4" align="center" gutterBottom fontSize="1.5rem" fontWeight={600}>
        INVOICE
      </Typography>

      {/* Invoice Details Table */}
      <TableContainer component={Paper} sx={{ border: "1px solid black" }}>
        <Table>
          <TableBody>
            <TableRow>
              <TableCell
                rowSpan={2}
                sx={{
                  border: "1px solid black",
                  verticalAlign: "top",
                  width: "50%",
                  padding: "6px",
                  height: "70px",
                }}
              >
                <Typography fontWeight="bold" sx={{ fontSize: "0.75rem" }}>
                  From: {fromAddress.contactName}
                </Typography>
                <Typography sx={{ fontSize: "0.75rem" }}>{formatAddress(fromAddress)}</Typography>
                <Typography sx={{ fontSize: "0.75rem" }}>{fromAddress.phone1}</Typography>
              </TableCell>
              <TableCell sx={{ border: "1px solid black", height: "35px", verticalAlign: "top", padding: "6px" }}>
                <Typography fontWeight="bold" sx={{ fontSize: "0.75rem" }}>
                  Invoice Number
                </Typography>
                <Typography sx={{ fontSize: "0.75rem" }}>{shipmentInfo.trackingNumber}</Typography>
              </TableCell>
              <TableCell sx={{ border: "1px solid black", height: "35px", verticalAlign: "top", padding: "6px" }}>
                <Typography fontWeight="bold" sx={{ fontSize: "0.75rem" }}>
                  Invoice Date
                </Typography>
                <Typography sx={{ fontSize: "0.75rem" }}>{formatDate(shipmentInfo.shipmentDate)}</Typography>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell sx={{ border: "1px solid black", height: "35px", verticalAlign: "top", padding: "6px" }}>
                <Typography fontWeight="bold" sx={{ fontSize: "0.75rem" }}>
                  Tracking Number
                </Typography>
                <Typography sx={{ fontSize: "0.75rem" }}>{shipmentInfo.trackingNumber}</Typography>
              </TableCell>
              <TableCell sx={{ border: "1px solid black", height: "35px", verticalAlign: "top", padding: "6px" }}>
                <Typography fontWeight="bold" sx={{ fontSize: "0.75rem" }}>
                  Booking Date
                </Typography>
                <Typography sx={{ fontSize: "0.75rem" }}>{formatDate(shipmentInfo.shipmentDate)}</Typography>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell
                rowSpan={2}
                sx={{
                  border: "1px solid black",
                  verticalAlign: "top",
                  width: "35%",
                  padding: "6px",
                  height: "70px",
                }}
              >
                <Typography fontWeight="bold" sx={{ fontSize: "0.75rem" }}>
                  To: {toAddress.contactName}
                </Typography>
                <Typography sx={{ fontSize: "0.75rem" }}>{formatAddress(toAddress)}</Typography>
                <Typography sx={{ fontSize: "0.75rem" }}>{toAddress.phone1}</Typography>
              </TableCell>
              <TableCell sx={{ border: "1px solid black", height: "35px", verticalAlign: "top", padding: "6px" }}>
                <Typography fontWeight="bold" sx={{ fontSize: "0.75rem" }}>
                  Mode of Shipment
                </Typography>
                <Typography sx={{ fontSize: "0.75rem" }}>{shipmentInfo.shipmentType}</Typography>
              </TableCell>
              <TableCell sx={{ border: "1px solid black", height: "35px", verticalAlign: "top", padding: "6px" }}>
                <Typography fontWeight="bold" sx={{ fontSize: "0.75rem" }}>
                  Invoice Due Date
                </Typography>
                <Typography sx={{ fontSize: "0.75rem" }}>{dueDate}</Typography>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell
                colSpan={2}
                sx={{ border: "1px solid black", height: "35px", verticalAlign: "top", padding: "6px" }}
              >
                <Typography fontWeight="bold" sx={{ fontSize: "0.75rem" }}>
                  Sales Representative
                </Typography>
                <Typography sx={{ fontSize: "0.75rem" }}>{shipmentInfo.managedByName}</Typography>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>

      {/* Service Type Table */}
      <Box sx={{ mt: 1 }}>
        <TableContainer component={Paper} sx={{ border: "1px solid black" }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ height: "20px" }}>
                <TableCell
                  scope="col"
                  sx={{ border: "1px solid black", fontWeight: "bold", fontSize: "0.8rem", padding: "3px" }}
                >
                  Service Type - Description
                </TableCell>
                <TableCell
                  scope="col"
                  sx={{ border: "1px solid black", fontWeight: "bold", fontSize: "0.8rem", width: 60, padding: "3px" }}
                  align="center"
                >
                  Quantity
                </TableCell>
                <TableCell
                  scope="col"
                  sx={{ border: "1px solid black", fontWeight: "bold", fontSize: "0.8rem", width: 60, padding: "3px" }}
                  align="center"
                >
                  Cost
                </TableCell>
                <TableCell
                  scope="col"
                  sx={{ border: "1px solid black", fontWeight: "bold", fontSize: "0.8rem", width: 80, padding: "3px" }}
                  align="center"
                >
                  Total Cost
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {services.map((service, index) => (
                <TableRow key={index} sx={{ height: "20px" }}>
                  <TableCell sx={{ border: "1px solid black", fontSize: "0.8rem", padding: "3px" }}>
                    {service.service || ""}:{service.description || ""}
                  </TableCell>
                  <TableCell sx={{ border: "1px solid black", fontSize: "0.8rem", padding: "3px" }} align="center">
                    {service.qty || packageDetails.totalpackages || ""}
                  </TableCell>
                  <TableCell sx={{ border: "1px solid black", fontSize: "0.8rem", padding: "3px" }} align="center">
                    ${Number(service.cost || 0).toFixed(2)}
                  </TableCell>
                  <TableCell sx={{ border: "1px solid black", fontSize: "0.8rem", padding: "3px" }} align="center">
                    ${Number(service.total || 0).toFixed(2)}
                  </TableCell>
                </TableRow>
              ))}
              {[...Array(9 - services.length)].map((_, index) => (
                <TableRow key={`empty-${index}`} sx={{ height: "20px" }}>
                  <TableCell sx={{ border: "1px solid black", fontSize: "0.8rem", padding: "3px" }}>

                  </TableCell>
                  <TableCell sx={{ border: "1px solid black", fontSize: "0.8rem", padding: "3px" }} align="center">

                  </TableCell>
                  <TableCell sx={{ border: "1px solid black", fontSize: "0.8rem", padding: "3px" }} align="center">

                  </TableCell>
                  <TableCell sx={{ border: "1px solid black", fontSize: "0.8rem", padding: "3px" }} align="center">

                  </TableCell>
                </TableRow>
              ))}
              <TableRow sx={{ height: "20px", borderTop: "1px solid black" }}>
                <TableCell colSpan={2} sx={{ border: "1px solid black" }} /> 
                <TableCell sx={{ border: "1px solid black", fontWeight: "bold", fontSize: "0.8rem", padding: "3px", whiteSpace: "nowrap" }}>
                  Gross Amount:
                </TableCell>
                <TableCell sx={{ border: "1px solid black", fontSize: "0.8rem", padding: "3px" }} align="right">
                  ${grossAmount.toFixed(2)}
                </TableCell>
              </TableRow>
              <TableRow sx={{ height: "20px" }}>
                <TableCell colSpan={2} sx={{ border: "1px solid black" }} /> 
                <TableCell sx={{ border: "1px solid black", fontWeight: "bold", fontSize: "0.8rem", padding: "3px" }}>
                  Paid on:
                </TableCell>
                <TableCell sx={{ border: "1px solid black", fontSize: "0.8rem", padding: "3px" }} align="right">
                  ${paidAmount.toFixed(2)}
                </TableCell>
              </TableRow>
              <TableRow sx={{ height: "20px" }}>
                <TableCell colSpan={2} sx={{ border: "1px solid black" }} /> 
                <TableCell sx={{ border: "1px solid black", fontWeight: "bold", fontSize: "0.8rem", padding: "3px" }}>
                  Balance:
                </TableCell>
                <TableCell sx={{ border: "1px solid black", fontSize: "0.8rem", padding: "3px" }} align="right">
                  ${balance.toFixed(2)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {/* Payment Terms */}
        <PaymentMethods>
            <PaymentTerms sx={{ mt: -1 }}>
              <Typography fontWeight="bold" fontSize="0.8rem">
                PAYMENT TERMS:
              </Typography>
              <Typography fontSize="0.8rem">
                All charges, as above, must be paid by check or wire transfer within seven days from the receipt of our invoice
                for pickup of your shipment. Credit Card will be only accepted for payment under $500.00 and credit card fees
                will be charged at 3% if payment is being made by Credit Card, if payment is not made by due date fees of
                $35.00 and interest of 14.69% per annum will be applied.
              </Typography>
            </PaymentTerms>
            <Typography fontWeight="bold" fontSize="0.8rem" mt="10px">
              Method of Payment
            </Typography>
            <Box sx={{ overflowX: "auto", marginTop: "1rem" }}>
            <Table sx={{ mt: 2 }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontSize: "0.7rem" }}>Zelle Payment</TableCell>
                  <TableCell sx={{ fontSize: "0.7rem" }}>Bank (ACH) Payment</TableCell>
                  <TableCell sx={{ fontSize: "0.7rem" }}>Credit Card Payment</TableCell>
                  <TableCell sx={{ fontSize: "0.7rem" }}>Pay by Mail</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell sx={{ fontSize: "0.7rem",border: "1px solid #000",borderBottom:"none"}}>
                    Zelle payment is fast, safe and secure free bank to bank transfer via your email or phone number.
                  </TableCell>
                  <TableCell sx={{ fontSize: "0.7rem",border: "1px solid #000",borderBottom:"none" }}>
                    ACH payment is safe, secure and free electronic bank-to-bank payment authorized in USA.
                  </TableCell>
                  <TableCell sx={{ fontSize: "0.7rem" ,border: "1px solid #000",borderBottom:"none"}}>
                    On type and value of shipment, credit card fees may be applied on the credit card payments.
                  </TableCell>
                  <TableCell sx={{ fontSize: "0.7rem" ,border: "1px solid #000",borderBottom:"none"}}>
                    Below our registered address to mail physical check for your shipment.
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontSize: "0.7rem",border: "1px solid #000",borderTop:"none" }}>
                    Zelle Email: <a href="mailto:contact@SFLWorldwide.com">contact@SFLWorldwide.com</a>
                    <br />
                    Zelle Name: SFL Worldwide LLC
                    <br />
                    <Typography color="red" fontSize="0.7rem">
                      Please mention tracking number in memo field
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ fontSize: "0.7rem" ,border: "1px solid #000",borderTop:"none"}}>
                    <a href="https://www.sflworldwide.com/pay">www.sflworldwide.com/pay</a>
                  </TableCell>
                  <TableCell sx={{ fontSize: "0.7rem" ,border: "1px solid #000",borderTop:"none"}}>
                    <a href="https://www.sflworldwide.com/pay">www.sflworldwide.com/pay</a>
                  </TableCell>
                  <TableCell sx={{ fontSize: "0.7rem" ,border: "1px solid #000",borderTop:"none"}}>
                    SFL Worldwide LLC
                    <br />
                    3364 Garden Brook Drive
                    <br />
                    Farmers Branch, TX 75063
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
           </Box>
          </PaymentMethods>
      {/* Footer */}
      <Footer>
        <Typography fontSize="0.7rem">Subject To Texas - United States Jurisdiction</Typography>
        <Typography fontSize="0.7rem">
          <Link href="mailto:contact@SFLWorldwide.com" underline="hover">
            contact@SFLWorldwide.com
          </Link>{" "}
          |{" "}
          <Link href="https://www.SFLWorldwide.com" target="_blank" underline="hover">
            www.SFLWorldwide.com
          </Link>{" "}
          | SFL WORLDWIDE LLC | FMC Licence No.: <strong>025184</strong>
        </Typography>
      </Footer>
    </InvoiceContainer>
  );
};

export default PrintInvoice;