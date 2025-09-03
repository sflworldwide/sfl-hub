import React from "react";
import { Box, Button } from "@mui/material";
import "../../../styles/UserTabStyles.css";


const TabNavigation = ({ activeTab, handleTabClick,hideMarkup }) => {
  // Debug: Log props to verify isSameCountry
  console.log("TabNavigation props:", { activeTab, handleTabClick});

  const tabs = [
    { label: "USER DETAILS" ,value: "user-details"},
    { label: "ACCESS DETAILS",value:"access-details" },
    ...(!hideMarkup ? [{ label: "MARKUP DETAILS", value: "markup-details" }] : []),
    { label: "DOCUMENTATION",value:"documentation" },
  ];
  return (
    <Box className="custom-tab-container">
      {tabs.map((tab) => (
        <Button
          key={tab.value}
          onClick={() => handleTabClick(tab.value)}
          className={`tab-button-user ${activeTab === tab.value ? "active-tab" : ""}`}
        >
          {tab.label}
        </Button>
      ))}
    </Box>
  );
};

export default TabNavigation;