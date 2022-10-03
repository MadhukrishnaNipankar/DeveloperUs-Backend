require("dotenv").config({ path: "./config/config.env" });
const app = require("./app");
const connectDb = require("./config/db");
const port = process.env.PORT;

connectDb();
app.listen(port, () => {
  console.log(`DeveloperUs listening on port ${port}`);
});
