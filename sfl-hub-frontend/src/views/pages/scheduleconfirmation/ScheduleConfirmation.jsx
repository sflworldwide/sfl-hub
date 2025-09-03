import React, { useState, useEffect } from 'react';
import GridContainer from "../../styles/grid/GridContainer.jsx";
import GridItem from "../../styles/grid/GridItem.jsx";
//import { fileBase } from "../../utils/config";
import Right from "../../../assets/check.svg";
// import error from "../../../assets/error.svg";
import box from "../../../assets/box-receive.png";
// import downloadImage from "../../../assets/downloadimage.svg";
import { useLocation } from 'react-router-dom';
import CryptoJS from "crypto-js";

const ScheduleConfirmation = () => {
  const location = useLocation();
  const SECRET_KEY = import.meta.env.VITE_SECRET_KEY;
  const { trackingNumber, shipment, sender, recipient, packageData, commercialInvoiceData } = location.state || {};

  const [state, setState] = useState({
    trackingNumber: trackingNumber,
    from_address: sender,
    to_address: recipient,
    packages: packageData,
    commercial: commercialInvoiceData,
    payment_online: {},
    payment_bank: {},
    shipments: shipment,
    paymentType: "",
    isPackage: true,
    showGetrate: true,
    showGetrateError: false,
    Attachments: [],
    data: {},
    FedexTrackingNumber: "",
    AttachmentsLink1: "",
    AttachmentsLink2: "",
    LableError: "",
  });

  // useEffect(() => {
  //   if (localStorage.getItem("shipmentObj")) {
  //     const data = JSON.parse(localStorage.getItem("shipmentObj"));

  //     let attachData = data.Attachments;
  //     let mainLabelIndex, commInvoiceIndex;
  //     let attachpath = "";
  //     let attachPath2 = "";
  //     if (data.data) {
  //       if (attachData.length > 0 && data.data.MasterTrackingId) {
  //         let labelFileName = "Label_" + data.data.MasterTrackingId.TrackingNumber;
  //         mainLabelIndex = attachData.findIndex((x) => x.FileName === labelFileName);
  //         commInvoiceIndex = attachData.findIndex((x) => x.DocumentType === "Commercial Invoice");
  //         if (mainLabelIndex !== -1) {
  //           attachpath = attachData[mainLabelIndex]["AttachmentPath"];
  //         } else {
  //           attachpath = attachData[0]["AttachmentPath"];
  //         }
  //         if (commInvoiceIndex !== -1) {
  //           attachPath2 = attachData[commInvoiceIndex]["path"];
  //         }
  //       }
  //     }

  //     setState((prevState) => ({
  //       ...prevState,
  //       Attachments: data.Attachments,
  //       trackingNumber: data.trackingNumber,
  //       from_address: data.Second_data.from_address,
  //       to_address: data.Second_data.to_address,
  //       packages: data.Second_data.packages,
  //       commercial: data.Second_data.commercial,
  //       payment_online: data.Second_data.PaymentData[0],
  //       payment_bank: data.Second_data.PaymentData[0],
  //       paymentType: data.Second_data.paymentType,
  //       shipments: data.Second_data.shipments,
  //       isPackage: data.Second_data.shipments.package_type === "Documents (Under 0.5Lbs)" ? false : true,
  //       showGetrate: data.showGetrate,
  //       showGetrateError: data.showGetrateError,
  //       data: data.data,
  //       FedexTrackingNumber: Object.keys(data.data).length !== 0 ? (data.data.success ? data.data.MasterTrackingId.TrackingNumber : "") : "",
  //       AttachmentsLink1: data.Attachments.length != 0 ? fileBase + attachpath : "",
  //       AttachmentsLink2: data.Attachments.length > 1 ? attachPath2 : "",
  //       LableError: Object.keys(data.data).length !== 0 ? data.data.data : "",
  //     }));
  //   }
  // }, []);

  const {
    from_address,
    to_address,
    shipments,
  } = state;

  return (
    <GridContainer>
      <div className="sc-shipment-outer">
        <div className="scs-header">
          <GridContainer>
            <GridItem md="6" xs={12}>
              <div className="scs-headerinner">
                <h4>SHIPMENT SCHEDULED SUCCESSFULLY </h4>
                <p>TRACKING NUMBER</p>
                <span>{state.trackingNumber}</span>
                {/* <span>Thank you for scheduling your shipment with SFL Worldwide.</span> */}
              </div>
            </GridItem>
            <GridItem md="6" xs={12}>
              <div className="ssc-header-img">
                <img style={{ textAlign: "center" }} src={Right} alt="SFL" />
              </div>
            </GridItem>
          </GridContainer>
        </div>
        <div className="scs-content">
          <h3>THANK YOU FOR SCHEDULING YOUR SHIPMENT WITH SFL WORLDWIDE.</h3>
          <GridContainer>
            <GridItem md="6" xs={12}>
              <div className="scs-table">
                <p>
                  <span>
                    <i className="fa fa-user"></i> Sender Name:
                  </span>
                  <i>
                    {CryptoJS.AES.decrypt(from_address.contact_name, SECRET_KEY).toString(CryptoJS.enc.Utf8) || "sfl sender"}
                  </i>
                </p>
                <p>
                  <span>
                    <i className="fa fa-truck" aria-hidden="true"></i> Tracking Number:
                  </span>
                  <i>{state.trackingNumber || "sfl"}</i>
                </p>
              </div>
            </GridItem>
            <GridItem md="6" xs={12}>
              <div className="scs-table">
                <p>
                  <span>
                    <i className="fa fa-user"></i> Recipient Name:
                  </span>
                  <i>
                    {CryptoJS.AES.decrypt(to_address.contact_name, SECRET_KEY).toString(CryptoJS.enc.Utf8) || "sfl recipient"}
                  </i>
                </p>
                <p>
                  <span>
                    <i className="fa fa-ship" aria-hidden="true"></i> Shipment Type:
                  </span>
                  <i>{shipments.shipment_type || ""}</i>
                </p>
              </div>
            </GridItem>
          </GridContainer>
        </div>
        <div className="scs-steps">
          <h3>How does shipping works with SFL Worldwide?</h3>
          <GridContainer>
            <GridItem md="5" xs={12}>
              <div className="scs-steps-video">
                <iframe
                  src="https://www.youtube.com/embed/ldTbD6h1CjM"
                  frameBorder="0"
                  allow="autoplay; encrypted-media"
                  allowFullScreen
                  title="video"
                  width="100%"
                  height="200"
                ></iframe>
              </div>
            </GridItem>
            <GridItem md="7" xs={12}>
              <div className="scs-steps-inner">
                <h4>Step 1:</h4>
                <p>
                  After scheduling your shipment, you will receive a call from our
                  associates to go over your shipment.
                </p>
                <h4>Step 2:</h4>
                <p>
                  You will receive an email with a prepaid shipping label and a
                  commercial invoice if required. As a standard process, we advise you
                  to print the shipping label and securely paste it on your box or
                  envelope.
                </p>
                <h4>International Shipment:</h4>
                <p>
                  You will receive an email with a prepaid shipping label/document and a
                  commercial invoice if required. As a standard process, we advise you
                  to print the shipping label/document and securely paste it on your box
                  or envelope.
                </p>
                <h4>Step 3:</h4>
                <p>
                  Depending upon the selected service, we will arrange a door pickup or
                  you may drop your package at the nearest drop off location provided by
                  us.
                </p>
              </div>
            </GridItem>
          </GridContainer>
        </div>

        <div className="scs-instruction">
          <GridContainer>
            <GridItem md="8" xs={12}>
              <h3>Dropoff & Pickup Instructions</h3>
              <ul>
                <li>
                  If you have requested door pickup; pickup will be scheduled
                  within 1-2 business days from shipment scheduled date. Same
                  day pickup is not available
                </li>
                <li>
                  With door pickup it is customer’s responsibility to bring
                  shipment to front door; pickup person will not go inside
                  customer’s property for pickup.
                </li>
                <li>
                  All required documentations have been completed prior to
                  pickup.
                </li>
                <li>
                  Make sure items are properly packed and sealed prior to
                  pickup date. Pickup crew will not wait while items are being
                  packed at the time of pickup.
                </li>
                <li>
                  Standard pickup is schedule anytime between 9AM to 6PM local
                  standard time; someone has to be available during this time
                  to avoid any delay in pickups.
                </li>
                <li>
                  Customer will be provided with pickup confirmation number
                  and carrier contact number to coordinate door pickup
                </li>
                <li>
                  If there is any access code please advise your sales
                  associate so it can be mentioned on pickup request. If
                  pickup person is not able to access your location it will
                  delay and cancel the pickup.
                </li>
                <li>
                  Make sure to securely paste label on box; if you used
                  bag/suitcase use bag tags to secure labels on box. You can
                  get bag tags for free from any FedEx or UPS store.
                </li>
                <li>
                  Make sure your shipment is scanned at time of drop and you
                  get drop off receipt.
                </li>
              </ul>
            </GridItem>
            <GridItem md="4" xs={12}>
              <div className="box-img">
                <img src={box} alt="SFL" />
              </div>
            </GridItem>
          </GridContainer>
        </div>
      </div>
    </GridContainer>
  );
};

export default ScheduleConfirmation;