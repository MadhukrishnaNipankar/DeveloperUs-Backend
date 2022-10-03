const jwt = require("jsonwebtoken");
const { promisify } = require("util");
const User = require("./../models/userModel");
const AppError = require("../utils/appError");

const createToken = (id) => {
  const token = jwt.sign({ id: id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
  return token;
};

exports.signup = async (req, res, next) => {
  try {
    const newUser = await User.create({
      email: req.body.email,
      password: req.body.password,
    });
    const token = createToken(newUser._id);

    res.status(201).json({
      status: "success",
      token,
      data: {
        user: newUser,
      },
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      return next(new AppError(`Please send valid data`, 400));
    } else if (error.code === 11000) {
      return next(
        new AppError(
          `This account is already registered. Please try logging in`,
          400
        )
      );
    }
    return next(new AppError(`Unable to process the request.`, 500));
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    //1)Check if email or password exist in the request
    if (!email || !password) {
      return next(new AppError("Please provide email and password", 400));
    }
    //2)Check if user exists && password is correct
    const user = await User.findOne({ email }).select("+password");

    //3)If No user exist OR password is incorrect
    if (!user || !(await user.isPasswordCorrect(password, user.password))) {
      return next(new AppError("Incorrect email or password", 401));
    }
    //4)If everything is ok, send token to client
    const token = createToken(user._id);
    res.status(200).json({
      status: "success",
      token,
    });
  } catch (error) {
    return next(new AppError(`Unable to Login.Please try after sometime`, 500));
  }
};

exports.protect = async (req, res, next) => {
  let token;
  //1) Check if the token exists in the request body
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  //2) if no token found in the header,send unauthorized error
  if (!token) {
    return next(
      new AppError("You are not logged in. Please log in to get access.", 401)
    );
  }
  //3) Check if the token is valid
  let decoded;
  try {
    decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
    console.log(decoded);
  } catch (error) {
    console.log(error);
    if (error.name === "TokenExpiredError") {
      return next(
        new AppError("Your token has expired. Please log in again", 401)
      );
    }
    return next(
      new AppError("You are not authorized to access this route.", 401)
    );
  }

  //4) Check if the user still exists
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(
      new AppError(
        "The user belonging to this token does no longer exist ",
        401
      )
    );
  }

  //5) Check if the user changed password after the token was issued

  //6) GRANT ACCESS TO PROTECTED ROUTE
  req.user = currentUser;
  next();
};
