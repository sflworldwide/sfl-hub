import { makeStyles } from "@mui/styles";

const phoneInputStyles = {
  phoneInputContainer: {
    width: "100%",
    position: "relative",
    marginBottom: "16px",
    
    "& .react-tel-input": {
      fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
      
      "& .form-control": {
        height: "45px",
        padding: "8px 45px",
        border: "none",
        borderBottom: "1px solid #949494",
        borderRadius: "0",
        backgroundColor: "transparent",
        fontSize: "14px",
        fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
        outline: "none",
        boxShadow: "none",
        transition: "border-bottom-color 0.2s ease",
        
        "&:focus": {
          borderBottom: "2px solid #ab47bc",
          boxShadow: "none",
        },
        
        "&.error": {
          borderBottom: "2px solid #f44336",
        }
      },
      
      "& .flag-dropdown": {
        border: "none",
        borderBottom: "1px solid #949494",
        borderRadius: "0",
        backgroundColor: "transparent",
        
        "&:hover": {
          backgroundColor: "transparent",
        },
        
        "&.open": {
          borderBottom: "2px solid #ab47bc",
        }
      },
      
      "& .special-label": {
        fontSize: "14px",
        color: "rgba(0, 0, 0, 0.6)",
        fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
        position: "absolute",
        top: "-5px",
        left: "0",
        pointerEvents: "none",
        transition: "all 0.2s ease",
      }
    }
  },
  
  phoneInputError: {
    "& .react-tel-input .form-control": {
      borderBottom: "2px solid #f44336",
    },
    "& .react-tel-input .flag-dropdown": {
      borderBottom: "2px solid #f44336",
    }
  },
  
  errorText: {
    marginTop: "4px",
    fontSize: "12px",
    color: "#f44336",
  }
};

const usePhoneInputStyles = makeStyles(phoneInputStyles);

export default usePhoneInputStyles;