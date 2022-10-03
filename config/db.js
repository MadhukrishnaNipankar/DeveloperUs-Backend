const mongoose = require("mongoose");
const CONNECTION_STRING = process.env.MONGO_URL.replace(
  "<PASSWORD>",
  process.env.MONGO_PASSWORD
);

const connectDb = () => {
  mongoose
    .connect(CONNECTION_STRING)
    .then((conn) => {
      console.log(`DB connection successfull on link : ${CONNECTION_STRING}`);
    })
    .catch((err) => {
      console.log("some error occured", err);
    });
};

module.exports = connectDb;
