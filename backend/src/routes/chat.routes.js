const express = require("express");
const router = express.Router();

router.post("/", (req, res) => {
  res.json({ message: "Chat endpoint working" });
});

module.exports = router;