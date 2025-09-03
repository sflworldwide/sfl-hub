import React from "react";
import { Box, Button } from "@mui/material";
import "../../styles/TabsStyles.css";

const TabNavigation = ({ activeTab, handleTabClick, isSameCountry = false }) => {
  // Debug: Log props to verify isSameCountry
  console.log("TabNavigation props:", { activeTab, handleTabClick, isSameCountry });

  const tabs = [
    { label: "CUSTOMER DETAILS", value: "customer" },
    { label: "PACKAGE", value: "package" },
    ...(isSameCountry ? [] : [{ label: "COMMERCIAL INV.", value: "commercial" }]),
    { label: "ACCOUNTS", value: "accounts" },
    { label: "TRACKING", value: "tracking" },
    { label: "DOCUMENTATION", value: "documentation" },
  ];
  return (
    <Box className="custom-tab-container">
      {tabs.map((tab) => (
        <Button
          key={tab.value}
          onClick={() => handleTabClick(tab.value)}
          className={`tab-button ${activeTab === tab.value ? "active-tab" : ""}`}
        >
          {tab.label}
        </Button>
      ))}
    </Box>
  );
};

export default TabNavigation;