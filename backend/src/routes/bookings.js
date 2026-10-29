import { Router } from "express";
import mongoose from "mongoose";
import { auth, adminOnly } from "../middleware/auth.js";
import {
  Booking,
  Show,
  Seat,
  ShowSeat,
  Theatre,
  Movie,
  Screen,
  Notification,
} from "../models/index.js";
const router = Router();
const HOLD_SECONDS = Number(process.env.HOLD_SECONDS || 120);
// Atomic per-seat conditional writes. Multi-seat holds are all-or-nothing: on any conflict, release only this booking's claims.
router.post("/hold-seats", auth, async (req, res, next) => {
  const session = await mongoose.startSession();
  let createdBooking;
  try {
    const { showId, seatIds } = req.body;
    if (
      !showId ||
      !Array.isArray(seatIds) ||
      seatIds.length < 1 ||
      seatIds.length > 10 ||
      new Set(seatIds.map(String)).size !== seatIds.length
    )
      return res
        .status(400)
        .json({ message: "Choose between 1 and 10 unique seats" });
    const show = await Show.findOne({
      _id: showId,
      bookingStatus: "published",
      startTime: { $gt: new Date() },
    }).populate("movieId theatreId screenId");
    if (!show)
      return res.status(404).json({ message: "Show is not available" });
    const seats = await Seat.find({
      _id: { $in: seatIds },
      screenId: show.screenId._id,
      isActive: true,
    });
    if (seats.length !== seatIds.length)
      return res.status(400).json({ message: "One or more seats are invalid" });
    const now = new Date(),
      expiresAt = new Date(now.getTime() + HOLD_SECONDS * 1000);
    const subtotal = seats.reduce(
      (sum, s) => sum + (show.pricing[s.category] ?? show.pricing.standard),
      0,
    );
    const fee = 35,
      tax = Math.round((subtotal + fee) * 0.18);
    createdBooking = await Booking.create({
      bookingReference:
        "FKT-" + Math.random().toString(36).slice(2, 8).toUpperCase(),
      userId: req.user._id,
      showId,
      seatIds: seats.map((s) => s._id),
      seatLabels: seats.map((s) => `${s.rowLabel}${s.seatNumber}`),
      status: "held",
      paymentStatus: "unpaid",
      subtotal,
      convenienceFee: fee,
      taxAmount: tax,
      totalAmount: subtotal + fee + tax,
      reservationExpiresAt: expiresAt,
    }); // Ensure one inventory document exists per show-seat before attempting the atomic claim.
    await ShowSeat.bulkWrite(
      seats.map((seat) => ({
        updateOne: {
          filter: { showId, seatId: seat._id },
          update: {
            $setOnInsert: {
              showId,
              seatId: seat._id,
              seatLabel: `${seat.rowLabel}${seat.seatNumber}`,
              category: seat.category,
              status: "available",
            },
          },
          upsert: true,
        },
      })),
      { ordered: false },
    ).catch((err) => {
      if (err.code !== 11000) throw err;
    });
    const claimed = [];
    for (const seat of seats) {
      const label = `${seat.rowLabel}${seat.seatNumber}`;
      const row = await ShowSeat.findOneAndUpdate(
        {
          showId,
          seatId: seat._id,
          $or: [
            { status: "available" },
            { status: "held", expiresAt: { $lte: now } },
          ],
        },
        {
          $set: {
            status: "held",
            bookingId: createdBooking._id,
            lockedBy: req.user._id,
            lockedAt: now,
            expiresAt,
            seatLabel: label,
            category: seat.category,
            priceAtReservation:
              show.pricing[seat.category] ?? show.pricing.standard,
          },
        },
        { upsert: false, new: true },
      );
      if (!row) {
        await ShowSeat.updateMany(
          { bookingId: createdBooking._id, status: "held" },
          {
            $set: {
              status: "available",
              bookingId: null,
              lockedBy: null,
              lockedAt: null,
              expiresAt: null,
            },
          },
        );
        await Booking.findByIdAndUpdate(createdBooking._id, {
          status: "cancelled",
        });
        return res
          .status(409)
          .json({
            message: `Seat ${label} is no longer available. Please select again.`,
          });
      }
      claimed.push(row._id);
    }
    res
      .status(201)
      .json({ booking: createdBooking, holdSeconds: HOLD_SECONDS });
  } catch (e) {
    if (createdBooking) {
      await ShowSeat.updateMany(
        { bookingId: createdBooking._id, status: "held" },
        {
          $set: {
            status: "available",
            bookingId: null,
            lockedBy: null,
            lockedAt: null,
            expiresAt: null,
          },
        },
      ).catch(() => {});
      await Booking.findByIdAndUpdate(createdBooking._id, {
        status: "cancelled",
      }).catch(() => {});
    }
    next(e);
  } finally {
    await session.endSession().catch(() => {});
  }
});
router.get("/:bookingId", auth, async (req, res, next) => {
  try {
    const b = await Booking.findOne({
      _id: req.params.bookingId,
      userId: req.user._id,
    }).populate({
      path: "showId",
      populate: [
        { path: "movieId" },
        { path: "theatreId" },
        { path: "screenId" },
      ],
    });
    if (!b) return res.status(404).json({ message: "Booking not found" });
    res.json(b);
  } catch (e) {
    next(e);
  }
});
router.post("/:bookingId/release", auth, async (req, res, next) => {
  try {
    const b = await Booking.findOne({
      _id: req.params.bookingId,
      userId: req.user._id,
      status: "held",
    });
    if (!b)
      return res.status(404).json({ message: "Active booking hold not found" });
    await ShowSeat.updateMany(
      { bookingId: b._id, lockedBy: req.user._id, status: "held" },
      {
        $set: {
          status: "available",
          bookingId: null,
          lockedBy: null,
          lockedAt: null,
          expiresAt: null,
        },
      },
    );
    b.status = "cancelled";
    await b.save();
    res.json({ message: "Reservation released" });
  } catch (e) {
    next(e);
  }
});


