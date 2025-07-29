const http = require("http");
const express = require("express");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.ORIGIN_FRONTEND,
  },
});

const onlineUsers = {};

const notificationNamespace = io.of("/notifications");

const notificationOnlineUsers = {};

const chatNamespace = io.of("/chat");

const chatOnlineUsers = {};

module.exports = {
  app,
  server,
  io,
  onlineUsers,
  notificationNamespace,
  notificationOnlineUsers,
  chatNamespace,
  chatOnlineUsers,
};
