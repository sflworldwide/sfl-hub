import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useNavigate,
} from "react-router-dom";
import React, { useEffect, useRef } from "react";
import RegisterPage from "./views/pages/RegisterPage";
import EmailVerification from "./views/pages/EmailVerification";
import { Toaster } from "react-hot-toast";
import LoginPage from "./views/pages/LoginPage";
import ForgotPassword from "./views/pages/ForgetPage";
import ScheduleShipment from "./views/pages/scheduleshipment/Scheduleshipment";
import ResetPassword from "./views/pages/ResetPassword";
import { ShipmentProvider } from "./views/ShipmentContext";
import "./App.css";
import "./index.css";
import { api } from "./utils/api";
import Invoice from "./views/pages/ShipmentDocumentation/Invoice";
import PrintCommercialInvoice from "./views/pages/ShipmentDocumentation/PrintCommercialInvoice";
import ProfilePage from "./views/pages/scheduleshipment/ProfilePage";

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
    // resetTimer();

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      events.forEach((event) => window.removeEventListener(event, resetTimer));
    };
  }, [navigate]);

  return children;
};

function App() {
  let inactivityTimer;

  // Function to send the keep-alive request
  const keepSessionAlive = () => {
    fetch(`${api.BackendURL}/users/keepAlive`, {
      method: "POST",
      credentials: "include", // Ensure cookies are sent along with the request
    })
      .then((response) => {
        console.log("Keep-alive response status:", response);
        if (response.status === 401) {
          sessionStorage.clear();
          // If the backend returns 401 (session expired), log out the user
          document.cookie =
            "LKA=; Max-Age=0; path=/; secure; HttpOnly; SameSite=Strict";
          // alert("Session expired. You have been logged out due to inactivity.");
          window.location.href = "/login"; // Redirect to login page or handle logout
        }
      })
      .catch((err) => console.error("Error in keep-alive check:", err));
  };

  // Function to reset inactivity timer
  const resetInactivityTimer = () => {
    clearTimeout(inactivityTimer);

    inactivityTimer = setTimeout(() => {
      keepSessionAlive();
    }, 15 * 60 * 1000);
  };

  useEffect(() => {
    // Set up event listeners for mouse and keyboard activity
    document.addEventListener("mousemove", resetInactivityTimer);
    document.addEventListener("keypress", resetInactivityTimer);

    // Call keep-alive function immediately and reset inactivity timer
    resetInactivityTimer();

    // Cleanup the event listeners when the component is unmounted
    return () => {
      document.removeEventListener("mousemove", resetInactivityTimer);
      document.removeEventListener("keypress", resetInactivityTimer);
      clearTimeout(inactivityTimer); // Clear the timeout when component unmounts
    };
  }, []);
  useEffect(() => {
    const handleContextMenu = (e) => {
      e.preventDefault();
    };

    const handleKeyDown = (e) => {
      if (
        e.key === "F12" ||
        (e.ctrlKey && e.shiftKey && (e.key === "I" || e.key === "J")) ||
        (e.ctrlKey && e.key === "U")
      ) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    };

    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <Router>
      <InactivityHandler>
        <div>
          <Toaster position="top-right" reverseOrder={false} />
        </div>
        <Routes>
          <Route
            path="/"
            element={<Navigate replace to="/auth/login-page" />}
          />
          <Route path="/auth/login-page" element={<LoginPage />} />
          <Route path="/auth/register-page" element={<RegisterPage />} />
          <Route path="/emailverification" element={<EmailVerification />} />
          <Route path="/ProfilePage" element={<ProfilePage />} />
          <Route
            path="/auth/forgotpassword-page"
            element={<ForgotPassword />}
          />
          <Route path="/auth/ResetPassword" element={<ResetPassword />} />
          <Route path="/auth/printinvoice" element={<Invoice />} />
          <Route
            path="/auth/printcommercialinvoice"
            element={<PrintCommercialInvoice />}
          />
          <Route
            path="/admin/*"
            element={
              <ProtectedRoute>
                <ShipmentProvider>
                  <ScheduleShipment />
                </ShipmentProvider>
              </ProtectedRoute>
            }
          />
          <Route
            path="*"
            element={<Navigate to="/auth/login-page" replace />}
          />
        </Routes>
      </InactivityHandler>
    </Router>
  );
}

export default App;
