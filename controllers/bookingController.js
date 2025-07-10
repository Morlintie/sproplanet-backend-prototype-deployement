const Booking = require("../models/Booking");
const Pitch = require("../models/Pitch");
const { BadRequestError, NotFoundError } = require("../errors");
const { StatusCodes } = require("http-status-codes");
const {
  paymentHelper,
  pitchTax,
  middlemanTax,
  dateToIso,
  companyBookingQuery,
} = require("../utils");

const createBooking = async (req, res) => {
  const { userId } = req.user;
  const { pitchId, start, totalPlayers, notes, method } = req.body;
  if (!pitchId || !start) {
    throw new BadRequestError("please provide all required data");
  }
  const pitch = await Pitch.findOne({ _id: pitchId }).lean();
  if (!pitch) {
    throw new NotFoundError("Pitch not found");
  }
  if (pitch.closed) {
    throw new BadRequestError("This pitch is closed for bookings");
  }
  if (pitch.status !== "active") {
    throw new BadRequestError("This pitch is not available for bookings");
  }

  console.log("middlemanShare", pitch.middlemanShare);

  const zeroCount = String(pitch.middlemanShare).split(".")[1].length || 0;

  let one = "1";
  for (let i = 0; i < zeroCount; i++) {
    one += "0";
  }
  const middlemanShareTimes = Number(one);

  const realPitchTax = pitchTax(pitch.pricing.hourlyRate);
  const middlemanShare =
    (pitch.pricing.hourlyRate * (pitch.middlemanShare * middlemanShareTimes)) /
    middlemanShareTimes;

  const realMiddlemanTax = middlemanTax(middlemanShare);
  const currency = pitch.pricing.currency;
  const hourlyRate = pitch.pricing.hourlyRate;

  const price = {
    hourlyRate,
    currency,
    tax: realPitchTax,
    middlemanShare: middlemanShare,
    middlemanTax: realMiddlemanTax,
    total: hourlyRate + realPitchTax + middlemanShare + realMiddlemanTax,
  };
  price.pitchTxId = paymentHelper({ amount: hourlyRate + pitchTax, currency });
  price.middlemanTxId = paymentHelper({
    amount: middlemanShare + middlemanTax,
    currency,
  });

  const userSelectedFields =
    "-__v -price.middlemanShare -price.middlemanTax -price.middlemanTxId -price.pitchTxId";

  const booking = await Booking.create({
    pitch: pitchId,
    company: pitch.company,
    bookedBy: userId,
    start: dateToIso(start),
    totalPlayers,
    notes,
    method,
    price,
  })
    .select(userSelectedFields)
    .lean();
  res.status(StatusCodes.CREATED).json({
    booking,
  });
};

const getPreviousUserBookings = async (req, res) => {
  const { userId } = req.user;
  let { sort } = req.query;

  if (!sort) {
    sort = "-start";
  }

  const limit = 10;
  let page = Number(req.query.page) || 1;
  const skip = (page - 1) * limit;
  if (isNaN(page)) {
    throw new BadRequestError("Page number must be a number");
  }
  if (page < 1) {
    throw new BadRequestError("Page number cannot be less than 1");
  }
  const userSelectedFields =
    "-__v -price.middlemanShare -price.middlemanTax -price.middlemanTxId -price.pitchTxId";
  const previousBookings = await Booking.find({
    bookedBy: userId,
    $or: [{ status: "completed" }, { status: "cancelled" }],
  })
    .select(userSelectedFields)
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .lean();
  if (!previousBookings || previousBookings.length === 0) {
    throw new NotFoundError("No pervious bookings found for this user");
  }

  const pitchCount = await Booking.countDocuments({
    bookedBy: userId,
    $or: [{ status: "completed" }, { status: "cancelled" }],
  });
  res.status(StatusCodes.OK).json({
    bookings: previousBookings,
    total: pitchCount,
    limit,
  });
};

const getCurrentUserBookings = async (req, res) => {
  const { userId } = req.user;
  const userSelectedFields =
    "-__v -price.middlemanShare -price.middlemanTax -price.middlemanTxId -price.pitchTxId";
  const currentUserBookings = await Booking.find({
    bookedBy: userId,
    $or: [{ status: "pending" }, { status: "confirmed" }],
  })
    .select(userSelectedFields)
    .sort("-start")
    .lean();

  if (!currentUserBookings || currentUserBookings.length === 0) {
    throw new NotFoundError("No current bookings found for this user");
  }
  res.status(StatusCodes.OK).json({
    bookings: currentUserBookings,
  });
};

