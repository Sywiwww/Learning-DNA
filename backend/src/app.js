const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth.routes");
const chatRoutes = require("./routes/chat.routes");
const learningRoutes = require("./routes/learning.routes");
const syncRoutes = require("./routes/sync.routes");
const notificationRoutes = require("./routes/notification.routes");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/learning", learningRoutes);
app.use("/api/sync", syncRoutes);
app.use("/api/notifications", notificationRoutes);

module.exports = app;