import { styled } from '@mui/material/styles';
import { Box, Drawer, Button, Menu, ListItem } from '@mui/material';

// Wrapper for desktop sidebar
export const SidebarWrapper = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'drawerWidth',
})(({ theme, drawerWidth }) => ({
  width: drawerWidth,
  backgroundColor: '#1a202c',
  color: 'white',
  padding: theme.spacing(1),
  overflow: 'hidden',
  flexShrink: 0,
  transition: 'width 0.3s ease-in-out',
  display: 'none',

  [theme.breakpoints.up('sm')]: {
    display: 'block',
  },
}));


// Drawer for mobile
export const MobileDrawer = styled(Drawer)(({ theme }) => ({
  display: 'block',

  [theme.breakpoints.up('sm')]: {
    display: 'none',
  },
}));

//profile
export const ProfileBox = styled(Box)(({ theme }) => ({
    width: 300, backgroundColor: '#292929', height: '100%', padding: 2
    }));


// Logo container
export const LogoBox = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  marginBottom: theme.spacing(4),
  borderBottom: '1px solid rgb(228, 240, 242)',
  
}));

// Menu button
export const UsernameButton = styled(Button)(({ theme }) => ({
  textTransform: 'none',
  color: 'grey',
  display: 'flex',
}));

// Styled ListItem with dynamic highlight
export const StyledListItem = styled(ListItem, {
  shouldForwardProp: (prop) => prop !== 'active',
})(({ theme, active }) => ({
  backgroundColor: active ? '#00ACC1' : 'transparent',
  color: active ? 'white' : 'inherit',
  borderRadius: theme.shape.borderRadius,
  border: 'none',
  cursor: 'pointer',
  transition: 'background-color 0.3s ease-in-out',
  '&.Mui-selected': {
    backgroundColor: '#00ACC1',
    color: 'white',
  },
  '&:hover': {
    backgroundColor: '#00ACC1',
    color: 'white',
  },
}));
