//errors
require("express-async-errors");
// essentials
const express = require("express");
const connectDB = require("./db/connection");
const cookieParser = require("cookie-parser");
//middlewares
const errorHandlerMiddleware = require("./middlewares/errorHandlerMiddleware");
const notFoundMiddleware = require("./middlewares/notFoundMiddleware");
const passport = require("passport");
//routers
const authRouter = require("./routes/authRouter");
const userRouter = require("./routes/userRouter");
const companyRouter = require("./routes/companyRouter");
const pitchRouter = require("./routes/pitchRouter");
//security
const cors = require("cors");
//others
const morgan = require("morgan");

const PORT = process.env.PORT;
const app = express();

app.use(cors({ origin: process.env.ORIGIN_FRONTEND, credentials: true }));

app.use(express.json());
app.use(morgan("tiny"));
app.use(cookieParser(process.env.JWT_SECRET));
app.use(passport.initialize());

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/user", userRouter);
app.use("/api/v1/company", companyRouter);
app.use("/api/v1/pitch", pitchRouter);

app.get("/", (req, res) => {
  res.send(
    "<a href ='/api/v1/auth/google'> Click here to test google oauth </a> "
  );
});

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
