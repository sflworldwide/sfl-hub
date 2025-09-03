import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer, // Added import
  TableHead,
  TableRow,
  Select,
  MenuItem,
  TextField,
  Button,
  Popover,
  Checkbox,
  FormControlLabel,
  Divider
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';

const mockData = [
  { country: 'India', type: 'Air', serviceName: 'FedEx', subService: 'FEDEX_FREIGHT_PRIORITY', displayName: 'Fedex Freight Priority', pkgMarkup: '15', envMarkup: '15', markupType: 'Percentage', status: 'Active' },
  { country: 'India', type: 'Ground', serviceName: 'FedEx', subService: 'FEDEX_GROUND', displayName: 'Fedex Ground', pkgMarkup: '15', envMarkup: '15', markupType: 'Percentage', status: 'Active' },
  { country: 'India', type: 'Air', serviceName: 'FedEx', subService: 'FEDEX_NEXT_DAY_EARLY_MORNING', displayName: 'Fedex Next Day Early Morning', pkgMarkup: '15', envMarkup: '15', markupType: 'Percentage', status: 'Active' },
  { country: 'India', type: 'Air', serviceName: 'FedEx', subService: 'FEDEX_NEXT_DAY_END_OF_DAY', displayName: 'Fedex Next Day End Of Day', pkgMarkup: '15', envMarkup: '15', markupType: 'Percentage', status: 'Active' },
  { country: 'India', type: 'Air', serviceName: 'FedEx', subService: 'FEDEX_NEXT_DAY_FREIGHT', displayName: 'Fedex Next Day Freight', pkgMarkup: '15', envMarkup: '15', markupType: 'Percentage', status: 'Active' },
  { country: 'India', type: 'Air', serviceName: 'FedEx', subService: 'FEDEX_NEXT_DAY_MID_MORNING', displayName: 'Fedex Next Day Mid Morning', pkgMarkup: '15', envMarkup: '15', markupType: 'Percentage', status: 'Active' },
  { country: 'India', type: 'Ground', serviceName: 'FedEx', subService: 'GROUND_HOME_DELIVERY', displayName: 'Fedex Ground Home Delivery', pkgMarkup: '15', envMarkup: '15', markupType: 'Percentage', status: 'Active' },
  { country: 'India', type: 'Air', serviceName: 'FedEx', subService: 'INTERNATIONAL_ECONOMY', displayName: 'Fedex International Economy', pkgMarkup: '15', envMarkup: '15', markupType: 'Percentage', status: 'Active' },
  { country: 'India', type: 'Air', serviceName: 'FedEx', subService: 'INTERNATIONAL_ECONOMY_FREIGHT', displayName: 'Fedex International Economy Freight', pkgMarkup: '15', envMarkup: '15', markupType: 'Percentage', status: 'Active' },
  { country: 'India', type: 'Air', serviceName: 'FedEx', subService: 'INTERNATIONAL_FIRST', displayName: 'Fedex International First', pkgMarkup: '15', envMarkup: '15', markupType: 'Percentage', status: 'Active' },
  { country: 'India', type: 'Air', serviceName: 'FedEx', subService: 'FEDEX_INTERNATIONAL_PRIORITY', displayName: 'Fedex International Priority', pkgMarkup: '15', envMarkup: '15', markupType: 'Percentage', status: 'Active' },
  { country: 'India', type: 'Air', serviceName: 'FedEx', subService: 'FEDEX_INTERNATIONAL_PRIORITY_FREIGHT', displayName: 'Fedex International Priority Freight', pkgMarkup: '15', envMarkup: '15', markupType: 'Percentage', status: 'Active' },
  { country: 'India', type: 'Air', serviceName: 'FedEx', subService: 'FEDEX_PRIORITY_OVERNIGHT', displayName: 'Fedex Priority Overnight', pkgMarkup: '15', envMarkup: '15', markupType: 'Percentage', status: 'Active' },
  { country: 'India', type: 'Air', serviceName: 'FedEx', subService: 'FEDEX_SAME_DAY', displayName: 'Fedex Same Day', pkgMarkup: '15', envMarkup: '15', markupType: 'Percentage', status: 'Active' },
  { country: 'India', type: 'Air', serviceName: 'FedEx', subService: 'FEDEX_SAME_DAY_CITY', displayName: 'Fedex Same Day City', pkgMarkup: '15', envMarkup: '15', markupType: 'Percentage', status: 'Active' },
  { country: 'India', type: 'Air', serviceName: 'FedEx', subService: 'FEDEX_SMART_POST', displayName: 'Fedex Smart Post', pkgMarkup: '15', envMarkup: '15', markupType: 'Percentage', status: 'Active' },
  { country: 'India', type: 'Air', serviceName: 'FedEx', subService: 'FEDEX_2_DAY', displayName: 'Fedex 2 Day', pkgMarkup: '15', envMarkup: '15', markupType: 'Percentage', status: 'Active' },
  { country: 'India', type: 'Air', serviceName: 'FedEx', subService: 'FEDEX_2_DAY_AM', displayName: 'Fedex 2 Day AM', pkgMarkup: '15', envMarkup: '15', markupType: 'Percentage', status: 'Active' },
  { country: 'India', type: 'Air', serviceName: 'FedEx', subService: 'STANDARD_OVERNIGHT', displayName: 'Fedex Standard Overnight', pkgMarkup: '15', envMarkup: '15', markupType: 'Percentage', status: 'Active' },
  { country: 'India', type: 'Ground', serviceName: 'Destination Services', subService: '40FT_FCL', displayName: '40FT FCL', pkgMarkup: '15', envMarkup: '15', markupType: 'Percentage', status: 'Active' },
  { country: 'India', type: 'Ground', serviceName: 'Destination Services', subService: '40FT_HC_FCL', displayName: '40FT HC FCL', pkgMarkup: '15', envMarkup: '15', markupType: 'Percentage', status: 'Active' },
  { country: 'India', type: 'Ground', serviceName: 'Destination Services', subService: 'LCL', displayName: 'LCL', pkgMarkup: '15', envMarkup: '15', markupType: 'Percentage', status: 'Active' },
  { country: 'India', type: 'Ocean', serviceName: 'Consolidation', subService: 'Texas Console', displayName: 'Texas Console', pkgMarkup: '15', envMarkup: '15', markupType: 'Percentage', status: 'Active' },
  { country: 'India', type: 'Ocean', serviceName: 'Consolidation', subService: 'New Jersey Console', displayName: 'New Jersey Console', pkgMarkup: '15', envMarkup: '15', markupType: 'Percentage', status: 'Active' },
  { country: 'India', type: 'Ocean', serviceName: 'Consolidation', subService: 'California Console', displayName: 'California Console', pkgMarkup: '15', envMarkup: '15', markupType: 'Percentage', status: 'Active' },
  { country: 'India', type: 'Air', serviceName: 'FedEx', subService: 'FEDEX_INTERNATIONAL_PRIORITY_EXPRESS', displayName: 'Fedex Intl Priority Express', pkgMarkup: '15', envMarkup: '15', markupType: 'Percentage', status: 'Active' },
  { country: 'India', type: 'Ground', serviceName: 'FedEx', subService: 'FEDEX_GROUND_ECONOMY', displayName: 'Fedex Ground Economy', pkgMarkup: '15', envMarkup: '15', markupType: 'Percentage', status: 'Active' },
  { country: 'India', type: 'Air', serviceName: 'FedEx', subService: 'FEDEX_INTERNATIONAL_CONNECT_PLUS', displayName: 'Fedex International Connect Plus', pkgMarkup: '15', envMarkup: '15', markupType: 'Percentage', status: 'Active' },
  { country: 'India', type: 'Ground', serviceName: 'Destination Services', subService: 'Groupage', displayName: 'Groupage', pkgMarkup: '15', envMarkup: '15', markupType: 'Percentage', status: 'Active' },
  { country: 'India', type: 'Air', serviceName: 'FedEx', subService: 'INTERNATIONAL_PRIORITY_FREIGHT', displayName: 'Fedex International Priority Freight', pkgMarkup: '15', envMarkup: '15', markupType: 'Percentage', status: 'Active' },
  { country: 'India', type: 'Ocean', serviceName: 'FCL Shipment', subService: '20FT - Door-2-Door', displayName: '20FT - Door-2-Door', pkgMarkup: '15', envMarkup: '15', markupType: 'Percentage', status: 'Active' },
  { country: 'India', type: 'Ocean', serviceName: 'FCL Shipment', subService: '20FT - Door-2-Port', displayName: '20FT - Door-2-Port', pkgMarkup: '15', envMarkup: '15', markupType: 'Percentage', status: 'Active' },
  { country: 'India', type: 'Ocean', serviceName: 'FCL Shipment', subService: '40FT - Door-2-Door', displayName: '40FT - Door-2-Door', pkgMarkup: '15', envMarkup: '15', markupType: 'Percentage', status: 'Active' },
  { country: 'India', type: 'Ocean', serviceName: 'FCL Shipment', subService: '40FT - Door-2-Port', displayName: '40FT - Door-2-Port', pkgMarkup: '15', envMarkup: '15', markupType: 'Percentage', status: 'Active' },
  { country: 'India', type: 'Ocean', serviceName: 'FCL Shipment', subService: '40FT HC - Door-2-Door', displayName: '40FT HC - Door-2-Door', pkgMarkup: '15', envMarkup: '15', markupType: 'Percentage', status: 'Active' },
  { country: 'India', type: 'Ocean', serviceName: 'FCL Shipment', subService: '40FT HC - Door-2-Port', displayName: '40FT HC - Door-2-Port', pkgMarkup: '15', envMarkup: '15', markupType: 'Percentage', status: 'Active' },
  { country: 'India', type: 'Ocean', serviceName: 'LCL Shipment', subService: 'Door to Port', displayName: 'Door to Port', pkgMarkup: '15', envMarkup: '15', markupType: 'Percentage', status: 'Active' },
  { country: 'India', type: 'Ocean', serviceName: 'LCL Shipment', subService: 'Door to Door', displayName: 'Door to Door', pkgMarkup: '15', envMarkup: '15', markupType: 'Percentage', status: 'Active' },
];


