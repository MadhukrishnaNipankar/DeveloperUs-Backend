const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true,
  },
  aboutMe: {
    type: String,
    trim: true,
  },
  email: {
    type: String,
    required: [true, "Please provide your email"],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, "Please provide a valid email"], //transforms the email to lowercase
  },
  password: {
    type: String,
    required: [true, "Please provide a password"],
    minlength: [8, "Length of password must be greater than or equal to 8"],
    select: false,
  },
  photo: String,
  skills: [String],
  interests: [String],
  socialLinks: [String],
  websiteLink: String,
  profileViewCount: Number,
  residenceLocation: String,
  noOfSuccessFullContributions: {
    type: Number,
    default: 0,
  },
  noOfAcceptedRequestsByOtherUser: {
    type: Number,
    default: 0,
  },
  noOfAcceptedRequestsByMe: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now(),
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
});

// Hashing the password just before saving the instance of the user object into database
userSchema.pre("save", async function (next) {
  //Only run this function, If the password was actually modified
  if (!this.isModified("password")) return next();

  //   hash the password with cost of 12
  this.password = await bcrypt.hash(this.password, 12);
});

userSchema.pre("save", function (next) {
  //Only run this function, If the password was actually modified
  if (!this.isModified("password") || this.isNew) return next();

  this.passwordChangedAt = Date.now() - 1000;
  next();
});

// Password Verification
userSchema.methods.isPasswordCorrect = async function (
  candidatePassword,
  userPassword
) {
  /* 
candidatePassword - password that the user passed in the body, which is not hashed
userPassword - Hashed password which is stored in the database
*/
  return await bcrypt.compare(candidatePassword, userPassword);
};

// Password Reset Token Generation
userSchema.methods.createPasswordResetToken = async function () {
  const resetToken = crypto.randomBytes(32).toString("hex"); //This is plane Token

  //hashed Token which will be stored into database
  const hashedResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  // console.log({ resetToken }, { hashedResetToken });

  this.passwordResetToken = hashedResetToken;
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

const User = mongoose.model("User", userSchema);
module.exports = User;
