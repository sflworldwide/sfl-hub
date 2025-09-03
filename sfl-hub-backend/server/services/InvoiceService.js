import createSequelizeInstance from "../config/dbConnection.js";  
import moment from 'moment';


async function addUpdateInvoice(invoice, firstShipment, userid) {
    return new Promise(async (resolve, reject) => {
        try {
            let data = {
                id: 0,
                success: false,
            };

            console.log("invoice...", invoice);
            console.log("ShippingID...", firstShipment); 
            console.log("userid...", userid);

            let insertUpdateValue = "I";  
            if (invoice.ShippingInvoiceID && invoice.ShippingInvoiceID > 0) {
                insertUpdateValue = "U"; 
            } else if (invoice.Status === "Inactive") {
                insertUpdateValue = "D"; 
            }

            const invoiceData = {
                invoiceid: invoice.ShippingInvoiceID || null, 
                shippingid: firstShipment.shippingid || 0,  
                invoicedate: moment().format("YYYY-MM-DD HH:mm:ss").toString(),
                servicedescription: "Shipping Charges",
                quantity: "1",
                amount: invoice.Amount,
                description: `Rate Quoted : ${firstShipment.chargableweight} Lbs.`,
                totalamount: invoice.Amount,
                status: "Active",
                insertupdate: insertUpdateValue,
                createdby: userid,
            };

            const invoiceJson = JSON.stringify(invoiceData);
            console.log("invoiceJson:", invoiceJson); 

            const invoiceQuery = "CALL spaddupdateinvoice(?,?,?)"; 
            console.log("invoiceQuery...", invoiceQuery);

            const sequelize = await createSequelizeInstance();
            const [invoiceRes, metadata] = await sequelize.query(invoiceQuery, {
                replacements: [
                    invoiceJson,           
                    userid,
                    null           
                ],
                type: sequelize.QueryTypes.RAW, 
            });

            if (invoiceRes) {
                console.log("Stored Procedure Response: ", invoiceRes);
                // console.log("Returned iuid: ", outputIUID);
                data.success = true;
                data.res = invoiceRes;
                resolve(data);
            } else {
                reject({
                    success: false,
                    message: "Failed to add/update invoice."
                });
            }

        } catch (invoiceErr) {
            console.error("Error in addUpdateInvoice:", invoiceErr);
            reject({
                error: invoiceErr,
                message: "oops! Something went wrong",
                success: false,
            });
        }
    });
}


async function generateInvoiceGetRate(shipmentData) {
    return new Promise(async (resolve, reject) => { 
        try {
            if (shipmentData.TrackingNumber) {
                const sequelize = await createSequelizeInstance();
                const shipQuery = `SELECT * FROM spgetshipmentdetailbytrackingnumber(:TrackingNumber)`;

                const [shipRes, shipMeta] = await sequelize.query(shipQuery, {
                    replacements: {
                        TrackingNumber: shipmentData.TrackingNumber
                    } 
                });

                if (!shipRes || shipRes.length === 0) {
                    return reject({
                        success: false,
                        message: "No shipment found with this tracking number."
                    });
                }

                const firstShipment = shipRes[0];
                // console.log("firstShipment :", firstShipment);

                const weightTobeDisplayed = firstShipment.chargableweight || firstShipment.totalweight || 0;
                const invoice = {
                    InvoiceDate: moment().format("YYYY-MM-DD HH:mm:ss").toString(),
                    ServiceDescription: "Shipping Charges",
                    Quantity: "1",
                    Amount: 0,
                    Description: `Rate Quoted : ${weightTobeDisplayed} Lbs.`,
                    TotalAmount: 0,
                    Status: "Active",
                };

                invoice.Amount = shipmentData.Rates.toFixed(2);
                invoice.TotalAmount = shipmentData.Rates.toFixed(2);

                const invoiceRes = await addUpdateInvoice(invoice, firstShipment, shipmentData.UserID, sequelize);

                if (!invoiceRes || !invoiceRes.success) {
                    return reject({
                        success: false,
                        message: "Failed to add/update invoice."
                    });
                }

                resolve({
                    success: true,
                    message: "Data saved successfully"
                }); 

            } else {
                reject({
                    success: false,
                    message: "TrackingNumber is required."
                });
            }
        } catch (error) {
            console.error("Error in generateInvoiceGetRate:", error);
            reject({
                success: false,
                message: "An unexpected error occurred.",
                error: error
            });
        }
    });
}


export { generateInvoiceGetRate};