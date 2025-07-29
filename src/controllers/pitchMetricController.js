const Booking = require("../models/Booking");
const { StatusCodes } = require("http-status-codes");
const { NotFoundError, BadRequestError } = require("../errors");
const mongoose = require("mongoose");
const PitchReview = require("../models/PitchReview");

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

    const totalBookings = bookings.reduce((acc, curr) => acc);
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

const pitchStatusMetrics = async (req, res) => {
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
          pitch: new mongoose.Types.ObjectId(id),
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
          statusCounts: { $push: { status: "$_id", count: "$count" } },
        },
      },
      { $unwind: "$statusCounts" },
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
    const bookings = await Booking.aggregate([
      {
        $match: {
          pitch: new mongoose.Types.ObjectId(id),
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
          statusCounts: { $push: { status: "$_id", count: "$count" } },
        },
      },
      { $unwind: "$statusCounts" },
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

const previousStatusMetrics = async (req, res) => {
  const { companyId, role } = req.user;
  const { timeSpan } = req.body;
  const possibleTimeSpans = ["week", "month", "year", "total"];
  if (!possibleTimeSpans.includes(timeSpan)) {
    throw new BadRequestError("Invalid time period provided");
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
          status: { $in: ["completed", "cancelled"] },
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
          statusCounts: { $push: { status: "$_id", count: "$count" } },
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
    const { id } = req.params;
    if (!id) {
      throw new BadRequestError("Please provide company ID for admin role");
    }
    const bookings = await Booking.aggregate([
      {
        $match: {
          company: new mongoose.Types.ObjectId(id),
          createdAt: { $gte: matchTime },
          status: { $in: ["completed", "cancelled"] },
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
          statusCounts: { $push: { status: "$_id", count: "$count" } },
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
      res.status(StatusCodes.OK).json({
        statusMetrics: [],
      });
    }
    res.status(StatusCodes.OK).json({
      statusMetrics: bookings,
    });
  }
};

const previousTotalEarned = async (req, res) => {
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
    const previousBookings = await Booking.aggregate([
      {
        $match: {
          company: new mongoose.Types.ObjectId(companyId),
          "price.paid": true,
          "price.paidAt": { $gte: matchTime },
          status: { $in: ["completed"] },
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
    if (!previousBookings || previousBookings.length === 0) {
      return res.status(StatusCodes.OK).json({
        totalEarned: 0,
        totalPaidBookings: 0,
      });
    }
    res.status(StatusCodes.OK).json({
      totalEarned: previousBookings[0].totalEarned,
      totalPaidBookings: previousBookings[0].totalPaidBookings,
    });
  }
  if (role === "admin") {
    const { id } = req.params;
    if (!id) {
      throw new BadRequestError("Please provide required data");
    }
    const previousBookings = await Booking.aggregate([
      {
        $match: {
          company: new mongoose.Types.ObjectId(id),
          "price.paid": true,
          "price.paidAt": { $gte: matchTime },
          status: { $in: ["completed"] },
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
    if (!previousBookings || previousBookings.length === 0) {
      return res.status(StatusCodes.OK).json({
        totalEarned: 0,
        totalPaidBookings: 0,
      });
    }
    res.status(StatusCodes.OK).json({
      totalEarned: previousBookings[0].totalEarned,
      totalPaidBookings: previousBookings[0].totalPaidBookings,
    });
  }
};

const previousRefundedTotal = async (req, res) => {
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
    const previousBookings = await Booking.aggregate([
      {
        $match: {
          company: new mongoose.Types.ObjectId(companyId),
          "refunded.at": { $gte: matchTime },
          status: { $in: ["cancelled"] },
        },
      },
      {
        $group: {
          _id: null,
          totalRefunded: { $sum: "$price.hourlyRate" },
          totalRefundedBookings: { $sum: 1 },
        },
      },
    ]);
    if (!previousBookings || previousBookings.length === 0) {
      return res.status(StatusCodes.OK).json({
        totalRefunded: 0,
        totalRefundedBookings: 0,
      });
    }
    res.status(StatusCodes.OK).json({
      totalRefunded: previousBookings[0].totalRefunded,
      totalRefundedBookings: previousBookings[0].totalRefundedBookings,
    });
  }
  if (role === "admin") {
    const { id } = req.params;

    if (!id) {
      throw new BadRequestError("Please provide required data");
    }
    const previousBookings = await Booking.aggregate([
      {
        $match: {
          company: new mongoose.Types.ObjectId(id),
          "refunded.at": { $gte: matchTime },
          status: { $in: ["cancelled"] },
        },
      },
      {
        $group: {
          _id: null,
          totalRefunded: { $sum: "$price.hourlyRate" },
          totalRefundedBookings: { $sum: 1 },
        },
      },
    ]);
    if (!previousBookings || previousBookings.length === 0) {
      return res.status(StatusCodes.OK).json({
        totalRefunded: 0,
        totalRefundedBookings: 0,
      });
    }
    res.status(StatusCodes.OK).json({
      totalRefunded: previousBookings[0].totalRefunded,
      totalRefundedBookings: previousBookings[0].totalRefundedBookings,
    });
  }
};

const previousPitchStatusMetrics = async (req, res) => {
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
    const previousBookings = await Booking.aggregate([
      {
        $match: {
          company: new mongoose.Types.ObjectId(companyId),
          pitch: new mongoose.Types.ObjectId(id),
          createdAt: { $gte: matchTime },
          status: { $in: ["completed", "cancelled"] },
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
          statusCounts: { $push: { status: "$_id", count: "$count" } },
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

    if (!previousBookings || previousBookings.length === 0) {
      return res.status(StatusCodes.OK).json({
        statusMetrics: [],
      });
    }
    res.status(StatusCodes.OK).json({
      statusMetrics: previousBookings,
    });
  }
  if (role === "admin") {
    const previousBookings = await Booking.aggregate([
      {
        $match: {
          pitch: new mongoose.Types.ObjectId(id),
          createdAt: { $gte: matchTime },
          status: { $in: ["completed", "cancelled"] },
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
          statusCounts: { $push: { status: "$_id", count: "$count" } },
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
    if (!previousBookings || previousBookings.length === 0) {
      return res.status(StatusCodes.OK).json({
        statusMetrics: [],
      });
    }
    res.status(StatusCodes.OK).json({
      statusMetrics: previousBookings,
    });
  }
};

const previousPitchTotalEarned = async (req, res) => {
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
    const previousBookings = await Booking.aggregate([
      {
        $match: {
          company: new mongoose.Types.ObjectId(companyId),
          pitch: new mongoose.Types.ObjectId(id),
          "price.paid": true,
          "price.paidAt": { $gte: matchTime },
          status: { $in: ["completed"] },
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
    if (!previousBookings || previousBookings.length === 0) {
      return res.status(StatusCodes.OK).json({
        totalEarned: 0,
        totalPaidBookings: 0,
      });
    }
    res.status(StatusCodes.OK).json({
      totalEarned: previousBookings[0].totalEarned,
      totalPaidBookings: previousBookings[0].totalPaidBookings,
    });
  }
  if (role === "admin") {
    const previousBookings = await Booking.aggregate([
      {
        $match: {
          pitch: new mongoose.Types.ObjectId(id),
          "price.paid": true,
          "price.paidAt": { $gte: matchTime },
          status: { $in: ["completed"] },
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
    if (!previousBookings || previousBookings.length === 0) {
      return res.status(StatusCodes.OK).json({
        totalEarned: 0,
        totalPaidBookings: 0,
      });
    }
    res.status(StatusCodes.OK).json({
      totalEarned: previousBookings[0].totalEarned,
      totalPaidBookings: previousBookings[0].totalPaidBookings,
    });
  }
  if (role === "admin") {
    const previousBookings = await Booking.aggregate([
      {
        $match: {
          pitch: new mongoose.Types.ObjectId(id),
          "price.paid": true,
          "price.paidAt": { $gte: matchTime },
          status: { $in: ["completed"] },
        },
      },
    ]);
    if (!previousBookings || previousBookings.length === 0) {
      return res.status(StatusCodes.OK).json({
        totalEarned: 0,
        totalPaidBookings: 0,
      });
    }
    res.status(StatusCodes.OK).json({
      totalEarned: previousBookings[0].totalEarned,
      totalPaidBookings: previousBookings[0].totalPaidBookings,
    });
  }
};

const previousPitchRefundedTotal = async (req, res) => {
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
    const previousBookings = await Booking.aggregate([
      {
        $match: {
          company: new mongoose.Types.ObjectId(companyId),
          pitch: new mongoose.Types.ObjectId(id),
          "refunded.at": { $gte: matchTime },
          status: { $in: ["cancelled"] },
        },
      },
      {
        $group: {
          _id: null,
          totalRefunded: { $sum: "$price.hourlyRate" },
          totalRefundedBookings: { $sum: 1 },
        },
      },
    ]);
    if (!previousBookings || previousBookings.length === 0) {
      return res.status(StatusCodes.OK).json({
        totalRefunded: 0,
        totalRefundedBookings: 0,
      });
    }
    res.status(StatusCodes.OK).json({
      totalRefunded: previousBookings[0].totalRefunded,
      totalRefundedBookings: previousBookings[0].totalRefundedBookings,
    });
  }
  if (role === "admin") {
    const previousBookings = await Booking.aggregate([
      {
        $match: {
          pitch: new mongoose.Types.ObjectId(id),
          "refunded.at": { $gte: matchTime },
          status: { $in: ["cancelled"] },
        },
      },
      {
        $group: {
          _id: null,
          totalRefunded: { $sum: "$price.hourlyRate" },
          totalRefundedBookings: { $sum: 1 },
        },
      },
    ]);
    if (!previousBookings || previousBookings.length === 0) {
      return res.status(StatusCodes.OK).json({
        totalRefunded: 0,
        totalRefundedBookings: 0,
      });
    }
    res.status(StatusCodes.OK).json({
      totalRefunded: previousBookings[0].totalRefunded,
      totalRefundedBookings: previousBookings[0].totalRefundedBookings,
    });
  }
};

const currentConfirmedBookings = async (req, res) => {
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
          status: "confirmed",
        },
      },
      {
        $group: {
          _id: "$price.paid",
          totalConfirmedBookings: { $sum: 1 },
        },
      },

      {
        $project: {
          paidStatus: "$_id",
          totalConfirmedBookings: "$totalConfirmedBookings",
          _id: 0,
        },
      },
    ]);
    if (!bookings || bookings.length === 0) {
      return res.status(StatusCodes.OK).json({
        totalConfirmedBookings: [],
      });
    }
    res.status(StatusCodes.OK).json({
      totalConfirmedBookings: bookings[0].totalConfirmedBookings,
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
          status: "confirmed",
        },
      },
      {
        $group: {
          _id: "$price.paid",
          totalConfirmedBookings: { $sum: 1 },
        },
      },
      {
        $project: {
          paidStatus: "$_id",
          totalConfirmedBookings: "$totalConfirmedBookings",
          _id: 0,
        },
      },
    ]);
    if (!bookings || bookings.length === 0) {
      return res.status(StatusCodes.OK).json({
        totalConfirmedBookings: [],
      });
    }
    res.status(StatusCodes.OK).json({
      totalConfirmedBookings: bookings[0].totalConfirmedBookings,
    });
  }
};

const currentPendingBookings = async (req, res) => {
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
          status: "pending",
        },
      },
      {
        $group: {
          _id: "$price.paid",
          totalPendingBookings: { $sum: 1 },
        },
      },
      {
        $project: {
          paidStatus: "$_id",
          totalPendingBookings: "$totalPendingBookings",
          _id: 0,
        },
      },
    ]);
    if (!bookings || bookings.length === 0) {
      return res.status(StatusCodes.OK).json({
        totalPendingBookings: [],
      });
    }
    res.status(StatusCodes.OK).json({
      totalPendingBookings: bookings[0].totalPendingBookings,
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
          status: "pending",
        },
      },
      {
        $group: {
          _id: "$price.paid",
          totalPendingBookings: { $sum: 1 },
        },
      },
      {
        $project: {
          paidStatus: "$_id",
          totalPendingBookings: "$totalPendingBookings",
          _id: 0,
        },
      },
    ]);
    if (!bookings || bookings.length === 0) {
      return res.status(StatusCodes.OK).json({
        totalPendingBookings: [],
      });
    }
    res.status(StatusCodes.OK).json({
      totalPendingBookings: bookings[0].totalPendingBookings,
    });
  }
};

const currentStatusMetrics = async (req, res) => {
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
          status: { $in: ["pending", "confirmed"] },
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
          statusCounts: { $push: { status: "$_id", count: "$count" } },
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
    const { id } = req.params;
    if (!id) {
      throw new BadRequestError("Please provide company ID for admin role");
    }
    const bookings = await Booking.aggregate([
      {
        $match: {
          company: new mongoose.Types.ObjectId(id),
          createdAt: { $gte: matchTime },
          status: { $in: ["pending", "confirmed"] },
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
          statusCounts: { $push: { status: "$_id", count: "$count" } },
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

const currentConfirmedPitchBookings = async (req, res) => {
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
          pitch: new mongoose.Types.ObjectId(id),
          status: "confirmed",
        },
      },
      {
        $group: {
          _id: "$price.paid",
          totalConfirmedBookings: { $sum: 1 },
        },
      },
      {
        $project: {
          paidStatus: "$_id",
          totalConfirmedBookings: "$totalConfirmedBookings",
          _id: 0,
        },
      },
    ]);
    if (!bookings || bookings.length === 0) {
      return res.status(StatusCodes.OK).json({
        totalConfirmedBookings: [],
      });
    }
    res.status(StatusCodes.OK).json({
      totalConfirmedBookings: bookings[0].totalConfirmedBookings,
    });
  }
  if (role === "admin") {
    const bookings = await Booking.aggregate([
      {
        $match: {
          pitch: new mongoose.Types.ObjectId(id),
          status: "confirmed",
        },
      },
      {
        $group: {
          _id: "$price.paid",
          totalConfirmedBookings: { $sum: 1 },
        },
      },
      {
        $project: {
          paidStatus: "$_id",
          totalConfirmedBookings: "$totalConfirmedBookings",
          _id: 0,
        },
      },
    ]);
    if (!bookings || bookings.length === 0) {
      return res.status(StatusCodes.OK).json({
        totalConfirmedBookings: [],
      });
    }
    res.status(StatusCodes.OK).json({
      totalConfirmedBookings: bookings[0].totalConfirmedBookings,
    });
  }
};

const currentPendingPitchBookings = async (req, res) => {
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
          pitch: new mongoose.Types.ObjectId(id),
          status: "pending",
        },
      },
      {
        $group: {
          _id: "$price.paid",
          totalPendingBookings: { $sum: 1 },
        },
      },
      {
        $project: {
          paidStatus: "$_id",
          totalPendingBookings: "$totalPendingBookings",
          _id: 0,
        },
      },
    ]);
    if (!bookings || bookings.length === 0) {
      return res.status(StatusCodes.OK).json({
        totalPendingBookings: [],
      });
    }
    res.status(StatusCodes.OK).json({
      totalPendingBookings: bookings[0].totalPendingBookings,
    });
  }
  if (role === "admin") {
    const bookings = await Booking.aggregate([
      {
        $match: {
          pitch: new mongoose.Types.ObjectId(id),
          status: "pending",
        },
      },
      {
        $group: {
          _id: "$price.paid",
          totalPendingBookings: { $sum: 1 },
        },
      },
      {
        $project: {
          paidStatus: "$_id",
          totalPendingBookings: "$totalPendingBookings",
          _id: 0,
        },
      },
    ]);
    if (!bookings || bookings.length === 0) {
      return res.status(StatusCodes.OK).json({
        totalPendingBookings: [],
      });
    }
    res.status(StatusCodes.OK).json({
      totalPendingBookings: bookings[0].totalPendingBookings,
    });
  }
};

const currentPitchStatusMetrics = async (req, res) => {
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
          pitch: new mongoose.Types.ObjectId(id),
          createdAt: { $gte: matchTime },
          status: { $in: ["pending", "confirmed"] },
        },
      },
      {
        $group: {
          _id: "$status",
          totalBookings: { $sum: 1 },
        },
      },
      {
        $group: {
          _id: null,
          totalBookings: { $sum: "$totalBookings" },
          statusCounts: { $push: { status: "$_id", count: "$totalBookings" } },
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
    const bookings = await Booking.aggregate([
      {
        $match: {
          pitch: new mongoose.Types.ObjectId(id),
          createdAt: { $gte: matchTime },
          status: { $in: ["pending", "confirmed"] },
        },
      },
      {
        $group: {
          _id: "$status",
          totalBookings: { $sum: 1 },
        },
      },
      {
        $group: {
          _id: null,
          totalBookings: { $sum: "$totalBookings" },
          statusCounts: { $push: { status: "$_id", count: "$totalBookings" } },
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

const averageCompanyRating = async (req, res) => {
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
    const bookings = await PitchReview.aggregate([
      {
        $match: {
          company: new mongoose.Types.ObjectId(companyId),
          createdAt: { $gte: matchTime },
        },
      },
      {
        $group: {
          _id: null,
          averageRating: { $avg: "$rating" },
          totalReviews: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          averageRating: { $round: ["$averageRating", 2] },
          totalReviews: "$totalReviews",
        },
      },
    ]);
    if (!bookings || bookings.length === 0) {
      return res.status(StatusCodes.OK).json({
        ratingStatus: [],
      });
    }
    res.status(StatusCodes.OK).json({
      ratingStatus: bookings,
    });
  }
  if (role === "admin") {
    const { id } = req.params;
    if (!id) {
      throw new BadRequestError("Please provide required data");
    }
    const bookings = await PitchReview.aggregate([
      {
        $match: {
          company: new mongoose.Types.ObjectId(id),
          createdAt: { $gte: matchTime },
        },
      },
      {
        $group: {
          _id: null,
          averageRating: { $avg: "$rating" },
          totalReviews: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          averageRating: { $round: ["$averageRating", 2] },
          totalReviews: "$totalReviews",
        },
      },
    ]);
    if (!bookings || bookings.length === 0) {
      return res.status(StatusCodes.OK).json({
        ratingStatus: [],
      });
    }
    res.status(StatusCodes.OK).json({
      ratingStatus: bookings,
    });
  }
};

const bestCustomers = async (req, res) => {
  const { companyId, role } = req.user;
  if (role === "owner") {
    const bestCustomers = await Booking.aggregate([
      {
        $match: {
          company: new mongoose.Types.ObjectId(companyId),
          status: { $in: ["completed", "confirmed"] },
          "price.paid": true,
        },
      },
      {
        $group: {
          _id: "$bookedBy",
          totalSpent: { $sum: "$price.hourlyRate" },
          totalBookings: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: "users",
          let: { userId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ["$_id", "$$userId"],
                },
              },
            },
            {
              $project: {
                _id: 1,
                name: 1,
                email: 1,
                phone: 1,
                profilePicture: 1,
                school: 1,
                age: 1,
                goalKeeper: 1,
                description: 1,
              },
            },
          ],
          as: "userDetails",
        },
      },
      {
        $sort: { totalSpent: -1 },
      },
      {
        $limit: 10,
      },
    ]);

    if (!bestCustomers || bestCustomers.length === 0) {
      return res.status(StatusCodes.OK).json({
        bestCustomers: [],
      });
    }
    res.status(StatusCodes.OK).json({
      bestCustomers,
    });
  }
  if (role === "admin") {
    const { id } = req.params;
    if (!id) {
      throw new BadRequestError("Please provide required data");
    }
    const bestCustomers = await Booking.aggregate([
      {
        $match: {
          company: new mongoose.Types.ObjectId(id),
          status: { $in: ["completed", "confirmed"] },
          "price.paid": true,
        },
      },
      {
        $group: {
          _id: "$bookedBy",
          totalSpent: { $sum: "$price.hourlyRate" },
          totalBookings: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: "users",
          let: { userId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ["$_id", "$$userId"],
                },
              },
            },
            {
              $project: {
                _id: 1,
                name: 1,
                email: 1,
                phone: 1,
                profilePicture: 1,
                school: 1,
                age: 1,
                goalKeeper: 1,
                description: 1,
              },
            },
          ],
          as: "userDetails",
        },
      },
      {
        $sort: { totalSpent: -1 },
      },
      {
        $limit: 10,
      },
    ]);
    if (!bestCustomers || bestCustomers.length === 0) {
      return res.status(StatusCodes.OK).json({
        bestCustomers: [],
      });
    }
    res.status(StatusCodes.OK).json({
      bestCustomers,
    });
  }
};

const datePercentage = async (req, res) => {
  const { companyId, role } = req.user;
  if (role === "owner") {
    const bookings = await Booking.aggregate([
      {
        $match: {
          company: new mongoose.Types.ObjectId(companyId),
          status: { $in: ["completed", "confirmed"] },
          "price.paid": true,
        },
      },
      {
        $project: {
          month: { $month: "$createdAt" },
          weekday: { $dayOfWeek: "$createdAt" }, // 1 = Sunday, 2 = Monday, ..., 7 = Saturday
        },
      },
      {
        $facet: {
          monthlyCounts: [
            {
              $group: {
                _id: "$month",
                count: { $sum: 1 },
              },
            },
          ],
          dayCounts: [
            {
              $group: {
                _id: { month: "$month", weekday: "$weekday" },
                count: { $sum: 1 },
              },
            },
          ],
          total: [{ $count: "globalTotal" }],
        },
      },
      {
        $project: {
          total: { $arrayElemAt: ["$total", 0] },
          monthlyCounts: 1,
          dayCounts: 1,
        },
      },
      {
        $unwind: "$monthlyCounts",
      },
      {
        $project: {
          month: "$monthlyCounts._id",
          monthCount: "$monthlyCounts.count",
          total: "$total.globalTotal",
          dayCounts: 1,
        },
      },
      {
        $addFields: {
          monthlyPercentage: {
            $round: [
              { $multiply: [{ $divide: ["$monthCount", "$total"] }, 100] },
              2,
            ],
          },
          days: {
            $filter: {
              input: "$dayCounts",
              as: "day",
              cond: { $eq: ["$$day._id.month", "$month"] },
            },
          },
        },
      },
      {
        $project: {
          month: 1,
          monthlyPercentage: 1,
          days: {
            $map: {
              input: "$days",
              as: "d",
              in: {
                day: {
                  $arrayElemAt: [
                    [
                      "", // 0 placeholder
                      "Sunday",
                      "Monday",
                      "Tuesday",
                      "Wednesday",
                      "Thursday",
                      "Friday",
                      "Saturday",
                    ],
                    "$$d._id.weekday",
                  ],
                },
                dailyPercentage: {
                  $round: [
                    {
                      $multiply: [
                        { $divide: ["$$d.count", "$monthCount"] },
                        100,
                      ],
                    },
                    2,
                  ],
                },
              },
            },
          },
        },
      },
      {
        $addFields: {
          month: {
            $arrayElemAt: [
              [
                "", // 0 placeholder
                "January",
                "February",
                "March",
                "April",
                "May",
                "June",
                "July",
                "August",
                "September",
                "October",
                "November",
                "December",
              ],
              "$month",
            ],
          },
        },
      },
      {
        $sort: { month: 1 },
      },
    ]);

    if (!bookings || bookings.length === 0) {
      return res.status(StatusCodes.OK).json({
        datePercentages: [],
      });
    }
    res.status(StatusCodes.OK).json({
      datePercentages: bookings,
    });
  }
  if (role === "admin") {
    const { id } = req.params;
    if (!id) {
      throw new BadRequestError("Please provide required data");
    }
    const bookings = await Booking.aggregate([
      {
        $match: {
          company: new mongoose.Types.ObjectId(id),
          status: { $in: ["completed", "confirmed"] },
          "price.paid": true,
        },
      },
      {
        $project: {
          month: { $month: "$createdAt" },
          weekday: { $dayOfWeek: "$createdAt" }, // 1 = Sunday, 2 = Monday, ..., 7 = Saturday
        },
      },
      {
        $facet: {
          monthlyCounts: [
            {
              $group: {
                _id: "$month",
                count: { $sum: 1 },
              },
            },
          ],
          dayCounts: [
            {
              $group: {
                _id: { month: "$month", weekday: "$weekday" },
                count: { $sum: 1 },
              },
            },
          ],
          total: [{ $count: "globalTotal" }],
        },
      },
      {
        $project: {
          total: { $arrayElemAt: ["$total", 0] },
          monthlyCounts: 1,
          dayCounts: 1,
        },
      },
      {
        $unwind: "$monthlyCounts",
      },
      {
        $project: {
          month: "$monthlyCounts._id",
          monthCount: "$monthlyCounts.count",
          total: "$total.globalTotal",
          dayCounts: 1,
        },
      },
      {
        $addFields: {
          monthlyPercentage: {
            $round: [
              { $multiply: [{ $divide: ["$monthCount", "$total"] }, 100] },
              2,
            ],
          },
          days: {
            $filter: {
              input: "$dayCounts",
              as: "day",
              cond: { $eq: ["$$day._id.month", "$month"] },
            },
          },
        },
      },
      {
        $project: {
          month: 1,
          monthlyPercentage: 1,
          days: {
            $map: {
              input: "$days",
              as: "d",
              in: {
                day: {
                  $arrayElemAt: [
                    [
                      "", // 0 placeholder
                      "Sunday",
                      "Monday",
                      "Tuesday",
                      "Wednesday",
                      "Thursday",
                      "Friday",
                      "Saturday",
                    ],
                    "$$d._id.weekday",
                  ],
                },
                dailyPercentage: {
                  $round: [
                    {
                      $multiply: [
                        { $divide: ["$$d.count", "$monthCount"] },
                        100,
                      ],
                    },
                    2,
                  ],
                },
              },
            },
          },
        },
      },
      {
        $addFields: {
          month: {
            $arrayElemAt: [
              [
                "", // 0 placeholder
                "January",
                "February",
                "March",
                "April",
                "May",
                "June",
                "July",
                "August",
                "September",
                "October",
                "November",
                "December",
              ],
              "$month",
            ],
          },
        },
      },
      {
        $sort: { month: 1 },
      },
    ]);
    if (!bookings || bookings.length === 0) {
      return res.status(StatusCodes.OK).json({
        datePercentages: [],
      });
    }
    res.status(StatusCodes.OK).json({
      datePercentages: bookings,
    });
  }
};

const datePercentagePitch = async (req, res) => {
  const { companyId, role } = req.user;
  const { id } = req.params;
  if (!id) {
    throw new BadRequestError("Please provide required data");
  }
  if (role === "owner") {
    const bookings = await Booking.aggregate([
      {
        $match: {
          company: new mongoose.Types.ObjectId(companyId),
          pitch: new mongoose.Types.ObjectId(id),
          status: { $in: ["completed", "confirmed"] },
          "price.paid": true,
        },
      },
      {
        $project: {
          month: { $month: "$createdAt" },
          weekday: { $dayOfWeek: "$createdAt" }, // 1 = Sunday, 2 = Monday, ..., 7 = Saturday
        },
      },
      {
        $facet: {
          monthlyCounts: [
            {
              $group: {
                _id: "$month",
                count: { $sum: 1 },
              },
            },
          ],
          dayCounts: [
            {
              $group: {
                _id: { month: "$month", weekday: "$weekday" },
                count: { $sum: 1 },
              },
            },
          ],
          total: [{ $count: "globalTotal" }],
        },
      },
      {
        $project: {
          total: { $arrayElemAt: ["$total", 0] },
          monthlyCounts: 1,
          dayCounts: 1,
        },
      },
      {
        $unwind: "$monthlyCounts",
      },
      {
        $project: {
          month: "$monthlyCounts._id",
          monthCount: "$monthlyCounts.count",
          total: "$total.globalTotal",
          dayCounts: 1,
        },
      },
      {
        $addFields: {
          monthlyPercentage: {
            $round: [
              { $multiply: [{ $divide: ["$monthCount", "$total"] }, 100] },
              2,
            ],
          },
          days: {
            $filter: {
              input: "$dayCounts",
              as: "day",
              cond: { $eq: ["$$day._id.month", "$month"] },
            },
          },
        },
      },
      {
        $project: {
          month: 1,
          monthlyPercentage: 1,
          days: {
            $map: {
              input: "$days",
              as: "d",
              in: {
                day: {
                  $arrayElemAt: [
                    [
                      "", // 0 placeholder
                      "Sunday",
                      "Monday",
                      "Tuesday",
                      "Wednesday",
                      "Thursday",
                      "Friday",
                      "Saturday",
                    ],
                    "$$d._id.weekday",
                  ],
                },
                dailyPercentage: {
                  $round: [
                    {
                      $multiply: [
                        { $divide: ["$$d.count", "$monthCount"] },
                        100,
                      ],
                    },
                    2,
                  ],
                },
              },
            },
          },
        },
      },
      {
        $addFields: {
          month: {
            $arrayElemAt: [
              [
                "", // 0 placeholder
                "January",
                "February",
                "March",
                "April",
                "May",
                "June",
                "July",
                "August",
                "September",
                "October",
                "November",
                "December",
              ],
              "$month",
            ],
          },
        },
      },
      {
        $sort: { month: 1 },
      },
    ]);
    if (!bookings || bookings.length === 0) {
      return res.status(StatusCodes.OK).json({
        datePercentages: [],
      });
    }
    res.status(StatusCodes.OK).json({
      datePercentages: bookings,
    });
  }
  if (role === "admin") {
    const bookings = await Booking.aggregate([
      {
        $match: {
          pitch: new mongoose.Types.ObjectId(id),
          status: { $in: ["completed", "confirmed"] },
          "price.paid": true,
        },
      },
      {
        $project: {
          month: { $month: "$createdAt" },
          weekday: { $dayOfWeek: "$createdAt" },
        },
      },
      {
        $facet: {
          monthlyCounts: [
            {
              $group: {
                _id: "$month",
                count: { $sum: 1 },
              },
            },
          ],
          dayCounts: [
            {
              $group: {
                _id: { month: "$month", weekday: "$weekday" },
                count: { $sum: 1 },
              },
            },
          ],
          total: [{ $count: "globalTotal" }],
        },
      },
      {
        $project: {
          total: { $arrayElemAt: ["$total", 0] },
          monthlyCounts: 1,
          dayCounts: 1,
        },
      },
      {
        $unwind: "$monthlyCounts",
      },
      {
        $project: {
          month: "$monthlyCounts._id",
          monthCount: "$monthlyCounts.count",
          total: "$total.globalTotal",
          dayCounts: 1,
        },
      },
      {
        $addFields: {
          monthlyPercentage: {
            $round: [
              { $multiply: [{ $divide: ["$monthCount", "$total"] }, 100] },
              2,
            ],
          },
          days: {
            $filter: {
              input: "$dayCounts",
              as: "day",
              cond: { $eq: ["$$day._id.month", "$month"] },
            },
          },
        },
      },
      {
        $project: {
          month: 1,
          monthlyPercentage: 1,
          days: {
            $map: {
              input: "$days",
              as: "d",
              in: {
                day: {
                  $arrayElemAt: [
                    [
                      "", // 0 placeholder
                      "Sunday",
                      "Monday",
                      "Tuesday",
                      "Wednesday",
                      "Thursday",
                      "Friday",
                      "Saturday",
                    ],
                    "$$d._id.weekday",
                  ],
                },
                dailyPercentage: {
                  $round: [
                    {
                      $multiply: [
                        { $divide: ["$$d.count", "$monthCount"] },
                        100,
                      ],
                    },
                    2,
                  ],
                },
              },
            },
          },
        },
      },
      {
        $addFields: {
          month: {
            $arrayElemAt: [
              [
                "", // 0 placeholder
                "January",
                "February",
                "March",
                "April",
                "May",
                "June",
                "July",
                "August",
                "September",
                "October",
                "November",
                "December",
              ],
              "$month",
            ],
          },
        },
      },
      {
        $sort: { month: 1 },
      },
    ]);
    if (!bookings || bookings.length === 0) {
      return res.status(StatusCodes.OK).json({
        datePercentages: [],
      });
    }
    res.status(StatusCodes.OK).json({
      datePercentages: bookings,
    });
  }
};

const dailyEarned = async (req, res) => {
  const { companyId, role } = req.user;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (role === "owner") {
    const bookings = await Booking.aggregate([
      {
        $match: {
          company: new mongoose.Types.ObjectId(companyId),
          createdAt: { $gte: yesterday, $lt: new Date() },
          status: { $in: ["completed", "confirmed"] },
          "price.paid": true,
        },
      },
      {
        $addFields: {
          dayLabel: {
            $cond: [{ $gte: ["$createdAt", today] }, "today", "yesterday"],
          },
        },
      },
      {
        $group: {
          _id: "$dayLabel",
          totalEarned: { $sum: "$price.hourlyRate" },
          totalBookings: { $sum: 1 },
        },
      },
      {
        $group: {
          _id: null,
          data: {
            $push: {
              k: "$_id",
              v: {
                totalEarned: "$totalEarned",
                totalBookings: "$totalBookings",
              },
            },
          },
        },
      },
      {
        $replaceRoot: {
          newRoot: {
            $arrayToObject: "$data",
          },
        },
      },
      {
        $project: {
          today: 1,
          yesterday: 1,
          earnedChangePercent: {
            $cond: [
              { $gt: ["$yesterday.totalEarned", 0] },
              {
                $round: [
                  {
                    $multiply: [
                      {
                        $divide: [
                          {
                            $subtract: [
                              "$today.totalEarned",
                              "$yesterday.totalEarned",
                            ],
                          },
                          "$yesterday.totalEarned",
                        ],
                      },
                      100,
                    ],
                  },
                  2,
                ],
              },
              null,
            ],
          },
          bookingChangePercent: {
            $cond: [
              { $gt: ["$yesterday.totalBookings", 0] },
              {
                $round: [
                  {
                    $multiply: [
                      {
                        $divide: [
                          {
                            $subtract: [
                              "$today.totalBookings",
                              "$yesterday.totalBookings",
                            ],
                          },
                          "$yesterday.totalBookings",
                        ],
                      },
                      100,
                    ],
                  },
                  2,
                ],
              },
              null,
            ],
          },
        },
      },
    ]);

    if (!bookings) {
      return res.status(StatusCodes.OK).json({
        dailyRatios: {},
      });
    }
    res.status(StatusCodes.OK).json({
      dailyRatios: bookings,
    });
  }
  if (role === "admin") {
    const { id } = req.params;
    if (!id) {
      throw new BadRequestError("Please provide require data");
    }
    const bookings = await Booking.aggregate([
      {
        $match: {
          company: new mongoose.Types.ObjectId(id),
          createdAt: { $gte: yesterday, $lt: new Date() },
          status: { $in: ["completed", "confirmed"] },
          "price.paid": true,
        },
      },
      {
        $addFields: {
          dayLabel: {
            $cond: [{ $gte: ["$createdAt", today] }, "today", "yesterday"],
          },
        },
      },
      {
        $group: {
          _id: "$dayLabel",
          totalEarned: { $sum: "$price.hourlyRate" },
          totalBookings: { $sum: 1 },
        },
      },
      {
        $group: {
          _id: null,
          data: {
            $push: {
              k: "$_id",
              v: {
                totalEarned: "$totalEarned",
                totalBookings: "$totalBookings",
              },
            },
          },
        },
      },
      {
        $replaceRoot: {
          newRoot: {
            $arrayToObject: "$data",
          },
        },
      },
      {
        $project: {
          today: 1,
          yesterday: 1,
          earnedChangePercent: {
            $cond: [
              { $gt: ["$yesterday.totalEarned", 0] },
              {
                $round: [
                  {
                    $multiply: [
                      {
                        $divide: [
                          {
                            $subtract: [
                              "$today.totalEarned",
                              "$yesterday.totalEarned",
                            ],
                          },
                          "$yesterday.totalEarned",
                        ],
                      },
                      100,
                    ],
                  },
                  2,
                ],
              },
              null,
            ],
          },
          bookingChangePercent: {
            $cond: [
              { $gt: ["$yesterday.totalBookings", 0] },
              {
                $round: [
                  {
                    $multiply: [
                      {
                        $divide: [
                          {
                            $subtract: [
                              "$today.totalBookings",
                              "$yesterday.totalBookings",
                            ],
                          },
                          "$yesterday.totalBookings",
                        ],
                      },
                      100,
                    ],
                  },
                  2,
                ],
              },
              null,
            ],
          },
        },
      },
    ]);
    if (!bookings) {
      return res.status(StatusCodes.OK).json({
        dailyRatios: {},
      });
    }
    res.status(StatusCodes.OK).json({
      dailyRatios: bookings,
    });
  }
};

const dailyEarnedPitch = async (req, res) => {
  const { companyId, role } = req.user;
  const { id } = req.params;
  if (!id) {
    throw new BadRequestError("Please provide require data");
  }
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (role === "owner") {
    const bookings = await Booking.aggregate([
      {
        $match: {
          company: new mongoose.Types.ObjectId(companyId),
          pitch: new mongoose.Types.ObjectId(id),
          createdAt: { $gte: yesterday, $lt: new Date() },
          status: { $in: ["completed", "confirmed"] },
          "price.paid": true,
        },
      },
      {
        $addFields: {
          dayLabel: {
            $cond: [{ $gte: ["$createdAt", today] }, "today", "yesterday"],
          },
        },
      },
      {
        $group: {
          _id: "$dayLabel",
          totalEarned: { $sum: "$price.hourlyRate" },
          totalBookings: { $sum: 1 },
        },
      },
      {
        $group: {
          _id: null,
          data: {
            $push: {
              k: "$_id",
              v: {
                totalEarned: "$totalEarned",
                totalBookings: "$totalBookings",
              },
            },
          },
        },
      },

      {
        $replaceRoot: {
          newRoot: {
            $arrayToObject: "$data",
          },
        },
      },
      {
        $project: {
          today: 1,
          yesterday: 1,
          totalEarnedChangePercent: {
            $cond: [
              { $gt: ["$yesterday.totalEarned", 0] },
              {
                $round: [
                  {
                    $multiply: [
                      {
                        $divide: [
                          {
                            $subtract: [
                              "$today.totalEarned",
                              "$yesterday.totalEarned",
                            ],
                          },
                          "$yesterday.totalEarned",
                        ],
                      },
                      100,
                    ],
                  },
                  2,
                ],
              },
              null,
            ],
          },
          bookingChangePercent: {
            $cond: [
              { $gt: ["$yesterday.totalBookings", 0] },
              {
                $round: [
                  {
                    $multiply: [
                      {
                        $divide: [
                          {
                            $subtract: [
                              "$today.totalBookings",
                              "$yesterday.totalBookings",
                            ],
                          },
                          "$yesterday.totalBookings",
                        ],
                      },
                      100,
                    ],
                  },
                  2,
                ],
              },
              null,
            ],
          },
        },
      },
    ]);
    if (!bookings) {
      return res.status(StatusCodes.OK).json({
        dailyRatios: {},
      });
    }
    res.status(StatusCodes.OK).json({
      dailyRatios: bookings,
    });
  }
  if (role === "admin") {
    const bookings = await Booking.aggregate([
      {
        $match: {
          pitch: new mongoose.Types.ObjectId(id),
          createdAt: { $gte: yesterday, $lt: new Date() },
          status: { $in: ["completed", "confirmed"] },
          "price.paid": true,
        },
      },
      {
        $addFields: {
          dayLabel: {
            $cond: [{ $gte: ["$createdAt", today] }, "today", "yesterday"],
          },
        },
      },
      {
        $group: {
          _id: "$dayLabel",
          totalEarned: { $sum: "$price.hourlyRate" },
          totalBookings: { $sum: 1 },
        },
      },
      {
        $group: {
          _id: null,
          data: {
            $push: {
              k: "$_id",
              v: {
                totalEarned: "$totalEarned",
                totalBookings: "$totalBookings",
              },
            },
          },
        },
      },
      {
        $replaceRoot: {
          newRoot: {
            $arrayToObject: "$data",
          },
        },
      },
      {
        $project: {
          today: 1,
          yesterday: 1,
          totalEarnedChangePercent: {
            $cond: [
              { gt: ["$yesterday.totalEarned", 0] },
              {
                $round: [
                  {
                    $multiply: [
                      {
                        $divide: [
                          {
                            $subtract: [
                              "$today.totalEarned",
                              "$yesterday.totalEarned",
                            ],
                          },
                          "$yesterday.totalEarned",
                        ],
                      },
                      100,
                    ],
                  },
                  2,
                ],
              },
              null,
            ],
          },
          bookingChangePercent: {
            $cond: [
              { gt: ["$yesterday.totalBookings", 0] },
              {
                $round: [
                  {
                    $multiply: [
                      {
                        $divide: [
                          {
                            $subtract: [
                              "$today.totalBookings",
                              "$yesterday.totalBookings",
                            ],
                          },
                          "$yesterday.totalBookings",
                        ],
                      },
                      100,
                    ],
                  },
                  2,
                ],
              },
              null,
            ],
          },
        },
      },
    ]);
    if (!bookings) {
      return res.status(StatusCodes.OK).json({
        dailyRatios: {},
      });
    }
    res.status(StatusCodes.OK).json({
      dailyRatios: bookings,
    });
  }
};

module.exports = {
  totalEarned,
  statusMetrics,
  pitchEarned,
  pitchStatusMetrics,
  previousStatusMetrics,
  previousTotalEarned,
  previousRefundedTotal,
  previousPitchStatusMetrics,
  previousPitchTotalEarned,
  previousPitchRefundedTotal,
  currentConfirmedBookings,
  currentPendingBookings,
  currentStatusMetrics,
  currentConfirmedPitchBookings,
  currentPendingPitchBookings,
  currentPitchStatusMetrics,
  averageCompanyRating,
  bestCustomers,
  datePercentage,
  datePercentagePitch,
  dailyEarned,
  dailyEarnedPitch,
};
