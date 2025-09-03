import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast"; 
import { useRegister } from "../RegisterContext";
import sflLogo from "../../assets/sfl-logo-white.svg";
import ReactTable from "../../components/ReactTable";  // Import your table component

const MyShipment = () => {
  const { emailVerify, setEmailVerify, registerDetails } = useRegister();
  const navigate = useNavigate();

  const [generatedOtp, setGeneratedOtp] = useState("");
  const otpGenerated = useRef(false);

  async function generateOTP() {
    const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(newOtp);
    console.log("Generated OTP:", newOtp);
    toast.success("OTP sent to Your Mail", {
      position: "top-right", 
      duration: 3000,        
    });
  }

  useEffect(() => {
    if (!otpGenerated.current) {
      generateOTP();
      otpGenerated.current = true;  
    }
  }, []);

  return (
    <>
      <div className="sidenav-wrap">
        <div className="brand">
          <a href="#"><img src={sflLogo} alt="SFL Logo" /></a>
        </div>
        <div className="sidenav-inner">
          <ul>
            <li>
              <a href="#">Schedule Shipment</a>
            </li>
            <li>
              <a href="#">My Shipment</a>
            </li>
          </ul>
        </div>
      </div>

      {/* Add ReactTable component */}
      <div className="content-wrap">
        <h2>My Shipments</h2>
        <ReactTable />
      </div>
    </>
  );
};

export default MyShipment;
