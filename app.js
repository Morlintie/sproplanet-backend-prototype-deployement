//errors
require("express-async-errors");
// essentials
const express = require("express");
const connectDB = require("./db/connection");
const cookieParser = require("cookie-parser");
const { setupCronJobs } = require("./utils");
const {
  app,
  server,
  io,
  onlineUsers,
  notificationNamespace,
  notificationOnlineUsers,
  chatOnlineUsers,
  chatNamespace,
} = require("./server/serverConfig");
//middlewares
const errorHandlerMiddleware = require("./middlewares/errorHandlerMiddleware");
const notFoundMiddleware = require("./middlewares/notFoundMiddleware");
const passport = require("passport");
//routers
const authRouter = require("./routes/authRouter");
const userRouter = require("./routes/userRouter");
const companyRouter = require("./routes/companyRouter");
const pitchRouter = require("./routes/pitchRouter");
const pitchReviewRouter = require("./routes/pitchReviewRouter");
const bookingRouter = require("./routes/bookingRouter");
const advertRouter = require("./routes/advertRouter");
const invitationRouter = require("./routes/InvitationRouter");
const advertChatRouter = require("./routes/advertChatRouter");
const chatRouter = require("./routes/chatRouter");

//security
const cors = require("cors");
//others
const morgan = require("morgan");
const fileUpload = require("express-fileupload");
const cloudinary = require("cloudinary").v2;

const PORT = process.env.PORT;

//setting up middlewares

app.use(cors({ origin: process.env.ORIGIN_FRONTEND, credentials: true }));

app.use(
  fileUpload({
    useTempFiles: true,
    tempFileDir: "/tmp/",
    limits: { files: 5, fileSize: 1024 * 1024 * 1024 * 5 },
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_KEY,
  api_secret: process.env.CLOUD_SECRET,
});

app.use(morgan("tiny"));
app.use(cookieParser(process.env.JWT_SECRET));
app.use(passport.initialize());

// setting up cron jobs

setupCronJobs();

//setting up routes

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/user", userRouter);
app.use("/api/v1/company", companyRouter);
app.use("/api/v1/pitch", pitchRouter);
app.use("/api/v1/pitch-review", pitchReviewRouter);
app.use("/api/v1/booking", bookingRouter);
app.use("/api/v1/advert", advertRouter);
app.use("/api/v1/invitation", invitationRouter);
app.use("/api/v1/advert-chat", advertChatRouter);
app.use("/api/v1/chat", chatRouter);

//socket setup

io.on("connection", (socket) => {
  console.log("A new client connected with id:", socket.id);
  const { userId } = socket.handshake.query;
  if (userId) {
    onlineUsers[userId] = socket.id;
    io.emit("onlineUsers", Object.keys(onlineUsers));
  }

  socket.on("disconnect", () => {
    console.log("Client disconnected with id:", socket.id);
    for (const [key, value] of Object.entries(onlineUsers)) {
      if (value === socket.id) {
        delete onlineUsers[key];
        io.emit("onlineUsers", Object.keys(onlineUsers));
        break;
      }
    }
  });
});

notificationNamespace.on("connection", (socket) => {
  console.log("Notification client connected with id:", socket.id);
  const { userId } = socket.handshake.query;
  if (userId) {
    notificationOnlineUsers[userId] = socket.id;
  }

  socket.on("joinRoom", ({ roomId }) => {
    socket.join(roomId);
    console.log(`Client with id: ${socket.id} joined room: ${roomId}`);
  });

  socket.on("leaveRoom", ({ roomId }) => {
    socket.leave(roomId);
    console.log(`Client with id: ${socket.id} left room: ${roomId}`);
  });

  socket.on("disconnect", () => {
    for (const [key, value] of Object.entries(notificationOnlineUsers)) {
      if (value === socket.id) {
        delete notificationOnlineUsers[key];
        break;
      }
    }
    console.log("Notification client disconnected with id:", socket.id);
  });
});

chatNamespace.on("connection", (socket) => {
  console.log("Chat client connected with id:", socket.id);

  const { userId } = socket.handshake.query;
  if (userId) {
    chatOnlineUsers[userId] = socket.id;
  }

  socket.on("joinRoom", ({ roomId }) => {
    socket.join(roomId);
    console.log(`Client with id: ${socket.id} joined room: ${roomId}`);
  });

  socket.on("leaveRoom", ({ roomId }) => {
    socket.leave(roomId);
    console.log(`Client with id: ${socket.id} left room: ${roomId}`);
  });

  socket.on("disconnect", () => {
    for (const [key, value] of Object.entries(chatOnlineUsers)) {
      if (value === socket.id) {
        delete chatOnlineUsers[key];
        break;
      }
    }
    console.log("Chat client disconnected with id:", socket.id);
  });
});

//error handling middlewares

app.use(errorHandlerMiddleware);
app.use(notFoundMiddleware);

const start = async () => {
  try {
    await connectDB();
    server.listen(PORT, () => {
      console.log(`Server run on port ${PORT}`);
    });
  } catch (err) {
    console.log(`Something went wrong ${err}`);
  }
};

start();
