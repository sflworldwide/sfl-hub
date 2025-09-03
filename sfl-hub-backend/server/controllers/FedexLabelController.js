import { fedexLabel } from '../services/FedexLabelService.js';

const fedexLabelController = async (req, res) => {
    try {
        const inpdata = req.body;
        const data = await fedexLabel(inpdata);
        if (data && data.success) { //
            return res.status(200).json(data); 
        } else {
            return res.status(500).json({ 
                success: false, 
                error: 'Label Generation Failed', 
                message: data ? (data.message || 'An unexpected error occurred indicating failure.') : 'No data returned and no error thrown.', //
                details: data || null 
            });
        }

    } catch (err) {
        console.error("Error in fedexLabelController catch block:", err); 

        if (err && typeof err === 'object' && err.success === false && err.message) { 
            return res.status(500).json({ 
                success: false, //
                message: err.message, 
                details: err.error || err.fedexResponse || "No further details available." 
            });
        } else {
            return res.status(500).json({ 
                success: false, 
                error: "Internal Server Error", 
                message: "An unexpected error occurred during label generation.", 
                details: err.message || err.toString() 
            });
        }
    }
};

export { fedexLabelController };