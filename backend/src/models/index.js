import mongoose from "mongoose";
const { Schema, model } = mongoose;
const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: {
  type: String,
  required: true,
  trim: true
},
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    accountStatus: {
      type: String,
      enum: ["active", "disabled"],
      default: "active",
    },
    preferredCity: { type: Schema.Types.ObjectId, ref: "City" },
  },
  { timestamps: true },
);
const citySchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    state: String,
    country: { type: String, default: "India" },
    image: String,
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);
const theatreSchema = new Schema(
  {
    name: { type: String, required: true },
    cityId: {
      type: Schema.Types.ObjectId,
      ref: "City",
      required: true,
      index: true,
    },
    address: String,
    screens: {
  type: Number,
  required: true,
  min: 1,
  default: 1,
},
capacity: {
  type: Number,
  required: true,
  min: 1,
  default: 100,
},
    amenities: [String],
    contact: String,
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);
const screenSchema = new Schema(
  {
    name: { type: String, required: true },
    theatreId: {
      type: Schema.Types.ObjectId,
      ref: "Theatre",
      required: true,
      index: true,
    },
    screenType: { type: String, default: "Standard" },
    supportedFormats: [String],
    capacity: { type: Number, default: 70 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);
const seatSchema = new Schema(
  {
    screenId: { type: Schema.Types.ObjectId, ref: "Screen", required: true },
    rowLabel: { type: String, required: true },
    seatNumber: { type: Number, required: true },
    category: {
      type: String,
      enum: ["standard", "premium", "recliner"],
      default: "standard",
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);
seatSchema.index({ screenId: 1, rowLabel: 1, seatNumber: 1 }, { unique: true });
const movieSchema = new Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    poster: String,
    backdrop: String,
    description: String,
    genre: [String],
    language: [String],
    duration: { type: Number, default: 120 },
    certification: String,
    releaseDate: Date,
    cast: [String],
    crew: [String],
    trailerUrl: String,
    labels: [String],
    status: {
      type: String,
      enum: ["coming-soon", "now-showing", "archived"],
      default: "now-showing",
    },
    isFeatured: { type: Boolean, default: false },
    isTrending: { type: Boolean, default: false },
    rating: Number,
  },
  { timestamps: true },
);
const showSchema = new Schema(
  {
    movieId: {
      type: Schema.Types.ObjectId,
      ref: "Movie",
      required: true,
      index: true,
    },
    theatreId: {
      type: Schema.Types.ObjectId,
      ref: "Theatre",
      required: true,
      index: true,
    },
    screenId: {
      type: Schema.Types.ObjectId,
      ref: "Screen",
      required: true,
      index: true,
    },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    format: { type: String, default: "2D" },
    language: { type: String, default: "English" },
    pricing: {
      standard: { type: Number, default: 220 },
      premium: { type: Number, default: 280 },
      recliner: { type: Number, default: 420 },
    },
    bookingStatus: {
      type: String,
      enum: ["published", "draft", "cancelled"],
      default: "published",
    },
  },
  { timestamps: true },
);
showSchema.index({ screenId: 1, startTime: 1, endTime: 1 });
const inventorySchema = new Schema(
  {
    showId: { type: Schema.Types.ObjectId, ref: "Show", required: true },
    seatId: { type: Schema.Types.ObjectId, ref: "Seat", required: true },
    seatLabel: String,
    category: String,
    status: {
      type: String,
      enum: ["available", "held", "booked", "blocked"],
      default: "available",
    },
    bookingId: { type: Schema.Types.ObjectId, ref: "Booking", default: null },
    lockedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    lockedAt: Date,
    expiresAt: Date,
    priceAtReservation: Number,
  },
  { timestamps: true },
);
inventorySchema.index({ showId: 1, seatId: 1 }, { unique: true });
inventorySchema.index({ showId: 1, status: 1, expiresAt: 1 });
const bookingSchema = new Schema(
  {
    bookingReference: { type: String, unique: true },
    bookingId: {
  type: Schema.Types.ObjectId,
  ref: "Booking",
  default: null,
},
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    showId: { type: Schema.Types.ObjectId, ref: "Show", required: true },
    seatIds: [Schema.Types.ObjectId],
    seatLabels: [String],
    status: {
      type: String,
      enum: ["held", "confirmed", "expired", "cancelled", "payment-review"],
      default: "held",
    },
    paymentStatus: {
      type: String,
      enum: ["unpaid", "pending", "paid", "failed", "refund-pending"],
      default: "unpaid",
    },
    subtotal: Number,
    convenienceFee: Number,
    taxAmount: Number,
    discountAmount: { type: Number, default: 0 },
    totalAmount: Number,
    currency: { type: String, default: "INR" },
    reservationExpiresAt: Date,
    idempotencyKey: String,
  },
  { timestamps: true },
);
bookingSchema.index({ userId: 1, createdAt: -1 });
const paymentSchema = new Schema(
  {
    bookingId: {
      type: Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
      index: true,
    },
    provider: { type: String, default: "razorpay" },
    providerOrderId: String,
    providerPaymentId: String,
    amount: Number,
    currency: { type: String, default: "INR" },
    status: {
      type: String,
      enum: [
        "created",
        "pending",
        "verified",
        "failed",
        "refund-pending",
        "refunded",
      ],
      default: "created",
    },
    idempotencyKey: { type: String, unique: true, sparse: true },
    verifiedAt: Date,
  },
  { timestamps: true },
);
const notificationSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: String,
    message: String,
    type: String,
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true },
);
export const User = model("User", userSchema);
export const City = model("City", citySchema);
export const Theatre = model("Theatre", theatreSchema);
export const Screen = model("Screen", screenSchema);
export const Seat = model("Seat", seatSchema);
export const Movie = model("Movie", movieSchema);
export const Show = model("Show", showSchema);
export const ShowSeat = model("ShowSeat", inventorySchema);
export const Booking = model("Booking", bookingSchema);
export const Payment = model("Payment", paymentSchema);
export const Notification = model("Notification", notificationSchema);