const getCompanyBookings = async (req, res) => {
  const { companyId, role } = req.user;
  let { sort, select } = req.query;
  const searchQuery = companyBookingQuery(req);
  if (!sort) {
    sort = "-createdAt";
  }

  const limit = req.query.limit ? Number(req.query.limit) : 10;
  let page = Number(req.query.page) || 1;
  const skip = (page - 1) * limit;
  if (isNaN(page)) {
    throw new BadRequestError("Page number must be a number");
  }
  if (page < 1) {
    throw new BadRequestError("Page number cannot be less than 1");
  }
  if (role === "owner") {
    const companyBookings = await Booking.find({
      company: companyId,
      ...searchQuery,
    })
      .select(select)
      .select("-__v -price.middlemanTax -price.middlemanTxId")
      .limit(limit)
      .skip(skip)
      .sort(sort)
      .lean();
    if (!companyBookings || companyBookings.length === 0) {
      throw new NotFoundError("No bookings found for this company");
    }
    const pitchCount = await Booking.countDocuments({
      company: companyId,
      ...searchQuery,
    });
    res.status(StatusCodes.OK).json({
      bookings: companyBookings,
      total: pitchCount,
      limit,
    });
  }
  if (role === "admin") {
    const { id } = req.params;
    if (!id) {
      throw new BadRequestError("Please provide required data");
    }
    const companyBookings = await Booking.find({
      company: id,
      ...searchQuery,
    })
      .select(select)
      .limit(limit)
      .skip(skip)
      .sort(sort)
      .lean();
    if (!companyBookings || companyBookings.length === 0) {
      throw new NotFoundError("No booking found for this company");
    }
    const pitchCount = await Booking.countDocuments({
      company: id,
      ...searchQuery,
    });
    res.status(StatusCodes.OK).json({
      bookings: companyBookings,
      total: pitchCount,
      limit,
    });
  }
};

const getPreviousCompanyBookings = async (req, res) => {
  const { companyId, role } = req.user;

  let { sort, select } = req.query;
  const searchQuery = companyBookingQuery(req);
  if (!sort) {
    sort = "-createdAt";
  }
  delete searchQuery?.status;

  const limit = req.query.limit ? Number(req.query.limit) : 10;
  let page = Number(req.query.page) || 1;
  const skip = (page - 1) * limit;
  if (isNaN(page)) {
    throw new BadRequestError("Page number must be a number");
  }
  if (page < 1) {
    throw new BadRequestError("Page number cannot be less than 1");
  }
  if (role === "owner") {
    const companyBookings = await Booking.find({
      company: companyId,
      $or: [{ status: "completed" }, { status: "cancelled" }],
      ...searchQuery,
    })
      .select(select)
      .select("-__v -price.middlemanTax -price.middlemanTxId")
      .limit(limit)
      .skip(skip)
      .sort(sort)
      .lean();
    if (!companyBookings || companyBookings.length === 0) {
      throw new NotFoundError("No bookings found for this company");
    }
    const pitchCount = await Booking.countDocuments({
      company: companyId,
      ...searchQuery,
    });
    res.status(StatusCodes.OK).json({
      bookings: companyBookings,
      total: pitchCount,
      limit,
    });
  }
  if (role === "admin") {
    const { id } = req.params;
    if (!id) {
      throw new BadRequestError("Please provide required data");
    }

    const companyBookings = await Booking.find({
      company: id,
      $or: [{ status: "completed" }, { status: "cancelled" }],
      ...searchQuery,
    })
      .select(select)
      .limit(limit)
      .skip(skip)
      .sort(sort)
      .lean();
    if (!companyBookings || companyBookings.length === 0) {
      throw new NotFoundError("No booking found for this company");
    }
    const pitchCount = await Booking.countDocuments({
      company: id,
      ...searchQuery,
    });
    res.status(StatusCodes.OK).json({
      bookings: companyBookings,
      total: pitchCount,
      limit,
    });
  }
};

