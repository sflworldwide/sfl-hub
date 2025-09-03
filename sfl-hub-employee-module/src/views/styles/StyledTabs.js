// StyledTabs.js
import { styled } from "@mui/material/styles";
import { Tabs, Tab, Box } from "@mui/material";

export const StyledTabs = styled(Tabs)(({ theme }) => ({
  position: "relative",
  backgroundColor: "#EEEEEE",
}));

export const AnimatedIndicator = styled(Box, {
  shouldForwardProp: (prop) => prop !== "isMobile" && prop !== "activeIndex" && prop !== "length",
})(({ isMobile, activeIndex, length }) => ({
  position: "absolute",
  bottom: isMobile ? "auto" : 0,
  left: isMobile ? "auto" : `${(activeIndex * 100) / length}%`,
  top: isMobile ? `${(activeIndex * 100) / length}%` : "auto",
  width: isMobile ? "100%" : `${100 / length}%`,
  height: isMobile ? `${100 / length}%` : "100%",
  backgroundColor: "#E91E63",
  borderRadius: "5px",
  boxShadow: "0px 5px 10px rgba(0, 0, 0, 0.3)",
  transition: isMobile ? "top 0.3s ease-in-out" : "left 0.3s ease-in-out",
}));

export const StyledTab = styled(Tab)(({ theme }) => ({
  textAlign: "center",
  fontSize: theme.breakpoints.down("sm") ? "12px" : "16px",
  backgroundColor: "transparent",
  borderRadius: "9px",
  transition: "background-color 0.3s ease-in-out, color 0.3s ease-in-out",
  "&.Mui-selected": {
    boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.3)",
    color: "white",
  },
  "&.Mui-disabled": {
    color: "rgba(0, 0, 0, 0.26)",
    opacity: 1,
  },
}));
