
import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import { User } from "./src/models/index.js";

async function seedAdmin() {
  const mongoUri =
    process.env.MONGO_URI ||
    process.env.MONGODB_URI ||
    process.env.MONGODB_URL;

  const name = process.env.ADMIN_NAME;
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  const phone = process.env.ADMIN_PHONE || "9999999999";

  if (!mongoUri || !email || !password || !name) {
    throw new Error(
      "Missing MongoDB URI or admin credentials in backend/.env"
    );
  }

  await mongoose.connect(mongoUri);

  const passwordHash = await bcrypt.hash(password, 12);

  await User.findOneAndUpdate(
    { email },
    {
      $set: {
        name,
        email,
        phone,
        passwordHash,
        role: "admin",
        accountStatus: "active",
      },
    },
    {
      upsert: true,
      new: true,
      runValidators: true,
      setDefaultsOnInsert: true,
    }
  );

  console.log("Admin account created or updated successfully.");
  console.log(`Admin email: ${email}`);

  await mongoose.disconnect();
}

seedAdmin().catch(async (error) => {
  console.error("Admin setup failed:", error.message);

  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }

  process.exitCode = 1;
});
