const jwt = require("jsonwebtoken");
const { promisify } = require("util");
const crypto = require("crypto");
const User = require("./../models/userModel");
const AppError = require("../utils/appError");
const {
  getGoogleOAuthTokens,
  getGithubOAuthTokens,
  getGithubUser,
  getLinkedinToken,
  getLinkedinUser,
} = require("../utils/authUtils");
// const sendEmail = require("../utils/email");

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

    //if email exists, but password doesn't inside the database, throw an error
    if (!user.password) {
      return next(
        new AppError(
          `Unable to perform the action. Please login with different method.`,
          400
        )
      );
    }

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

//This will receive email address
exports.forgotPassword = async (req, res, next) => {
  try {
    //1)Get user based on POSTED email
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      return next(new AppError(`There is no user with email address.`, 404));
    }
    //2) Generate the random token
    const resetToken = await user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    //3) Send it to user's email
    //SEND EMAIL HERE ! THIS IS FOR TESTING PURPOSE
    res.status(200).json({
      status: "success",
      resetToken,
    });
  } catch (error) {
    return next(
      new AppError(
        `Unable to Process the request.Please try after sometime`,
        500
      )
    );
  }
};

//This will receive the token as well as the new password
exports.resetPassword = async (req, res, next) => {
  try {
    //1) Get user based on the token
    const hashedToken = crypto
      .createHash("sha256")
      .update(req.params.token)
      .digest("hex");

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    }); // will return only those objects which has similar hashed token and whose password is not expired

    //2) If token is not expired, and user exist, set the new password
    if (!user) {
      return next(new AppError(`Token is invalid or has expired`, 400));
    }
    if (req.body.newPassword === undefined) {
      return next(
        new AppError(`newPassword field is missing in the request body`, 400)
      );
    }
    user.password = req.body.newPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    //Log the user in,send JWT
    const token = createToken(user._id);
    res.status(200).json({
      status: "success",
      token,
    });

    //3) Update changePasswordAt property for the user
  } catch (error) {
    return next(
      new AppError(
        `Unable to Process the request.Please try after sometime`,
        500
      )
    );
  }
};

//This will receive the current password
exports.updatePassword = async (req, res, next) => {
  try {
    //1) get user from collection
    if (
      req.body.currentPassword === undefined ||
      req.body.newPassword === undefined
    ) {
      return next(
        new AppError(
          `Please provide currentPassword as well as newPassword`,
          400
        )
      );
    }
    const user = await User.findById(req.user.id).select("+password");
    //2) check if posted password is correct
    if (!user.isPasswordCorrect(req.body.currentPassword, user.password)) {
      return next(new AppError(`Your current password is wrong`, 401));
    }
    //3) if so, update the password
    user.password = req.body.newPassword;
    try {
      await user.save();
    } catch (error) {
      if (error._message === "User validation failed") {
        return next(new AppError(`New Password is Invalid `, 400));
      }
    }
    //4) Log user in, send JWT
    const token = createToken(user._id);
    res.status(200).json({
      status: "success",
      token,
    });
  } catch (error) {
    return next(
      new AppError(
        `Unable to Process the request.Please try after sometime`,
        500
      )
    );
  }
};

//signup + login with google
exports.googleAuthentication = async (req, res, next) => {
  try {
    //get the code from query string
    const code = req.query.code.toString();
    if (!code) {
      return next(new AppError(`Parameter missing:code`, 400));
    }
    //get id token with the code
    const { id_token } = await getGoogleOAuthTokens(code);
    //get user data from id_token
    const googleUser = await jwt.decode(id_token);
    //if email is not verified, throw error
    if (!googleUser.email_verified) {
      return next(new AppError(`Google account is not verified`, 403));
    }
    //if the user doesnt exist in the database, create one
    const user = await User.findOneAndUpdate(
      { email: googleUser.email }, //filter
      {
        email: googleUser.email,
        name: googleUser.name,
        photo: googleUser.picture,
      },
      {
        new: true,
        upsert: true,
      }
    );
    //create jwt token and send it
    const token = createToken(user._id);
    res.status(200).json({
      status: "success",
      token,
    });
  } catch (error) {
    console.log(error);
    return next(
      new AppError(
        `Unable to Process the request.Please try after sometime`,
        500
      )
    );
  }
};

//signup + login with github
exports.githubAuthentication = async (req, res, next) => {
  try {
    //get the code from query string
    const code = req.query.code.toString();
    if (!code) {
      return next(new AppError(`Parameter missing:code`, 400));
    }
    //get the path from query string
    const path = req.query.path.toString();
    if (!path) {
      return next(new AppError(`Parameter missing:path`, 400));
    }
    //get access token with the code
    const { access_token } = await getGithubOAuthTokens(code);
    //get github user using access token
    const githubUser = await getGithubUser(access_token);
    //if the user doesnt exist in the database, create one
    const user = await User.findOneAndUpdate(
      { email: githubUser.email }, //filter
      {
        email: githubUser.email,
        name: githubUser.name,
        photo: githubUser.avatar_url,
      },
      {
        new: true,
        upsert: true,
      }
    );
    //create jwt token and send it
    const token = createToken(user._id);
    res.status(200).json({
      status: "success",
      token,
    });
  } catch (error) {
    console.log(error);
    return next(
      new AppError(
        `Unable to Process the request.Please try after sometime`,
        500
      )
    );
  }
};

//signup + login with linkedinAuthentication
exports.linkedinAuthentication = async (req, res, next) => {
  try {
    //get the code from query string
    const code = req.query.code.toString();
    if (!code) {
      return next(new AppError(`Parameter missing:code`, 400));
    }
    //get access token with the code
    const { access_token } = await getLinkedinToken(code);
    console.log({ access_token });
    //get linkedin user using access token
    const linkedinUser = await getLinkedinUser(access_token);
    console.log({ linkedinUser });
    res.status(200).json({
      status: "this route is yet to implement",
      access_token,
      linkedinUser,
    });
  } catch (error) {
    console.log(error);
    return next(
      new AppError(
        `Unable to Process the request.Please try after sometime`,
        500
      )
    );
  }
};
