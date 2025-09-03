import { fedexETD} from '../services/FedexETDService.js';
// import { fedexETD, insertFedexETDData, getEtdDetails, updateEtdDetails} from '../services/FedexETDService.js'; 


const fedexETDController = async (req, res) => {
    try {
        const inpdata = req.body;
        const data = await fedexETD(inpdata);
        if (data) {
            res.json({
                data
            });
        } else {
            res.status(500).json({
                error: 'Failed to generate ETD'
            });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({
            error: 'Internal Server Error'
        });
    }
};

// const insertFedexETDDataController = async (req, res) => {
//     try {
//         const inpdata = req.body;
//         const data = await insertFedexETDData(inpdata);
//         if (data) {
//             res.json({
//                 data
//             });
//         } else {
//             res.status(500).json({
//                 error: 'Failed to insert ETD data'
//             });
//         }
//     } catch (err) {
//         console.error(err);
//         res.status(500).json({
//             error: 'Internal Server Error'
//         });
//     }
// };

// const getEtdDetailsController = async (req, res) => {
//     try {
//         const inpdata = req.body;
//         const data = await getEtdDetails(inpdata);
//         if (data) {
//             res.json({
//                 data
//             });
//         } else {
//             res.status(404).json({
//                 message: 'ETD details not found'
//             });
//         }
//     } catch (err) {
//         console.error(err);
//         res.status(500).json({
//             error: 'Internal Server Error'
//         });
//     }
// };

// const updateEtdDetailsController = async (req, res) => {
//     try {
//         const inpdata = req.body;
//         const data = await updateEtdDetails(inpdata);
//         if (data) {
//             res.json({
//                 data
//             });
//         } else {
//             res.status(500).json({
//                 error: 'Failed to update ETD details'
//             });
//         }
//     } catch (err) {
//         console.error(err);
//         res.status(500).json({
//             error: 'Internal Server Error'
//         });
//     }
// };

export {fedexETDController }
// export {fedexETDController, insertFedexETDDataController, getEtdDetailsController, updateEtdDetailsController }