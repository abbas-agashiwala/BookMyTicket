import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../models/index.js";
import { auth } from "../middleware/auth.js";
const router = Router();
router.post("/signup", async (req, res, next) => {
  try {
    const { name, email, password, phone = "" } = req.body;
    if (
  !name?.trim() ||
  !/^\S+@\S+\.\S+$/.test(email || "") ||
  !/^[0-9]{10}$/.test(phone || "") ||
  typeof password !== "string" ||
  password.length < 8
) {
  return res.status(400).json({
    message:
      "Enter your name, a valid email, a 10-digit mobile number, and a password of at least 8 characters.",
  });
}
    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists)
      return res
        .status(409)
        .json({ message: "An account with this email already exists" });
    const user = await User.create({
      name,
      email,
      phone,
      passwordHash: await bcrypt.hash(password, 12),
    });
    const token = jwt.sign({ sub: user.id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });
    res
      .status(201)
      .json({
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
  } catch (e) {
    next(e);
  }
});
router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({
      email: String(email || "").toLowerCase(),
    }).select("+passwordHash");
    if (!user || !(await bcrypt.compare(password || "", user.passwordHash)))
      return res
        .status(401)
        .json({ message: "Email or password is incorrect" });
    if (user.accountStatus !== "active")
      return res.status(403).json({ message: "Account is disabled" });
    const token = jwt.sign({ sub: user.id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });
    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (e) {
    next(e);
  }
});
router.post("/logout", (_req, res) =>
  res.json({ message: "Logged out. Remove the bearer token on the client." }),
);
router.get("/me", auth, (req, res) =>
  res.json({
    user: {
      id: req.user.id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      phone: req.user.phone,
    },
  }),
);

// Get all registered customers for the admin panel

 // Get all registered customers for the admin panel
router.get("/admin/users", auth, async (req, res, next) => {
  try {
    // Only admins can access this endpoint
    if (req.user.role !== "admin") {
      return res.status(403).json({
        message: "Access denied. Admins only.",
      });
    }

    const users = await User.find({ role: "user" })
      .select("name email phone accountStatus createdAt")
      .sort({ createdAt: -1 })
      .lean();

    return res.json({ users });
  } catch (error) {
    next(error);
  }
});

export default router;
