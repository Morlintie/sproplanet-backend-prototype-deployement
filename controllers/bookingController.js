const Booking = require("../models/Booking");
const { StatusCodes } = require("http-status-codes");
const { paymentHelper } = require("../utils");

const createBooking = async (req, res) => {
  res.send("user create booking");
};

const createBookingCompany = async (req, res) => {
  res.send("company create booking");
};

const getUserBookings = async (req, res) => {
  res.send("get user bookings");
};

const getCompanyBookings = async (req, res) => {
  res.send("get company bookings");
};

const getSingleBooking = async (req, res) => {
  res.send("get single booking");
};

const updateBooking = async (req, res) => {
  res.send("update booking");
};

const replyBooking = async (req, res) => {
  res.send("reply booking");
};

const switchBooking = async (req, res) => {
  res.send("switch booking");
};

const refundBooking = async (req, res) => {
  res.send("refund booking");
};

const rejectBooking = async (req, res) => {
  res.send("reject booking");
};

const deleteBooking = async (req, res) => {
  res.send("delete booking");
};

module.exports = {
  createBooking,
  createBookingCompany,
  getUserBookings,
  getCompanyBookings,
  getSingleBooking,
  updateBooking,
  replyBooking,
  switchBooking,
  refundBooking,
  rejectBooking,
  deleteBooking,
};
