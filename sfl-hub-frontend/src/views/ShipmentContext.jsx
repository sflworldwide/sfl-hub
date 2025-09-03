import React, { createContext, useContext, useState } from 'react';

// Define the shape of the context
const ShipmentContext = createContext();

// Initial state for formData (fromDetails and toDetails)
const initialFormData = {
  fromCountry: 'us',
  fromZipCode: '',
  fromCity: '',
  fromState: '',
  toCountry: 'us',
  toZipCode: '',
  toCity: '',
  toState: '',
  shipDate: new Date().toISOString().split('T')[0],
  residential: 'No',
  packageType: 'Package',
};

// Initial state for packageRows (packageDetails)
const initialPackageRows = [
  {
    packageNumber: '',
    weight: '',
    length: '',
    width: '',
    height: '',
    chargeableWeight: '',
    insuredValue: '',
  },
];

// Context Provider Component
export const ShipmentProvider = ({ children }) => {
  const [formData, setFormData] = useState(initialFormData);
  const [packageRows, setPackageRows] = useState(initialPackageRows);
    const [Giszip, GsetisZip] = useState(0);
    const [Gresiszip, GsetresisZip] = useState(0);
     const [GshipmentType, GsetShipmentType] = useState('AIR');
     const [isGetrate,setIsgetrate]=useState(false);

  // Extract fromDetails and toDetails from formData
  const fromDetails = {
    fromCountry: formData.fromCountry,
    fromZipCode: formData.fromZipCode,
    fromCity: formData.fromCity,
    fromState: formData.fromState,
  };

  const toDetails = {
    toCountry: formData.toCountry,
    toZipCode: formData.toZipCode,
    toCity: formData.toCity,
    toState: formData.toState,
    residential: formData.residential,
    packageType: formData.packageType,
    shipDate: formData.shipDate,
  };

  // Function to update fromDetails
  const updateFromDetails = (newFromDetails) => {
    setFormData((prev) => ({
      ...prev,
      ...newFromDetails,
    }));
  };

  // Function to update toDetails
  const updateToDetails = (newToDetails) => {
    setFormData((prev) => ({
      ...prev,
      ...newToDetails,
    }));
  };

  // Context value
  const value = {
    fromDetails,
    updateFromDetails,
    toDetails,
    updateToDetails,
    Giszip,
    GsetisZip,   
    Gresiszip,
    GsetresisZip,
    GshipmentType,
    GsetShipmentType,
    packageDetails: packageRows,
    setPackageDetails: setPackageRows,
    isGetrate,
    setIsgetrate,
  };

  return (
    <ShipmentContext.Provider value={value}>
      {children}
    </ShipmentContext.Provider>
  );
};

// Custom hook to use the context
export const useShipmentContext = () => {
  const context = useContext(ShipmentContext);
  if (!context) {
    throw new Error('useShipmentContext must be used within a ShipmentProvider');
  }
  return context;
};