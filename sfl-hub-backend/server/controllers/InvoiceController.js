import { generateInvoiceGetRate} from '../services/InvoiceService.js';



const generateInvoiceGetRateController = async (req, res) => {
    try {
        const response = await generateInvoiceGetRate(req.body);
        if (response && response.success) {
            const responseData = {
                success: true,
                data: response,
            };
            if (Array.isArray(response.data)) {
                responseData.count = response.data.length;
            }
            res.status(200).send(responseData);
        } else {
            console.log("Error in generateInvoiceGetRate:", response);
            const message = response && response.message ? response.message : "No records found."; 
            const responseData = {
                success: false,
                data: {
                    errorMessage: message,
                },
            };
            res.status(200).send(responseData);
        }
    } catch (error) {
        console.error("Error in generateInvoiceGetRateController:", error);

        const responseData = {
            success: false,
            data: {
                errorMessage: "An unexpected error occurred.",
            },
        };

        res.status(500).send(responseData);
    }
};

export {generateInvoiceGetRateController};