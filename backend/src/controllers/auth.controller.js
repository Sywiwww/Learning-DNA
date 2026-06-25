exports.login = async (req, res) => {
  res.status(200).json({
    success: true,
    message: "Login successful",
  });
};