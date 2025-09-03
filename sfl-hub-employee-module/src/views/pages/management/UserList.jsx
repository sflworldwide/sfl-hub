import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  MenuItem,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import PeopleIcon from "@mui/icons-material/People";
import SearchIcon from "@mui/icons-material/Search";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import EditIcon from "@mui/icons-material/Edit";

import { api } from "../../../utils/api";
import { useUserListContext } from "./UserListContext";

const UserList = () => {
  const navigate = useNavigate();
  const context = useUserListContext();

  if (!context) {
    return <Typography color="error">Error: UserListContext is not available. Please wrap the component with UserListProvider.</Typography>;
  }

  const { formData, setFormData, searchFilters, setSearchFilters, resetFormData } = context;
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const handleChange = (field) => (event) => {
    setFormData((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSearchChange = (field) => (event) => {
    setSearchFilters((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleReset = () => {
    resetFormData();
    setCurrentPage(1);
  };

  const { data: userData = [], isLoading, refetch } = useQuery({
    queryKey: ['userList', formData],
    queryFn: async () => {
      const response = await axios.post(`${api.BackendURL}/usermanagement/getUserList`, {
        userDetails: {
          Name: formData.name,
          UserName: formData.userName,
          UserType: formData.userType,
          Email: formData.email,
          AccountNumber: formData.accountNumber,
          ManagedBy: formData.managedBy,
          Status: formData.status,
        },
      }, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      return response.data.resResult || [];
    },
    enabled: false, 
  });

  const FetchUserList = () => {
    refetch();
  };

  const filteredData = userData.filter((row) =>
    Object.keys(searchFilters).every((key) => {
      const searchValue = searchFilters[key] || "";
      let rowValue = row[key] || "";

      if (key === "name") rowValue = row.name || "";
      if (key === "userName") rowValue = row.loginid || "";
      if (key === "userType") rowValue = row.usertype || "";
      if (key === "email") rowValue = row.email || "";
      if (key === "createdOn") rowValue = row.createdon ? new Date(row.createdon).toLocaleDateString() : "";
      if (key === "accountNumber") rowValue = row.accountnumber || "";
      if (key === "managedBy") rowValue = row.managedbyname || "";
      if (key === "status") rowValue = row.status || "";
      if (key === "personid") rowValue = row.personid || "";
      if (key === "phonenum") rowValue = row.phonenum || "";
      if (key === "addressline1") rowValue = row.addressline1 || "";
      if (key === "addressline2") rowValue = row.addressline2 || "";
      if (key === "addressline3") rowValue = row.addressline3 || "";
      if (key === "city") rowValue = row.city || "";
      if (key === "companyname") rowValue = row.companyname || "";
      if (key === "state") rowValue = row.state || "";
      if (key === "zipcode") rowValue = row.zipcode || "";

      rowValue = rowValue.toString().toLowerCase();
      return searchValue === "" || rowValue.includes(searchValue.toLowerCase());
    })
  );

  const totalRows = filteredData.length;
  const totalPages = Math.ceil(totalRows / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedData = filteredData.slice(startIndex, endIndex);

  const handleRowsPerPageChange = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setCurrentPage(1);
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  return (
    <Box sx={{ p: { xs: 1, sm: 3 } }}>
      <Card elevation={2}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Box display="flex" alignItems="center" gap={1.5}>
              <Box
                sx={{
                  marginBottom: 6,
                  position: "absolute",
                  width: 40,
                  height: 40,
                  backgroundColor: "#8e24aa",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                  boxShadow: 3,
                  zIndex: 1,
                  padding: "30px",
                }}
              >
                <PeopleIcon sx={{ fontSize: 20 }} />
              </Box>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: "bold",
                  fontSize: { xs: "12px", sm: "14px" },
                  display: "flex",
                  alignItems: "center",
                  marginLeft: { xs: 6, sm: 9 },
                  position: "absolute",
                  marginBottom: 4,
                }}
              >
                User List
              </Typography>
            </Box>
            <Button
              variant="contained"
              sx={{ backgroundColor: "#8e24aa", fontSize: { xs: "8px", sm: "10px" }, padding: "10px 15px", fontWeight: 550 }}
              onClick={() => navigate("/admin/AddUser")}
            >
              Add User
            </Button>
          </Box>

          <Grid container spacing={1} mb={2} sx={{ flexDirection: { xs: "column", sm: "row" } }}>
            <Grid item xs={12} sm={6} md={4} mb={2}>
              <TextField
                label="Name"
                value={formData.name}
                onChange={handleChange("name")}
                fullWidth
                variant="outlined"
                size="small"
                InputProps={{ sx: { fontSize: "11px" } }}
                InputLabelProps={{ sx: { fontSize: "11px" } }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4} mb={2}>
              <TextField
                label="User Name"
                value={formData.userName}
                onChange={handleChange("userName")}
                fullWidth
                variant="outlined"
                size="small"
                InputProps={{ sx: { fontSize: "11px" } }}
                InputLabelProps={{ sx: { fontSize: "11px" } }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4} mb={2}>
              <Select
                fullWidth
                variant="outlined"
                value={formData.userType}
                onChange={handleChange("userType")}
                displayEmpty
                size="small"
                sx={{ fontSize: "11px" }}
              >
                <MenuItem value="" sx={{ fontSize: "11px" }}>User Type</MenuItem>
                <MenuItem value="admin" sx={{ fontSize: "11px" }}>Customer</MenuItem>
                <MenuItem value="staff" sx={{ fontSize: "11px" }}>Employee</MenuItem>
                <MenuItem value="customer" sx={{ fontSize: "11px" }}>Contractor</MenuItem>
              </Select>
            </Grid>
            <Grid item xs={12} sm={6} md={4} mb={2}>
              <TextField
                label="Email"
                value={formData.email}
                onChange={handleChange("email")}
                fullWidth
                variant="outlined"
                size="small"
                InputProps={{ sx: { fontSize: "11px" } }}
                InputLabelProps={{ sx: { fontSize: "11px" } }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4} mb={2}>
              <TextField
                label="Created On"
                type="date"
                value={formData.createdOn}
                onChange={handleChange("createdOn")}
                fullWidth
                variant="outlined"
                size="small"
                InputLabelProps={{ shrink: true, sx: { fontSize: "11px" } }}
                InputProps={{ sx: { fontSize: "11px" } }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4} mb={2}>
              <TextField
                label="Account Number"
                value={formData.accountNumber}
                onChange={handleChange("accountNumber")}
                fullWidth
                variant="outlined"
                size="small"
                InputProps={{ sx: { fontSize: "11px" } }}
                InputLabelProps={{ sx: { fontSize: "11px" } }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4} mb={2}>
              <Select
                fullWidth
                variant="outlined"
                value={formData.managedBy}
                onChange={handleChange("managedBy")}
                displayEmpty
                size="small"
                sx={{ fontSize: "11px" }}
              >
                <MenuItem value="" sx={{ fontSize: "11px" }}>Managed By</MenuItem>
                <MenuItem value="manager1" sx={{ fontSize: "11px" }}>No Option</MenuItem>
              </Select>
            </Grid>
            <Grid item xs={12} sm={6} md={4} mb={2}>
              <Select
                fullWidth
                variant="outlined"
                value={formData.status}
                onChange={handleChange("status")}
                displayEmpty
                size="small"
                sx={{ fontSize: "11px" }}
              >
                <MenuItem value="" sx={{ fontSize: "11px" }}>Status</MenuItem>
                <MenuItem value="Enable" sx={{ fontSize: "11px" }}>Enable</MenuItem>
                <MenuItem value="Disable" sx={{ fontSize: "11px" }}>Disable</MenuItem>
              </Select>
            </Grid>
          </Grid>

          <Box display="flex" justifyContent="flex-end" gap={2} mb={2} flexWrap="wrap">
            <Button
              variant="contained"
              color="error"
              sx={{ fontSize: { xs: "8px", sm: "10px" }, padding: "6px", fontWeight: 550 }}
            >
              <FileDownloadIcon />
            </Button>
            <Button
              variant="contained"
              sx={{ backgroundColor: "#ec407a", fontSize: { xs: "8px", sm: "10px" }, padding: "10px 15px", fontWeight: 550 }}
              startIcon={<SearchIcon />}
              onClick={FetchUserList}
            >
              Search
            </Button>
            <Button
              variant="contained"
              sx={{ backgroundColor: "#9e9e9e", fontSize: { xs: "8px", sm: "10px" }, padding: "10px 15px", fontWeight: 550 }}
              startIcon={<RestartAltIcon />}
              onClick={handleReset}
            >
              Reset
            </Button>
          </Box>

          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  {[
                    "Name",
                    "User Name",
                    "User Type",
                    "Email",
                    "Created On",
                    "Account No.",
                    "Managed By",
                    "Status",
                    "Actions",
                  ].map((header, i) => (
                    <TableCell
                      key={i}
                      sx={{
                        fontWeight: "bold",
                        fontSize: "11px",
                        whiteSpace: "normal",
                        wordWrap: "break-word",
                        verticalAlign: "top",
                        paddingBottom: 0,
                      }}
                    >
                      {header}
                      {header !== "Actions" && (
                        <TextField
                          value={searchFilters[header.toLowerCase().replace(" ", "")]}
                          onChange={handleSearchChange(header.toLowerCase().replace(" ", ""))}
                          size="small"
                          sx={{ mt: 1, width: "100%", fontSize: "10px" }}
                          InputProps={{
                            sx: {
                              fontSize: "10px",
                              borderBottom: "1px solid rgba(0,0,0,0.23)",
                              padding: 0,
                            },
                          }}
                          variant="standard"
                        />
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center" sx={{ fontSize: "10px" }}>
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : paginatedData.length > 0 ? (
                  paginatedData.map((row, index) => (
                    <TableRow key={index}>
                      <TableCell sx={{ fontSize: "11px", whiteSpace: "normal", wordWrap: "break-word" }}>{row.name}</TableCell>
                      <TableCell sx={{ fontSize: "11px", whiteSpace: "normal", wordWrap: "break-word" }}>{row.loginid}</TableCell>
                      <TableCell sx={{ fontSize: "11px", whiteSpace: "normal", wordWrap: "break-word" }}>{row.usertype}</TableCell>
                      <TableCell sx={{ fontSize: "11px", whiteSpace: "normal", wordWrap: "break-word" }}>{row.email}</TableCell>
                      <TableCell sx={{ fontSize: "11px", whiteSpace: "normal", wordWrap: "break-word" }}>
                        {row.createdon ? new Date(row.createdon).toLocaleDateString() : ""}
                      </TableCell>
                      <TableCell sx={{ fontSize: "11px", whiteSpace: "normal", wordWrap: "break-word" }}>{row.accountnumber || ""}</TableCell>
                      <TableCell sx={{ fontSize: "11px", whiteSpace: "normal", wordWrap: "break-word" }}>{row.managedbyname || ""}</TableCell>
                      <TableCell sx={{ fontSize: "11px", whiteSpace: "normal", wordWrap: "break-word" }}>{row.status}</TableCell>
                      <TableCell sx={{ fontSize: "11px", whiteSpace: "normal", wordWrap: "break-word" }}>
                        <EditIcon
                          sx={{ fontSize: "19px", cursor: "pointer", border: "1px solid blue" }}
                          color="primary"
                          onClick={() => navigate("/admin/EditUser", { state: { user: row } })}
                        />
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={9} align="center" sx={{ fontSize: "10px" }}>
                      No rows found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <Box
            mt={2}
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            flexWrap="wrap"
            sx={{ flexDirection: { xs: "column", sm: "row" }, gap: { xs: 1, sm: 0 } }}
          >
            <Button
              variant="outlined"
              disabled={currentPage === 1}
              onClick={handlePreviousPage}
              sx={{ fontSize: "10px" }}
            >
              Previous
            </Button>
            <Typography sx={{ fontSize: "10px" }}>
              Total rows: {totalRows} | Page {currentPage} of {totalPages}
            </Typography>
            <Select
              variant="standard"
              value={rowsPerPage}
              onChange={handleRowsPerPageChange}
              size="small"
              sx={{ minWidth: 120, fontSize: "10px", "& .MuiSelect-select": { borderBottom: "1px solid rgba(0,0,0,0.23)" } }}
            >
              <MenuItem value={10} sx={{ fontSize: "10px" }}>10 rows</MenuItem>
              <MenuItem value={25} sx={{ fontSize: "10px" }}>25 rows</MenuItem>
              <MenuItem value={50} sx={{ fontSize: "10px" }}>50 rows</MenuItem>
            </Select>
            <Button
              variant="outlined"
              disabled={currentPage === totalPages}
              onClick={handleNextPage}
              sx={{ fontSize: "10px" }}
            >
              Next
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default UserList;