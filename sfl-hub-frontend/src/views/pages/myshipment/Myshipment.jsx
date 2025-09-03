import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { api, encryptURL, getUserIP, getUserDetails } from "../../../utils/api";
import { toast } from "react-hot-toast";
import {
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Select,
  MenuItem,
  Box,
  Menu,
  Checkbox,
  ListItemText,
  TextField, // Added for search inputs
} from "@mui/material";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import DirectionsBoatIcon from "@mui/icons-material/DirectionsBoat";
import CircularProgress from "@mui/material/CircularProgress";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { IconBox } from "../../styles/scheduleshipmentStyle";
import { useStyles } from "../../styles/MyshipmentStyle";

// Constants
const STATUSES = [
  "New Request",
  "Cancelled",
  "Customs Clearance",
  "Delivered",
  "Delivery In Route",
  "Destuffing",
  "In Consolidation",
  "In Transit",
  "In-Distribution",
  "Incomplete",
  "Lost/Damaged",
  "On Hold",
  "Pickup scheduled",
  "To Be Deleted",
];

const ShipmentDashboard = ({ setEdit }) => {
  const classes = useStyles();
  const navigate = useNavigate();
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [page, setPage] = useState(0);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedStatuses, setSelectedStatuses] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  // State for search inputs
  const [searchInputs, setSearchInputs] = useState({
    shipmentdate: "",
    trackingnumber: "",
    fromcontactname: "",
    fromcity: "",
    fromstate: "",
    tocontactname: "",
    tocity: "",
    tostate: "",
    shipmenttype: "",
    shipmentstatus: "",
  });

  // Get user data
  const user = JSON.parse(sessionStorage.getItem("user") || "{}");
  const personId = user?.personID;

  // Viewport meta tag handling
  useEffect(() => {
    const meta = document.querySelector("meta[name=viewport]");
    const originalViewport = meta?.getAttribute("content");

    const viewportContent =
      "width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no";

    if (meta) {
      meta.setAttribute("content", viewportContent);
    } else {
      const newMeta = document.createElement("meta");
      newMeta.name = "viewport";
      newMeta.content = viewportContent;
      document.head.appendChild(newMeta);
    }

    return () => {
      if (meta && originalViewport) {
        meta.setAttribute("content", originalViewport);
      }
    };
  }, []);

  // Fetch shipments using React Query
  const {
    data: shipmentsData = [],
    isLoading,
    isError,
    error,
    refetch
  } = useQuery({
    queryKey: ["shipments", personId],
    queryFn: async () => {
      if (!personId) throw new Error("Person ID not found");

      const { username, email } = getUserDetails();
      const userIP = await getUserIP();

      const encodedUrl = encryptURL("/shipment/myShipments");
      const response = await axios.post(
        `${api.BackendURL}/shipment/${encodedUrl}`,
        {
          data: {
            Person_ID: personId,
            username: username,
            email: email,
            ip: userIP,
          },
        },
        {
          withCredentials: true,
        }
      );
      const data = response.data?.user?.[0];
      if (!data) throw new Error("No shipment data");
      console.log("Shipment data:", data);
      return data.sort(
        (a, b) => new Date(b.shipmentdate) - new Date(a.shipmentdate)
      );
    },
    enabled: !!personId,
    // staleTime: 5 * 60 * 1000, // 5 minutes
  staleTime: 0,                  // Treat data as stale immediately
  refetchOnMount: "always",      // Refetch on every mount
  refetchOnWindowFocus: true,    // Refetch when window regains focus
  retry: 2,
    onError: (error) => {
      console.error("Error fetching shipments:", error);
      toast.error("Failed to load shipments. Please try again.");
    },
  });

  // Update filtered data when shipmentsData or searchInputs change
  useEffect(() => {
    let filtered = shipmentsData;

    // Apply status filter
    if (
      selectedStatuses.length > 0 &&
      selectedStatuses.length !== STATUSES.length
    ) {
      filtered = filtered.filter((row) =>
        selectedStatuses.includes(row.shipmentstatus)
      );
    }

    // Apply search input filters
    filtered = filtered.filter((row) => {
      const dateStr = new Date(row.shipmentdate)
        .toLocaleDateString("en-GB")
        .toLowerCase();
      return (
        (!searchInputs.shipmentdate ||
          dateStr.includes(searchInputs.shipmentdate.toLowerCase())) &&
        (!searchInputs.trackingnumber ||
          (row.trackingnumber
            ? row.trackingnumber
                .toLowerCase()
                .includes(searchInputs.trackingnumber.toLowerCase())
            : false)) &&
        (!searchInputs.fromcontactname ||
          row.fromcontactname
            .toLowerCase()
            .includes(searchInputs.fromcontactname.toLowerCase())) &&
        (!searchInputs.fromcity ||
          row.fromcity
            .toLowerCase()
            .includes(searchInputs.fromcity.toLowerCase())) &&
        (!searchInputs.fromstate ||
          row.fromstate
            .toLowerCase()
            .includes(searchInputs.fromstate.toLowerCase())) &&
        (!searchInputs.tocontactname ||
          row.tocontactname
            .toLowerCase()
            .includes(searchInputs.tocontactname.toLowerCase())) &&
        (!searchInputs.tocity ||
          row.tocity
            .toLowerCase()
            .includes(searchInputs.tocity.toLowerCase())) &&
        (!searchInputs.tostate ||
          row.tostate
            .toLowerCase()
            .includes(searchInputs.tostate.toLowerCase())) &&
        (!searchInputs.shipmenttype ||
          row.shipmenttype
            .toLowerCase()
            .includes(searchInputs.shipmenttype.toLowerCase())) &&
        (!searchInputs.shipmentstatus ||
          row.shipmentstatus
            .toLowerCase()
            .includes(searchInputs.shipmentstatus.toLowerCase()))
      );
    });

    setFilteredData(filtered);
    setPage(0); // Reset to first page on filter change
  }, [shipmentsData, selectedStatuses, searchInputs]);

  // Handle search input changes
  const handleSearchInputChange = (field) => (event) => {
    setSearchInputs((prev) => ({
      ...prev,
      [field]: event.target.value,
    }));
  };

  // Menu handling
  const open = Boolean(anchorEl);
  const handleClick = (event) => setAnchorEl(event.currentTarget);
  const handleClose = () => setAnchorEl(null);

  const handleSelect = (status) => {
    if (status === "All") {
      setSelectedStatuses(
        selectedStatuses.length === STATUSES.length ? [] : STATUSES
      );
    } else {
      setSelectedStatuses((prev) =>
        prev.includes(status)
          ? prev.filter((s) => s !== status)
          : [...prev, status]
      );
    }
  };

  const handleSearch = () => {
    handleClose();
  };

  const handleEdit = async (row) => {
    try {
      const { username, email } = getUserDetails();
      const userIP = await getUserIP();

      const encodedUrl = encryptURL("/shipment/getmyShipments");
      const response = await axios.post(
        `${api.BackendURL}/shipment/${encodedUrl}`,
        {
          data: {
            Shipping_ID: row.shippingid,
            username: username,
            email: email,
            ip: userIP,
          },
        },
        {
          withCredentials: true,
        }
      );

      if (response.status === 200 && response.data?.user) {
        setEdit(true);
        navigate("/admin/MyShipmentNew", {
          state: { shipment: response.data.user },
          replace: true,
        });
      } else {
        throw new Error("Failed to fetch shipment details");
      }
    } catch (error) {
      console.error("Error fetching shipment details:", error);
      toast.error(
        error?.response?.data?.message || "Failed to fetch shipment details"
      );
    }
  };

  // Pagination handlers
  const handleRowsPerPageChange = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handlePreviousPage = () => {
    setPage((prev) => Math.max(prev - 1, 0));
  };

  const handleNextPage = () => {
    setPage((prev) =>
      Math.min(prev + 1, Math.ceil(filteredData.length / rowsPerPage) - 1)
    );
  };

  const displayedRows = filteredData.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );
  const isAllSelected = selectedStatuses.length === STATUSES.length;

  return (
    <div className="page-wrap">
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <h2 style={{ fontSize: "1rem" }}>
              <IconBox className="card-icon">
                <DirectionsBoatIcon className={classes.iconBox} />
              </IconBox>
              <span>My Shipment</span>
            </h2>
          </div>
          <div className="card-filter">
            <Button
              variant="contained"
              color="secondary"
              endIcon={<ArrowDropDownIcon />}
              onClick={handleClick}
              className={classes.mainButton}
              sx={{ fontSize: "0.65rem", py: 0.3, px: 1.2, minHeight: "28px" }}
            >
              Search Shipment Status
            </Button>
            <Menu
              anchorEl={anchorEl}
              open={open}
              onClose={handleClose}
              PaperProps={{
                className: classes.menuPaper,
                sx: {
                  maxHeight: 260,
                  padding: 0,
                  mt: 0.5,
                },
              }}
              MenuListProps={{ dense: true }}
            >
              <MenuItem
                onClick={() => handleSelect("All")}
                className={classes.menuItem}
                sx={{ fontSize: "0.65rem", py: 0.3, minHeight: "28px" }}
              >
                <Checkbox
                  checked={isAllSelected}
                  size="small"
                  sx={{ p: 0.5 }}
                />
                <ListItemText
                  primary="All"
                  sx={{ "& .MuiListItemText-primary": { fontSize: "0.65rem" } }}
                />
              </MenuItem>
              {STATUSES.map((status) => (
                <MenuItem
                  key={status}
                  onClick={() => handleSelect(status)}
                  className={classes.menuItem}
                  sx={{ fontSize: "0.65rem", py: 0.3, minHeight: "12px" }}
                >
                  <Checkbox
                    checked={selectedStatuses.includes(status)}
                    size="small"
                    sx={{ p: 0.5 }}
                  />
                  <ListItemText
                    primary={status}
                    sx={{
                      "& .MuiListItemText-primary": { fontSize: "0.65rem" },
                    }}
                  />
                </MenuItem>
              ))}
              <Box
                className={classes.searchButtonContainer}
                sx={{ px: 1, py: 0.5 }}
              >
                <Button
                  variant="contained"
                  color="secondary"
                  onClick={handleSearch}
                  className={classes.searchButton}
                  sx={{
                    fontSize: "0.65rem",
                    py: 0.4,
                    minHeight: "28px",
                    width: "100%",
                  }}
                >
                  Search
                </Button>
              </Box>
            </Menu>
          </div>
        </div>
        <div className="card-body">
          <TableContainer component={Paper} className={classes.tableContainer}>
            <Table>
              <TableHead className={classes.tableHead}>
                <TableRow>
                  {[
                    "Date",
                    "Tracking",
                    "Sender",
                    "City",
                    "State",
                    "Receiver",
                    "City",
                    "State",
                    "Type",
                    "Status",
                    "Actions",
                  ].map((heading) => (
                    <TableCell
                      key={heading}
                      className={classes.tableCell}
                      sx={{ fontSize: "0.75rem" }}
                    >
                      {heading}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              {/* Search Input Row */}
              <TableRow className="table-row">
                <TableCell className="small-cell">
                  <TextField
                    size="small"
                    variant="standard"
                    value={searchInputs.shipmentdate}
                    onChange={handleSearchInputChange("shipmentdate")}
                    InputProps={{
                      style: { fontSize: "0.75rem" },
                    }}
                  />
                </TableCell>
                <TableCell className="small-cell">
                  <TextField
                    size="small"
                    variant="standard"
                    value={searchInputs.trackingnumber}
                    onChange={handleSearchInputChange("trackingnumber")}
                    InputProps={{
                      style: { fontSize: "0.75rem" },
                    }}
                  />
                </TableCell>
                <TableCell className="small-cell">
                  <TextField
                    size="small"
                    variant="standard"
                    value={searchInputs.fromcontactname}
                    onChange={handleSearchInputChange("fromcontactname")}
                    InputProps={{
                      style: { fontSize: "0.75rem" },
                    }}
                  />
                </TableCell>
                <TableCell className="small-cell">
                  <TextField
                    size="small"
                    variant="standard"
                    value={searchInputs.fromcity}
                    onChange={handleSearchInputChange("fromcity")}
                    InputProps={{
                      style: { fontSize: "0.75rem" },
                    }}
                  />
                </TableCell>
                <TableCell className="small-cell">
                  <TextField
                    size="small"
                    variant="standard"
                    value={searchInputs.fromstate}
                    onChange={handleSearchInputChange("fromstate")}
                    InputProps={{
                      style: { fontSize: "0.75rem" },
                    }}
                  />
                </TableCell>
                <TableCell className="small-cell">
                  <TextField
                    size="small"
                    variant="standard"
                    value={searchInputs.tocontactname}
                    onChange={handleSearchInputChange("tocontactname")}
                    InputProps={{
                      style: { fontSize: "0.75rem" },
                    }}
                  />
                </TableCell>
                <TableCell className="small-cell">
                  <TextField
                    size="small"
                    variant="standard"
                    value={searchInputs.tocity}
                    onChange={handleSearchInputChange("tocity")}
                    InputProps={{
                      style: { fontSize: "0.75rem" },
                    }}
                  />
                </TableCell>
                <TableCell className="small-cell">
                  <TextField
                    size="small"
                    variant="standard"
                    value={searchInputs.tostate}
                    onChange={handleSearchInputChange("tostate")}
                    InputProps={{
                      style: { fontSize: "0.75rem" },
                    }}
                  />
                </TableCell>
                <TableCell className="small-cell">
                  <TextField
                    size="small"
                    variant="standard"
                    value={searchInputs.shipmenttype}
                    onChange={handleSearchInputChange("shipmenttype")}
                    InputProps={{
                      style: { fontSize: "0.75rem" },
                    }}
                  />
                </TableCell>
                <TableCell className="small-cell">
                  <TextField
                    size="small"
                    variant="standard"
                    value={searchInputs.shipmentstatus}
                    onChange={handleSearchInputChange("shipmentstatus")}
                    InputProps={{
                      style: { fontSize: "0.75rem" },
                    }}
                  />
                </TableCell>
                <TableCell className="small-cell"></TableCell>{" "}
                {/* Empty cell for Actions */}
              </TableRow>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={11} align="center">
                      <CircularProgress />
                    </TableCell>
                  </TableRow>
                ) : isError ? (
                  <TableRow>
                    <TableCell
                      colSpan={11}
                      align="center"
                      sx={{ fontSize: "0.75rem", color: "red" }}
                    >
                      {error?.response?.data?.error ||
                        error?.message ||
                        "Error loading shipments"}
                    </TableCell>
                  </TableRow>
                ) : displayedRows.length > 0 ? (
                  displayedRows.map((row) => (
                    <TableRow
                      key={row.id || row.shippingid}
                      className="table-row"
                    >
                      <TableCell className="small-cell">
                        {new Date(row.shipmentdate).toLocaleDateString("en-GB")}
                      </TableCell>
                      <TableCell className="small-cell">
                        {row.trackingnumber}
                      </TableCell>
                      <TableCell className="small-cell">
                        {row.fromcontactname}
                      </TableCell>
                      <TableCell className="small-cell">
                        {row.fromcity}
                      </TableCell>
                      <TableCell className="small-cell">
                        {row.fromstate}
                      </TableCell>
                      <TableCell className="small-cell">
                        {row.tocontactname}
                      </TableCell>
                      <TableCell className="small-cell">{row.tocity}</TableCell>
                      <TableCell className="small-cell">
                        {row.tostate}
                      </TableCell>
                      <TableCell className="small-cell">
                        {row.shipmenttype}
                      </TableCell>
                      <TableCell className="small-cell">
                        {row.shipmentstatus}
                      </TableCell>
                      <TableCell>
                        <Box
                          display="flex"
                          alignItems="center"
                          variant="contained"
                          onClick={() => handleEdit(row)}
                          sx={{
                            fontSize: "12px",
                            background: "#0c72e8",
                            color: "white",
                            p: 1,
                            borderRadius: "5px",
                            cursor: "pointer",
                          }}
                        >
                          <OpenInNewIcon
                            sx={{
                              color: "white",
                            }}
                            className={classes.editIcon}
                            style={{
                              cursor: "pointer",
                              marginRight: 8,
                              color: "white",
                            }}
                            onClick={() => handleEdit(row)}
                          />
                          Open
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={11}
                      align="center"
                      sx={{ fontSize: "0.75rem" }}
                    >
                      No shipments found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </div>
        <Box
          className="table-footer"
          sx={{
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            gap: 2,
            alignItems: "center",
            padding: 2,
          }}
        >
          <Button
            variant="outlined"
            onClick={handlePreviousPage}
            disabled={page === 0}
            sx={{ fontSize: "0.75rem" }}
          >
            Previous
          </Button>
          <Typography
            sx={{
              fontSize: { sm: "0.75rem", xs: "0.6rem" },
              fontWeight: "bold",
            }}
          >
            Total rows: {filteredData.length} of {shipmentsData.length}
          </Typography>
          <Select
            value={rowsPerPage}
            onChange={handleRowsPerPageChange}
            sx={{ fontSize: "0.75rem", height: "2rem", fontWeight: "bold" }}
          >
            {[5, 10, 20, 25, 50, 100].map((value) => (
              <MenuItem key={value} value={value} sx={{ fontSize: "0.75rem" }}>
                {value} rows
              </MenuItem>
            ))}
          </Select>
          <Button
            variant="outlined"
            onClick={handleNextPage}
            disabled={page >= Math.ceil(filteredData.length / rowsPerPage) - 1}
            sx={{ fontSize: "0.75rem" }}
          >
            Next
          </Button>
        </Box>
      </div>
      <Box className="footer-box">
        <Typography
          className={classes.footerTypography}
          sx={{
            mt: 2,
            fontSize: "0.75rem",
            textAlign: { xs: "center", sm: "right" },
          }}
        >
          All Rights Reserved. Site Powered by{" "}
          <span
            className={`${classes.sflLink} sfl-link`}
            onClick={() => window.open("https://sflworldwide.com/", "_blank")}
            style={{ cursor: "pointer" }}
          >
            SFL Worldwide
          </span>
        </Typography>
      </Box>
    </div>
  );
};

export default ShipmentDashboard;
