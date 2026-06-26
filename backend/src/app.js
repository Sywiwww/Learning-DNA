require("dotenv").config();

const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth.routes");
const chatRoutes = require("./routes/chat.routes");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/chat", chatRoutes);

module.exports = app;