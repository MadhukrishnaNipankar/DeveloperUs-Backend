const express = require("express");
const router = express.Router();
const {
  login,
  signup,
  protect,
  forgotPassword,
  resetPassword,
  updatePassword,
  googleAuthentication,
  githubAuthentication,
  linkedinAuthentication,
} = require("../controllers/authController");

//Authentication
router.route("/oauth/google").get(googleAuthentication);
router.route("/oauth/github").get(githubAuthentication);
router.route("/oauth/linkedin").get(linkedinAuthentication);
router.route("/login").post(login);
router.route("/signup").post(signup);
router.route("/forgotPassword").post(forgotPassword);
router.route("/resetPassword/:token").post(resetPassword);
router.route("/password").patch(protect, updatePassword);

module.exports = router;
