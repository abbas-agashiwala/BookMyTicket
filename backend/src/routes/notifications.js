
import { Router } from "express";
import { Notification } from "../models/index.js";
import { auth } from "../middleware/auth.js";

const router = Router();

// Fetch notifications belonging only to the logged-in user.
router.get("/", auth, async (req, res, next) => {
  try {
    const notifications = await Notification.find({
      userId: req.user._id,
    })
      .sort({ createdAt: -1 })
      .lean();

    res.json({ notifications });
  } catch (error) {
    next(error);
  }
});

export default router;
