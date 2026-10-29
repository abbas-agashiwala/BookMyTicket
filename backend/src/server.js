import "dotenv/config";
import http from "http";
import { Server } from "socket.io";
import app from "./app.js";
import { connectDB } from "./config/db.js";
const port = process.env.PORT || 5000;
await connectDB();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: (process.env.CLIENT_ORIGIN || "http://localhost:5173").split(","),
    methods: ["GET", "POST"],
  },
});
io.on("connection", (socket) => {
  socket.on("join-show", (showId) => {
    if (typeof showId === "string" && showId.length < 100)
      socket.join(`show:${showId}`);
  });
});
app.set("io", io);
server.listen(port, () => console.log(`Flickt API listening on ${port}`));
