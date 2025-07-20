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

  await Booking.create({
    pitch: pitchId,
    company: pitch.company,
    bookedBy: userId,
    start: dateToIso(start),
    totalPlayers,
    notes,
    method,
    price,
  });

  res.status(StatusCodes.CREATED).json({
    message: "Booking created successfully",
    success: true,
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
    "-__v -price.middlemanShare -price.middlemanTax -price.middlemanTxId -price.pitchTxId ";
  const previousBookings = await Booking.find({
    bookedBy: userId,
    $or: [{ status: "completed" }, { status: "cancelled" }],
  })
    .select(userSelectedFields)
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .lean()
    .populate({
      path: "pitch",
      select:
        "name location facilities specifications pricing media contact rating refundAllowed _id",
    })
    .populate({
      path: "bookedBy",
      select:
        "name email profilePicture goalKeeper  description phoneNumber _id",
    })
    .populate({
      path: "cancel.by",
      select:
        "name email profilePicture  goalKeeper phone description logo phoneNumber _id  ",
    })
    .populate({
      path: "refunded.by",
      select:
        "name email profilePicture  goalKeeper phone description logo phoneNumber _id",
    });
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
    count: previousBookings.length,
    limit,
  });
};

const getCurrentUserBookings = async (req, res) => {
  const { userId } = req.user;
  const userSelectedFields =
    "-__v -price.middlemanShare -price.middlemanTax -price.middlemanTxId -price.pitchTxId ";
  const currentUserBookings = await Booking.find({
    bookedBy: userId,
    $or: [{ status: "pending" }, { status: "confirmed" }],
  })
    .select(userSelectedFields)
    .sort("-start")
    .lean()
    .populate({
      path: "pitch",
      select:
        "name location facilities specifications pricing media contact rating refundAllowed _id",
    })
    .populate({
      path: "bookedBy",
      select:
        "name email profilePicture goalKeeper phoneNumber description _id",
    })
    .populate({
      path: "cancel.by",
      select:
        "name email profilePicture goalKeeper phoneNumber description logo _id ",
    })
    .populate({
      path: "refunded.by",
      select:
        "name email profilePicture goalKeeper phoneNumber description logo _id",
    });

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
    const ownerSelectedFields =
      "-__v -price.middlemanTax -price.middlemanTxId ";
    const companyBookings = await Booking.find({
      company: companyId,
      ...searchQuery,
    })
      .select(select)
      .select(ownerSelectedFields)
      .limit(limit)
      .skip(skip)
      .sort(sort)
      .lean()
      .populate({
        path: "pitch",
        select:
          "name location facilities specifications pricing media contact rating refundAllowed _id",
      })
      .populate({
        path: "bookedBy",
        select:
          "name email profilePicture goalKeeper description phoneNumber _id",
      })
      .populate({
        path: "cancel.by",
        select:
          "name email profilePicture goalKeeper phone description phoneNumber logo _id ",
      })
      .populate({
        path: "refunded.by",
        select:
          "name email profilePicture goalKeeper phone description phoneNumber logo _id",
      });
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
      count: companyBookings.length,
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
    const ownerSelectedFields =
      "-__v -price.middlemanTax -price.middlemanTxId ";
    const companyBookings = await Booking.find({
      company: companyId,
      $or: [{ status: "completed" }, { status: "cancelled" }],
      ...searchQuery,
    })
      .select(select)
      .select(ownerSelectedFields)
      .limit(limit)
      .skip(skip)
      .sort(sort)
      .lean()
      .populate({
        path: "pitch",
        select:
          "name location facilities specifications pricing media contact rating refundAllowed _id",
      })
      .populate({
        path: "bookedBy",
        select:
          "name email profilePicture goalKeeper description phoneNumber _id",
      })
      .populate({
        path: "cancel.by",
        select:
          "name email profilePicture goalKeeper phone description logo phoneNumber _id ",
      })
      .populate({
        path: "refunded.by",
        select:
          "name email profilePicture goalKeeper phone description logo phoneNumber _id",
      });
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
      count: companyBookings.length,
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
    const ownerSelectedFields =
      "-__v -price.middlemanTax -price.middlemanTxId ";
    const companyBookings = await Booking.find({
      company: companyId,
      $or: [{ status: "pending" }, { status: "confirmed" }],
      ...searchQuery,
    })
      .select(select)
      .select(ownerSelectedFields)
      .limit(limit)
      .skip(skip)
      .sort(sort)
      .lean()
      .populate({
        path: "pitch",
        select:
          "name location facilities specifications pricing media contact rating refundAllowed _id",
      })
      .populate({
        path: "bookedBy",
        select:
          "name email profilePicture goalKeeper description phoneNumber _id",
      })
      .populate({
        path: "cancel.by",
        select:
          "name email profilePicture goalKeeper phone description logo phoneNumber _id ",
      })
      .populate({
        path: "refunded.by",
        select:
          "name email profilePicture goalKeeper phone description logo phoneNumber _id",
      });
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
      count: companyBookings.length,
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
      "-__v -price.middlemanShare -price.middlemanTax -price.middlemanTxId -price.pitchTxId ";
    const booking = await Booking.findOne({
      _id: id,
      bookedBy: req.user.userId,
    })
      .select(userSelectedFields)
      .lean()
      .populate({
        path: "pitch",
        select:
          "name location facilities specifications pricing media contact rating refundAllowed _id",
      })
      .populate({
        path: "bookedBy",
        select:
          "name email profilePicture goalKeeper description phoneNumber _id",
      })
      .populate({
        path: "cancel.by",
        select:
          "name email profilePicture goalKeeper phone description logo phoneNumber _id ",
      })
      .populate({
        path: "refunded.by",
        select:
          "name email profilePicture goalKeeper phone description logo phoneNumber _id",
      });
    if (!booking) {
      throw new NotFoundError("Booking not found for this user");
    }
    res.status(StatusCodes.OK).json({
      booking,
    });
  }
  if (role === "owner") {
    const ownerSelectedFields =
      "-__v -price.middlemanTax -price.middlemanTxId ";
    const booking = await Booking.findOne({
      _id: id,
      company: companyId,
    })
      .select(ownerSelectedFields)
      .lean()
      .populate({
        path: "pitch",
        select:
          "name location facilities specifications pricing media contact rating refundAllowed _id",
      })
      .populate({
        path: "bookedBy",
        select:
          "name email profilePicture goalKeeper description phoneNumber _id",
      })
      .populate({
        path: "cancel.by",
        select:
          "name email profilePicture goalKeeper phone description logo phoneNumber _id ",
      })
      .populate({
        path: "refunded.by",
        select:
          "name email profilePicture goalKeeper phone description logo phoneNumber _id",
      });
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
  const { role, userId } = req.user;

  if (!id) {
    throw new BadRequestError("Please provide required data");
  }
  if (role === "user") {
    const booking = await Booking.findOneAndUpdate(
      { _id: id, bookedBy: userId },
      { "price.paid": true },
      { new: true, runValidators: true, timestamps: true }
    )
      .lean()
      .populate({
        path: "pitch",
        select:
          "name location facilities specifications pricing media contact rating refundAllowed _id",
      })
      .populate({
        path: "bookedBy",
        select:
          "name email profilePicture goalKeeper description phoneNumber _id",
      })
      .populate({
        path: "cancel.by",
        select:
          "name email profilePicture goalKeeper phone description logo phoneNumber _id ",
      })
      .populate({
        path: "refunded.by",
        select:
          "name email profilePicture goalKeeper phone description logo phoneNumber _id",
      });
    if (!booking) {
      throw new NotFoundError("Booking not found fort this user");
    }
    res.status(StatusCodes.OK).json({
      booking,
    });
  }

  if (role === "admin") {
    const booking = await Booking.findOneAndUpdate(
      { _id: id },
      { "price.paid": true },
      { new: true, runValidators: true, timestamps: true }
    ).lean();
    if (!booking) {
      throw new NotFoundError("Booking not found");
    }
    res.status(StatusCodes.OK).json({
      booking,
    });
  }
};

