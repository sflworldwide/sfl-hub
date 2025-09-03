import React, { useState } from 'react';
import {
  Box,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox,
  Paper,
} from '@mui/material';

// Fallback static data with all permissions set to false
const moduleData = [
  { name: 'Billing Report', permissions: [false, false, false] },
  { name: 'Calendar', permissions: [false, false, false] },
  { name: 'File a Claim', permissions: [false, false, false] },
  { name: 'Get Rate - AIR', permissions: [false, false, false] },
  { name: 'Get Rate - Ocean', permissions: [false, false, false] },
  { name: 'Get Rates - Side Bar', permissions: [false, false, false] },
  { name: 'Management > Consolidation Center', permissions: [false, false, false] },
  { name: 'Management > Container', permissions: [false, false, false] },
  { name: 'Management > Credit Card', permissions: [false, false, false] },
  { name: 'Management > Invoices services', permissions: [false, false, false] },
  { name: 'Management > Lead', permissions: [false, false, false] },
  { name: 'Management > Ocean Tracking', permissions: [false, false, false] },
  { name: 'Management > Review', permissions: [false, false, false] },
  { name: 'Management > Sales Lead Referred', permissions: [false, false, false] },
  { name: 'Management > Service', permissions: [false, false, false] },
  { name: 'Management > User', permissions: [false, false, false] },
  { name: 'Management > Vendor', permissions: [false, false, false] },
  { name: 'Online Payment', permissions: [false, false, false] },
  { name: 'Report > Account Reports > Payment Received', permissions: [false, false, false] },
  { name: 'Report > Email Report', permissions: [false, false, false] },
  { name: 'Report > Lead v/s Shipment Report', permissions: [false, false, false] },
  { name: 'Reports > Account Reports > Profit and Loss', permissions: [false, false, false] },
  { name: 'Reports > Accounts Payable', permissions: [false, false, false] },
  { name: 'Reports > Accounts Receivable', permissions: [false, false, false] },
  { name: 'Reports > Console Split Invoice', permissions: [false, false, false] },
  { name: 'Reports > Download Forms', permissions: [false, false, false] },
  { name: 'Reports > FedEx Invoice Upload', permissions: [false, false, false] },
  { name: 'Reports > Locked Shipment Report', permissions: [false, false, false] },
  { name: 'Reports > Review Report', permissions: [false, false, false] },
  { name: 'Reports > Sales All', permissions: [false, false, false] },
  { name: 'Reports > Sales Clear', permissions: [false, false, false] },
  { name: 'Reports > Sales Commission', permissions: [false, false, false] },
  { name: 'Reports > Sales Team Productivity', permissions: [false, false, false] },
  { name: 'Reports > Sales Unclear', permissions: [false, false, false] },
  { name: 'Reports > Standard Invoice Upload', permissions: [false, false, false] },
  { name: 'Reports > User Login Report', permissions: [false, false, false] },
  { name: 'Reports > Vendor Invoice Upload', permissions: [false, false, false] },
  { name: 'Reports > Label printing', permissions: [false, false, false] },
  { name: 'Sales Lead > Listing', permissions: [false, false, false] },
  { name: 'Sales Lead > Search', permissions: [false, false, false] },
  { name: 'Search - Top Bar', permissions: [false, false, false] },
  { name: 'Shipment > Listing', permissions: [false, false, false] },
  { name: 'Shipment > My Shipment', permissions: [false, false, false] },
  { name: 'Shipment > Schedule', permissions: [false, false, false] },
  { name: 'Shipment > Search', permissions: [false, false, false] },
];

const AccessTable = ({ user }) => {
  // Initialize permissions state with user.permissions or fallback to moduleData
  const [permissions, setPermissions] = useState(
    user?.permissions?.length > 0 ? user.permissions : moduleData
  );

  // Handle individual checkbox changes
  const handlePermissionChange = (moduleIndex, permissionIndex) => {
    setPermissions((prev) => {
      const newPermissions = [...prev];
      newPermissions[moduleIndex] = {
        ...newPermissions[moduleIndex],
        permissions: [
          ...newPermissions[moduleIndex].permissions.slice(0, permissionIndex),
          !newPermissions[moduleIndex].permissions[permissionIndex],
          ...newPermissions[moduleIndex].permissions.slice(permissionIndex + 1),
        ],
      };
      return newPermissions;
    });
  };

  // Handle header checkbox (toggle all for a specific permission type)
  const handleHeaderCheckboxChange = (permissionIndex) => {
    setPermissions((prev) =>
      prev.map((module) => ({
        ...module,
        permissions: [
          ...module.permissions.slice(0, permissionIndex),
          !module.permissions[permissionIndex],
          ...module.permissions.slice(permissionIndex + 1),
        ],
      }))
    );
  };

  return (
    <CardContent sx={{ pt: 0 }}>
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead sx={{ backgroundColor: '#2d2d2d' }}>
            <TableRow>
              <TableCell
                sx={{
                  color: 'white',
                  fontWeight: 'bold',
                  fontSize: 13,
                  borderRight: '1px solid #555',
                  width: '30%',
                }}
              >
                Module Name
              </TableCell>
              {['Read', 'Write', 'Delete'].map((label, idx) => (
                <TableCell
                  key={label}
                  align="center"
                  sx={{
                    color: 'white',
                    fontWeight: 'bold',
                    fontSize: 13,
                    borderRight: idx < 3 ? '1px solid #555' : 'none',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <Box
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    gap={1}
                    onClick={(e) => e.stopPropagation()} // Prevent event bubbling
                  >
                    {label} Access
                    <Checkbox
                      sx={{
                        color: 'white',
                        p: 0,
                        '&.Mui-checked': { color: '#fff' },
                      }}
                      checked={permissions.every((module) => module.permissions[idx])}
                      onChange={() => handleHeaderCheckboxChange(idx)}
                      onClick={(e) => e.stopPropagation()} // Ensure checkbox click works
                    />
                  </Box>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {permissions.map((module, index) => (
              <TableRow key={index}>
                <TableCell sx={{ borderRight: '1px solid #ccc', fontSize: 13 }}>
                  {module.name}
                </TableCell>
                {module.permissions.map((hasAccess, colIndex) => (
                  <TableCell
                    key={colIndex}
                    align="center"
                    sx={{
                      borderRight: colIndex < 3 ? '1px solid #ccc' : 'none',
                      fontSize: 13,
                    }}
                  >
                    <Box
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      onClick={(e) => e.stopPropagation()} // Prevent event bubbling
                    >
                      <Checkbox
                        checked={hasAccess}
                        onChange={() => handlePermissionChange(index, colIndex)}
                        sx={{
                          p: 0.5,
                          color: '#e91e63',
                          '&.Mui-checked': { color: '#e91e63' },
                        }}
                        onClick={(e) => e.stopPropagation()} // Ensure checkbox click works
                      />
                    </Box>
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </CardContent>
  );
};

export default AccessTable;