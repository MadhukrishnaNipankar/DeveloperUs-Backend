const express = require("express");
const cors = require("cors");

const app = express();
const userRouter = require("./routes/userRoutes");
const AppError = require("./utils/appError");
const globalErrorHandler = require("./controllers/errorController");

// Cors
app.use(
  cors({
    origin: "*",
  })
);

// Middleware for putting body data to request object
app.use(express.json());

// Routes
app.use("/api/v1/user", userRouter);

// Handling Undefined Routes
app.all("*", (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server`, 404));
});

// Middleware function for error handling
app.use(globalErrorHandler);

module.exports = app;
