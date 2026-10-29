import jwt from "jsonwebtoken";
import { User } from "../models/index.js";
export async function auth(req, res, next) {
  try {
    const h = req.headers.authorization || "";
    const token = h.startsWith("Bearer ") ? h.slice(7) : null;
    if (!token)
      return res.status(401).json({ message: "Authentication required" });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.sub);
    if (!user || user.accountStatus !== "active")
      return res.status(401).json({ message: "Session is invalid" });
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}
export function adminOnly(req, res, next) {
  if (req.user?.role !== "admin")
    return res.status(403).json({ message: "Administrator access required" });
  next();
}
