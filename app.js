const express = require("express");
const connectDB = require("./db/connection");
const PORT = process.env.PORT;
const app = express();

app.get("/", (req, res) => {
  res.send("Welcome to tikitaka prototype backend");
});

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
