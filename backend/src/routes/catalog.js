import { Router } from "express";
import mongoose from "mongoose";
import {
  City,
  Movie,
  Show,
  Theatre,
  Screen,
  Seat,
  ShowSeat,
} from "../models/index.js";
import { auth, adminOnly } from "../middleware/auth.js";

const router = Router();
router.get("/cities", async (req, res, next) => {
  try {
    res.json(await City.find({ isActive: true }).sort({ name: 1 }).lean());
  } catch (e) {
    next(e);
  }
});

router.post("/admin/cities", auth, adminOnly, async (req, res, next) => {
  try {
    const name = String(req.body.name || "").trim();

    if (!name) {
      return res.status(400).json({
        message: "City name is required",
      });
    }

    // Automatically generate a URL-friendly slug.
    const slug = name
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    if (!slug) {
      return res.status(400).json({
        message: "Please enter a valid city name",
      });
    }

    const existingCity = await City.findOne({
      $or: [
        { slug },
        {
          name: {
            $regex: `^${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
            $options: "i",
          },
        },
      ],
    });

    if (existingCity) {
      return res.status(409).json({
        message: "This city already exists",
      });
    }

    const city = await City.create({
      name,
      slug,
      isActive: true,
    });

    res.status(201).json(city);
  } catch (error) {
    next(error);
  }
});

router.delete("/admin/cities/:id", auth, adminOnly, async (req, res, next) => {
  try {
    const city = await City.findById(req.params.id);

    if (!city) {
      return res.status(404).json({ message: "City not found" });
    }

    city.isActive = false;
    await city.save();

    res.json({ message: "City removed successfully" });
  } catch (error) {
    next(error);
  }
});

router.get("/movies", async (req, res, next) => {
  try {
    const q = {};
    if (req.query.status) q.status = req.query.status;
    if (req.query.search)
      q.title = {
        $regex: String(req.query.search).slice(0, 80),
        $options: "i",
      };
    res.json(
      await Movie.find(q)
        .sort({ isFeatured: -1, isTrending: -1, title: 1 })
        .lean(),
    );
  } catch (e) {
    next(e);
  }
});
router.get("/movies/:id", async (req, res, next) => {
  try {
    const m = await Movie.findById(req.params.id);
    if (!m) return res.status(404).json({ message: "Movie not found" });
    res.json(m);
  } catch (e) {
    next(e);
  }
});
router.get("/shows", async (req, res, next) => {
  try {
    const q = { bookingStatus: "published", startTime: { $gte: new Date() } };
    if (req.query.movieId) q.movieId = req.query.movieId;
    if (req.query.theatreId) q.theatreId = req.query.theatreId;
    const shows = await Show.find(q)
      .populate("movieId theatreId screenId")
      .sort({ startTime: 1 })
      .lean();
    res.json(shows);
  } catch (e) {
    next(e);
  }
});

router.get("/shows/:showId/seats", async (req, res, next) => {
  try {
    const { showId } = req.params;

    if (!mongoose.isValidObjectId(showId)) {
      return res.status(400).json({ message: "Invalid show ID." });
    }

    const show = await Show.findById(showId);

    if (!show) {
      return res.status(404).json({ message: "Show not found." });
    }

    // Get all active seats for this show's screen.
    const seats = await Seat.find({
      screenId: show.screenId,
      isActive: true,
    }).lean();

    // Create inventory only for seats that don't have a record yet.
    // Existing booked/held records will not be overwritten.
    if (seats.length > 0) {
      await ShowSeat.bulkWrite(
        seats.map((seat) => ({
          updateOne: {
            filter: {
              showId: show._id,
              seatId: seat._id,
            },
            update: {
              $setOnInsert: {
                showId: show._id,
                seatId: seat._id,
                seatLabel: `${seat.rowLabel}${seat.seatNumber}`,
                category: seat.category,
                status: "available",
              },
            },
            upsert: true,
          },
        })),
      );
    }

    // Read the latest inventory after initializing missing records.
    const inventory = await ShowSeat.find({
      showId: show._id,
    }).lean();

    const inventoryBySeat = new Map(
      inventory.map((item) => [String(item.seatId), item]),
    );

    const result = seats.map((seat) => {
      const item = inventoryBySeat.get(String(seat._id));

      let availability = "available";

      if (item?.status === "booked") {
        availability = "booked";
      } else if (item?.status === "blocked") {
        availability = "blocked";
      } else if (
        item?.status === "held" &&
        item.expiresAt &&
        new Date(item.expiresAt).getTime() > Date.now()
      ) {
        availability = "locked";
      }

      return {
        ...seat,
        availability,
      };
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.get("/admin/movies", auth, adminOnly, async (_req, res, next) => {
  try {
    res.json(await Movie.find().sort({ createdAt: -1 }).lean());
  } catch (e) {
    next(e);
  }
});
router.post("/admin/movies", auth, adminOnly, async (req, res, next) => {
  try {
    const movie = await Movie.create(req.body);
    res.status(201).json(movie);
  } catch (e) {
    next(e);
  }
});
router.put("/admin/movies/:id", auth, adminOnly, async (req, res, next) => {
  try {
    const movie = await Movie.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!movie) return res.status(404).json({ message: "Movie not found" });
    res.json(movie);
  } catch (e) {
    next(e);
  }
});
router.delete("/admin/movies/:id", auth, adminOnly, async (req, res, next) => {
  try {
    const show = await Show.findOne({
      movieId: req.params.id,
      startTime: { $gte: new Date() },
    });
    if (show)
      return res
        .status(409)
        .json({ message: "Cannot delete a movie with upcoming shows" });
    await Movie.findByIdAndDelete(req.params.id);
    res.json({ message: "Movie deleted" });
  } catch (e) {
    next(e);
  }
});

/* =========================
   ADMIN THEATRE ROUTES
========================= */

// Get all theatres
router.get("/admin/theatres", auth, adminOnly, async (req, res, next) => {
  try {
    const theatres = await Theatre.find({ isActive: true })
      .populate("cityId", "name")
      .sort({ createdAt: -1 })
      .lean();

    res.json(theatres);
  } catch (error) {
    next(error);
  }
});

router.post("/admin/theatres", auth, adminOnly, async (req, res, next) => {
  try {
    const { name, cityId, address, screens: screenCount, capacity } = req.body;

    const theatreName = String(name || "").trim();
    const numberOfScreens = Number(screenCount);
    const seatsPerScreen = Number(capacity);

    if (!theatreName || !cityId) {
      return res.status(400).json({
        message: "Theatre name and city are required.",
      });
    }

    if (
      !Number.isInteger(numberOfScreens) ||
      numberOfScreens < 1 ||
      numberOfScreens > 50
    ) {
      return res.status(400).json({
        message: "Enter between 1 and 50 screens.",
      });
    }

    if (
      !Number.isInteger(seatsPerScreen) ||
      seatsPerScreen < 1 ||
      seatsPerScreen > 1000
    ) {
      return res.status(400).json({
        message: "Seat capacity must be between 1 and 1000 per screen.",
      });
    }

    const city = await City.findOne({
      _id: cityId,
      isActive: true,
    });

    if (!city) {
      return res.status(400).json({
        message: "Please select a valid active city.",
      });
    }

    const theatre = await Theatre.create({
  name: theatreName,
  cityId: city._id,
  address: String(address || "").trim(),
  screens: numberOfScreens,
  capacity: seatsPerScreen * numberOfScreens,
  isActive: true,
});

    try {
      const screenRecords = Array.from(
  { length: numberOfScreens },
  (_, index) => ({
    name: `Screen ${index + 1}`,
    theatreId: theatre._id,
    capacity: seatsPerScreen,
    screenType: "Standard",
    isActive: true,
  }),
);

const createdScreens = await Screen.insertMany(screenRecords);

      // Generate seats for every screen.
      const seatRecords = [];

      for (const screen of createdScreens) {
        const seatsPerRow = 10;

        for (let seatIndex = 0; seatIndex < screen.capacity; seatIndex++) {
          const rowIndex = Math.floor(seatIndex / seatsPerRow);
          const seatNumber = (seatIndex % seatsPerRow) + 1;

          seatRecords.push({
            screenId: screen._id,
            rowLabel: String.fromCharCode(65 + rowIndex),
            seatNumber,
            category:
              rowIndex >= 8
                ? "recliner"
                : rowIndex >= 5
                  ? "premium"
                  : "standard",
            isActive: true,
          });
        }
      }

      await Seat.insertMany(seatRecords);
    } catch (error) {
      await Theatre.findByIdAndDelete(theatre._id);
      throw error;
    }

    const savedTheatre = await Theatre.findById(theatre._id)
      .populate("cityId", "name")
      .lean();

    res.status(201).json({
      ...savedTheatre,
      screens: numberOfScreens,
      capacity: seatsPerScreen * numberOfScreens,
    });
  } catch (error) {
    next(error);
  }
});

// Delete (deactivate) a theatre
router.delete(
  "/admin/theatres/:id",
  auth,
  adminOnly,
  async (req, res, next) => {
    try {
      if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(400).json({
          message: "Invalid theatre ID.",
        });
      }

      const theatre = await Theatre.findByIdAndUpdate(
        req.params.id,
        { isActive: false },
        { new: true },
      );

      if (!theatre) {
        return res.status(404).json({
          message: "Theatre not found.",
        });
      }

      res.json({ message: "Theatre removed successfully." });
    } catch (error) {
      next(error);
    }
  },
);

router.get("/admin/shows", auth, adminOnly, async (req, res, next) => {
  try {
    const shows = await Show.find()
      .populate("movieId", "title")
      .populate("theatreId", "name")
      .populate("screenId", "name capacity")
      .sort({ startTime: 1 })
      .lean();

    res.json(shows);
  } catch (error) {
    next(error);
  }
});

router.post("/admin/shows", auth, adminOnly, async (req, res, next) => {
  try {
    const {
      movieId,
      theatreId,
      screenId,
      startTime,
      endTime,
      format,
      language,
      pricing,
    } = req.body;

    if (!movieId || !theatreId || !screenId || !startTime || !endTime) {
      return res.status(400).json({
        message:
          "Movie, theatre, screen, start time and end time are required.",
      });
    }

    if (new Date(endTime) <= new Date(startTime)) {
      return res.status(400).json({
        message: "End time must be after start time.",
      });
    }

    const [movie, theatre, screen] = await Promise.all([
      Movie.findById(movieId),
      Theatre.findById(theatreId),
      Screen.findById(screenId),
    ]);

    if (!movie) {
      return res.status(404).json({ message: "Movie not found." });
    }

    if (!theatre) {
      return res.status(404).json({ message: "Theatre not found." });
    }

    if (!screen || String(screen.theatreId) !== String(theatre._id)) {
      return res.status(400).json({
        message: "Select a valid screen belonging to this theatre.",
      });
    }

    const show = await Show.create({
      movieId,
      theatreId,
      screenId,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      format: format || "2D",
      language: language || "English",
      pricing,
      bookingStatus: "published",
    });

    const populatedShow = await Show.findById(show._id)
      .populate("movieId", "title")
      .populate("theatreId", "name")
      .populate("screenId", "name capacity")
      .lean();

    res.status(201).json(populatedShow);
  } catch (error) {
    next(error);
  }
});

router.delete("/admin/shows/:id", auth, adminOnly, async (req, res, next) => {
  try {
    const show = await Show.findById(req.params.id);

    if (!show) {
      return res.status(404).json({ message: "Show not found." });
    }

    await Show.findByIdAndDelete(req.params.id);

    res.json({ message: "Show deleted successfully." });
  } catch (error) {
    next(error);
  }
});

// Your existing city and movie routes...

// Step 1: Admin shows routes
// (the GET /admin/shows, POST /admin/shows,
// and DELETE /admin/shows/:id code)

// Step 2: Admin theatres route
router.get("/admin/theatres", auth, adminOnly, async (req, res, next) => {
  try {
    const theatres = await Theatre.find({ isActive: true })
      .populate("cityId", "name")
      .sort({ name: 1 })
      .lean();

    res.json(theatres);
  } catch (error) {
    next(error);
  }
});

// Step 2: Admin screens route
router.get("/admin/screens", auth, adminOnly, async (req, res, next) => {
  try {
    const screens = await Screen.find({ isActive: true })
      .populate("theatreId", "name")
      .sort({ name: 1 })
      .lean();

    res.json(screens);
  } catch (error) {
    next(error);
  }
});


router.post(
  "/admin/screens/:screenId/generate-seats",
  auth,
  adminOnly,
  async (req, res, next) => {
    try {
      const screen = await Screen.findById(req.params.screenId);

      if (!screen) {
        return res.status(404).json({ message: "Screen not found." });
      }

      const existingCount = await Seat.countDocuments({
        screenId: screen._id,
      });

      if (existingCount > 0) {
        return res.status(409).json({
          message: `This screen already has ${existingCount} seats. No seats were added.`,
        });
      }

      const capacity = Number(screen.capacity);

      if (!Number.isInteger(capacity) || capacity < 1) {
        return res.status(400).json({
          message: "This screen has an invalid seat capacity.",
        });
      }

      const seatsPerRow = 10;
      const seats = [];

      for (let i = 0; i < capacity; i++) {
        const rowIndex = Math.floor(i / seatsPerRow);

        seats.push({
          screenId: screen._id,
          rowLabel: String.fromCharCode(65 + rowIndex),
          seatNumber: (i % seatsPerRow) + 1,
          category:
            rowIndex >= 8
              ? "recliner"
              : rowIndex >= 5
                ? "premium"
                : "standard",
          isActive: true,
        });
      }

      await Seat.insertMany(seats);

      res.status(201).json({
        message: "Seats generated successfully.",
        screenId: screen._id,
        seatsCreated: seats.length,
      });
    } catch (error) {
      next(error);
    }
  },
);


export default router;