const getCurrentCompanyBookings = async (req, res) => {
  const { companyId, role } = req.user;
  let { sort, select } = req.query;
  const searchQuery = companyBookingQuery(req);
  if (!sort) {
    sort = "-createdAt";
  }
  delete searchQuery?.status;

  const limit = req.query.limit ? Number(req.query.limit) : 10;
  let page = Number(req.query.page) || 1;
  const skip = (page - 1) * limit;
  if (isNaN(page)) {
    throw new BadRequestError("Page number must be a number");
  }
  if (page < 1) {
    throw new BadRequestError("Page number cannot be less than 1");
  }

  if (role === "owner") {
    const companyBookings = await Booking.find({
      company: companyId,
      $or: [{ status: "pending" }, { status: "confirmed" }],
      ...searchQuery,
    })
      .select(select)
      .select("-__v -price.middlemanTax -price.middlemanTxId")
      .limit(limit)
      .skip(skip)
      .sort(sort)
      .lean();
    if (!companyBookings || companyBookings.length === 0) {
      throw new NotFoundError("No bookings found for this company");
    }
    const pitchCount = await Booking.countDocuments({
      company: companyId,
      ...searchQuery,
    });
    res.status(StatusCodes.OK).json({
      bookings: companyBookings,
      total: pitchCount,
      limit,
    });
  }
  if (role === "admin") {
    const { id } = req.params;
    if (!id) {
      throw new BadRequestError("Please provide required data");
    }

    const companyBookings = await Booking.find({
      company: id,
      $or: [{ status: "pending" }, { status: "confirmed" }],
      ...searchQuery,
    })
      .select(select)
      .limit(limit)
      .skip(skip)
      .sort(sort)
      .lean();
    if (!companyBookings || companyBookings.length === 0) {
      throw new NotFoundError("No booking found for this company");
    }
    const pitchCount = await Booking.countDocuments({
      company: id,
      ...searchQuery,
    });
    res.status(StatusCodes.OK).json({
      bookings: companyBookings,
      total: pitchCount,
      limit,
    });
  }
};

const getSingleBooking = async (req, res) => {
  const { id } = req.params;
  const { role } = req.user;
  if (!id) {
    throw new BadRequestError("Please provide required data");
  }

  if (role === "user") {
    const userSelectedFields =
      "-__v -price.middlemanShare -price.middlemanTax -price.middlemanTxId -price.pitchTxId";
    const booking = await Booking.findOne({
      _id: id,
      bookedBy: req.user.userId,
    })
      .select(userSelectedFields)
      .lean();
    if (!booking) {
      throw new NotFoundError("Booking not found for this user");
    }
    res.status(StatusCodes.OK).json({
      booking,
    });
  }
  if (role === "owner") {
    const booking = await Booking.findOne({
      _id: id,
      company: req.user.companyId,
    })
      .select("-__v -price.middlemanTax -price.middlemanTxId")
      .lean();
    if (!booking) {
      throw new NotFoundError("Booking not found for this company");
    }
    res.status(StatusCodes.OK).json({
      booking,
    });
  }
  if (role === "admin") {
    const booking = await Booking.findOne({ _id: id }).lean();
    if (!booking) {
      throw new NotFoundError("Booking not found");
    }
    res.status(StatusCodes.OK).json({
      booking,
    });
  }
};

const payBooking = async (req, res) => {
  const { id } = req.params;
  const { role } = req.user;

  if (!id) {
    throw new BadRequestError("Please provide required data");
  }
  if (role === "user") {
    const booking = await Booking.findOneAndUpdate(
      { _id: id, bookedBy: req.user.userId },
      { "price.paid": true },
      { new: true, runValidators: true }
    );
    if (!booking) {
      throw new NotFoundError("Booking not found fort this user");
    }
    res.status(StatusCodes.OK).json({
      booking,
    });
  }
  if (role === "owner") {
    const booking = await Booking.findOneAndUpdate(
      { _id: id, company: req.user.companyId },
      { "price.paid": true },
      { new: true, runValidators: true }
    );
    if (!booking) {
      throw new NotFoundError("Booking not found for this company");
    }
    res.status(StatusCodes.OK).json({
      booking,
    });
  }
  if (role === "admin") {
    const booking = await Booking.findOneAndUpdate(
      { _id: id },
      { "price.paid": true },
      { new: true, runValidators: true }
    );
    if (!booking) {
      throw new NotFoundError("Booking not found");
    }
    res.status(StatusCodes.OK).json({
      booking,
    });
  }
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
  getPreviousUserBookings,
  getCurrentUserBookings,
  getCompanyBookings,
  getPreviousCompanyBookings,
  getCurrentCompanyBookings,
  getSingleBooking,
  updateBooking,
  replyBooking,
  switchBooking,
  refundBooking,
  rejectBooking,
  deleteBooking,
  payBooking,
};