router.post("/:bookingId/confirm-demo", auth, async (req, res, next) => {
  try {
    const booking = await Booking.findOne({
      _id: req.params.bookingId,
      userId: req.user._id,
    });

    if (!booking) {
      return res.status(404).json({
        message: "Booking not found.",
      });
    }

    // Avoid duplicate confirmations and notifications.
    if (booking.status === "confirmed") {
      return res.json({
        booking,
        message: "Booking is already confirmed.",
      });
    }

    if (
      booking.status !== "held" ||
      !booking.reservationExpiresAt ||
      booking.reservationExpiresAt <= new Date()
    ) {
      return res.status(409).json({
        message: "Your seat hold has expired. Please select seats again.",
      });
    }

    // This is a demo confirmation, not a real payment.
    const result = await ShowSeat.updateMany(
      {
        bookingId: booking._id,
        status: "held",
      },
      {
        $set: {
          status: "booked",
          expiresAt: null,
          lockedBy: null,
          lockedAt: null,
        },
      }
    );

    if (result.matchedCount !== booking.seatIds.length) {
      return res.status(409).json({
        message: "Some seats are no longer available. Please contact support.",
      });
    }

    booking.status = "confirmed";
    booking.paymentStatus = "pending";
    await booking.save();

    await Notification.create({
      userId: booking.userId,
      bookingId: booking._id,
      title: "Demo booking confirmed!",
      message: `Booking ${booking.bookingReference} is saved. No payment was taken.`,
      type: "booking",
    });

    res.json({
      booking,
      message: "Demo booking saved successfully. No payment was taken.",
    });
  } catch (error) {
    next(error);
  }
});

router.get("/me/bookings/list", auth, async (req, res, next) => {
  try {
    res.json(
      await Booking.find({ userId: req.user._id })
        .sort({ createdAt: -1 })
        .lean(),
    );
  } catch (e) {
    next(e);
  }
});


router.post("/:bookingId/confirm", auth, async (req, res, next) => {
  try {
    const booking = await Booking.findOne({
      _id: req.params.bookingId,
      userId: req.user._id,
    }).populate({
      path: "showId",
      populate: [
        { path: "movieId" },
        { path: "theatreId" },
        { path: "screenId" },
      ],
    });

    if (!booking) {
      return res.status(404).json({
        message: "Booking not found.",
      });
    }

    if (booking.status === "confirmed") {
      return res.json({
        message: "Booking is already confirmed.",
        booking,
      });
    }

    // This demo route does not verify a real payment.
    // Confirm only if the booking is eligible for demo checkout.
    if (
      booking.status !== "held" ||
      booking.paymentStatus !== "unpaid" ||
      !booking.reservationExpiresAt ||
      booking.reservationExpiresAt <= new Date()
    ) {
      return res.status(409).json({
        message: "Booking expired or is not eligible for confirmation.",
      });
    }

    
    // Confirm the seat inventory before confirming the booking.
    const inventoryResult = await ShowSeat.updateMany(
      {
        bookingId: booking._id,
        showId: booking.showId._id,
        status: "held",
        lockedBy: req.user._id,
        expiresAt: { $gt: new Date() },
      },
      {
        $set: {
          status: "booked",
          expiresAt: null,
          lockedBy: null,
          lockedAt: null,
        },
      },
    );

    if (inventoryResult.modifiedCount !== booking.seatIds.length) {
      return res.status(409).json({
        message:
          "Some seats are no longer available or your reservation has expired. Please select seats again.",
      });
    }

    booking.status = "confirmed";
    booking.paymentStatus = "paid";
    await booking.save();

    const show = booking.showId;
    const movie = show?.movieId;
    const theatre = show?.theatreId;

    const movieTitle = movie?.title || "Movie";
    const theatreName = theatre?.name || "Theatre";

    const notification = await Notification.create({
  userId: booking.userId,
  title: "Booking confirmed!",
  message:
    `Booking ${booking.bookingReference} confirmed. ` +
    `Movie: ${movieTitle}. ` +
    `Theatre: ${theatreName}. ` +
    `Seats: ${booking.seatLabels.join(", ")}. ` +
    `Total: ₹${booking.totalAmount}.`,
  type: "booking",
});

    res.json({
      message: "Booking confirmed and notification created.",
      booking,
      notification,
    });
  } catch (error) {
    next(error);
  }
});


// Get all bookings for the admin panel
router.get("/admin/list", auth, adminOnly, async (req, res, next) => {
  try {
    const bookings = await Booking.find()
      .populate("userId", "name email phone")
      .populate({
        path: "showId",
        populate: [
          { path: "movieId", select: "title poster" },
          { path: "theatreId", select: "name address" },
          { path: "screenId", select: "name" },
        ],
      })
      .sort({ createdAt: -1 })
      .lean();

    res.json({ bookings });
  } catch (error) {
    next(error);
  }
});

export default router;
