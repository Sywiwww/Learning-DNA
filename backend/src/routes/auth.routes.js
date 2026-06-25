const express = require("express");
const router = express.Router();

const {
  register,
  login,
} = require("../controllers/auth.controller");

const authMiddleware = require("../middleware/auth.middleware");

// Authentication Routes
router.post("/register", register);
router.post("/login", login);

router.get("/me", authMiddleware, (req, res) => {
  res.json({
    success: true,
    user: req.user,
  });
});

module.exports = router;