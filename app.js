//errors
require("express-async-errors");
// essentials
const express = require("express");
const connectDB = require("./db/connection");
const cookieParser = require("cookie-parser");
//middlewares
const errorHandlerMiddleware = require("./middlewares/errorHandlerMiddleware");
const notFoundMiddleware = require("./middlewares/notFoundMiddleware");
//routers
const authRouter = require("./routes/authRouter");
const PORT = process.env.PORT;
const app = express();
//others
const morgan = require("morgan");

app.use(express.json());
app.use(morgan("tiny"));
app.use(cookieParser(process.env.JWT_SECRET));

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
