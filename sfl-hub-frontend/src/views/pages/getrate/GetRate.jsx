import React, { useState, useRef,useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { api, encryptURL } from '../../../utils/api';
import { toast } from 'react-hot-toast';
import {
  Box,
  Autocomplete,
  FormControl,
  Card,
  CardContent,
  Button,
  Typography,
  TextField,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tabs,
  Tab,
  IconButton,
  useMediaQuery,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import FlightTakeoffIcon from '@mui/icons-material/FlightTakeoff';
import { IconBox } from '../../styles/scheduleshipmentStyle';
import { useStyles } from '../../styles/MyshipmentStyle';
import { useShipmentContext } from '../../ShipmentContext';
import { useNavigate } from 'react-router-dom';

// Define StyledTextField and StyledTableTextField similar to Myshipmentnew
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

// Define ResponsiveTable for Package Details
const ResponsivePackageTable = ({ packageDetails, formErrors, handlePackageRowChange, handleDeleteRow, isEnvelope, weightUnit, dimensionUnit, chargeableUnit, handleWeightUnitChange }) => {
  const isMobile = useMediaQuery("(max-width:600px)");
  const columns = [
    "No of Packages",
    ` Weight (${weightUnit})`,
    `Dimension (L * W * H) (${dimensionUnit})`,
    `Chargeable Weight (${chargeableUnit})`,
    "Insured Value (USD)",
    ""
  ];

  if (isMobile) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
        <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 1 }}>
          <Select
            value={weightUnit || 'LB'}
            onChange={(e) => {
              console.log('Mobile view weight unit change:', e.target.value);
              handleWeightUnitChange(e.target.value);
            }}
            disabled={isEnvelope}
            sx={{
              height: '24px',
              width: '70px',
              fontSize: '12px',
              backgroundColor: '#000',
              color: '#fff',
              '& .MuiSelect-select': {
                padding: '4px 24px 4px 8px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.42)',
              },
              '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
              '&:hover .MuiOutlinedInput-notchedOutline': { border: 'none' },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': { border: 'none' },
              '& .MuiSvgIcon-root': { color: '#fff' },
            }}
          >
            <MenuItem value="LB">LB</MenuItem>
            <MenuItem value="KG">KG</MenuItem>
          </Select>
        </Box>
        {packageDetails.map((row, index) => (
          <Paper key={index} sx={{ p: 1.5, boxShadow: 1 }}>
            <Box sx={{ mb: 1, display: "flex", flexDirection: "column", gap: 1 }}>
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <Typography variant="caption" sx={{ minWidth: 120, fontWeight: "bold", fontSize: "0.75rem" }}>
                  No of Packages:
                </Typography>
                <StyledTableTextField
                  fullWidth
                  type="number"
                  value={row.packageNumber || ''}
                  onChange={(e) => handlePackageRowChange(index, 'packageNumber', e.target.value)}
                  error={!!formErrors.packageRows[index]?.packageNumber}
                  helperText={formErrors.packageRows[index]?.packageNumber}
                  disabled={isEnvelope}
                  size="small"
                  InputProps={{ autoComplete: 'off', autoCorrect: 'off', autoCapitalize: 'none' }}
                />
              </Box>
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <Typography variant="caption" sx={{ minWidth: 120, fontWeight: "bold", fontSize: "0.75rem" }}>
                  Weight ({weightUnit}):
                </Typography>
                <StyledTableTextField
                  fullWidth
                  type="number"
                  value={row.weight || ''}
                  onChange={(e) => handlePackageRowChange(index, 'weight', e.target.value)}
                  error={!!formErrors.packageRows[index]?.weight}
                  helperText={formErrors.packageRows[index]?.weight}
                  disabled={isEnvelope}
                  size="small"
                  InputProps={{ autoComplete: 'off', autoCorrect: 'off', autoCapitalize: 'none' }}
                />
              </Box>
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <Typography variant="caption" sx={{ minWidth: 120, fontWeight: "bold", fontSize: '0.75rem' }}>
                  Dimension ({dimensionUnit}):
                </Typography>
                <Box sx={{ display: "flex", gap: 1, flex: 1 }}>
                  <StyledTableTextField
                    type="number"
                    value={row.length || ''}
                    onChange={(e) => handlePackageRowChange(index, 'length', e.target.value)}
                    error={!!formErrors.packageRows[index]?.length}
                    helperText={formErrors.packageRows[index]?.length}
                    disabled={isEnvelope}
                    size="small"
                    placeholder="L"
                    InputProps={{ autoComplete: 'off', autoCorrect: 'off', autoCapitalize: 'none' }}
                  />
                  <StyledTableTextField
                    type="number"
                    value={row.width || ''}
                    onChange={(e) => handlePackageRowChange(index, 'width', e.target.value)}
                    error={!!formErrors.packageRows[index]?.width}
                    helperText={formErrors.packageRows[index]?.width}
                    disabled={isEnvelope}
                    size="small"
                    placeholder="W"
                    InputProps={{ autoComplete: 'off', autoCorrect: 'off', autoCapitalize: 'none' }}
                  />
                  <StyledTableTextField
                    type="number"
                    value={row.height || ''}
                    onChange={(e) => handlePackageRowChange(index, 'height', e.target.value)}
                    error={!!formErrors.packageRows[index]?.height}
                    helperText={formErrors.packageRows[index]?.height}
                    disabled={isEnvelope}
                    size="small"
                    placeholder="H"
                    InputProps={{ autoComplete: 'off', autoCorrect: 'off', autoCapitalize: 'none' }}
                  />
                </Box>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <Typography variant="caption" sx={{ minWidth: 120, fontWeight: "bold", fontSize: "0.75rem" }}>
                  Chargeable Weight ({chargeableUnit}):
                </Typography>
                <StyledTableTextField
                  fullWidth
                  type="number"
                  value={row.chargeableWeight || ''}
                  disabled
                  size="small"
                  InputProps={{ autoComplete: 'off', autoCorrect: 'off', autoCapitalize: 'none' }}
                />
              </Box>
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <Typography variant="caption" sx={{ minWidth: 120, fontWeight: "bold", fontSize: "0.75rem" }}>
                  Insured Value (USD):
                </Typography>
                <StyledTableTextField
                  fullWidth
                  type="number"
                  value={row.insuredValue || ''}
                  onChange={(e) => handlePackageRowChange(index, 'insuredValue', e.target.value)}
                  error={!!formErrors.packageRows[index]?.insuredValue}
                  helperText={formErrors.packageRows[index]?.insuredValue}
                  size="small"
                  InputProps={{ autoComplete: 'off', autoCorrect: 'off', autoCapitalize: 'none' }}
                />
              </Box>
              {packageDetails.length > 1 && (
                <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                  <IconButton
                    onClick={() => handleDeleteRow(index)}
                    sx={{ color: '#f44336' }}
                    disabled={isEnvelope}
                    aria-label="Delete package row"
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              )}
            </Box>
          </Paper>
        ))}
      </Box>
    );
  }

  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow sx={{ backgroundColor: '#000' }}>
            {columns.map((col, idx) => (
              <TableCell
                key={idx}
                sx={{ padding: '8px', fontSize: '14px', color: '#fff', fontWeight: 'bold' }}
              >
                {col.includes('Weight') || col.includes('Dimension') || col.includes('Chargeable') ? (
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    {col.split(' (')[0]}
                    <Select
                      value={
                        col.includes('Weight')
                          ? weightUnit || 'LB'
                          : col.includes('Dimension')
                            ? dimensionUnit || 'INCHES'
                            : chargeableUnit || 'LB'
                      }
                      onChange={(e) => {
                        if (col.includes('Weight')) {
                          console.log('Desktop view weight unit change:', e.target.value);
                          handleWeightUnitChange(e.target.value);
                        }
                      }}
                      disabled={col.includes('Dimension') || col.includes('Chargeable') || isEnvelope}
                      sx={{
                        height: '24px',
                        width: col.includes('Dimension') ? '90px' : '70px',
                        fontSize: '12px',
                        color: '#fff',
                        marginLeft: '8px',
                        backgroundColor: 'transparent',
                        border: 'none',
                        '& .MuiSelect-select': {
                          padding: '4px 24px 4px 8px',
                          borderBottom: '1px solid rgba(255, 255, 255, 0.42)',
                        },
                        '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
                        '&:hover .MuiOutlinedInput-notchedOutline': { border: 'none' },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': { border: 'none' },
                        '&.Mui-disabled': {
                          '& .MuiSelect-select': { color: '#fff', '-webkit-text-fill-color': '#fff' },
                        },
                        '& .MuiSvgIcon-root': { color: '#fff' },
                      }}
                    >
                      {col.includes('Dimension') ? [
                        <MenuItem key="INCHES" value="INCHES">INCHES</MenuItem>,
                        <MenuItem key="CM" value="CM">CM</MenuItem>
                      ] : [
                        <MenuItem key="LB" value="LB">LB</MenuItem>,
                        <MenuItem key="KG" value="KG">KG</MenuItem>
                      ]}
                    </Select>
                  </Box>
                ) : (
                  col
                )}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {packageDetails.map((row, index) => (
            <TableRow key={index}>
              <TableCell sx={{ padding: '8px' }}>
                <StyledTableTextField
                  type="number"
                  value={row.packageNumber || ''}
                  onChange={(e) => handlePackageRowChange(index, 'packageNumber', e.target.value)}
                  error={!!formErrors.packageRows[index]?.packageNumber}
                  helperText={formErrors.packageRows[index]?.packageNumber}
                  disabled={isEnvelope}
                  fullWidth
                  size="small"
                  InputProps={{ autoComplete: 'off', autoCorrect: 'off', autoCapitalize: 'none' }}
                />
              </TableCell>
              <TableCell sx={{ padding: '8px' }}>
                <StyledTableTextField
                  type="number"
                  value={row.weight || ''}
                  onChange={(e) => handlePackageRowChange(index, 'weight', e.target.value)}
                  error={!!formErrors.packageRows[index]?.weight}
                  helperText={formErrors.packageRows[index]?.weight}
                  disabled={isEnvelope}
                  fullWidth
                  size="small"
                  InputProps={{ autoComplete: 'off', autoCorrect: 'off', autoCapitalize: 'none' }}
                />
              </TableCell>
              <TableCell sx={{ padding: '8px', display: 'flex', gap: '4px', alignItems: 'center' }}>
                <StyledTableTextField
                  type="number"
                  value={row.length || ''}
                  onChange={(e) => handlePackageRowChange(index, 'length', e.target.value)}
                  error={!!formErrors.packageRows[index]?.length}
                  helperText={formErrors.packageRows[index]?.length}
                  disabled={isEnvelope}
                  size="small"
                  placeholder="L"
                  sx={{ flex: 1 }}
                  InputProps={{ autoComplete: 'off', autoCorrect: 'off', autoCapitalize: 'none' }}
                />
                <StyledTableTextField
                  type="number"
                  value={row.width || ''}
                  onChange={(e) => handlePackageRowChange(index, 'width', e.target.value)}
                  error={!!formErrors.packageRows[index]?.width}
                  helperText={formErrors.packageRows[index]?.width}
                  disabled={isEnvelope}
                  size="small"
                  placeholder="W"
                  sx={{ flex: 1 }}
                  InputProps={{ autoComplete: 'off', autoCorrect: 'off', autoCapitalize: 'none' }}
                />
                <StyledTableTextField
                  type="number"
                  value={row.height || ''}
                  onChange={(e) => handlePackageRowChange(index, 'height', e.target.value)}
                  error={!!formErrors.packageRows[index]?.height}
                  helperText={formErrors.packageRows[index]?.height}
                  disabled={isEnvelope}
                  size="small"
                  placeholder="H"
                  sx={{ flex: 1 }}
                  InputProps={{ autoComplete: 'off', autoCorrect: 'off', autoCapitalize: 'none' }}
                />
              </TableCell>
              <TableCell sx={{ padding: '8px' }}>
                <StyledTableTextField
                  type="number"
                  value={row.chargeableWeight || ''}
                  disabled
                  fullWidth
                  size="small"
                  InputProps={{ autoComplete: 'off', autoCorrect: 'off', autoCapitalize: 'none' }}
                />
              </TableCell>
              <TableCell sx={{ padding: '8px' }}>
                <StyledTableTextField
                  type="number"
                  value={row.insuredValue || ''}
                  onChange={(e) => handlePackageRowChange(index, 'insuredValue', e.target.value)}
                  error={!!formErrors.packageRows[index]?.insuredValue}
                  helperText={formErrors.packageRows[index]?.insuredValue}
                  fullWidth
                  size="small"
                  InputProps={{ autoComplete: 'off', autoCorrect: 'off', autoCapitalize: 'none' }}
                />
              </TableCell>
              <TableCell sx={{ padding: '8px' }}>
                {packageDetails.length > 1 && (
                  <IconButton
                    onClick={() => handleDeleteRow(index)}
                    sx={{ color: '#f44336' }}
                    disabled={isEnvelope}
                    aria-label="Delete package row"
                  >
                    <DeleteIcon />
                  </IconButton>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

const GetRate = ({ setActiveModule, setActiveTab, setCompletedTabs,setConfirmation }) => {
  const navigate = useNavigate();
  const classes = useStyles();
  const {
    fromDetails,
    updateFromDetails,
    toDetails,
    updateToDetails,
    packageDetails,
    setPackageDetails,
    Giszip,
    GsetisZip,
    Gresiszip,
    GsetresisZip,
    GshipmentType,
    GsetShipmentType,
    setIsgetrate,
  } = useShipmentContext();

  // Fetch countries data
  const { data: countries = [], isLoading: isCountriesLoading, isError: isCountriesError } = useQuery({
    queryKey: ['country'],
    queryFn: async () => {
      //const encodedUrl = encryptURL("/getCountry")
      const res = await axios.get(`${api.BackendURL}/locations/getCountry`,{
        withCredentials: true, // ✅ Correct placement
      });
      const countryData = res.data?.user?.[0] || [];
      return countryData.map(country => ({
        value: country.countrycode.toLowerCase(),
        label: country.countryname,
        countryid: country.countryid,
        isfedexcity: country.isfedexcity,
      }));
    },
    staleTime: 24 * 60 * 60 * 1000,
    retry: 2,
    onError: (error) => {
      console.error('Failed to fetch countries:', error);
      toast.error('Failed to load countries.');
    },
  });

  const [rates, setRates] = useState([]);
  const [showRates, setShowRates] = useState(false);
  const [pickupErrors, setPickupErrors] = useState({
    fromZipCode: '',
    toZipCode: '',
  });
  const [formErrors, setFormErrors] = useState({
    fromCountry: '',
    toCountry: '',
    fromZipCode: '',
    toZipCode: '',
    fromCity: '',
    toCity: '',
    shipDate: '',
    packageRows: packageDetails.map(() => ({
      packageNumber: '',
      weight: '',
      length: '',
      width: '',
      height: '',
      chargeableWeight: '',
      insuredValue: '',
    })),
  });

  // Global unit states
  const [weightUnit, setWeightUnit] = useState('LB');
  const [dimensionUnit, setDimensionUnit] = useState('INCHES');
  const [chargeableUnit, setChargeableUnit] = useState('LB');
  const isEnvelope = toDetails.packageType === 'Envelope';

  // Sync packageDetails with packageType changes
  useEffect(() => {
    if (isEnvelope) {
      setPackageDetails([
        {
          packageNumber: '1',
          weight: '0.5',
          length: '10',
          width: '13',
          height: '1',
          chargeableWeight: '1',
          insuredValue: '0',
        },
      ]);
      setWeightUnit('LB');
      setDimensionUnit('INCHES');
      setChargeableUnit('LB');
    } else {
      if (
        packageDetails.length !== 1 ||
        packageDetails[0].packageNumber !== '' ||
        packageDetails[0].weight !== '' ||
        packageDetails[0].length !== '' ||
        packageDetails[0].width !== '' ||
        packageDetails[0].height !== '' ||
        packageDetails[0].chargeableWeight !== '' ||
        packageDetails[0].insuredValue !== ''
      ) {
        setPackageDetails([
          {
            packageNumber: '',
            weight: '',
            length: '',
            width: '',
            height: '',
            chargeableWeight: '',
            insuredValue: '',
          },
        ]);
      }
    }
  }, [toDetails.packageType, setPackageDetails]);

  // Sync formErrors with packageDetails
  useEffect(() => {
    setFormErrors(prev => ({
      ...prev,
      packageRows: packageDetails.map(() => ({
        packageNumber: '',
        weight: '',
        length: '',
        width: '',
        height: '',
        chargeableWeight: '',
        insuredValue: '',
      })),
    }));
  }, [packageDetails]);

  // Fetch city list for fromCountry when iszip === 0
  const fromCountryObj = countries.find(c => c.value === fromDetails.fromCountry);
  const { data: fromCities = [], isLoading: isFromCitiesLoading, error: fromCitiesError } = useQuery({
    queryKey: ['fromCityList', fromDetails.fromCountry],
    queryFn: async () => {
      if (!fromCountryObj || Giszip !== 1) return [];
      const encodedUrl = encryptURL("/locations/getFedexCityList");
      const response = await axios.post(`${api.BackendURL}/locations/${encodedUrl}`, {
        countryID: fromCountryObj.countryid,
        cityType: 'FedEx',
      },
      {
      withCredentials: true,
      }
    );
      return response.data.user?.[0]?.map(city => city.cityname) || [];
    },
    enabled: !!fromCountryObj && Giszip === 1,
    staleTime: 24 * 60 * 60 * 1000,
    retry: 2,
    onError: (error) => {
      console.error('Failed to fetch from city list:', error);
      toast.error('Failed to load from city list.');
    },
  });

  // Fetch city list for toCountry when resiszip === 0
  const toCountryObj = countries.find(c => c.value === toDetails.toCountry);
  const { data: toCities = [], isLoading: isToCitiesLoading, error: toCitiesError } = useQuery({
    queryKey: ['toCityList', toDetails.toCountry],
    queryFn: async () => {
      if (!toCountryObj || Gresiszip !== 1) return [];
      const encodedUrl = encryptURL("/locations/getFedexCityList");
      const response = await axios.post(`${api.BackendURL}/locations/${encodedUrl}`, {
        countryID: toCountryObj.countryid,
        cityType: 'FedEx',
      },
      {
      withCredentials: true,
      }
    );
      return response.data.user?.[0]?.map(city => city.cityname) || [];
    },
    enabled: !!toCountryObj && Gresiszip === 1,
    staleTime: 24 * 60 * 60 * 1000,
    retry: 2,
    onError: (error) => {
      console.error('Failed to fetch to city list:', error);
      toast.error('Failed to load to city list.');
    },
  });

  const validateForm = () => {
    let isValid = true;
    const newErrors = {
      fromCountry: '',
      toCountry: '',
      fromZipCode: '',
      toZipCode: '',
      fromCity: '',
      toCity: '',
      shipDate: '',
      packageRows: packageDetails.map(() => ({
        packageNumber: '',
        weight: '',
        length: '',
        width: '',
        height: '',
        chargeableWeight: '',
        insuredValue: '',
      })),
    };

    if (!fromDetails.fromCountry) {
      newErrors.fromCountry = 'From Country is required';
      isValid = false;
    }
    if (!toDetails.toCountry) {
      newErrors.toCountry = 'To Country is required';
      isValid = false;
    }
    if (Giszip === 0 && !fromDetails.fromZipCode) {
      newErrors.fromZipCode = 'From Zip Code is required';
      isValid = false;
    }
    if (Gresiszip === 0 && !toDetails.toZipCode) {
      newErrors.toZipCode = 'To Zip Code is required';
      isValid = false;
    }
    if (!fromDetails.fromCity) {
      newErrors.fromCity = 'From City is required';
      isValid = false;
    }
    if (!toDetails.toCity) {
      newErrors.toCity = 'To City is required';
      isValid = false;
    }
    if (!toDetails.shipDate) {
      newErrors.shipDate = 'Ship Date is required';
      isValid = false;
    }

    packageDetails.forEach((row, index) => {
      if (!row.packageNumber || isNaN(row.packageNumber) || parseInt(row.packageNumber) <= 0) {
        newErrors.packageRows[index].packageNumber = 'Valid number of packages is required';
        isValid = false;
      }
      if (!row.weight || isNaN(row.weight) || parseFloat(row.weight) <= 0) {
        newErrors.packageRows[index].weight = 'Valid weight is required';
        isValid = false;
      }
      if (!isEnvelope) {
        if (!row.length || isNaN(row.length) || parseFloat(row.length) <= 0) {
          newErrors.packageRows[index].length = 'Valid length is required';
          isValid = false;
        }
        if (!row.width || isNaN(row.width) || parseFloat(row.width) <= 0) {
          newErrors.packageRows[index].width = 'Valid width is required';
          isValid = false;
        }
        if (!row.height || isNaN(row.height) || parseFloat(row.height) <= 0) {
          newErrors.packageRows[index].height = 'Valid height is required';
          isValid = false;
        }
      }
      if (row.insuredValue && (isNaN(row.insuredValue) || parseFloat(row.insuredValue) < 0)) {
        newErrors.packageRows[index].insuredValue = 'Valid insured value is required';
        isValid = false;
      }
    });

    setFormErrors(newErrors);
    return isValid;
  };

  const calculateChargeableWeight = (pkg, fromCountry, toCountry) => {
    const weight = parseFloat(pkg.weight) || 0;
    const length = parseFloat(pkg.length) || 0;
    const width = parseFloat(pkg.width) || 0;
    const height = parseFloat(pkg.height) || 0;
    const packagenumber = parseInt(pkg.packageNumber) || 1;

    const dimensionalWeight = Math.floor(
      fromCountry === toCountry
        ? (length * width * height) / 166
        : (length * width * height) / 139
    );

    return (Math.max(weight, dimensionalWeight) * packagenumber).toString();
  };

  useEffect(() => {
    if (isEnvelope) return;
    setPackageDetails(prevRows =>
      prevRows.map(row => ({
        ...row,
        chargeableWeight: calculateChargeableWeight(row, fromDetails.fromCountry, toDetails.toCountry),
      }))
    );
  }, [fromDetails.fromCountry, toDetails.toCountry, packageDetails, isEnvelope, setPackageDetails]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('from')) {
      updateFromDetails({ [name]: value });
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    } else if (name.startsWith('to') || name === 'residential' || name === 'packageType' || name === 'shipDate') {
      updateToDetails({ [name]: value });
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const fromDebounceRef = useRef(null);
  const toDebounceRef = useRef(null);

  const fetchCityState = async (zipCode, countryValue, isFrom) => {
    if (!zipCode || zipCode.length < 2) {
      if (isFrom) {
        updateFromDetails({ fromCity: '', fromState: '' });
        setPickupErrors(prev => ({ ...prev, fromZipCode: '' }));
        setFormErrors(prev => ({ ...prev, fromCity: '' }));
      } else {
        updateToDetails({ toCity: '', toState: '' });
        setPickupErrors(prev => ({ ...prev, toZipCode: '' }));
        setFormErrors(prev => ({ ...prev, toCity: '' }));
      }
      return;
    }

    try {
      const country = countries.find(c => c.value === countryValue);
      if (!country) {
        throw new Error('Country not selected or invalid');
      }

      const encodedUrl = encryptURL('/locations/getstateCitybyPostalCode');
      const response = await axios.post(`${api.BackendURL}/locations/${encodedUrl}`, {
        CountryID: country.countryid,
        PostalCode: zipCode,
      },
      {
        withCredentials: true,
      }
    );

      const userData = response.data?.user?.[0] || [];
      if (userData.length > 0) {
        const place = userData[0];
        if (isFrom) {
          updateFromDetails({ fromCity: place.city || '', fromState: place.state || '' });
        } else {
          updateToDetails({ toCity: place.city || '', toState: place.state || '' });
        }
        setPickupErrors(prev => ({ ...prev, [isFrom ? 'fromZipCode' : 'toZipCode']: '' }));
        setFormErrors(prev => ({ ...prev, [isFrom ? 'fromCity' : 'toCity']: '' }));
        return;
      }

      if (countryValue === 'in') {
        const res = await axios.get(`https://api.postalpincode.in/pincode/${zipCode}`);
        const data = res.data[0];
        if (data.Status === 'Success' && data.PostOffice?.length > 0) {
          const place = data.PostOffice[0];
          if (isFrom) {
            updateFromDetails({ fromCity: place.Block || place.District || '', fromState: place.State || '' });
          } else {
            updateToDetails({ toCity: place.Block || place.District || '', toState: place.State || '' });
          }
          setPickupErrors(prev => ({ ...prev, [isFrom ? 'fromZipCode' : 'toZipCode']: '' }));
          setFormErrors(prev => ({ ...prev, [isFrom ? 'fromCity' : 'toCity']: '' }));
          return;
        }
      }

      const res = await axios.get(
        `https://maps.googleapis.com/maps/api/geocode/json?key=${import.meta.env.VITE_GOOGLE_API_KEY}&components=country:${countryValue}|postal_code:${zipCode}`
      );
      const components = res.data.results?.[0]?.address_components || [];
      let city = '';
      let state = '';

      components.forEach(component => {
        if (component.types.includes('locality') || component.types.includes('postal_town')) {
          city = component.long_name;
        }
        if (component.types.includes('administrative_area_level_1')) {
          state = component.long_name;
        }
      });

      if (city || state) {
        if (isFrom) {
          updateFromDetails({ fromCity: city, fromState: state });
        } else {
          updateToDetails({ toCity: city, toState: state });
        }
        setPickupErrors(prev => ({ ...prev, [isFrom ? 'fromZipCode' : 'toZipCode']: '' }));
        setFormErrors(prev => ({ ...prev, [isFrom ? 'fromCity' : 'toCity']: '' }));
        return;
      }

      throw new Error('No valid data found');
    } catch (err) {
      console.error(`Failed to fetch city/state for ${isFrom ? 'fromZipCode' : 'toZipCode'}:`, err.message);
      if (isFrom) {
        updateFromDetails({ fromCity: '', fromState: '' });
        setPickupErrors(prev => ({
          ...prev,
          fromZipCode: 'Invalid or unsupported zip code.',
        }));
        setFormErrors(prev => ({
          ...prev,
          fromCity: 'Invalid city due to invalid zip code.',
        }));
      } else {
        updateToDetails({ toCity: '', toState: '' });
        setPickupErrors(prev => ({
          ...prev,
          toZipCode: 'Invalid or unsupported zip code.',
        }));
        setFormErrors(prev => ({
          ...prev,
          toCity: 'Invalid city due to invalid zip code.',
        }));
      }
    }
  };

  const handleFromZipCodeBlur = async () => {
    if (Giszip === 1 || !fromDetails.fromZipCode || fromDetails.fromZipCode.length < 2) {
      updateFromDetails({ fromCity: '', fromState: '' });
      setPickupErrors(prev => ({ ...prev, fromZipCode: '' }));
      setFormErrors(prev => ({ ...prev, fromCity: '' }));
      return;
    }

    if (fromDebounceRef.current) clearTimeout(fromDebounceRef.current);

    fromDebounceRef.current = setTimeout(async () => {
      await fetchCityState(fromDetails.fromZipCode, fromDetails.fromCountry, true);
    }, 500);
  };

  const handleToZipCodeBlur = async () => {
    if (Gresiszip === 1 || !toDetails.toZipCode || toDetails.toZipCode.length < 2) {
      updateToDetails({ toCity: '', toState: '' });
      setPickupErrors(prev => ({ ...prev, toZipCode: '' }));
      setFormErrors(prev => ({ ...prev, toCity: '' }));
      return;
    }

    if (toDebounceRef.current) clearTimeout(toDebounceRef.current);

    toDebounceRef.current = setTimeout(async () => {
      await fetchCityState(toDetails.toZipCode, toDetails.toCountry, false);
    }, 500);
  };

  const handlePackageRowChange = (index, field, value) => {
    if (isEnvelope) return;

    if (['packageNumber', 'weight', 'length', 'width', 'height'] && !/^\d*$/.test(value)) return;
    setPackageDetails((prevRows) => {
      const updatedRows = [...prevRows];
      updatedRows[index] = { ...updatedRows[index], [field]: value };
      return updatedRows;
    });
    setFormErrors(prev => {
      const newPackageErrors = [...prev.packageRows];
      newPackageErrors[index] = { ...newPackageErrors[index], [field]: '' };
      return { ...prev, packageRows: newPackageErrors };
    });
  };

  const handleWeightUnitChange = (value) => {
    if (isEnvelope) return;
    setWeightUnit(value);
    if (value === 'KG') {
      setDimensionUnit('CM');
      setChargeableUnit('KG');
    } else if (value === 'LB') {
      setDimensionUnit('INCHES');
      setChargeableUnit('LB');
    }
  };

  const handleAddRow = () => {
    if (isEnvelope) return;
    setPackageDetails((prevRows) => [
      ...prevRows,
      {
        packageNumber: '',
        weight: '',
        length: '',
        width: '',
        height: '',
        chargeableWeight: '',
        insuredValue: '',
      },
    ]);
    setFormErrors(prev => ({
      ...prev,
      packageRows: [
        ...prev.packageRows,
        {
          packageNumber: '',
          weight: '',
          length: '',
          width: '',
          height: '',
          chargeableWeight: '',
          insuredValue: '',
        },
      ],
    }));
  };

  const handleDeleteRow = (index) => {
    if (isEnvelope) return;
    setPackageDetails((prevRows) => {
      const updatedRows = [...prevRows];
      updatedRows.splice(index, 1);
      setRates([]);
      setShowRates(false);
      return updatedRows;
    });
    setFormErrors(prev => {
      const newPackageErrors = [...prev.packageRows];
      newPackageErrors.splice(index, 1);
      return { ...prev, packageRows: newPackageErrors };
    });
  };

  const handleGetRate = async () => {
    if (!validateForm()) {
      toast.error('Please fill all required fields correctly');
      return;
    }

    toast.dismiss();
    const loading = toast.loading('Getting Rate...');
    const fromCountryObj = countries.find((c) => c.value === fromDetails.fromCountry);
    const toCountryObj = countries.find((c) => c.value === toDetails.toCountry);

    const basePayload = {
      quoteData: {
        PackageType: toDetails.packageType,
        WeightType: weightUnit,
        UpsData: {
          FromCountry: JSON.stringify({
            CountryID: fromCountryObj.countryid,
            CountryName: fromCountryObj.label,
            CountryCode: fromCountryObj.value.toUpperCase(),
            IsFedexCity: Giszip,
            IsUpsCity: 0,
            IsDhlCity: 0,
            IsZipAvailable: Giszip === 1 ? 0 : 1,
            FromZipCodeOptional: Giszip === 1,
            ToZipCodeOptional: Gresiszip === 1,
          }),
          FromCity: fromDetails.fromCity,
          FromUPSCity: null,
          FromFedExCity: Giszip === 1 ? fromDetails.fromCity : null,
          FromZipCode: fromDetails.fromZipCode,
          FromStateProvinceCode: '',
          ToCountry: JSON.stringify({
            CountryID: toCountryObj.countryid,
            CountryName: toCountryObj.label,
            CountryCode: toCountryObj.value.toUpperCase(),
            IsFedexCity: Gresiszip,
            IsUpsCity: 0,
            IsDhlCity: 0,
            IsZipAvailable: Gresiszip === 0 ? 1 : 0,
            FromZipCodeOptional: Giszip === 1,
            ToZipCodeOptional: Gresiszip === 1,
          }),
          ToCity: toDetails.toCity,
          ToUPSCity: '',
          ToFedExCity: Gresiszip === 1 ? toDetails.toCity : '',
          ToZipCode: toDetails.toZipCode,
          ToStateProvinceCode: '',
        },
        IsResidencial: toDetails.residential === 'Yes',
        IsPickUp: false,
        ShipDate: toDetails.shipDate ? new Date(toDetails.shipDate).toISOString() : new Date().toISOString(),
        AgentCode: 12122,
      },
    };

    let payload;

    if (toDetails.packageType === 'Envelope') {
      payload = {
        ...basePayload,
        quoteData: {
          ...basePayload.quoteData,
          PackageNumber: ['1'],
          Weight: ['0.5'],
          DimeL: ['10'],
          DimeW: ['13'],
          DimeH: ['1'],
          TotalLength: 10,
          TotalWidth: 13,
          TotalHeight: 1,
          TotalInsuredValues: 0,
          ChargableWeight: ['0.5'],
          InsuredValues: ['0'],
          SelectedWeightType: 'LB',
          TotalWeight: 1,
          WeightCount: 1,
          LengthCount: 1,
          WidthCount: 1,
          HeightCount: 1,
          PackCount: '1',
          PackageDetailsCount: 1,
          PackageDetailsText: '1',
          EnvelopeWeightLBSText: 1,
          PackageDetails: [
            {
              PackageNumber: 1,
              PackageWeight: 0.5,
              PackageWidth: 13,
              PackageLength: 10,
              PackageHeight: 1,
              PackageChargableWeight: 1,
              PackageInsuredValue: '0',
            },
          ],
        },
      };
    } else {
      const totalWeight = packageDetails.reduce((sum, row) => sum + (parseFloat(row.weight) || 0), 0);
      const totalLength = packageDetails.reduce((sum, row) => sum + (parseFloat(row.length) || 0), 0);
      const totalWidth = packageDetails.reduce((sum, row) => sum + (parseFloat(row.width) || 0), 0);
      const totalHeight = packageDetails.reduce((sum, row) => sum + (parseFloat(row.height) || 0), 0);
      const totalInsuredValues = packageDetails.reduce(
        (sum, row) => sum + (parseFloat(row.insuredValue) || 0),
        0
      );

      payload = {
        ...basePayload,
        quoteData: {
          ...basePayload.quoteData,
          PackageNumber: packageDetails.map((row) => row.packageNumber || '1'),
          Weight: packageDetails.map((row) => row.weight || '0'),
          DimeL: packageDetails.map((row) => row.length || '0'),
          DimeW: packageDetails.map((row) => row.width || '0'),
          DimeH: packageDetails.map((row) => row.height || '0'),
          TotalLength: totalLength || 0,
          TotalWidth: totalWidth || 0,
          TotalHeight: totalHeight || 0,
          TotalInsuredValues: totalInsuredValues || 0,
          ChargableWeight: packageDetails.map((row) => row.chargeableWeight || '0'),
          InsuredValues: packageDetails.map((row) => row.insuredValue || '0'),
          SelectedWeightType: weightUnit,
          TotalWeight: totalWeight || 0,
          WeightCount: packageDetails.length,
          LengthCount: packageDetails.length,
          WidthCount: packageDetails.length,
          HeightCount: packageDetails.length,
          PackCount: packageDetails.length.toString(),
          PackageDetailsCount: packageDetails.length,
          PackageDetailsText: packageDetails.length.toString(),
          EnvelopeWeightLBSText: totalWeight || 0,
          PackageDetails: packageDetails.map((row) => ({
            PackageNumber: parseInt(row.packageNumber) || 1,
            PackageWeight: parseFloat(row.weight) || 0,
            PackageWidth: parseFloat(row.width) || 0,
            PackageLength: parseFloat(row.length) || 0,
            PackageHeight: parseFloat(row.height) || 0,
            PackageChargableWeight: parseFloat(row.chargeableWeight) || 0,
            PackageInsuredValue: row.insuredValue || '0',
          })),
        },
      };
    }

    try {
         const encodedUrl = encryptURL("/getRates/getRatesData");
      const response = await fetch(`${api.BackendURL}/getRates/${encodedUrl}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        credentials: 'include',
      });

      const result = await response.json();
      toast.dismiss();
      if (result.message === "Data fetched") {
        toast.success('Rates fetched successfully');
        const allRates = result.data.reduce((acc, current) => acc.concat(current), []);
        const updatedRates = allRates.map((item) => ({
          service: item.ServiceDisplayName || item.Service_Type,
          deliveryDate: item.Delivery_Date,
          rate: item.Rates,
          ServiceDisplayName: item.ServiceDisplayName,
          ServiceType: item.ServiceType,
          MainServiceName: item.MainServiceName,
          fromcountry: fromDetails.fromCountry,
          Error: item.Service_Type,
          isError: item.IsError || false,
        }));
        setRates(updatedRates);
        setShowRates(true);
      } else {
        toast.error('No rates');
        setRates([]);
        console.error('API error:', result);
      }
    } catch (error) {
      toast.dismiss();
      toast.error('Error fetching rates', error);
      console.error('Error fetching rates:', error);
    }
  };

  const handleReset = () => {
    updateFromDetails({
      fromCountry: 'us',
      fromZipCode: '',
      fromCity: '',
      fromState: '',
    });
    updateToDetails({
      toCountry: 'us',
      toZipCode: '',
      toCity: '',
      toState: '',
      shipDate: new Date().toISOString().split('T')[0],
      residential: 'No',
      packageType: 'Package',
    });
    setPackageDetails([
      {
        packageNumber: '',
        weight: '',
        length: '',
        width: '',
        height: '',
        chargeableWeight: '',
        insuredValue: '',
      },
    ]);
    setRates([]);
    setShowRates(false);
    setWeightUnit('LB');
    setDimensionUnit('INCHES');
    setChargeableUnit('LB');
    GsetisZip(0);
    GsetresisZip(0);
    setPickupErrors({ fromZipCode: '', toZipCode: '' });
    setFormErrors({
      fromCountry: '',
      toCountry: '',
      fromZipCode: '',
      toZipCode: '',
      fromCity: '',
      toCity: '',
      shipDate: '',
      packageRows: [
        {
          packageNumber: '',
          weight: '',
          length: '',
          width: '',
          height: '',
          chargeableWeight: '',
          insuredValue: '',
        },
      ],
    });
    toast.dismiss();
  };

  useEffect(() => {
    setRates([]);
    setShowRates(false);
  }, [fromDetails.fromCountry]);

  const handleBook = (rate) => {
    console.log(`Booking ${rate.service}`);
    sessionStorage.setItem("service", JSON.stringify(rate));
    GsetShipmentType(rate.ServiceType);
    setIsgetrate(true);
    setActiveTab("schedule-pickup");
    setActiveModule('Schedule Shipment');
    setConfirmation(false);
    setCompletedTabs({
        "schedule-pickup": false,
        sender: false,
        recipient: false,
        package: false,
      });
    navigate("/admin/Scheduleshipment", { replace: true });
  };

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#f5f5f5', padding: '16px' }}>
      <Card sx={{ boxShadow: 3, borderRadius: '8px', margin: '16px', flexGrow: 1, overflow: 'visible' }}>
        <div className="card-title" style={{ minWidth: "60%" }}>
          <h2 style={{ fontSize: '1rem', fontWeight: "500" }}>
            <IconBox className="card-icon">
              <FlightTakeoffIcon className={classes.iconBox} />
            </IconBox>
            <span>Get Rates</span>
          </h2>
        </div>

        <Tabs
          value={GshipmentType === 'AIR' || GshipmentType === 'GROUND' ? 'AIR' : 'OCEAN'}
          indicatorColor="transparent"
          variant="fullWidth"
          onChange={(e, newValue) => GsetShipmentType(newValue)}
          sx={{
            marginRight: '0px',
            marginTop: '14px',
          }}
        >
          <Tab
            label="Air / Ground"
            value="AIR"
            sx={{
              padding: '12px 16px',
              fontWeight: 'medium',
              backgroundColor: GshipmentType === 'AIR' || GshipmentType === 'GROUND' ? '#E91E63' : '#e0e0e0',
              '&.Mui-selected': {
                boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.3)',
                color: 'white',
              },
              '&:hover': {
                backgroundColor: GshipmentType === 'AIR' || GshipmentType === 'GROUND' ? '#ec407a' : '#bdbdbd',
              },
              textTransform: 'uppercase',
              minHeight: '36px',
            }}
          />
        </Tabs>

        <CardContent sx={{ padding: '16px' }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' }, gap: '16px', marginBottom: '16px' }}>
            <Box>
              <FormControl fullWidth>
                <Autocomplete
                  freeSolo
                  disablePortal
                  options={countries}
                  getOptionLabel={(option) => option.label}
                  value={fromDetails.fromCountry ? countries.find((c) => c.value === fromDetails.fromCountry) || null : null}
                  onChange={(event, newValue) => {
                    updateFromDetails({ fromCountry: newValue?.value || '' });
                    GsetisZip(newValue?.isfedexcity ?? 0);
                    updateFromDetails({ fromZipCode: '', fromCity: '', fromState: '' });
                  }}
                  disabled={isCountriesLoading || isCountriesError}
                  renderInput={(params) => (
                    <StyledTextField
                      {...params}
                      className="small-textfield"
                      label="From Country"
                      error={!!formErrors.fromCountry}
                      helperText={formErrors.fromCountry}
                    />
                  )}
                  noOptionsText={isCountriesError ? 'Error loading countries' : 'No countries found'}
                  sx={{ '& .MuiAutocomplete-inputRoot': { height: '40px' } }}
                />
              </FormControl>
            </Box>
            <Box>
              <StyledTextField
                fullWidth
                label={Giszip === 1 ? 'Not required' : "From Zip Code"}
                name="fromZipCode"
                value={fromDetails.fromZipCode || ''}
                onChange={handleInputChange}
                onBlur={handleFromZipCodeBlur}
                placeholder={Giszip === 1 ? 'Not required' : undefined}
                size="small"
                className="custom-textfield"
                inputProps={{
                  maxLength: 15,
                  readOnly: Giszip === 1,
                  autoComplete: 'off',
                  autoCorrect: 'off',
                  autoCapitalize: 'none',
                }}
                error={!!pickupErrors.fromZipCode || !!formErrors.fromZipCode}
                helperText={pickupErrors.fromZipCode || formErrors.fromZipCode}
                disabled={Giszip === 1}
              />
            </Box>
            <Box>
              {Giszip === 1 ? (
                <FormControl fullWidth>
                  <Autocomplete
                    freeSolo
                    disablePortal
                    options={fromCities}
                    value={fromDetails.fromCity || ''}
                    onChange={(event, newValue) => updateFromDetails({ fromCity: newValue || '' })}
                    disabled={isFromCitiesLoading || fromCitiesError}
                    renderInput={(params) => (
                      <StyledTextField
                        {...params}
                        className="small-textfield"
                        label="From City"
                        error={!!formErrors.fromCity}
                        helperText={formErrors.fromCity || (fromCitiesError ? 'Error loading cities' : undefined)}
                      />
                    )}
                    noOptionsText={isFromCitiesLoading ? 'Loading cities...' : 'No cities found'}
                    sx={{ '& .MuiAutocomplete-inputRoot': { height: '40px' } }}
                  />
                </FormControl>
              ) : (
                <StyledTextField
                  fullWidth
                  label="From City"
                  name="fromCity"
                  className="custom-textfield"
                  value={fromDetails.fromCity || ''}
                  onChange={handleInputChange}
                  size="small"
                  error={!!formErrors.fromCity}
                  helperText={formErrors.fromCity}
                  InputProps={{
                    autoComplete: 'off',
                    autoCorrect: 'off',
                    autoCapitalize: 'none',
                  }}
                />
              )}
            </Box>
            <Box>
              <FormControl fullWidth>
                <Autocomplete
                  freeSolo
                  disablePortal
                  options={countries}
                  getOptionLabel={(option) => option.label}
                  value={toDetails.toCountry ? countries.find((c) => c.value === toDetails.toCountry) || null : null}
                  onChange={(event, newValue) => {
                    updateToDetails({ toCountry: newValue?.value || '' });
                    GsetresisZip(newValue?.isfedexcity ?? 0);
                    updateToDetails({ toZipCode: '', toCity: '', toState: '' });
                  }}
                  disabled={isCountriesLoading || isCountriesError}
                  renderInput={(params) => (
                    <StyledTextField
                      {...params}
                      className="small-textfield"
                      label="To Country"
                      error={!!formErrors.toCountry}
                      helperText={formErrors.toCountry}
                    />
                  )}
                  noOptionsText={isCountriesError ? 'Error loading countries' : 'No countries found'}
                  sx={{ '& .MuiAutocomplete-inputRoot': { height: '40px' } }}
                />
              </FormControl>
            </Box>
            <Box>
              <StyledTextField
                fullWidth
                label={Gresiszip === 1 ? 'Not required' : "To Zip Code"}
                name="toZipCode"
                value={toDetails.toZipCode || ''}
                onChange={handleInputChange}
                onBlur={handleToZipCodeBlur}
                placeholder={Gresiszip === 1 ? 'Not required' : undefined}
                size="small"
                className="custom-textfield"
                inputProps={{
                  maxLength: 15,
                  readOnly: Gresiszip === 1,
                  autoComplete: 'off',
                  autoCorrect: 'off',
                  autoCapitalize: 'none',
                }}
                error={!!pickupErrors.toZipCode || !!formErrors.toZipCode}
                helperText={pickupErrors.toZipCode || formErrors.toZipCode}
                disabled={Gresiszip === 1}
              />
            </Box>
            <Box>
              {Gresiszip === 1 ? (
                <FormControl fullWidth>
                  <Autocomplete
                    freeSolo
                    disablePortal
                    options={toCities}
                    value={toDetails.toCity || ''}
                    onChange={(event, newValue) => updateToDetails({ toCity: newValue || '' })}
                    disabled={isToCitiesLoading || toCitiesError}
                    renderInput={(params) => (
                      <StyledTextField
                        {...params}
                        className="small-textfield"
                        label="To City"
                        error={!!formErrors.toCity}
                        helperText={formErrors.toCity || (toCitiesError ? 'Error loading cities' : undefined)}
                      />
                    )}
                    noOptionsText={isToCitiesLoading ? 'Loading cities...' : 'No cities found'}
                    sx={{ '& .MuiAutocomplete-inputRoot': { height: '40px' } }}
                  />
                </FormControl>
              ) : (
                <StyledTextField
                  fullWidth
                  name="toCity"
                  label="To City"
                  className="custom-textfield"
                  value={toDetails.toCity || ''}
                  onChange={handleInputChange}
                  size="small"
                  error={!!formErrors.toCity}
                  helperText={formErrors.toCity}
                  InputProps={{
                    autoComplete: 'off',
                    autoCorrect: 'off',
                    autoCapitalize: 'none',
                  }}
                />
              )}
            </Box>
            <Box>
              <FormControl fullWidth>
                <Autocomplete
                  options={[{ value: 'No', label: 'No' }, { value: 'Yes', label: 'Yes' }]}
                  getOptionLabel={(option) => option.label}
                  value={toDetails.residential ? { value: toDetails.residential, label: toDetails.residential } : null}
                  onChange={(event, newValue) => updateToDetails({ residential: newValue?.value || '' })}
                  renderInput={(params) => (
                    <StyledTextField
                      {...params}
                      className="small-textfield"
                      label="Residential"
                    />
                  )}
                  sx={{ '& .MuiAutocomplete-inputRoot': { height: '40px' } }}
                />
              </FormControl>
            </Box>
            <Box>
              <FormControl fullWidth>
                <Autocomplete
                  options={[{ value: 'Package', label: 'Package' }, { value: 'Envelope', label: 'Envelope' }]}
                  getOptionLabel={(option) => option.label}
                  value={toDetails.packageType ? { value: toDetails.packageType, label: toDetails.packageType } : null}
                  onChange={(event, newValue) => updateToDetails({ packageType: newValue?.value || '' })}
                  renderInput={(params) => (
                    <StyledTextField
                      {...params}
                      className="small-textfield"
                      label="Package Type"
                    />
                  )}
                  sx={{ '& .MuiAutocomplete-inputRoot': { height: '40px' } }}
                />
              </FormControl>
            </Box>
            <Box>
              <StyledTextField
                fullWidth
                type="date"
                label="Ship Date"
                name="shipDate"
                value={toDetails.shipDate || ''}
                onChange={handleInputChange}
                size="small"
                className="small-textfield"
                InputLabelProps={{
                  shrink: true,
                }}
                placeholder=""
                error={!!formErrors.shipDate}
                helperText={formErrors.shipDate}
              />
            </Box>
          </Box>

          <Box sx={{ marginBottom: '16px' }}>
            <Typography variant="h6" sx={{ fontWeight: 'medium', marginBottom: '8px', fontSize: { xs: '1rem', sm: '1.25rem' } }}>
              Package Details
            </Typography>
            <ResponsivePackageTable
              packageDetails={packageDetails}
              formErrors={formErrors}
              handlePackageRowChange={handlePackageRowChange}
              handleDeleteRow={handleDeleteRow}
              isEnvelope={isEnvelope}
              weightUnit={weightUnit}
              dimensionUnit={dimensionUnit}
              chargeableUnit={chargeableUnit}
              handleWeightUnitChange={handleWeightUnitChange}
            />
            <Button
              onClick={handleAddRow}
              variant="contained"
              sx={{
                marginTop: '8px',
                backgroundColor: isEnvelope ? '#e0e0e0' : 'paleblue',
                color: 'white',
                textTransform: 'uppercase',
                '&:hover': { backgroundColor: '#bdbdbd' },
              }}
              disabled={isEnvelope}
            >
              ADD NEW ROW
            </Button>
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <Button
              onClick={handleGetRate}
              variant="contained"
              sx={{ backgroundColor: '#E91E63', '&:hover': { backgroundColor: '#E91E63' } }}
            >
              GET RATE
            </Button>
            <Button
              onClick={handleReset}
              variant="contained"
              sx={{ backgroundColor: '#e0e0e0', color: '#424242', '&:hover': { backgroundColor: '#bdbdbd' } }}
            >
              RESET
            </Button>
          </Box>
        </CardContent>
      </Card>
      <Card sx={{ boxShadow: 3, borderRadius: '8px', margin: '16px', flexGrow: 1, overflow: 'visible' }}>
        {showRates && rates && rates.length > 0 && (
          <CardContent sx={{ padding: '16px' }}>
            <Typography variant="h6" sx={{ fontWeight: 'medium', marginBottom: '8px', fontSize: { xs: '1rem', sm: '1.25rem' } }}>
              Rate Details
            </Typography>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#000' }}>
                    <TableCell sx={{ padding: '8px', fontSize: '14px', color: '#fff', fontWeight: 'bold' }}>Service Type</TableCell>
                    <TableCell sx={{ padding: '8px', fontSize: '14px', color: '#fff', fontWeight: 'bold' }}>Delivery Date</TableCell>
                    <TableCell sx={{ padding: '8px', fontSize: '14px', color: '#fff', fontWeight: 'bold' }}>Rates</TableCell>
                    <TableCell sx={{ padding: '8px', fontSize: '14px', color: '#fff', fontWeight: 'bold' }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rates.map((rate, index) => (
                    <TableRow key={index}>
                      <TableCell sx={{ padding: '8px', fontSize: '14px' }}>
                        {rate.service || rate.Error}
                        {rate.isError}
                      </TableCell>
                      <TableCell sx={{ padding: '8px', fontSize: '14px' }}>{rate.deliveryDate}</TableCell>
                      <TableCell sx={{ padding: '8px', fontSize: '14px' }}>
                        {rate.rate === 0
                          ? "Call for Rates"
                          : `${fromDetails.fromCountry === 'in' ? 'INR '
                            : fromDetails.fromCountry === 'ca' ? 'CAD '
                              : 'USD '} ${fromDetails.fromCountry === 'us'
                                ? Number(rate.rate).toFixed(2)
                                : Math.ceil(rate.rate)}`
                        }
                      </TableCell>
                      <TableCell sx={{ padding: '8px', fontSize: '14px' }}>
                        <Button
                          onClick={() => handleBook(rate)}
                          disabled={rate.rate === 0}
                          variant="contained"
                          sx={{ backgroundColor: '#4caf50', '&:hover': { backgroundColor: '#388e3c' } }}
                        >
                          BOOK
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        )}
      </Card>
    </Box>
  );
};

export default GetRate;