const updateBooking = async (req, res) => {
  const { totalPlayers, notes } = req.body;
  const { id } = req.params;
  const { userId, role } = req.user;
  if (!id) {
    throw new BadRequestError("Please provide required data");
  }
  const updateObject = {
    totalPlayers,
    notes,
  };
  Object.keys(updateObject).forEach((key) => {
    if (updateObject[key] === undefined || updateObject[key] === null) {
      delete updateObject[key];
    }
  });
  if (role === "user") {
    const userSelectedFields =
      "-__v -price.middlemanShare -price.middlemanTax -price.middlemanTxId -price.pitchTxId ";
    const booking = await Booking.findOneAndUpdate(
      {
        _id: id,
        bookedBy: userId,
      },
      updateObject,
      { new: true, runValidators: true, timestamps: true }
    )
      .select(userSelectedFields)
      .lean()
      .populate({
        path: "pitch",
        select:
          "name location facilities specifications pricing media contact rating refundAllowed _id",
      })
      .populate({
        path: "bookedBy",
        select:
          "name email profilePicture goalKeeper description phoneNumber _id",
      })
      .populate({
        path: "cancel.by",
        select:
          "name email profilePicture goalKeeper phone description logo phoneNumber _id ",
      })
      .populate({
        path: "refunded.by",
        select:
          "name email profilePicture goalKeeper phone description logo phoneNumber _id",
      });
    if (!booking) {
      throw new NotFoundError("Booking not found");
    }
    res.status(StatusCodes.OK).json({
      booking,
    });
  }

  if (role === "admin") {
    const booking = await Booking.findOneAndUpdate(
      {
        _id: id,
      },
      updateObject,
      { new: true, runValidators: true, timestamps: true }
    ).lean();
    if (!booking) {
      throw new NotFoundError("Booking not found");
    }
    res.status(StatusCodes.OK).json({
      booking,
    });
  }
};