const countryList = ['All', 'Canada', 'India', 'United States', 'Others'];

const MarkupDetails = () => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedCountries, setSelectedCountries] = useState(['India']);

  const handleCountryClick = (event) => setAnchorEl(event.currentTarget);
  const handleCountryClose = () => setAnchorEl(null);

  const handleCountryToggle = (country) => {
    setSelectedCountries((prev) =>
      prev.includes(country)
        ? prev.filter((item) => item !== country)
        : [...prev, country]
    );
  };

  const handleSearch = () => {
    handleCountryClose();
    console.log('Selected Countries:', selectedCountries);
  };

  return (
    <Box> {/* Added parent Box to wrap all elements */}
      <Box display="flex" alignItems="center" justifyContent="flex-end" mb={2}>
        <Button
          variant="contained"
          endIcon={<ArrowDropDownIcon />}
          sx={{
            backgroundColor: '#ec407a',
            '&:hover': { backgroundColor: '#d81b60' },
            borderRadius: 1,
            height: 36,
            px: 2,
            fontSize: '0.75rem',
          }}
          onClick={handleCountryClick}
        >
          COUNTRY
        </Button>

        <Popover
          open={Boolean(anchorEl)}
          anchorEl={anchorEl}
          onClose={handleCountryClose}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          PaperProps={{ sx: { p: 1, minWidth: 200, borderRadius: 2 } }}
        >
          <Box display="flex" flexDirection="column">
            {countryList.map((country) => (
              <FormControlLabel
                key={country}
                sx={{ ml: 1 }}
                control={
                  <Checkbox
                    checked={selectedCountries.includes(country)}
                    onChange={() => handleCountryToggle(country)}
                    size="small"
                  />
                }
                label={<Typography sx={{ fontSize: '0.75rem' }}>{country}</Typography>}
              />
            ))}
            <Divider sx={{ my: 1 }} />
            <Button
              variant="contained"
              fullWidth
              onClick={handleSearch}
              sx={{
                backgroundColor: '#ec407a',
                '&:hover': { backgroundColor: '#d81b60' },
                fontSize: '0.75rem',
                py: 0.5
              }}
            >
              SEARCH
            </Button>
          </Box>
        </Popover>
      </Box>

      <TableContainer component={Paper}> {/* Added TableContainer */}
        <Table
          sx={{
            border: '1px solid #e0e0e0',
            '& td, & th': {
              padding: '4px 8px',
              verticalAlign: 'middle',
              borderRight: '1px solid #ccc',
            },
            '& td:last-child, & th:last-child': {
              borderRight: 'none',
            },
          }}
        >
          <TableHead>
            <TableRow sx={{ backgroundColor: '#2d2d2d' }}>
              {[
                'Country',
                'Type',
                'Service Name',
                'Sub Service Name',
                'Display Name',
                'Pkg Markup',
                'Env Markup',
                'Markup Type',
                'Status',
              ].map((heading) => (
                <TableCell key={heading}>
                  <Typography sx={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#fff' }}>
                    {heading}
                  </Typography>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>

          <TableBody>
            {mockData.map((row, index) => (
              <TableRow key={index} hover>
                <TableCell><Typography sx={{ fontSize: '0.75rem' }}>{row.country}</Typography></TableCell>
                <TableCell><Typography sx={{ fontSize: '0.75rem' }}>{row.type}</Typography></TableCell>
                <TableCell><Typography sx={{ fontSize: '0.75rem' }}>{row.serviceName}</Typography></TableCell>
                <TableCell><Typography sx={{ fontSize: '0.70rem' }}>{row.subService}</Typography></TableCell>
                <TableCell><Typography sx={{ fontSize: '0.75rem' }}>{row.displayName}</Typography></TableCell>
                <TableCell>
                  <TextField
                    variant="outlined"
                    size="small"
                    fullWidth
                    defaultValue={row.pkgMarkup}
                    inputProps={{ style: { fontSize: '0.75rem', padding: 4 } }}
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    variant="outlined"
                    size="small"
                    fullWidth
                    defaultValue={row.envMarkup}
                    inputProps={{ style: { fontSize: '0.75rem', padding: 4 } }}
                  />
                </TableCell>
                <TableCell>
                  <Select
                    size="small"
                    fullWidth
                    defaultValue={row.markupType}
                    sx={{ fontSize: '0.75rem' }}
                  >
                    <MenuItem value="Percentage" sx={{ fontSize: '0.75rem' }}>Percentage</MenuItem>
                    <MenuItem value="USD" sx={{ fontSize: '0.75rem' }}>USD</MenuItem>
                  </Select>
                </TableCell>
                <TableCell>
                  <Typography sx={{ fontSize: '0.75rem' }}>{row.status}</Typography></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box> 
  );
};

export default MarkupDetails;