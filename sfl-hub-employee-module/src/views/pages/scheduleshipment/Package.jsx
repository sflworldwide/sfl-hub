import React, { useState, useRef, createRef, useEffect } from "react";
import {
  Box,
  Typography,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  InputAdornment,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import DeleteIcon from "@mui/icons-material/Delete";
import { ButtonBox, NextButton,EditButton, PrevButton } from "../../styles/scheduleshipmentStyle";
import { useNavigate } from "react-router-dom";

const StyledTableTextField = ({ sx, ...props }) => (
  <TextField
    {...props}
    sx={{
      ...sx,
      "& .MuiInputBase-root": {
        height: 36, // Reduced height
        fontSize: "0.8rem", // Smaller font size
      },
      "& .MuiInputBase-input": {
        padding: "6px", // Tighter padding
        fontSize: "0.8rem", // Match font size
      },
      "& .MuiInputLabel-root": {
        fontSize: "0.8rem", // Smaller label font size
        transform: "translate(14px, 9px) scale(1)", // Adjust label position
      },
      "& .MuiInputLabel-shrink": {
        transform: "translate(14px, -6px) scale(0.75)", // Adjust label when shrunk
      },
      "& .MuiFormHelperText-root": {
        marginTop: "2px", // Smaller gap for helper text
      },
    }}
  />
);

const Package = ({
  packageData,
  setPackageData,
  handlePackageChange,
  handleAddPackage,
  handleRemovePackage,
  handlePackageSubmit,
  commercialInvoiceData,
  setCommercialInvoiceData,
  handleInvoiceChange,
  handleAddInvoiceRow,
  handleRemoveInvoiceRow,
  calculateTotalValue,
  handlepackagePrevious,
  packageErrors,
  packageType,
  setPackageType,
  noOfPackages,
  setNoOfPackages,
  dutiesPaidBy,
  setDutiesPaidBy,
  updatePackageRows,
  samecountry,
  isGetrate,
  setActiveModule,
}) => {
  // State to control dialog visibility
  const [openDialog, setOpenDialog] = useState(false);
  useEffect(()=>
  {
    if (packageType === "Envelope") {
      setNoOfPackages(1);
      updatePackageRows(1);
      const resetPackageData = [{
        noOfPackages: 1,
        weight: 0.5,
        length: 10,
        width: 13,
        height: 1,
        chargable_weight: 0.5,
        insured_value: 0,
      }];
      setPackageData(resetPackageData);
      setCommercialInvoiceData([{
        packageNumber: "1",
        contentDescription: "Document",
        quantity: 0,
        valuePerQty: 0,
      }]);
    }

  },[packageType])

  // // Create an array of refs for valuePerQty TextFields (one ref per row)
  // const valuePerQtyRefs = useRef(
  //   commercialInvoiceData.map(() => createRef())
  // );

  // Update refs when commercialInvoiceData changes (e.g., when rows are added/removed)


  const handlepkgtype = (e) => {
    const selectedType = e.target.value;
    setPackageType(selectedType);

    if (selectedType === "Envelope") {
      setNoOfPackages(1);
      updatePackageRows(1);
      const resetPackageData = [{
        noOfPackages: 1,
        weight: 0.5,
        length: 10,
        width: 13,
        height: 1,
        chargable_weight: 0.5,
        insured_value: 0,
      }];
      setPackageData(resetPackageData);
      setCommercialInvoiceData([{
        packageNumber: "1",
        contentDescription: "Document",
        quantity: 0,
        valuePerQty: 0,
      }]);
    } else if (selectedType === "Package") {
      setNoOfPackages(1);
      updatePackageRows(1);
      const resetPackageData = [{
        noOfPackages: 1,
        weight: 0,
        length: 0,
        width: 0,
        height: 0,
        chargable_weight: 0,
        insured_value: 0,
      }];
      setPackageData(resetPackageData);
      setCommercialInvoiceData([{
        packageNumber: "1",
        contentDescription: "",
        quantity: 0,
        valuePerQty: 0,
      }]);
    }
  };

  const navigate = useNavigate();
  function handleNext(e) {
    const totalinsured_value = packageData.reduce(
      (sum, pkg) => sum + Number(pkg.insured_value || 0),
      0
    );
    console.log("totalinsured_value", totalinsured_value);
    const totalDeclaredValue = commercialInvoiceData.reduce(
      (sum, _, index) => sum + Number(calculateTotalValue(index) || 0),
      0
    );
    console.log("totalDeclaredValue", totalDeclaredValue);

    if (samecountry === false && packageType !== "Envelope") {
      const isNextEnabled = totalinsured_value <= totalDeclaredValue && totalinsured_value >= 0;
      if (isNextEnabled) {
        console.log("different country");
        handlePackageSubmit();
      } else {
        setOpenDialog(true);
      }
    } else {
      console.log("same country or document");
      handlePackageSubmit();
    }
  }

  // Function to close the dialog
  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  // Function to handle update action and focus valuePerQty
  const handleUpdateCommercialValue = () => {
    // Focus the valuePerQty TextField in the first row (index 0)
    // if (valuePerQtyRefs.current[0]?.current) {
    //   valuePerQtyRefs.current[0].current.focus();
    // }
    setOpenDialog(false);
  };

  const isDocument = packageType === "Envelope";
    useEffect(() => {
  if (!isDocument) {
    // Ensure commercial invoice rows match number of packages
    const invoiceRows = Array.from({ length: noOfPackages }, (_, i) => ({
      packageNumber: String(i + 1),
      contentDescription: "",
      quantity: 0,
      valuePerQty: 0,
    }));
    setCommercialInvoiceData(invoiceRows);
  }
}, [noOfPackages, isDocument]);
  return (
    <Box className="ss-box">
      {/* Dialog for Insured Value Error */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        aria-labelledby="insured-value-dialog-title"
        sx={{ "& .MuiDialog-paper": { minWidth: "400px", p: 2 } }}
      >
        <DialogTitle id="insured-value-dialog-title" sx={{ fontWeight: "bold" }}>
          Insured Value cannot exceed Customs value.
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            Please change "Value Per Qty" in Commercial Invoice or update "Insured Value" in Get Rate.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={handleUpdateCommercialValue}
            variant="contained"
            color="primary"
            sx={{ textTransform: "none" }}
          >
            Update Commercial Value
          </Button>
        </DialogActions>
      </Dialog>

      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} sm={4}>
          <FormControl fullWidth className="small-textfield">
            <InputLabel id="package-type-label">Package Type (required)</InputLabel>
            <Select
              labelId="package-type-label"
              value={packageType || "Package"}
              label="Package Type (required)"
              onChange={(e) => handlepkgtype(e)}
              disabled={isGetrate}
              className="custom-select"
            >
              <MenuItem value="Package" >Package</MenuItem>
              <MenuItem value="Envelope">Document(Under 0.5Lbs)</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        {!isDocument && (
          <>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth className="small-textfield">
                <InputLabel id="no-of-packages-label">No. of Packages</InputLabel>
                <Select
                disabled={isGetrate}
                  labelId="no-of-packages-label"
                  value={noOfPackages || 1}
                  label="No. of Packages"
                  onChange={(e) => {
                    const num = parseInt(e.target.value, 10);
                    setNoOfPackages(num);
                    updatePackageRows(num);
                  }}
                >
                  {[...Array(10).keys()].map((num) => (
                    <MenuItem key={num + 1} value={num + 1}>
                      {num + 1}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth className="small-textfield">
                {/* <InputLabel id="duties-taxes-label">Duties & Taxes Paid By</InputLabel> */}
                <TextField
                  labelId="duties-taxes-label"
                  value="Recipient (No Additional Fees)"
                  label="Duties & Taxes Paid By"
                  onChange={(e) => setDutiesPaidBy(e.target.value)}
                  disabled
                />
                {/* <Select
                  labelId="duties-taxes-label"
                  value={dutiesPaidBy || "Recipient"}
                  label="Duties & Taxes Paid By"
                  onChange={(e) => setDutiesPaidBy(e.target.value)}
                  disabled
                >
                  <MenuItem value="Recipient">Recipient (No Additional Fees)</MenuItem>
                </Select> */}
              </FormControl>
            </Grid>
          </>
        )}
      </Grid>

      <form>
        <Box sx={{ overflowX: "auto", mb: 2 }}>
          <TableContainer component={Paper} sx={{ minWidth: 650 }}>
            <Table className="common-table">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ width: 245 }}>No of Pkgs</TableCell>
                  <TableCell sx={{ width: 245 }}>Weight (lbs)*</TableCell>
                  <TableCell sx={{ width: 499 }}>Dimension (L + W + H in)*</TableCell>
                  <TableCell sx={{ minWidth: 150 }}>Chargeable Wt</TableCell>
                  <TableCell sx={{ minWidth: 150 }}>Insured Val (USD)*</TableCell>
                  { !isGetrate && <TableCell sx={{ width: 60 }}></TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {packageData.map((pkg, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <StyledTableTextField
                        name="noOfPackages"
                        type="number"
                        value={pkg.noOfPackages || index + 1}
                        inputProps={{
                          autoComplete: "off",
                          autoCorrect: "off",
                          autoCapitalize: "none"
                        }}
                        InputProps={{ readOnly: true }}
                        fullWidth
                        variant="outlined"
                        size="small"
                        error={!!packageErrors[`noOfPackages_${index}`]}
                        helperText={packageErrors[`noOfPackages_${index}`]}
                        sx={{ backgroundColor: "#f0f0f0" }}
                      />
                    </TableCell>
                    <TableCell>
                      <StyledTableTextField
                        name="weight"
                        type="number"
                        value={isDocument ? 0.5 : pkg.weight || ""}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (!/^\d*$/.test(value)) return;
                          handlePackageChange(index, e);
                        }}
                        fullWidth
                        variant="outlined"
                        size="small"
                        error={!!packageErrors[`weight_${index}`]}
                        helperText={packageErrors[`weight_${index}`]}
                         disabled={isGetrate}
                        inputProps={{
                          autoComplete: "off",
                          autoCorrect: "off",
                          autoCapitalize: "none",
                          readOnly: isDocument,
                          step: 1,
                        }}
                        InputProps={{
                          endAdornment: <InputAdornment position="end">lbs</InputAdornment>,
                          readOnly: isDocument,
                        }}
                        sx={isDocument ? { backgroundColor: "#f0f0f0" } : {}}
                      />

                    </TableCell>
                    <TableCell>
                      <Box className="dimensions">
                        <StyledTableTextField
                          name="length"
                          type="number"
                          label="L"
                          value={isDocument ? 10 : pkg.length || ""}
                          onChange={(e) =>  {
                            const value = e.target.value;
                            if (!/^\d*$/.test(value)) return;
                            handlePackageChange(index, e);
                          }}
                          variant="outlined"
                          size="small"
                          sx={{ width: { xs: "100%", sm: "31%" }, mb: { xs: 1, sm: 0 } }}
                          error={!!packageErrors[`length_${index}`]}
                          helperText={packageErrors[`length_${index}`]}
                          
                          inputProps={{
                            autoComplete: "off",
                            autoCorrect: "off",
                            autoCapitalize: "none",
                            readOnly: isDocument
                          }}
                          InputProps={{
                            endAdornment: <InputAdornment position="end">in</InputAdornment>,
                            readOnly: isDocument
                          }}
                          disabled={isDocument || isGetrate}
                        />
                        <Typography sx={{ display: { xs: "none", sm: "block" } }}>+</Typography>
                        <StyledTableTextField
                          name="width"
                          type="number"
                          label="W"
                          value={isDocument ? 13 : pkg.width || ""}
                          onChange={(e) =>  {
                            const value = e.target.value;
                            if (!/^\d*$/.test(value)) return;
                            handlePackageChange(index, e);
                          }}
                          variant="outlined"
                          size="small"
                          inputProps={{
                            autoComplete: "off",
                            autoCorrect: "off",
                            autoCapitalize: "none",
                            readOnly: isDocument
                          }}
                          sx={{ width: { xs: "100%", sm: "31%" }, mb: { xs: 1, sm: 0 } }}
                          error={!!packageErrors[`width_${index}`]}
                          helperText={packageErrors[`width_${index}`]}
                          InputProps={{
                            endAdornment: <InputAdornment position="end">in</InputAdornment>,
                            readOnly: isDocument
                          }}
                          disabled={isDocument || isGetrate}
                        />
                        <Typography sx={{ display: { xs: "none", sm: "block" } }}>+</Typography>
                        <StyledTableTextField
                          name="height"
                          type="number"
                          label="H"
                          value={isDocument ? 1 : pkg.height || ""}
                          onChange={(e) =>  {
                            const value = e.target.value;
                            if (!/^\d*$/.test(value)) return;
                            handlePackageChange(index, e);
                          }}
                          variant="outlined"
                          size="small"
                          inputProps={{
                            autoComplete: "off",
                            autoCorrect: "off",
                            autoCapitalize: "none",
                            readOnly: isDocument
                          }}
                          sx={{ width: { xs: "100%", sm: "90px" } }}
                          error={!!packageErrors[`height_${index}`]}
                          helperText={packageErrors[`height_${index}`]}
                          InputProps={{
                            endAdornment: <InputAdornment position="end">in</InputAdornment>,
                            readOnly: isDocument
                          }}
                          disabled={isDocument|| isGetrate}
                        />
                      </Box>
                    </TableCell>
                    <TableCell>
                      <StyledTableTextField
                        name="chargable_weight"
                        type="number"
                        value={isDocument ? 0.5 : pkg.chargable_weight || ""}
                        InputProps={{
                          readOnly: true,
                          endAdornment: <InputAdornment position="end">lbs</InputAdornment>,
                        }}
                        inputProps={{
                          autoComplete: "off",
                          autoCorrect: "off",
                          autoCapitalize: "none"
                        }}
                        fullWidth
                        variant="outlined"
                        size="small"
                        sx={{ backgroundColor: "#f0f0f0" }}
                      />
                    </TableCell>
                    <TableCell>
                      <StyledTableTextField
                        name="insured_value"
                        type="number"
                        value={pkg.insured_value}
                        onChange={(e) =>
                          handlePackageChange(index, e)
                        }
                         disabled={isGetrate}
                        fullWidth
                        variant="outlined"
                        size="small"
                        inputProps={{
                          autoComplete: "off",
                          autoCorrect: "off",
                          autoCapitalize: "none",
                          min: 0
                        }}
                        InputProps={{
                          readOnly: isDocument,
                          startAdornment: <InputAdornment position="start">$</InputAdornment>,
                        }}
                        error={!!packageErrors[`insured_value_${index}`]}
                        helperText={packageErrors[`insured_value_${index}`]}
                      />
                    </TableCell>
                    <TableCell>
                      {!isDocument && !isGetrate && packageData.length > 1 ? (
                        <IconButton
                          onClick={() => handleRemovePackage(index)}
                          sx={{ color: "gray" }}
                          aria-label="delete package row"
                        >
                          <DeleteIcon />
                        </IconButton>
                      ) : null}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>

        {!isDocument && (
          <Box className="action-row">
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAddPackage}
              disabled={packageData.length >= 10 || isGetrate}
            >
              ADD NEW ROW
            </Button>

            <Box className="summary-box">
              <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                Totals:
              </Typography>
              <Typography variant="body2">Pkgs: {noOfPackages}</Typography>
              <Typography variant="body2">
                Wt: {packageData.reduce((sum, pkg) => sum + Number(pkg.weight || 0), 0).toString()} lbs
              </Typography>
              <Typography variant="body2">
                Chrg Wt: {packageData.reduce((sum, pkg) => sum + Number(pkg.chargable_weight || 0), 0).toString()} lbs
              </Typography>
              <Typography variant="body2">
                Ins Val: ${packageData.reduce((sum, pkg) => sum + Number(pkg.insured_value || 0), 0).toFixed(2)}
              </Typography>
            </Box>
          </Box>
        )}

        {!isDocument && (
          <Box sx={{ display: samecountry ? "none" : "block" }}>
            <Typography variant="h6" sx={{ mt: 4, mb: 1 }}>
              Commercial Invoice
            </Typography>
            <Box sx={{ overflowX: "auto", mb: 2 }}>
              <TableContainer component={Paper} sx={{ minWidth: 650 }}>
                <Table className="common-table">
                  <TableHead>
                    <TableRow sx={{ bgcolor: "#333" }}>
                      <TableCell sx={{ width: 100 }}>Pkg No</TableCell>
                      <TableCell sx={{ width: 889 }}>Content Description*</TableCell>
                      <TableCell sx={{ minWidth: 100 }}>Quantity*</TableCell>
                      <TableCell sx={{ minWidth: 150 }}>Value/Qty (USD)*</TableCell>
                      <TableCell sx={{ minWidth: 150 }}>Total Value (USD)</TableCell>
                      {/* <TableCell sx={{ width: 60 }}></TableCell> */}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {commercialInvoiceData.map((invoice, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <FormControl fullWidth variant="outlined" size="small" className="small-textfield">
                            <Select
                              name="packageNumber"
                              value={invoice.packageNumber || ""}
                              onChange={(e) => handleInvoiceChange(index, e)}
                              displayEmpty
                              error={!!packageErrors[`packageNumber_${index}`]}
                            >
                              {[...Array(noOfPackages > 0 ? noOfPackages : 0).keys()].map((_, i) => (
                                <MenuItem key={i + 1} value={String(i + 1)}>
                                  {i + 1}
                                </MenuItem>
                              ))}
                            </Select>
                            {packageErrors[`packageNumber_${index}`] && (
                              <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                                {packageErrors[`packageNumber_${index}`]}
                              </Typography>
                            )}
                          </FormControl>
                        </TableCell>
                        <TableCell>
                          <StyledTableTextField
                            name="contentDescription"
                            value={invoice.contentDescription || ""}
                            onChange={(e) => handleInvoiceChange(index, e)}
                            inputProps={{
                              autoComplete: "off",
                              autoCorrect: "off",
                              autoCapitalize: "none"
                            }}
                            fullWidth
                            variant="outlined"
                            size="small"
                            error={!!packageErrors[`contentDescription_${index}`]}
                            helperText={packageErrors[`contentDescription_${index}`]}
                          />
                        </TableCell>
                        <TableCell>
                          <StyledTableTextField
                            name="quantity"
                            type="number"
                            value={invoice.quantity || ""}
                            onChange={(e) =>{ 
                              const value = e.target.value;
                              if (!/^\d*$/.test(value)) return;
                              handleInvoiceChange(index, e)}}
                            inputProps={{
                              autoComplete: "off",
                              autoCorrect: "off",
                              autoCapitalize: "none"
                            }}
                            fullWidth
                            variant="outlined"
                            size="small"
                            error={!!packageErrors[`quantity_${index}`]}
                            helperText={packageErrors[`quantity_${index}`]}
                          />
                        </TableCell>
                        <TableCell>
                          <StyledTableTextField
                            name="valuePerQty"
                            type="number"
                            value={invoice.valuePerQty || ""}
                            onChange={(e) =>
                              handleInvoiceChange(index, e)}
                            inputProps={{
                              autoComplete: "off",
                              autoCorrect: "off",
                              autoCapitalize: "none"
                            }}
                            fullWidth
                            variant="outlined"
                            size="small"
                            // inputRef={valuePerQtyRefs.current[index]}
                            InputProps={{
                              startAdornment: <InputAdornment position="start">$</InputAdornment>,
                            }}
                            error={!!packageErrors[`valuePerQty_${index}`]}
                            helperText={packageErrors[`valuePerQty_${index}`]}
                          />
                        </TableCell>
                        <TableCell>
                          <StyledTableTextField
                            value={calculateTotalValue(index) || "0.00"}
                            fullWidth
                            variant="outlined"
                            size="small"
                            inputProps={{
                              autoComplete: "off",
                              autoCorrect: "off",
                              autoCapitalize: "none"
                            }}
                            InputProps={{
                              readOnly: true,
                              startAdornment: <InputAdornment position="start">$</InputAdornment>,
                            }}
                            sx={{ backgroundColor: "#f0f0f0" }}
                          />
                        </TableCell>
                        {/* <TableCell>
                          {commercialInvoiceData.length > 1 ? (
                            <IconButton
                              onClick={() => handleRemoveInvoiceRow(index)}
                              sx={{ color: "gray" }}
                              aria-label="delete invoice row"
                            >
                              <DeleteIcon />
                            </IconButton>
                          ) : null}
                        </TableCell> */}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>

            <Box className="invoice-action-row">
              {/* <Button
                variant="contained"
                startIcon={<AddIcon />}
                disabled={commercialInvoiceData.length >= noOfPackages}
                onClick={handleAddInvoiceRow}
                className="add-button"
              >
                ADD NEW ROW
              </Button> */}

              <Typography variant="body1" className="total-value-text">
                Total Declared Value: $
                {commercialInvoiceData
                  .reduce((sum, _, index) => sum + Number(calculateTotalValue(index) || 0), 0)
                  .toString()}
              </Typography>
            </Box>
          </Box>
        )}

        <ButtonBox>
          <PrevButton
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={handlepackagePrevious}
          >
            Previous
          </PrevButton>
          <Box sx={{ display: "flex", gap: 2 }}>
              {isGetrate && (
                <EditButton
                  type="button"
                  variant="contained"
                  onClick={() => {
                    setActiveModule("Get Rates");
                    navigate("/admin/getrate");
                  }}
                >
                  Edit
                </EditButton>
              )}
            <NextButton
            variant="contained"
            endIcon={<ArrowForwardIcon />}
            onClick={handleNext}
          >
            Submit
          </NextButton>
          </Box>
          
        </ButtonBox>
      </form>
    </Box>
  );
};

export default Package;