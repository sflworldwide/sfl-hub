import { useState, useEffect } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import {
  Box,
  useMediaQuery,
  useTheme,
  AppBar,
  IconButton,
  Menu,
  MenuItem,
} from "@mui/material";
import {
  Menu as MenuIcon,
  MoreVert as MoreVertIcon,
  List as ListIcon,
  AccountCircle as AccountCircleIcon,
} from "@mui/icons-material";
import Sidebar from "./scheduleshipment/Sidebar";
import Schedule from "./scheduleshipment/Scheduleshipment";
import ShipmentDashboard from "./myshipment/Myshipment";
import Myshipmentnew from "./myshipment/MyShipmentNew";
import ScheduleConfirmation from "./scheduleconfirmation/ScheduleConfirmation";
import GetRate from "./getrate/GetRate";
import ProfilePage from "./scheduleshipment/ProfilePage";
import { Root, MainContent } from "../styles/scheduleshipmentStyle";
import { useStyles } from "../styles/MyshipmentStyle";
import {
  DesktopToggleBtn,
  MobileToggleBtn,
  UsernameButton,
} from "../styles/scheduleshipmentStyle";
import ManagementDashboard from "./management/ManagementDashboard";
import UserList from "./management/UserList";
import Footer from "./Footer";
import EditUser from "./management/user/EditUser";
import { UserListProvider } from "./management/UserListContext";
import AddUsers from "./management/user/AddUsers";

const Dashboard = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const classes = useStyles();

  const [activeModule, setActiveModule] = useState("Schedule Shipment");
  const [activeTab, setActiveTab] = useState("schedule-pickup");
  const [drawerOpen, setDrawerOpen] = useState(!isMobile);
  const [drawerWidth, setDrawerWidth] = useState(250);
  const [anchorEl, setAnchorEl] = useState(null);
  const [loginName, setLoginName] = useState("Unknown");
  const [accountNumber, setAccountNumber] = useState("");

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const toggleDrawer = (open) => () => {
    setDrawerOpen(open);
  };

  const halfopen = () => {
    setDrawerWidth((prevWidth) => (prevWidth === 250 ? 70 : 250));
  };

  const handleprofile = () => {
    navigate("/admin/profilepage", { replace: true });
    handleMenuClose();
  };

  const handleLogout = () => {
    sessionStorage.clear();
    handleMenuClose();
    navigate("/auth/login-page", { replace: true });
  };

  const handleModuleClick = (module) => {
    setActiveModule(module);
    if (module === "Schedule Shipment") {
      navigate("/admin/scheduleshipment", { replace: true });
      setActiveTab("schedule-pickup");
    } else if (module === "My Shipment") {
      setActiveTab("my-shipment");
      navigate("/admin/shipmentlist", { replace: true });
    } else if (module === "Get Rates") {
      navigate("/admin/getrates", { replace: true });
    } else if (module === "Management") {
      navigate("/admin/managementnavigation", { replace: true });
    }
    setDrawerOpen(false);
  };

  useEffect(() => {
    const storedUser = JSON.parse(sessionStorage.getItem("user"));
    if (storedUser) {
      setLoginName(storedUser.name);
      setAccountNumber(storedUser.account_number);
    }
  }, []);

  return (
    <Root>
      <Sidebar
        drawerOpen={drawerOpen}
        Loginname={loginName}
        toggleDrawer={toggleDrawer}
        handleMenuOpen={handleMenuOpen}
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        handleMenuClose={handleMenuClose}
        handleLogout={handleLogout}
        handleprofile={handleprofile}
        activeModule={activeModule}
        handleModuleClick={handleModuleClick}
        drawerWidth={drawerWidth}
        setDrawerWidth={setDrawerWidth}
        account_number={accountNumber}
      />
      <MainContent>
        <AppBar
          position="static"
          color="default"
          elevation={1}
          sx={{ boxShadow: "none" }}
        >
          <Box sx={{ display: "flex", alignItems: "center", p: 1 }}>
            <DesktopToggleBtn sx={{ display: { xs: "none", sm: "block" } }}>
              <IconButton edge="start" color="primary" onClick={halfopen}>
                {drawerWidth === 70 ? <ListIcon /> : <MoreVertIcon />}
              </IconButton>
            </DesktopToggleBtn>

            <MobileToggleBtn sx={{ display: { xs: "block", sm: "none" } }}>
              <IconButton
                edge="start"
                color="inherit"
                onClick={() => setDrawerOpen(true)}
              >
                <MenuIcon />
              </IconButton>
            </MobileToggleBtn>

            <Box sx={{ flexGrow: 1 }} />

            <UsernameButton
              startIcon={<AccountCircleIcon />}
              onClick={handleMenuOpen}
            >
              {loginName}
            </UsernameButton>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
              anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
              transformOrigin={{ vertical: "top", horizontal: "right" }}
            >
              <MenuItem onClick={handleprofile}>Profile</MenuItem>
              <MenuItem onClick={handleLogout}>Logout</MenuItem>
            </Menu>
          </Box>
        </AppBar>
        <div style={{ minHeight: "75vh" }}>
          <Routes>
            <Route
              path="/scheduleshipment"
              element={
                <Schedule
                  setActiveModule={setActiveModule}
                  activeModule={activeModule}
                  activeTab={activeTab}
                  setActiveTab={setActiveTab}
                />
              }
            />
            <Route path="/shipmentlist" element={<ShipmentDashboard />} />
            <Route path="/myshipmentnew" element={<Myshipmentnew />} />
            <Route
              path="/scheduleconfirmation"
              element={<ScheduleConfirmation />}
            />
            <Route path="/AddUser" element={<AddUsers />} />
            <Route
              path="/getrates"
              element={
                <GetRate
                  setActiveModule={setActiveModule}
                  setActiveTab={setActiveTab}
                />
              }
            />
            <Route path="/profilepage" element={<ProfilePage />} />
            <Route
              path="/managementnavigation"
              element={<ManagementDashboard />}
            />

            <Route
              path="/userlist"
              element={
                <UserListProvider>
                  <UserList />
                </UserListProvider>
              }
            />
            <Route
              path="/EditUser"
              element={
                <UserListProvider>
                  <EditUser />
                </UserListProvider>
              }
            />
            {/* <Route path='/AddUser' element={<UserListProvider><addUsers /></UserListProvider>} /> */}
            <Route
              path="/"
              element={
                <Schedule
                  setActiveModule={setActiveModule}
                  activeModule={activeModule}
                  activeTab={activeTab}
                  setActiveTab={setActiveTab}
                />
              }
            />
          </Routes>
        </div>
        <Footer />
      </MainContent>
    </Root>
  );
};

export default Dashboard;