const replyBooking = async (req, res) => {
  const { id } = req.params;
  const { role, companyId } = req.user;
  const { status } = req.body;
  if (!id || !status) {
    throw new BadRequestError("Please provide required data");
  }

  if (role === "owner") {
    if (status === "completed") {
      throw new BadRequestError("You cannot reply with completed status");
    }
    const ownerSelectedFields =
      "-__v -price.middlemanTax -price.middlemanTxId ";
    const preBooking = await Booking.findOne({
      _id: id,
      company: companyId,
    }).lean();
    if (!preBooking) {
      throw new NotFoundError("Booking not found");
    }
    if (preBooking.status === "completed") {
      throw new BadRequestError("This booking is already completed");
    }
    if (status === "cancelled" && preBooking.price.paid) {
      throw new BadRequestError(
        "You cannot cancel a paid booking without refunding it"
      );
    }
    let booking;
    if (status !== "cancelled") {
      booking = await Booking.findOneAndUpdate(
        { _id: id, company: companyId },
        { status },
        { new: true, runValidators: true, timestamps: true }
      )
        .select(ownerSelectedFields)
        .lean()
        .populate({
          path: "pitch",
          select:
            "name location facilities specifications pricing media contact rating refundAllowed _id",
        })
        .populate({
          path: "bookedBy",
          select:
            "name email profilePicture goalKeeper description phoneNumber _id",
        })
        .populate({
          path: "cancel.by",
          select:
            "name email profilePicture goalKeeper phone description logo phoneNumber _id ",
        })
        .populate({
          path: "refunded.by",
          select:
            "name email profilePicture goalKeeper phone description logo phoneNumber _id",
        });
    } else if (status === "cancelled") {
      const { reason } = req.body;
      if (!reason) {
        throw new BadRequestError(
          "Please provide a reason for the cancellation"
        );
      }
      booking = await Booking.findOneAndUpdate(
        {
          _id: id,
          company: companyId,
        },
        {
          status,
          "cancel.at": new Date(Date.now()).toISOString(),
          "cancel.by": companyId,
          "cancel.reason": reason,
          cancelModel: "Company",
        },
        { new: true, runValidators: true, timestamps: true }
      )
        .select(ownerSelectedFields)
        .lean()
        .populate({
          path: "pitch",
          select:
            "name location facilities specifications pricing media contact rating refundAllowed _id",
        })
        .populate({
          path: "bookedBy",
          select:
            "name email profilePicture goalKeeper description phoneNumber _id",
        })
        .populate({
          path: "cancel.by",
          select:
            "name email profilePicture goalKeeper phone description logo phoneNumber _id ",
        })
        .populate({
          path: "refunded.by",
          select:
            "name email profilePicture goalKeeper phone description logo phoneNumber _id",
        });
    }

    res.status(StatusCodes.OK).json({
      booking,
    });
  }
  if (role === "admin") {
    let booking;
    if (status !== "cancelled") {
      booking = await Booking.findOneAndUpdate(
        { _id: id },
        { status },
        { new: true, runValidators: true }
      ).lean();
    } else if (status === "cancelled") {
      const { reason } = req.body;
      if (!reason) {
        throw new BadRequestError(
          "Please provide a reason for the cancellation"
        );
      }
      booking = await Booking.findOneAndUpdate(
        {
          _id: id,
        },
        {
          status,
          "cancel.at": new Date(Date.now()).toISOString(),
          "cancel.by": req.user.userId,
          "cancel.reason": reason,
          cancelModel: "User",
        },
        {
          new: true,
          runValidators: true,
          timestamps: true,
        }
      );
    }
    if (!booking) {
      throw new NotFoundError("Booking not found");
    }
    res.status(StatusCodes.OK).json({
      booking,
    });
  }
};

