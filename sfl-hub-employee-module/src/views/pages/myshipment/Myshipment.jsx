import React, { useState, useEffect, useMemo } from "react";
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
  TextField,
} from "@mui/material";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import DirectionsBoatIcon from "@mui/icons-material/DirectionsBoat";
import CircularProgress from '@mui/material/CircularProgress';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import RefreshIcon from '@mui/icons-material/Refresh';
import { IconBox } from "../../styles/scheduleshipmentStyle";
import { useStyles } from "../../styles/MyshipmentStyle";

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

const ShipmentDashboard = () => {
  const classes = useStyles();
  const navigate = useNavigate();
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [page, setPage] = useState(0);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedStatuses, setSelectedStatuses] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
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

  const user = JSON.parse(sessionStorage.getItem("user") || "{}");
  const personId = user?.personID;

  // Memoize searchInputs to stabilize reference
  const stableSearchInputs = useMemo(() => searchInputs, [
    searchInputs.shipmentdate,
    searchInputs.trackingnumber,
    searchInputs.fromcontactname,
    searchInputs.fromcity,
    searchInputs.fromstate,
    searchInputs.tocontactname,
    searchInputs.tocity,
    searchInputs.tostate,
    searchInputs.shipmenttype,
    searchInputs.shipmentstatus,
  ]);

  useEffect(() => {
    const meta = document.querySelector("meta[name=viewport]");
    const originalViewport = meta?.getAttribute("content");
    const viewportContent = "width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no";

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

  const { data: shipmentsData = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['shipments', personId],
    queryFn: async () => {
      if (!personId) throw new Error("Person ID not found");
      const { username, email } = getUserDetails();
      const userIP = await getUserIP();
      const encodedUrl = encryptURL("/shipment/myShipments");
      const response = await axios.post(`${api.BackendURL}/shipment/${encodedUrl}`, {
        data: {
          Person_ID: personId,
          username: username,
          email: email,
          ip: userIP,
        }
      });
      const data = response.data?.user?.[0];
      if (!data) throw new Error("No shipment data");
      console.log("Shipment data:", data);
      return data.sort((a, b) => new Date(b.shipmentdate) - new Date(a.shipmentdate));
    },
    enabled: !!personId,
    // staleTime: 5 * 60 * 1000,
     staleTime: 0,                  // Treat data as stale immediately
  refetchOnMount: "always",      // Refetch on every mount
  refetchOnWindowFocus: true,    // Refetch when window regains focus
  retry: 2,
    retry: false,
    onError: (error) => {
      console.error('Error fetching shipments:', error);
      toast.error("Failed to load shipments. Please try again.");
    }
  });

  // Memoize filtered data
  const filteredDataMemo = useMemo(() => {
    let filtered = shipmentsData;
    if (selectedStatuses.length > 0 && selectedStatuses.length !== STATUSES.length) {
      filtered = filtered.filter(row => selectedStatuses.includes(row.shipmentstatus));
    }
    filtered = filtered.filter(row => {
      const dateStr = new Date(row.shipmentdate).toLocaleDateString('en-GB').toLowerCase();
      return (
        (!stableSearchInputs.shipmentdate || dateStr.includes(stableSearchInputs.shipmentdate.toLowerCase())) &&
        (!stableSearchInputs.trackingnumber || (row.trackingnumber ? row.trackingnumber.toLowerCase().includes(stableSearchInputs.trackingnumber.toLowerCase()) : false)) &&
        (!stableSearchInputs.fromcontactname || row.fromcontactname.toLowerCase().includes(stableSearchInputs.fromcontactname.toLowerCase())) &&
        (!stableSearchInputs.fromcity || row.fromcity.toLowerCase().includes(stableSearchInputs.fromcity.toLowerCase())) &&
        (!stableSearchInputs.fromstate || row.fromstate.toLowerCase().includes(stableSearchInputs.fromstate.toLowerCase())) &&
        (!stableSearchInputs.tocontactname || row.tocontactname.toLowerCase().includes(stableSearchInputs.tocontactname.toLowerCase())) &&
        (!stableSearchInputs.tocity || row.tocity.toLowerCase().includes(stableSearchInputs.tocity.toLowerCase())) &&
        (!stableSearchInputs.tostate || row.tostate.toLowerCase().includes(stableSearchInputs.tostate.toLowerCase())) &&
        (!stableSearchInputs.shipmenttype || row.shipmenttype.toLowerCase().includes(stableSearchInputs.shipmenttype.toLowerCase())) &&
        (!stableSearchInputs.shipmentstatus || row.shipmentstatus.toLowerCase().includes(stableSearchInputs.shipmentstatus.toLowerCase()))
      );
    });
    return filtered;
  }, [shipmentsData, selectedStatuses, stableSearchInputs]);

  // Update filteredData only if necessary
  useEffect(() => {
    // Avoid updating if filteredData is already equal to filteredDataMemo
    if (JSON.stringify(filteredData) !== JSON.stringify(filteredDataMemo)) {
      setFilteredData(filteredDataMemo);
      setPage(0);
    }
  }, [filteredData, filteredDataMemo]);

  const handleSearchInputChange = (field) => (event) => {
    setSearchInputs(prev => ({
      ...prev,
      [field]: event.target.value,
    }));
  };

  const open = Boolean(anchorEl);
  const handleClick = (event) => setAnchorEl(event.currentTarget);
  const handleClose = () => setAnchorEl(null);

  const handleSelect = (status) => {
    if (status === "All") {
      setSelectedStatuses(selectedStatuses.length === STATUSES.length ? [] : STATUSES);
    } else {
      setSelectedStatuses(prev =>
        prev.includes(status)
          ? prev.filter(s => s !== status)
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
      const response = await axios.post(`${api.BackendURL}/shipment/${encodedUrl}`, {
        data: {
          Shipping_ID: row.shippingid,
          username: username,
          email: email,
          ip: userIP,
        }
      });
      if (response.status === 200 && response.data?.user) {
        navigate("/admin/MyShipmentNew", {
          state: { shipment: response.data.user },
          replace: true,
        });
      } else {
        throw new Error("Failed to fetch shipment details");
      }
    } catch (error) {
      console.error("Error fetching shipment details:", error);
      toast.error(error?.response?.data?.message || "Failed to fetch shipment details");
    }
  };

  const handleRowsPerPageChange = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handlePreviousPage = () => {
    setPage(prev => Math.max(prev - 1, 0));
  };

  const handleNextPage = () => {
    setPage(prev => Math.min(prev + 1, Math.ceil(filteredData.length / rowsPerPage) - 1));
  };

  const displayedRows = filteredData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
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
                sx: { maxHeight: 260, padding: 0, mt: 0.5 },
              }}
              MenuListProps={{ dense: true }}
            >
              <MenuItem
                onClick={() => handleSelect("All")}
                className={classes.menuItem}
                sx={{ fontSize: "0.65rem", py: 0.3, minHeight: "28px" }}
              >
                <Checkbox checked={isAllSelected} size="small" sx={{ p: 0.5 }} />
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
                    sx={{ "& .MuiListItemText-primary": { fontSize: "0.65rem" } }}
                  />
                </MenuItem>
              ))}
              <Box className={classes.searchButtonContainer} sx={{ px: 1, py: 0.5 }}>
                <Button
                  variant="contained"
                  color="secondary"
                  onClick={handleSearch}
                  className={classes.searchButton}
                  sx={{ fontSize: "0.65rem", py: 0.4, minHeight: "28px", width: "100%" }}
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
                    { label: "Date", key: "shipmentdate" },
                    { label: "Tracking", key: "trackingnumber" },
                    { label: "Sender", key: "fromcontactname" },
                    { label: "City", key: "fromcity" },
                    { label: "State", key: "fromstate" },
                    { label: "Receiver", key: "tocontactname" },
                    { label: "City", key: "tocity" },
                    { label: "State", key: "tostate" },
                    { label: "Type", key: "shipmenttype" },
                    { label: "Status", key: "shipmentstatus" },
                    { label: "Actions", key: "actions" },
                  ].map((item) => (
                    <TableCell
                      key={item.key}
                      className={classes.tableCell}
                      sx={{ fontSize: "0.75rem" }}
                    >
                      {item.label}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow className="table-row">
                  {[
                    { key: "shipmentdate", field: "shipmentdate" },
                    { key: "trackingnumber", field: "trackingnumber" },
                    { key: "fromcontactname", field: "fromcontactname" },
                    { key: "fromcity", field: "fromcity" },
                    { key: "fromstate", field: "fromstate" },
                    { key: "tocontactname", field: "tocontactname" },
                    { key: "tocity", field: "tocity" },
                    { key: "tostate", field: "tostate" },
                    { key: "shipmenttype", field: "shipmenttype" },
                    { key: "shipmentstatus", field: "shipmentstatus" },
                    { key: "actions", field: null },
                  ].map((item) => (
                    <TableCell key={item.key} className="small-cell">
                      {item.field ? (
                        <TextField
                          size="small"
                          variant="standard"
                          value={searchInputs[item.field]}
                          onChange={handleSearchInputChange(item.field)}
                          InputProps={{
                            style: { fontSize: "0.75rem" },
                          }}
                        />
                      ) : null}
                    </TableCell>
                  ))}
                </TableRow>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={11} align="center">
                      <CircularProgress />
                    </TableCell>
                  </TableRow>
                ) : isError ? (
                  <TableRow>
                    <TableCell colSpan={11} align="center" sx={{ fontSize: "0.75rem" }}>
                      Error loading shipments.{' '}
                      <Button
                        variant="text"
                        color="primary"
                        onClick={() => refetch()}
                        sx={{ fontSize: "0.75rem" }}
                        startIcon={<RefreshIcon />}
                      >
                        Retry
                      </Button>
                    </TableCell>
                  </TableRow>
                ) : displayedRows.length > 0 ? (
                  displayedRows.map((row) => (
                    <TableRow key={row.id || row.shippingid} className="table-row">
                      <TableCell className="small-cell">
                        {new Date(row.shipmentdate).toLocaleDateString('en-GB')}
                      </TableCell>
                      <TableCell className="small-cell">{row.trackingnumber}</TableCell>
                      <TableCell className="small-cell">{row.fromcontactname}</TableCell>
                      <TableCell className="small-cell">{row.fromcity}</TableCell>
                      <TableCell className="small-cell">{row.fromstate}</TableCell>
                      <TableCell className="small-cell">{row.tocontactname}</TableCell>
                      <TableCell className="small-cell">{row.tocity}</TableCell>
                      <TableCell className="small-cell">{row.tostate}</TableCell>
                      <TableCell className="small-cell">{row.shipmenttype}</TableCell>
                      <TableCell className="small-cell">{row.shipmentstatus}</TableCell>
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
                            sx={{ color: "white", marginRight: 1 }}
                            className={classes.editIcon}
                          />
                          Open
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={11} align="center" sx={{ fontSize: "0.75rem" }}>
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
          <Typography sx={{ fontSize: { sm: "0.75rem", xs: "0.6rem" }, fontWeight: "bold" }}>
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
    </div>
  );
};

export default ShipmentDashboard;