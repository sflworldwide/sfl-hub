import { styled } from '@mui/material/styles';
import { Box, Button } from '@mui/material';

// Root container
export const Root = styled(Box)(({ theme }) => ({
  display: 'flex',
  minHeight: '100vh',
  margin: 0,
}));

// Main content section
export const MainContent = styled(Box)(({ theme }) => ({
  flexGrow: 1,
  backgroundColor: '#EEEEEE',
}));

// Header bar box
export const AppBarBox = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  padding: theme.spacing(1),
}));

// Desktop toggle button
export const DesktopToggleBtn = styled('div')(({ theme }) => ({
  display: 'none',
  marginLeft: theme.spacing(2),
  [theme.breakpoints.up('sm')]: {
    display: 'block',
  },
}));

// Mobile toggle button
export const MobileToggleBtn = styled('div')(({ theme }) => ({
  display: 'block',
  [theme.breakpoints.up('sm')]: {
    display: 'none',
  },
}));

// Main content box (centered content)
export const ContentBox = styled(Box)(({ theme }) => ({
  width: '90%',
  alignSelf: 'center',
  justifyContent: 'center',
  margin: '5.2rem auto',
  backgroundColor: 'white',
  padding: '10px',
  boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.3)',
  borderRadius: 10,
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
  // overflowY: 'auto',
  [theme.breakpoints.down('md')]: {
    margin: '2rem auto',
  },
}));

// Icon container box
export const IconBox = styled(Box)(({ theme }) => ({
  display: 'inline-flex',
  justifyContent: 'center',
  alignItems: 'center',
  width: 55,
  height: 55,
  // borderRadius: 7,
  backgroundColor: '#c30ac9',
  boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.3)',
  marginRight: theme.spacing(3),
  marginLeft: theme.spacing(1),
}));

// Username button
export const UsernameButton = styled(Button)(({ theme }) => ({
  textTransform: 'none',
  color: 'grey',
  display: 'none',
  [theme.breakpoints.up('sm')]: {
    display: 'flex',
  },
}));


//phoneInput
export const PhoneInputStyle = {
  padding: '6px 8px',
  height: '40px',
  fontSize: '0.8rem',
  fontFamily: 'Roboto, sans-serif',
  borderRadius: '4px',
  paddingLeft: '48px' ,
};

// Buttons.js 
export const ButtonBox = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
  gap: theme.spacing(2),
  [theme.breakpoints.up("sm")]: {
    flexDirection: "row",
  },
}));

export const PrevButton = styled(Button)(({ theme }) => ({
  width: "100%",
  backgroundColor: "#999999",
  color: "white",
  "&:hover": {
    backgroundColor: "#666666",
  },
  [theme.breakpoints.up("sm")]: {
    width: "auto",
  },
}));

export const NextButton = styled(Button)(({ theme }) => ({
  width: "100%",
  paddingTop: theme.spacing(1.3),
  paddingBottom: theme.spacing(1.3),
  paddingRight: theme.spacing(3),
  paddingLeft: theme.spacing(3),
  backgroundColor: "#E91E63",
  color: "white",
  "&:hover": {
    backgroundColor: "red",
  },
  [theme.breakpoints.up("sm")]: {
    width: "auto",
  },
}));

export const PickupBox = styled(Box)(({ theme }) => ({
  padding: theme.spacing(3),
  backgroundColor: "white",
  borderRadius: theme.spacing(2),
  margin: theme.spacing(3),
  width: "55%",
  alignSelf: "center",
  marginLeft: "auto",
  marginRight: "auto",
  [theme.breakpoints.down("sm")]: {
    width: "90%", // ⬅ Wider on mobile
  },
}));

export const EditButton = styled(Button)(({ theme }) => ({
  width: "100%",
  paddingTop: theme.spacing(1.3),
  paddingBottom: theme.spacing(1.3),
  paddingRight: theme.spacing(3),
  paddingLeft: theme.spacing(3),
  backgroundColor: "#E91E63",
  color: "white",
  "&:hover": {
    backgroundColor: "red",
  },
  [theme.breakpoints.up("sm")]: {
    width: "auto",
  },
}));