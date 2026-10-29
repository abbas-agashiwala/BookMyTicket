
import "dotenv/config";
import mongoose from "mongoose";
import { connectDB } from "./config/db.js";
import {
  City,
  Theatre,
  Screen,
  Seat,
  Movie,
  Show,
  ShowSeat,
} from "./models/index.js";

async function seedDatabase() {
  await connectDB();

  // 1. Create or reuse Pune
  await City.updateOne(
    { slug: "pune" },
    {
      $set: {
        name: "Pune",
        state: "Maharashtra",
        country: "India",
        isActive: true,
      },
      $setOnInsert: { slug: "pune" },
    },
    { upsert: true }
  );

  const city = await City.findOne({ slug: "pune" });

  // 2. Create or reuse movies
  const movieData = [
    {
      title: "Dune: Part Two",
      slug: "dune-part-two",
      poster:
        "https://image.tmdb.org/t/p/w500/1pdfLVkbY9hJICj0H2CZjjYWJ.jpg",
      description: "Paul Atreides unites with Chani and the Fremen.",
      genre: ["Sci-Fi", "Adventure"],
      language: ["English"],
      duration: 166,
      certification: "UA 13+",
      status: "now-showing",
      isFeatured: true,
      isTrending: true,
      rating: 8.8,
    },
    {
      title: "The Batman",
      slug: "the-batman",
      poster:
        "https://image.tmdb.org/t/p/w500/74xTEgt7R36Fpoo50r9T25onhq.jpg",
      genre: ["Action", "Crime"],
      language: ["English"],
      duration: 176,
      status: "now-showing",
      isTrending: true,
      rating: 7.8,
    },
    {
      title: "Oppenheimer",
      slug: "oppenheimer",
      poster:
        "https://image.tmdb.org/t/p/w500/ptprK6AcqFKQJeJTt8t5dglvd.jpg",
      genre: ["Drama", "History"],
      language: ["English"],
      duration: 180,
      status: "now-showing",
      rating: 8.3,
    },
  ];

  const movies = [];

  for (const data of movieData) {
    await Movie.updateOne(
      { slug: data.slug },
      {
        $set: data,
      },
      { upsert: true }
    );

    movies.push(await Movie.findOne({ slug: data.slug }));
  }

  // 3. Create or reuse a theatre
  await Theatre.updateOne(
    { cityId: city._id, name: "PVR Phoenix Marketcity" },
    {
      $set: {
        address: "Phoenix Marketcity, Viman Nagar, Pune",
        amenities: ["Parking", "Food Court", "Dolby Audio"],
        isActive: true,
      },
      $setOnInsert: {
        cityId: city._id,
        name: "PVR Phoenix Marketcity",
      },
    },
    { upsert: true }
  );

  const theatre = await Theatre.findOne({
    cityId: city._id,
    name: "PVR Phoenix Marketcity",
  });

  // 4. Create or reuse a screen
  await Screen.updateOne(
    { theatreId: theatre._id, name: "Screen 1" },
    {
      $set: {
        screenType: "Standard",
        supportedFormats: ["2D", "IMAX"],
        capacity: 70,
        isActive: true,
      },
      $setOnInsert: {
        theatreId: theatre._id,
        name: "Screen 1",
      },
    },
    { upsert: true }
  );

  const screen = await Screen.findOne({
    theatreId: theatre._id,
    name: "Screen 1",
  });

  // 5. Create 70 seats: rows A-G, seats 1-10
  const seatDocuments = [];

  for (const row of ["A", "B", "C", "D", "E", "F", "G"]) {
    for (let number = 1; number <= 10; number++) {
      const category =
        ["A", "B", "C", "D"].includes(row)
          ? "standard"
          : ["E", "F"].includes(row)
            ? "premium"
            : "recliner";

      await Seat.updateOne(
        {
          screenId: screen._id,
          rowLabel: row,
          seatNumber: number,
        },
        {
          $set: { category, isActive: true },
          $setOnInsert: {
            screenId: screen._id,
            rowLabel: row,
            seatNumber: number,
          },
        },
        { upsert: true }
      );

      seatDocuments.push(
        await Seat.findOne({
          screenId: screen._id,
          rowLabel: row,
          seatNumber: number,
        })
      );
    }
  }

  // 6. Create one real show for each movie on a separate day
  const now = new Date();
  const shows = [];

  for (let i = 0; i < movies.length; i++) {
    const startTime = new Date(now);
    startTime.setDate(startTime.getDate() + i + 1);
    startTime.setHours(19, 30, 0, 0);

    const endTime = new Date(
      startTime.getTime() + movies[i].duration * 60 * 1000
    );

    await Show.updateOne(
      {
        movieId: movies[i]._id,
        theatreId: theatre._id,
        screenId: screen._id,
        startTime,
      },
      {
        $set: {
          endTime,
          format: "2D",
          language: "English",
          bookingStatus: "published",
          pricing: {
            standard: 220,
            premium: 280,
            recliner: 420,
          },
        },
        $setOnInsert: {
          movieId: movies[i]._id,
          theatreId: theatre._id,
          screenId: screen._id,
          startTime,
        },
      },
      { upsert: true }
    );

    const show = await Show.findOne({
      movieId: movies[i]._id,
      theatreId: theatre._id,
      screenId: screen._id,
      startTime,
    });

    shows.push(show);

    // 7. Create seat inventory for this show.
    // Existing inventory is preserved, including booked seats.
    for (const seat of seatDocuments) {
      const seatLabel = `${seat.rowLabel}${seat.seatNumber}`;

      await ShowSeat.updateOne(
        { showId: show._id, seatId: seat._id },
        {
          $setOnInsert: {
            showId: show._id,
            seatId: seat._id,
            seatLabel,
            category: seat.category,
            status: "available",
            priceAtReservation:
              show.pricing[seat.category] ?? show.pricing.standard,
          },
        },
        { upsert: true }
      );
    }
  }

  console.log("\nSeed completed successfully!");
  console.log("City:", city.name);
  console.log("Theatre:", theatre.name);
  console.log("Screen:", screen.name);
  console.log("Seats:", seatDocuments.length);
  console.log("Shows:", shows.length);

  for (const show of shows) {
    console.log(
      `${show._id} | ${movies.find((m) => m._id.equals(show.movieId)).title} | ${show.startTime.toLocaleString()}`
    );
  }

  await mongoose.disconnect();
}

seedDatabase().catch(async (error) => {
  console.error("Seed failed:", error);
  await mongoose.disconnect();
  process.exitCode = 1;
});
