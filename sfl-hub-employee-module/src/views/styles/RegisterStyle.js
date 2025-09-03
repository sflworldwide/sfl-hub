import { makeStyles } from "@mui/styles";
export const useStyles = makeStyles((theme) => ({
  root: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "100vh",
    backgroundColor: "gray.100",
    position: "relative",
    paddingLeft: (props) => (props.isMobile ? theme.spacing(2) : 0),
    paddingRight: (props) => (props.isMobile ? theme.spacing(2) : 0),
  },
  backgroundImage: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundImage: "url('/login-bg.png')",
    backgroundSize: "cover",
    backgroundPosition: "center",
  },
  paper: {
    padding: theme.spacing(4),
    borderRadius: "10px !important", 
    boxShadow: "0px 4px 20px rgba(0, 0, 0, 0.1) !important",
    maxWidth: 400,
    width: "100%",
    borderTop: "5px solid #d9040c",
    zIndex: 1,
  },
  logoContainer: {
    display: "flex",
    justifyContent: "center",
    marginBottom: theme.spacing(2),
  },
  logo: {
    height: "3rem",
  },
  usernameContainer: {
    position: "relative",
    width: "100%",
  },
  usernamePopover: {
    marginTop: theme.spacing(1),
  },
  usernamePopoverContent: {
    padding: theme.spacing(2),
    maxWidth: 300,
  },
  usernamePopoverTitle: {
    fontWeight: "bold",
  },
  usernameValidationText: {
    display: "flex",
    alignItems: "center",
    fontSize: "0.755rem !important",
  },
  passwordPopover: {
    marginTop: theme.spacing(2),
    marginLeft: (props) => (props.isMobile ? 0 : theme.spacing(3)),
  },
  passwordPopoverContent: {
    padding: theme.spacing(1.5),
    maxWidth: 280,
  },
  passwordPopoverTitle: {
    fontWeight: "bold",
    fontSize: "0.875rem",
  },
  passwordValidationText: {
    fontSize: "0.8rem !important",
    display: "flex",
    alignItems: "center",
  },
  submitButton: {
    marginTop: theme.spacing(2),
    backgroundColor: "red !important", // Bright red from the image
    color: "white",
    height: "48px", // Adjusted to ~48px to match the button height
    width: "100%", // Full width of the form (350px)
    "&:hover": {
      backgroundColor: "red", // Slightly darker red for hover
    },
  },
  backToLoginContainer: {
    display: "flex",
    justifyContent: "center",
    marginTop: theme.spacing(2),
  },
  backToLogin: {
    color: "darkblue",
    textDecoration: "none",
    fontWeight: 400,
  },
  inputIcon: {
    color: "gray",
    marginRight: theme.spacing(1),
  },
  toggleVisibilityIcon: {
    fontSize: "small"
  },
  iconButton: {
    padding: "1px",
    width: "10px",
  },
}));