const Booking = require("../models/Booking");
const { StatusCodes } = require("http-status-codes");
const { NotFoundError, BadRequestError } = require("../errors");
const mongoose = require("mongoose");

const totalEarned = async (req, res) => {
  const { companyId, role } = req.user;
  const { timeSpan } = req.body;
  const possibleTimeSpans = ["week", "month", "year", "total"];
  if (timeSpan) {
    if (!possibleTimeSpans.includes(timeSpan)) {
      throw new BadRequestError("Invalid time span provided");
    }
  }
  const matchTime = new Date();

  if (timeSpan === "week") {
    matchTime.setDate(matchTime.getDate() - 7);
  }
  if (timeSpan === "month") {
    matchTime.setMonth(matchTime.getMonth() - 1);
  }

  if (timeSpan === "year") {
    matchTime.setFullYear(matchTime.getFullYear() - 1);
  }

  if (timeSpan === "total") {
    matchTime.setFullYear(0);
  }

  if (role === "owner") {
    const bookings = await Booking.aggregate([
      {
        $match: {
          company: new mongoose.Types.ObjectId(companyId),
          "price.paid": true,
          "price.paidAt": { $gte: matchTime },
        },
      },
      {
        $group: {
          _id: null,
          totalEarned: { $sum: "$price.hourlyRate" },
          totalPaidBookings: { $sum: 1 },
        },
      },
    ]);
    if (!bookings || bookings.length === 0) {
      return res.status(StatusCodes.OK).json({
        totalEarned: 0,
        totalPaidBookings: 0,
      });
    }
    res.status(StatusCodes.OK).json({
      totalEarned: bookings[0].totalEarned,
      totalPaidBookings: bookings[0].totalPaidBookings,
    });
  }
  if (role === "admin") {
    const { id } = req.params;
    if (!id) {
      throw new BadRequestError("Please provide company ID for admin role");
    }

    const bookings = await Booking.aggregate([
      {
        $match: {
          company: new mongoose.Types.ObjectId(id),
          "price.paid": true,
          "price.paidAt": { $gte: matchTime },
        },
      },
      {
        $group: {
          _id: null,
          totalEarned: { $sum: "$price.hourlyRate" },
          totalPaidBookings: { $sum: 1 },
        },
      },
    ]);
    if (!bookings || bookings.length === 0) {
      return res.status(StatusCodes.OK).json({
        totalEarned: 0,
        totalPaidBookings: 0,
      });
    }
    res.status(StatusCodes.OK).json({
      totalEarned: bookings[0].totalEarned,
      totalPaidBookings: bookings[0].totalPaidBookings,
    });
  }
};

