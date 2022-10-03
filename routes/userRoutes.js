const express = require("express");
const router = express.Router();
const { login, signup, protect } = require("../controllers/authController");

router.route("/").get(protect, (req, res) => {
  res.status(200).json({
    status: "success",
  });
});
router.route("/login").post(login);
router.route("/signup").post(signup);

module.exports = router;
