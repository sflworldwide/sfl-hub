// import { User } from '../models/User.js';
import {
  getUserDetailsById,
  getUserDetailsBySearch,
  getProfileDetailsByPersonid,
  UpdateProfile,
  UpdateUserProfile,
} from "../services/userManagementServices.js";

const getUserList = async (req, res) => {
  try {
    const { userDetails } = req.body;
    if (!userDetails)
      return res.status(400).json({ error: "Userdetails is required" });

    const result = await getUserDetailsBySearch(userDetails);
    console.log("getUserList: Result from service:", result);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getUserDataById = async (req, res) => {
  try {
    const { userId } = req.body;

    const result = await getUserDetailsById(userId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
const getpersonDetailsProfile = async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: "UserId is required" });

    const result = await getProfileDetailsByPersonid(userId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
const updateProfileDetails = async (req, res) => {
  try {
    const result = await UpdateProfile(req.body, req.body.personId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
const updateUserProfileDetails = async (req, res) => {
  try {
    const result = await UpdateUserProfile(req.body, req.body.personid);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
export {
  getUserList,
  getUserDataById,
  getpersonDetailsProfile,
  updateProfileDetails,
  updateUserProfileDetails,
};