const cancelBookingUser = async (req, res) => {
  const { id } = req.params;
  const { role, userId } = req.user;
  const { reason } = req.body;
  if (!id) {
    throw new BadRequestError("Please provide required data");
  }
  if (!reason) {
    throw new BadRequestError("Please provide a reason for the cancellation");
  }
  if (role === "user") {
    const preBooking = await Booking.findOne({
      _id: id,
      bookedBy: userId,
    }).lean();
    if (!preBooking) {
      throw new NotFoundError("Booking not found for this user");
    }
    if (preBooking.status === "completed") {
      throw new BadRequestError("You cannot cancel a completed booking");
    }
    if (preBooking.status === "cancelled") {
      throw new BadRequestError("This booking is already cancelled");
    }
    if (preBooking.price.paid) {
      throw new BadRequestError(
        "You cannot cancel a paid booking without refunding it"
      );
    }
    const userSelectedFields =
      "-__v -price.middlemanShare -price.middlemanTax -price.middlemanTxId -price.pitchTxId ";
    const booking = await Booking.findOneAndUpdate(
      { _id: id, bookedBy: userId },
      {
        status: "cancelled",
        "cancel.at": new Date(Date.now()).toISOString(),
        "cancel.by": userId,
        "cancel.reason": reason,
        cancelModel: "User",
      },
      { new: true, runValidators: true, timestamps: true }
    )
      .select(userSelectedFields)
      .lean()
      .populate({
        path: "pitch",
        select:
          "name location facilities specifications pricing media contact rating refundAllowed _id",
      })
      .populate({
        path: "bookedBy",
        select:
          "name email profilePicture goalKeeper description phoneNumber _id",
      })
      .populate({
        path: "cancel.by",
        select:
          "name email profilePicture goalKeeper phone description logo phoneNumber _id ",
      })
      .populate({
        path: "refunded.by",
        select:
          "name email profilePicture goalKeeper phone description logo phoneNumber _id",
      });
    res.status(StatusCodes.OK).json({
      booking,
    });
  }
  if (role === "admin") {
    const booking = await Booking.findOneAndUpdate(
      { _id: id },
      {
        status: "cancelled",
        "cancel.at": new Date(Date.now()).toISOString(),
        "cancel.by": userId,
        "cancel.reason": reason,
        cancelModel: "User",
      },
      { new: true, runValidators: true, timestamps: true }
    );
    if (!booking) {
      throw new NotFoundError("Booking not found");
    }
    res.status(StatusCodes.OK).json({
      booking,
    });
  }
};

