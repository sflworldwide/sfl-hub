import React from 'react'
import axios from "axios";
import { toast } from "react-hot-toast";

const Olddbsend = () => {

    const handleSubmit = async () => {
        // loading
         const loadingToast = toast.loading("Sending...");
      try {
        const payload = {
          UserID: 31979,
          ipAddress: "",
          TrackingNumber: null,
          shipments: {
            tracking_number: "",
            shipment_type: "Air",
            location_type: "Residential",
            is_pickup: false,
            pickup_date: "2025-04-16 17:04:18",
            package_type: "Package",
            total_packages: 1,
            is_pay_online: 0,
            is_pay_bank: 0,
            promo_code: "",
            is_agree: "",
            total_weight: 10,
            total_chargable_weight: 10,
            total_insured_value: 0,
            duties_paid_by: "Recipient",
            total_declared_value: 0,
            userName: "TestAnshul1@",
            ServiceName: "",
            SubServiceName: "",
            managed_by: 5327,
            ShippingID: null,
            InvoiceDueDate: null
          },
          MovingBackToIndia: false,
          from_address: {
            AddressID: null,
            country_id: 202,
            country_name: "United States",
            fromCountryCode: "US",
            company_name: "",
            contact_name: "tesSender",
            address_1: "test",
            address_2: "test",
            address_3: "",
            MovingBack: false,
            OriginalPassportAvailable: false,
            EligibleForTR: false,
            city_id: 1,
            city_name: "Irving",
            fedex_city: "",
            state_id: 1,
            state_name: "Texas",
            zip_code: "75063",
            phone1: "12345678900",
            phone2: "",
            email: "test@gmail.com"
          },
          to_address: {
            AddressID: null,
            country_id: 89,
            country_name: "India",
            toCountryCode: "IN",
            company_name: "",
            contact_name: "test receipent",
            address_1: "wertyui",
            address_2: "",
            address_3: "",
            city_id: 2,
            city_name: "Ahmedabad",
            fedex_city: "",
            state_id: 1,
            state_name: "Gujarat",
            zip_code: "380001",
            phone1: "1234567890",
            phone2: "",
            email: ""
          },
          packages: [
            {
              shipments_tracking_number: "",
              PackageNumber: 1,
              weight: "10",
              unit_of_weight: "LBS",
              length: "1",
              width: "1",
              height: "1",
              TV: false,
              Crating: false,
              Repack: false,
              Stretch: false,
              chargable_weight: 10,
              insured_value: 0
            }
          ],
          commercial: [
            {
              shipments_tracking_number: "",
              package_number: 1,
              content_description: "Tshit",
              quantity: "1",
              value_per_qty: "1.00",
              total_value: "1.00",
              CommercialInvoiceID: null
            }
          ],
          invoiceData: [],
          TotalCommercialvalue: "1.00",
          TotalWeight: 10
        };
    
        const response = await axios.post(
          "https://hubapi.sflworldwide.com/scheduleshipment/addshipments",
          payload,
          {
            withCredentials: true,
            credentials: 'include',
            headers: {
              "Content-Type": "application/json", 
            },
          }
        );
        
    
        if (response.status === 200 && response.data.success) {
            toast.dismiss(loadingToast);
            toast.success("Shipment added successfully", {
                position: "top-right",
                autoClose: 3000,
            });
          console.log("Shipment added successfully:", response.data);
        } else {
          console.warn("Something went wrong:", response.data);
            toast.dismiss(loadingToast);
            toast.error("Something went wrong", {
                position: "top-right",
                autoClose: 3000,
            });
        }
      } catch (error) {
        console.error("Error adding shipment:", error);
        toast.dismiss(loadingToast);
        toast.error("Error adding shipment", {
            position: "top-right",
            autoClose: 3000,
        });
      }
    };

    const getManagedBy = async () => {
        // loading
         const loadingToast = toast.loading("Sending...");
        try {
          const response = await axios.post("https://hubapi.sflworldwide.com/scheduleshipment/getManagedByPhoneOREmailShipment", {
            FromEmail: "test@gmail.com",
            FromPhone1: "7412589630",
            FromPhone2: "",
            ToEmail: "",
            ToPhone1: "8660330457",
            ToPhone2: "recipientPhone2",
          });
      
          const managedBy = response.data?.data?.[0]?.ManagedBy || "";
            toast.dismiss(loadingToast);
            toast.success("ManagedBy fetched successfully", {
                position: "top-right",
                autoClose: 3000,
            });
          console.log("ManagedBy:", managedBy);
          
        } catch (error) {
          console.error("Failed to fetch ManagedBy", error);
            toast.dismiss(loadingToast);
            toast.error("Failed to fetch ManagedBy", {
                position: "top-right",
                autoClose: 3000,
            });
        }
      };
    

  return (
    <div>
        <h1>Olddbsend</h1>
        <button onClick={handleSubmit}>Submit</button>
        <button onClick={getManagedBy}>Get Managed By</button>
    </div>

  )
}

export default Olddbsend