const express = require("express");
const router = express.Router();

router.get("/", (req, res) => {
  res.json({ message: "Learning endpoint working" });
});

module.exports = router;