const switchBooking = async (req, res) => {
  const { id } = req.params;
  const { role, companyId } = req.user;
  const { start, pitch } = req.body;
  const updateObject = {
    start: dateToIso(start),

    pitch,
  };
  if (!id) {
    throw new BadRequestError("Please provide required data");
  }
  Object.keys(updateObject).forEach((key) => {
    if (updateObject[key] === undefined || updateObject[key] === null) {
      delete updateObject[key];
    }
  });
  if (role === "owner") {
    const preBooking = await Booking.findOne({
      _id: id,
      company: companyId,
    }).lean();
    if (!preBooking) {
      throw new NotFoundError("Booking not found");
    }
    if (preBooking.status === "completed") {
      throw new BadRequestError("This booking is already completed");
    }
    const ownerSelectedFields =
      "-__v -price.middlemanTax -price.middlemanTxId ";
    const booking = await Booking.findOneAndUpdate(
      { _id: id, company: companyId },
      updateObject,
      { new: true, runValidators: true, timestamps: true }
    )
      .select(ownerSelectedFields)
      .lean()
      .populate({
        path: "pitch",
        select:
          "name location facilities specifications pricing media contact rating refundAllowed _id",
      })
      .populate({
        path: "bookedBy",
        select:
          "name email profilePicture goalKeeper description phoneNumber _id",
      })
      .populate({
        path: "cancel.by",
        select:
          "name email profilePicture goalKeeper phone description logo phoneNumber _id ",
      })
      .populate({
        path: "refunded.by",
        select:
          "name email profilePicture goalKeeper phone description logo phoneNumber _id",
      });
    res.status(StatusCodes.OK).json({
      booking,
    });
  }
  if (role === "admin") {
    const booking = await Booking.findOneAndUpdate({ _id: id }, updateObject, {
      new: true,
      runValidators: true,
      timestamps: true,
    }).lean();
    if (!booking) {
      throw new NotFoundError("Booking not found");
    }
    res.status(StatusCodes.OK).json({
      booking,
    });
  }
};

const refundBooking = async (req, res) => {
  const { id } = req.params;
  const { role, userId } = req.user;
  const { reason } = req.body;
  if (!id) {
    throw new BadRequestError("Please provide required data");
  }
  if (!reason) {
    throw new BadRequestError("Please provide a reason for the refund");
  }
  if (role === "user") {
    const booking = await Booking.findOne({ _id: id, bookedBy: userId }).lean();
    if (!booking) {
      throw new NotFoundError("Booking not found for this user");
    }
    if (booking.status === "completed") {
      throw new BadRequestError("You cannot refund a completed booking");
    }
    if (booking.status === "cancelled") {
      throw new BadRequestError("This booking is already cancelled");
    }

    if (!booking.price.paid) {
      throw new BadRequestError("This booking is not paid, no need to refund");
    }
    // ----------------- Refund logic here -----------------
    const userSelectedFields =
      "-__v -price.middlemanShare -price.middlemanTax -price.middlemanTxId -price.pitchTxId ";
    const updatedBooking = await Booking.findOneAndUpdate(
      { _id: id, bookedBy: userId },
      {
        status: "cancelled",
        "cancel.at": new Date(Date.now()).toISOString(),
        "cancel.by": userId,
        "cancel.reason": reason,
        "price.paid": false,
        cancelModel: "User",
        "refunded.at": new Date(Date.now()).toISOString(),
        "refunded.by": userId,
        "refunded.reason": reason,
        refundedModel: "User",
      },
      { new: true, runValidators: true, timestamps: true }
    )
      .select(userSelectedFields)
      .lean()
      .populate({
        path: "pitch",
        select:
          "name location facilities specifications pricing media contact rating refundAllowed _id",
      })
      .populate({
        path: "bookedBy",
        select:
          "name email profilePicture goalKeeper description phoneNumber _id",
      })
      .populate({
        path: "cancel.by",
        select:
          "name email profilePicture goalKeeper phone description logo phoneNumber _id ",
      })
      .populate({
        path: "refunded.by",
        select:
          "name email profilePicture goalKeeper phone description logo phoneNumber _id",
      });
    res.status(StatusCodes.OK).json({
      booking: updatedBooking,
    });
  }
  if (role === "admin") {
    // ----------------- Refund logic here -----------------
    const booking = await Booking.findOneAndUpdate(
      { _id: id },
      {
        status: "cancelled",
        "cancel.at": new Date(Date.now()).toISOString(),
        "cancel.by": userId,
        "cancel.reason": reason,
        "price.paid": false,
        cancelModel: "User",
        "refunded.at": new Date(Date.now()).toISOString(),
        "refunded.by": userId,
        "refunded.reason": reason,
        refundedModel: "User",
      },
      { new: true, runValidators: true, timestamps: true }
    ).lean();
    if (!booking) {
      throw new NotFoundError("Booking not found");
    }
    res.status(StatusCodes.OK).json({ booking });
  }
};

