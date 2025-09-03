import React from "react";

import { StyledTabs, StyledTab, AnimatedIndicator } from '../../styles/StyledTabs';

const SectionTabs = ({ activeTab, setActiveTab, isMobile, completedTabs, shipmentType }) => {
  // Define tabs dynamically based on shipmentType
  const tabLabels =
    shipmentType === "Ocean"
      ? ["Schedule Pickup", "Sender", "Recipient"]
      : ["Schedule Pickup", "Sender", "Recipient", "Package"];
  const tabValues = tabLabels.map((label) => label.toLowerCase().replace(" ", "-"));

  // Determine the current tab index and disable future tabs
  const tabOrder = tabValues;
  const currentIndex = tabOrder.indexOf(activeTab);

  return (
    <StyledTabs
      orientation={isMobile ? "vertical" : "horizontal"}
      value={activeTab}
      onChange={(e, newValue) => setActiveTab(newValue)}
      variant="fullWidth"
      indicatorColor="transparent"
    >
      <AnimatedIndicator
        isMobile={isMobile}
        activeIndex={tabValues.indexOf(activeTab)}
        length={tabValues.length}
      />
      {tabLabels.map((label, index) => {
        const isDisabled = index > currentIndex && !completedTabs[tabOrder[index - 1]];
        return (
          <StyledTab
            key={label}
            label={label}
            value={tabValues[index]}
            disabled={isDisabled}
          />
        );
      })}
    </StyledTabs>
  );
};

export default SectionTabs;