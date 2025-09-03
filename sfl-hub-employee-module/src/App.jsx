import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import React, { useEffect, useRef } from "react";
import RegisterPage from "./views/pages/RegisterPage";
import EmailVerification from "./views/pages/EmailVerification";
import { Toaster } from "react-hot-toast";
import LoginPage from "./views/pages/LoginPage";
import ForgotPassword from "./views/pages/ForgetPage";
// import ScheduleShipment from "./views/pages/scheduleshipment/Scheduleshipment";
import ResetPassword from "./views/pages/ResetPassword";
import { ShipmentProvider } from "./views/ShipmentContext";
import "./App.css";
import "./index.css";
import Invoice from "./views/pages/ShipmentDocumentation/Invoice";
import PrintCommercialInvoice from "./views/pages/ShipmentDocumentation/PrintCommercialInvoice";
import Dashboard from "./views/pages/Dashboard";

// ProtectedRoute component
const ProtectedRoute = ({ children }) => {
  const authToken = sessionStorage.getItem("user");
  return authToken ? children : <Navigate to="/auth/login-page" replace />;
};

// Inactivity handler component
const InactivityHandler = ({ children }) => {
  const timeoutRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const resetTimer = () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        sessionStorage.removeItem("user");
        sessionStorage.removeItem("PersonID");
        sessionStorage.clear();
        navigate("/auth/login-page", { replace: true }); 
      }, 15 * 60 * 1000); // 15 minutes
    };

    const events = ["mousemove", "mousedown", "keydown", "touchstart"];
    events.forEach((event) => window.addEventListener(event, resetTimer));
    resetTimer(); 

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      events.forEach((event) => window.removeEventListener(event, resetTimer));
    };
  }, [navigate]);

  return children;
};

function App() {
  // useEffect(() => {
  //   const handleContextMenu = (e) => {
  //     e.preventDefault();
  //   };

  //   const handleKeyDown = (e) => {
  //     if (
  //       e.key === "F12" ||
  //       (e.ctrlKey && e.shiftKey && (e.key === "I" || e.key === "J")) ||
  //       (e.ctrlKey && e.key === "U")
  //     ) {
  //       e.preventDefault();
  //       e.stopPropagation();
  //       return false;
  //     }
  //   };

  //   document.addEventListener("contextmenu", handleContextMenu);
  //   document.addEventListener("keydown", handleKeyDown);

  //   return () => {
  //     document.removeEventListener("contextmenu", handleContextMenu);
  //     document.removeEventListener("keydown", handleKeyDown);
  //   };
  // }, []);

  return (
    <Router>
      <InactivityHandler>
        <div>
          <Toaster position="top-right" reverseOrder={false} />
        </div>
        <Routes>
          <Route path="/" element={<Navigate replace to="/auth/login-page" />} />
          <Route path="/auth/login-page" element={<LoginPage />} />
          <Route path="/auth/register-page" element={<RegisterPage />} />
          <Route path="/emailverification" element={<EmailVerification />} />
          <Route path="/auth/forgotpassword-page" element={<ForgotPassword />} />
          <Route path="/auth/ResetPassword" element={<ResetPassword />} />
          <Route path="/auth/printinvoice" element={<Invoice/>} />
          <Route path="/auth/printcommercialinvoice" element={<PrintCommercialInvoice/>} />
          <Route
            path="/admin/*"
            element={
            
              <ProtectedRoute>
                <ShipmentProvider>
                <Dashboard />
                </ShipmentProvider>
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/auth/login-page" replace />} />
        </Routes>
      </InactivityHandler>
    </Router>
  );
}

export default App;
