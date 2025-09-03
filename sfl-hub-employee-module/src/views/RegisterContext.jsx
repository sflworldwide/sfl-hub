import { createContext, useState, useContext } from "react";

const RegisterContext = createContext();


export  const RegisterProvider = ({ children }) => {
    const [registerDetails, setRegisterDetails] = useState({
        username: "",
        fullname: "",
        email: "",
        mobile: "",
        password: "",
        confirmpassword: "",
    });

    const [emailVerify, setEmailVerify] = useState(false); 

    return (
        <RegisterContext.Provider value={{ registerDetails, setRegisterDetails, emailVerify, setEmailVerify }}>
            {children}
        </RegisterContext.Provider>
    );
};


export const useRegister = () => {
    return useContext(RegisterContext);
};
