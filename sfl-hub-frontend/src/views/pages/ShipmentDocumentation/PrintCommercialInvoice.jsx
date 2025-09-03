import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import moment from "moment";
// import { CommonConfig } from "../../../utils/constant";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Paper,
  Box,
  Select,
  MenuItem,
  Typography,
} from "@mui/material";
import { styled } from "@mui/material/styles";

const StyledTable = styled(Table)({
  width: "100%",
  background: "#fff",
  borderCollapse: "collapse",
  borderSpacing: "1px",
});

const StyledTableCell = styled(TableCell)({
  textAlign: "left",
  border: "1px solid #000",
  color: "#000",
  fontSize: "12px",
  padding: "0px 5px",
  height: "23px",
  "&.center": {
    textAlign: "center",
  },
  "&.bg-grey": {
    background: "rgb(221, 235, 247)",
  },
});

const StyledTableHeadCell = styled(StyledTableCell)({
  fontWeight: 600,
});

const StyledTableBodyCell = styled(StyledTableCell)({
  fontWeight: 400,
});

const PrintContainer = styled(Paper)({
  maxWidth: "800px",
  width: "100%",
  margin: "30px auto",
});

const PrintCommercialInvoice = () => {
  const location = useLocation();
  const shipment = JSON.parse(sessionStorage.getItem("shipmentData"));

  const [state, setState] = useState({
    FromAddress: {},
    FromCountryName: "",
    ToCountryName: "",
    ToAddress: {},
    TrackingNumberList: [],
    TotalCost: 0,
    TrackingNumber: "",
    MaxPackageNumber: 0,
    CurrentTrackingNumber: "",
    ServiceName: "",
    CommercialItems: [], // Added to store commercial invoice items
  });

  useEffect(() => {

    if (shipment) {
      const shipmentInfo = shipment?.SHIPMENTINFO?.[0] || {};
      const fromAddress =
        shipment?.SHIPMENTDETAILS?.find((d) => d.entitytype === "FromAddress") || {};
      const toAddress =
        shipment?.SHIPMENTDETAILS?.find((d) => d.entitytype === "ToAddress") || {};
      const commercialItems = shipment?.COMMERCIAL || [];

      setState({
        FromAddress: {
          ShipmentDate: shipmentInfo.shipmentdate || "",
          CompanyName: fromAddress.companyname || "",
          ContactName: fromAddress.contactname || "",
          AddressLine1: fromAddress.addressline1 || "",
          AddressLine2: fromAddress.addressline2 || "",
          AddressLine3: fromAddress.addressline3 || "",
          City: fromAddress.city || "",
          State: fromAddress.state || "",
          ZipCode: fromAddress.zipcode || "",
          Phone1: fromAddress.phone1 || "",
          Email: fromAddress.email || "",
        },
        FromCountryName: fromAddress.countryname || "",
        ToCountryName: toAddress.countryname || "",
        ToAddress: {
          CompanyName: toAddress.companyname || "",
          ContactName: toAddress.contactname || "",
          AddressLine1: toAddress.addressline1 || "",
          AddressLine2: toAddress.addressline2 || "",
          AddressLine3: toAddress.addressline3 || "",
          City: toAddress.city || "",
          State: toAddress.state || "",
          ZipCode: toAddress.zipcode || "",
          Phone1: toAddress.phone1 || "",
          Email: toAddress.email || "",
        },
        TrackingNumberList: [
          { TrackingNumber: shipmentInfo.trackingnumber || "" },
        ],
        TotalCost: commercialItems
          .reduce((sum, item) => sum + parseFloat(item.totalvalue || 0), 0)
          .toFixed(2),
        TrackingNumber: shipmentInfo.trackingnumber || "",
        MaxPackageNumber: fromAddress.totalpackages || 0,
        CurrentTrackingNumber: shipmentInfo.trackingnumber || "",
        ServiceName: shipmentInfo.shipmenttype || "",
        CommercialItems: commercialItems.map((item) => ({
          packagenumber: item.packagenumber || 0,
          contentdescription: item.contentdescription || "",
          quantity: item.quantity || 0,
          valueperquantity: item.valueperquantity || "0.00",
          totalvalue: item.totalvalue || "0.00",
        })),
      });
    }
  }, []);

  const renderTrackingNumber = () => {
    return state.TrackingNumberList.map((tracking) => (

      <MenuItem key={tracking.TrackingNumber} value={tracking.TrackingNumber} sx={{ fontSize: "0.75rem", height: "2rem" }}>
        {tracking.TrackingNumber}
      </MenuItem>
    ));
  };

  const {
    FromAddress,
    ToAddress,
    FromCountryName,
    ToCountryName,
    TotalCost,
    TrackingNumber,
    MaxPackageNumber,
    CurrentTrackingNumber,
    ServiceName,
    CommercialItems,
  } = state;

  return (
    <PrintContainer elevation={0} id="printCommercial">
      <StyledTable>
        <TableBody>
          <TableRow>
            <StyledTableHeadCell colSpan={7} className="center bg-grey">
              <Typography variant="h6" sx={{ fontWeight: 600 }}>COMMERCIAL INVOICE</Typography>
            </StyledTableHeadCell>
          </TableRow>
          <TableRow>
            <StyledTableHeadCell colSpan={3} className="bg-grey">
              DATE OF EXPORTATION
            </StyledTableHeadCell>
            <StyledTableHeadCell colSpan={4} className="bg-grey">
              EXPORT REFERENCE - SFL TN
            </StyledTableHeadCell>
          </TableRow>
          <TableRow>
            <StyledTableBodyCell colSpan={4} sx={{ borderRight: "none" }}>
              {moment(FromAddress.ShipmentDate).format("MM/DD/YYYY")}
            </StyledTableBodyCell>
            <StyledTableBodyCell colSpan={3} sx={{ borderLeft: "none" }}>
              {TrackingNumber}
            </StyledTableBodyCell>
          </TableRow>
          <TableRow>
            <StyledTableHeadCell colSpan={3} className="bg-grey">
              SHIPPER / EXPORTER
            </StyledTableHeadCell>
            <StyledTableHeadCell colSpan={4} className="bg-grey">
              CONSIGNEE
            </StyledTableHeadCell>
          </TableRow>
          {ToAddress.CompanyName !== "" && (
            <TableRow>
              <StyledTableHeadCell colSpan={3}>
                COMPANY NAME: {FromAddress.CompanyName}
              </StyledTableHeadCell>
              <StyledTableHeadCell colSpan={4}>
                COMPANY NAME: {ToAddress.CompanyName}
              </StyledTableHeadCell>
            </TableRow>
          )}
          <TableRow>
            <StyledTableHeadCell colSpan={3}>
              COMPLETE NAME: {FromAddress.ContactName}
            </StyledTableHeadCell>
            <StyledTableHeadCell colSpan={4}>
              COMPLETE NAME: {ToAddress.ContactName}
            </StyledTableHeadCell>
          </TableRow>
          <TableRow>
            <StyledTableHeadCell colSpan={3}>ADDRESS</StyledTableHeadCell>
            <StyledTableHeadCell colSpan={4}>ADDRESS</StyledTableHeadCell>
          </TableRow>
          <TableRow>
            <StyledTableBodyCell colSpan={3} sx={{ verticalAlign: "top" }}>
              {FromAddress.AddressLine1}
              {FromAddress.AddressLine2 ? ", " + FromAddress.AddressLine2 : null}
              {FromAddress.AddressLine3 ? ", " + FromAddress.AddressLine3 : null}
            </StyledTableBodyCell>
            <StyledTableBodyCell colSpan={4}>
              {ToAddress.AddressLine1}
              {ToAddress.AddressLine2 ? ", " + ToAddress.AddressLine2 : null}
              {ToAddress.AddressLine3 ? ", " + ToAddress.AddressLine3 : null}
            </StyledTableBodyCell>
          </TableRow>

          <TableRow>
            <StyledTableBodyCell colSpan={3}>
              {FromAddress.City}, {FromAddress.State} - {FromAddress.ZipCode},{" "}
              {FromCountryName}
            </StyledTableBodyCell>
            <StyledTableBodyCell colSpan={4}>
              {ToAddress.City}, {ToAddress.State} - {ToAddress.ZipCode},{" "}
              {ToCountryName}
            </StyledTableBodyCell>
          </TableRow>
          <TableRow>
            <StyledTableHeadCell colSpan={3} className="bg-grey">
              CONTACT NUMBER: {FromAddress.Phone1}
            </StyledTableHeadCell>
            <StyledTableHeadCell colSpan={4} className="bg-grey">
              CONTACT NUMBER: {ToAddress.Phone1}
            </StyledTableHeadCell>
          </TableRow>
          <TableRow>
            <StyledTableHeadCell colSpan={3} className="bg-grey">
              EMAIL ID: {FromAddress.Email}
            </StyledTableHeadCell>
            <StyledTableHeadCell colSpan={4} className="bg-grey">
              EMAIL ID: {ToAddress.Email}
            </StyledTableHeadCell>
          </TableRow>
          <TableRow>
            <StyledTableHeadCell colSpan={3} className="bg-grey">
              COUNTRY OF EXPORT
            </StyledTableHeadCell>
            <StyledTableHeadCell colSpan={4} className="bg-grey">
              IMPORTER IF OTHER THAN CONSIGNEE
            </StyledTableHeadCell>
          </TableRow>
          <TableRow>
            <StyledTableBodyCell colSpan={3}>{FromCountryName}</StyledTableBodyCell>
            <StyledTableBodyCell colSpan={4} rowSpan={3}></StyledTableBodyCell>
          </TableRow>
          <TableRow>
            <StyledTableHeadCell colSpan={3} className="bg-grey">
              COUNTRY OF ORIGIN OF GOODS
            </StyledTableHeadCell>
          </TableRow>
          <TableRow>
            <StyledTableBodyCell colSpan={4}>{FromCountryName}</StyledTableBodyCell>
          </TableRow>
          <TableRow>
            <StyledTableHeadCell colSpan={3} className="bg-grey">
              COUNTRY OF ULTIMATE DESTINATION
            </StyledTableHeadCell>
            <StyledTableHeadCell colSpan={4} className="bg-grey">
              INTERNATIONAL AWB NO
            </StyledTableHeadCell>
          </TableRow>
          <TableRow>
            <StyledTableBodyCell colSpan={3}>{ToCountryName}</StyledTableBodyCell>
            <StyledTableBodyCell colSpan={4}>
              <Select
                value={CurrentTrackingNumber}
                displayEmpty
                fullWidth
                sx={{ fontSize: "0.75rem", height: "2rem" }}
              >
                <MenuItem value="" sx={{ fontSize: "0.75rem", height: "2rem" }}>Select Tracking Number</MenuItem>
                {renderTrackingNumber()}
              </Select>
            </StyledTableBodyCell>
          </TableRow>
          <TableRow>
            <StyledTableHeadCell className="bg-grey">Mark No.</StyledTableHeadCell>
            <StyledTableHeadCell className="bg-grey">No. of Packages</StyledTableHeadCell>
            <StyledTableHeadCell className="bg-grey">Complete desc. of Goods</StyledTableHeadCell>
            <StyledTableHeadCell className="bg-grey">Quantity</StyledTableHeadCell>
            <StyledTableHeadCell className="bg-grey" sx={{ maxWidth: 42 }}>
              Unit Value
            </StyledTableHeadCell>
            <StyledTableHeadCell className="bg-grey" sx={{ width: "15%" }}>
              Total Value
            </StyledTableHeadCell>
            <StyledTableHeadCell className="bg-grey">Currency USD/Dest</StyledTableHeadCell>
          </TableRow>
          {CommercialItems.map((item, index) => (
            <TableRow key={index}>
              <StyledTableBodyCell>{item.packagenumber}</StyledTableBodyCell>
              <StyledTableBodyCell>{MaxPackageNumber}</StyledTableBodyCell>
              <StyledTableBodyCell>{item.contentdescription}</StyledTableBodyCell>
              <StyledTableBodyCell>{item.quantity}</StyledTableBodyCell>
              <StyledTableBodyCell>{item.valueperquantity}</StyledTableBodyCell>
              <StyledTableBodyCell>{item.totalvalue}</StyledTableBodyCell>
              <StyledTableBodyCell>USD</StyledTableBodyCell>
            </TableRow>
          ))}
          {/* Added 3 empty rows for design */}
          {[...Array(9)].map((_, index) => (
            <TableRow key={`empty-${index}`}>
              <StyledTableBodyCell>&nbsp;</StyledTableBodyCell>
              <StyledTableBodyCell>&nbsp;</StyledTableBodyCell>
              <StyledTableBodyCell>&nbsp;</StyledTableBodyCell>
              <StyledTableBodyCell>&nbsp;</StyledTableBodyCell>
              <StyledTableBodyCell>&nbsp;</StyledTableBodyCell>
              <StyledTableBodyCell>&nbsp;</StyledTableBodyCell>
              <StyledTableBodyCell>&nbsp;</StyledTableBodyCell>
            </TableRow>
          ))}
          <TableRow>
            <StyledTableBodyCell rowSpan={2}></StyledTableBodyCell>
            <StyledTableHeadCell className="bg-grey">Total No. of Packages</StyledTableHeadCell>
            <StyledTableBodyCell rowSpan={2} colSpan={3}></StyledTableBodyCell>
            <StyledTableHeadCell className="bg-grey" sx={{ width: 42 }}>
              Total Value
            </StyledTableHeadCell>
            <StyledTableHeadCell className="bg-grey">Total Currency</StyledTableHeadCell>
          </TableRow>
          <TableRow>
            <StyledTableBodyCell className="bg-grey">{MaxPackageNumber}</StyledTableBodyCell>
            <StyledTableBodyCell className="bg-grey">${TotalCost}</StyledTableBodyCell>
            <StyledTableBodyCell className="bg-grey">USD</StyledTableBodyCell>
          </TableRow>
          <TableRow>
            <StyledTableBodyCell colSpan={6}>
              I DECLARE ALL THE INFORMATION CONTAINED IN THIS INVOICE TO BE TRUE AND CORRECT.
            </StyledTableBodyCell>
            <StyledTableBodyCell>Check One</StyledTableBodyCell>
          </TableRow>
          <TableRow>
            <StyledTableBodyCell colSpan={6} sx={{ borderBottom: "none" }}></StyledTableBodyCell>
            <StyledTableBodyCell>F.O.B</StyledTableBodyCell>
          </TableRow>
          <TableRow>
            <StyledTableBodyCell colSpan={6} sx={{ borderTop: "none", borderBottom: "none" }}></StyledTableBodyCell>
            <StyledTableBodyCell>C&F</StyledTableBodyCell>
          </TableRow>
          <TableRow>
            <StyledTableBodyCell rowSpan={2} colSpan={6} sx={{ borderTop: "none" }}></StyledTableBodyCell>
            <StyledTableBodyCell>C.I.F</StyledTableBodyCell>
          </TableRow>
          <TableRow>
            <StyledTableBodyCell sx={{ borderTop: "none" }}></StyledTableBodyCell>
          </TableRow>
          <TableRow>
            <StyledTableHeadCell colSpan={6}>
              SIGNATURE OF SHIPPER (Name, Title & Signature)
            </StyledTableHeadCell>
            <StyledTableHeadCell>DATE</StyledTableHeadCell>
          </TableRow>
        </TableBody>
      </StyledTable>
    </PrintContainer>
  );
};

export default PrintCommercialInvoice;