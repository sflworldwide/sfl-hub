import React from 'react';
import {
  Box,
  Menu,
  MenuItem,
  List,
  ListItemIcon,
  ListItemText,
} from '@mui/material';

import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import DirectionsBoatIcon from '@mui/icons-material/DirectionsBoat';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';

import {
  SidebarWrapper,
  MobileDrawer,
  LogoBox,
  UsernameButton,
  ProfileBox,
  StyledListItem,
} from '../../styles/sidebarStyles';

const Sidebar = ({
  drawerWidth,
  Loginname,
  setDrawerWidth,
  drawerOpen,
  toggleDrawer,
  anchorEl,
  open,
  handleMenuOpen,
  handleMenuClose,
  activeModule,
  handleModuleClick,
  setDrawerOpen,
  account_number,
}) => {

  const modules = account_number ? ['Get Rates', 'Schedule Shipment', 'My Shipment'] : ['Schedule Shipment', 'My Shipment'];

  const iconMap = {
    'Schedule Shipment': <LocalShippingIcon />,
    'My Shipment': <DirectionsBoatIcon />,
  };

  return (
    <>
      {/* Mobile Drawer */}
      <MobileDrawer
        anchor="left"
        open={drawerOpen}
        onClose={toggleDrawer(false)}
      >
        <ProfileBox >
          <LogoBox>
            <img src="/sfllogo2--.png" alt="Logo" width={120} style={{ marginBottom: 10 }} />
          </LogoBox>

          <Box sx={{ display: { xs: 'block', sm: 'none' } }}>
            <UsernameButton startIcon={<AccountCircleIcon />} onClick={handleMenuOpen}>
              {Loginname}
            </UsernameButton>
            <Menu
              anchorEl={anchorEl}
              open={open}
              onClose={handleMenuClose}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
              <MenuItem onClick={handleMenuClose}>Profile</MenuItem>
              <MenuItem onClick={handleMenuClose}>Logout</MenuItem>
            </Menu>
          </Box>

          <List>
            {modules.map((module) => {
              const getIcon = () => {
                switch (module) {
                  case 'Schedule Shipment':
                    return <LocalShippingIcon />;
                  case 'My Shipment':
                    return <DirectionsBoatIcon />;
                  default:
                    return <AttachMoneyIcon />;
                }
              };

              return (
                <StyledListItem
                  key={module}
                  component="button"
                  selected={activeModule === module}
                  onClick={() => handleModuleClick(module)}
                  active={activeModule === module}
                >
                  <ListItemIcon sx={{ color: 'white' }}>
                    {getIcon()}
                  </ListItemIcon>
                  <ListItemText primary={module} sx={{ color: 'white' }} />
                </StyledListItem>
              );
            })}
          </List>

        </ProfileBox>
      </MobileDrawer>

      {/* Permanent Sidebar (Desktop) */}
      <SidebarWrapper
        drawerWidth={drawerWidth}
        onMouseEnter={() => {
          if (drawerWidth === 70) setDrawerWidth(250);
        }}
      >
        <LogoBox>
          <img
            src={drawerWidth === 250 ? '/sfllogo2--.png' : '/logo-icon.png'}
            alt="Logo"
            width={drawerWidth === 250 ? 200 : 70}
            style={{ marginBottom: 10 }}
          />
        </LogoBox>



        <List>
          {modules.map((module) => (
            <StyledListItem
              key={module}
              component="button"
              selected={activeModule === module}
              onClick={() => handleModuleClick(module)}
            >
              <ListItemIcon sx={{ color: 'white', minWidth: '48px' }}>
                {iconMap[module] || <AttachMoneyIcon />}
              </ListItemIcon>
              <ListItemText
                primary={module}
                sx={{
                  '& .MuiTypography-root': {
                    fontSize: '0.9rem',
                    color: 'white',
                  }
                }}
              />
            </StyledListItem>
          ))}
        </List>

      </SidebarWrapper>
    </>
  );
};

export default Sidebar;
