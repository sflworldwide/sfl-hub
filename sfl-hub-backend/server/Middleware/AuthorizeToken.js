import jwt from "jsonwebtoken";
import { getSecrets } from "../services/userService.js";

export const authenticateUser = async (req, res, next) => {
  console.log("Middleware: authenticateUser called");
  try {
    const token = req.cookies?.LKA;
    if (!token) {
      return res.status(401).json({ error: "Authentication failed" });
    }

    const secrets = await getSecrets();
    if (!secrets?.JWT_SECRET) {
      return res.status(500).json({ error: "Server error" });
    }

    const decoded = jwt.verify(token, secrets.JWT_SECRET);

    req.user = decoded.users;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Unauthorized" });
  }
};