const rejectBooking = async (req, res) => {
  const { id } = req.params;
  const { role, companyId } = req.user;
  const { reason } = req.body;
  if (!id) {
    throw new BadRequestError("Please provide required data");
  }
  if (!reason) {
    throw new BadRequestError("Please provide a reason for the rejection");
  }
  if (role === "owner") {
    const preBooking = await Booking.findOne({
      _id: id,
      company: companyId,
    }).lean();
    if (!preBooking) {
      throw new NotFoundError("Booking not found");
    }
    if (preBooking.status === "completed") {
      throw new BadRequestError("This booking is already completed");
    }
    if (preBooking.status === "cancelled") {
      throw new BadRequestError("This booking is already cancelled");
    }

    if (!preBooking.price.paid) {
      throw new BadRequestError("This booking is not paid, no need to reject");
    }

    // ----------------- Refund logic here -----------------

    const ownerSelectedFields =
      "-__v -price.middlemanTax -price.middlemanTxId ";
    const booking = await Booking.findOneAndUpdate(
      { _id: id, company: companyId },
      {
        status: "cancelled",
        "cancel.at": new Date(Date.now()).toISOString(),
        "cancel.by": companyId,
        "cancel.reason": reason,
        "price.paid": false,
        cancelModel: "Company",
        "refunded.at": new Date(Date.now()).toISOString(),
        "refunded.by": companyId,
        "refunded.reason": reason,
        refundedModel: "Company",
      },
      { new: true, runValidators: true, timestamps: true }
    )
      .select(ownerSelectedFields)
      .lean()
      .populate({
        path: "pitch",
        select:
          "name location facilities specifications pricing media contact rating refundAllowed _id",
      })
      .populate({
        path: "bookedBy",
        select:
          "name email profilePicture goalKeeper description phoneNumber _id",
      })
      .populate({
        path: "cancel.by",
        select:
          "name email profilePicture goalKeeper phone description logo phoneNumber _id ",
      })
      .populate({
        path: "refunded.by",
        select:
          "name email profilePicture goalKeeper phone description logo phoneNumber _id",
      });
    res.status(StatusCodes.OK).json({
      booking,
    });
  }
  if (role === "admin") {
    // ----------------- Refund logic here -----------------
    const booking = await Booking.findOneAndUpdate(
      { _id: id },
      {
        status: "cancelled",
        "cancel.at": new Date(Date.now()).toISOString(),
        "cancel.by": userId,
        "cancel.reason": reason,
        "price.paid": false,
        cancelModel: "User",
        "refunded.at": new Date(Date.now()).toISOString(),
        "refunded.by": userId,
        "refunded.reason": reason,
        refundedModel: "User",
      },
      { new: true, runValidators: true, timestamps: true }
    ).lean();
    if (!booking) {
      throw new NotFoundError("Booking not found");
    }
    res.status(StatusCodes.OK).json({ booking });
  }
};

const deleteBooking = async (req, res) => {
  const { id } = req.params;
  if (!id) {
    throw new BadRequestError("Please provide required data");
  }
  const booking = await Booking.findOne({ _id: id }).lean();
  if (!booking) {
    throw new NotFoundError("Booking not found");
  }
  await Booking.deleteOne({ _id: id });
  res.status(StatusCodes.NO_CONTENT).json({
    msg: "Booking deleted successfully",
  });
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
  cancelBookingUser,
  replyBooking,
  switchBooking,
  refundBooking,
  rejectBooking,
  deleteBooking,
  payBooking,
};
