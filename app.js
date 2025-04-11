require("express-async-errors");
// essentials
const express = require("express");
const connectDB = require("./db/connection");
//middlewares
const errorHandlerMiddleware = require("./middlewares/errorHandlerMiddleware");
const notFoundMiddleware = require("./middlewares/notFoundMiddleware");
//routers
const authRouter = require("./routes/authRouter");
const PORT = process.env.PORT;
const app = express();

app.get("/", (req, res) => {
  res.send("Welcome to tikitaka prototype backend");
});

app.use("/api/v1/auth", authRouter);

app.use(errorHandlerMiddleware);
app.use(notFoundMiddleware);

const start = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Server run on port ${PORT}`);
    });
  } catch (err) {
    console.log(`Something went wrong ${err}`);
  }
};

start();