const statusMetrics = async (req, res) => {
  const { companyId, role } = req.user;
  const { timeSpan } = req.body;
  const possibleTimeSpans = ["week", "month", "year", "total"];
  if (!possibleTimeSpans.includes(timeSpan)) {
    throw new BadRequestError("Invalid time span provided");
  }
  const matchTime = new Date();
  if (timeSpan === "week") {
    matchTime.setDate(matchTime.getDate() - 7);
  }
  if (timeSpan === "month") {
    matchTime.setMonth(matchTime.getMonth() - 1);
  }

  if (timeSpan === "year") {
    matchTime.setFullYear(matchTime.getFullYear() - 1);
  }
  if (timeSpan === "total") {
    matchTime.setFullYear(0);
  }

  if (role === "owner") {
    const bookings = await Booking.aggregate([
      {
        $match: {
          company: new mongoose.Types.ObjectId(companyId),
          createdAt: { $gte: matchTime },
        },
      },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
      {
        $group: {
          _id: null,
          totalBookings: { $sum: "$count" },
          statusCounts: {
            $push: {
              status: "$_id",
              count: "$count",
            },
          },
        },
      },
      {
        $unwind: "$statusCounts",
      },
      {
        $project: {
          _id: 0,

          status: "$statusCounts.status",
          count: "$statusCounts.count",
          ratio: {
            $round: [{ $divide: ["$statusCounts.count", "$totalBookings"] }, 4],
          },
        },
      },
    ]);

    if (!bookings || bookings.length === 0) {
      return res.status(StatusCodes.OK).json({
        statusMetrics: [],
      });
    }
    res.status(StatusCodes.OK).json({
      statusMetrics: bookings,
    });
  }
  if (role === "admin") {
    console.log("hit here");
    const { id } = req.params;
    if (!id) {
      throw new BadRequestError("Please provide company ID for admin role");
    }
    const bookings = await Booking.aggregate([
      {
        $match: {
          company: new mongoose.Types.ObjectId(id),
          createdAt: { $gte: matchTime },
        },
      },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
      {
        $group: {
          _id: null,
          totalBookings: { $sum: "$count" },
          statusCounts: {
            $push: {
              status: "$_id",
              count: "$count",
            },
          },
        },
      },
      {
        $unwind: "$statusCounts",
      },
      {
        $project: {
          _id: 0,

          status: "$statusCounts.status",
          count: "$statusCounts.count",
          ratio: {
            $round: [{ $divide: ["$statusCounts.count", "$totalBookings"] }, 4],
          },
        },
      },
    ]);
    if (!bookings || bookings.length === 0) {
      return res.status(StatusCodes.OK).json({
        statusMetrics: [],
      });
    }
    res.status(StatusCodes.OK).json({
      statusMetrics: bookings,
    });
  }
};

const pitchEarned = async (req, res) => {
  const { companyId, role } = req.user;
  const { id } = req.params;
  const { timeSpan } = req.body;
  const possibleTimeSpans = ["week", "month", "year", "total"];
  if (!id) {
    throw new BadRequestError("Please provide required data");
  }
  if (!possibleTimeSpans.includes(timeSpan)) {
    throw new BadRequestError("Invalid time span provided");
  }
  const matchTime = new Date();

  if (timeSpan === "week") {
    matchTime.setDate(matchTime.getDate() - 7);
  }
  if (timeSpan === "month") {
    matchTime.setMonth(matchTime.getMonth() - 1);
  }
  if (timeSpan === "year") {
    matchTime.setFullYear(matchTime.getFullYear() - 1);
  }
  if (timeSpan === "total") {
    matchTime.setFullYear(0);
  }
  if (role === "owner") {
    const bookings = await Booking.aggregate([
      {
        $match: {
          company: new mongoose.Types.ObjectId(companyId),
          "price.paid": true,
          "price.paidAt": { $gte: matchTime },
          pitch: new mongoose.Types.ObjectId(id),
        },
      },
      {
        $group: {
          _id: null,
          totalEarned: { $sum: "$price.hourlyRate" },
          totalPaidBookings: { $sum: 1 },
        },
      },
    ]);
    if (!bookings || bookings.length === 0) {
      return res.status(StatusCodes.OK).json({
        totalEarned: 0,
        totalPaidBookings: 0,
      });
    }
    res.status(StatusCodes.OK).json({
      totalEarned: bookings[0].totalEarned,
      totalPaidBookings: bookings[0].totalPaidBookings,
    });
  }
  if (role === "admin") {
    const bookings = await Booking.aggregate([
      {
        $match: {
          "price.paid": true,
          "price.paidAt": { $gte: matchTime },
          pitch: new mongoose.Types.ObjectId(id),
        },
      },
      {
        $group: {
          _id: null,
          totalEarned: { $sum: "$price.hourlyRate" },
          totalPaidBookings: { $sum: 1 },
        },
      },
    ]);
    if (!bookings || bookings.length === 0) {
      return res.status(StatusCodes.OK).json({
        totalEarned: 0,
        totalPaidBookings: 0,
      });
    }
    res.status(StatusCodes.OK).json({
      totalEarned: bookings[0].totalEarned,
      totalPaidBookings: bookings[0].totalPaidBookings,
    });
  }
};

module.exports = {
  totalEarned,
  statusMetrics,
  pitchEarned,
};
