import React from "react";
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Typography, Box
} from "@mui/material";
import "../styles/material-table.css"; // We'll create this next

const rows = [
  { id: 1, name: "John Doe", age: 28, email: "john@example.com" },
  { id: 2, name: "Jane Smith", age: 34, email: "jane@example.com" },
  { id: 3, name: "Samuel Green", age: 22, email: "samuel@example.com" },
  { id: 4, name: "Emily Brown", age: 40, email: "emily@example.com" }
];

const MaterialResponsiveTable = () => {
  return (
    <Box p={2}>
      <Typography variant="h5" gutterBottom>
        Material UI Responsive Table
      </Typography>

      {/* Desktop Table */}
      <TableContainer
        component={Paper}
        className="responsive-table-container"
      >
        <Table className="responsive-table">
          <TableHead>
            <TableRow sx={{ backgroundColor: "#1976d2" }}>
              <TableCell sx={{ color: "white" }}>ID</TableCell>
              <TableCell sx={{ color: "white" }}>Name</TableCell>
              <TableCell sx={{ color: "white" }}>Age</TableCell>
              <TableCell sx={{ color: "white" }}>Email</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell data-label="ID">{row.id}</TableCell>
                <TableCell data-label="Name">{row.name}</TableCell>
                <TableCell data-label="Age">{row.age}</TableCell>
                <TableCell data-label="Email">{row.email}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default MaterialResponsiveTable;
