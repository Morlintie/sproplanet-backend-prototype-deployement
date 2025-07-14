const { BadRequestError, NotFoundError } = require("../errors");
const Booking = require("../models/Booking");
const Advert = require("../models/Advert");
const {
  onlineUsers,
  notificationNamespace,
} = require("../server/serverConfig");
const { StatusCodes } = require("http-status-codes");
const { dateToIso } = require("../utils");

const createAdvert = async (req, res) => {
  const { booking, playersNeeded, goalKeepersNeeded, participants, notes } =
    req.body;
  const { userId, role } = req.user;

  if (!booking) {
    const { customPitch, startsAt } = req.body;
    if (!customPitch || !startsAt) {
      throw new BadRequestError("Please provide all required data");
    }

    const createObject = {
      name: customPitch.name,

      createdBy: userId,
      startsAt: dateToIso(startsAt),
      customPitch,
      "address.location.type": customPitch?.location?.type,
      "address.location.coordinates": customPitch?.location?.coordinates,
      "address.address": customPitch?.address,
      "address.district": customPitch?.district,
      "address.city": customPitch?.city,
      playersNeeded,
      goalKeepersNeeded,
      participants,
      notes,
    };
    Object.keys(createObject).forEach((key) => {
      if (createObject[key] === undefined || createObject[key] === null) {
        delete createObject[key];
      }
    });

    await Advert.create({
      ...createObject,
    });
    return res.status(StatusCodes.CREATED).json({
      message: "Advert created successfully",
    });
  }
  const realBooking = await Booking.findOne({ _id: booking }).lean().populate({
    path: "pitch",
    select:
      "name description location specifications facilities pricing media contact rating status refundAllowed ",
  });
  if (!realBooking) {
    throw new NotFoundError("Booking not found");
  }
  if (
    realBooking.status === "completed" ||
    realBooking.status === "cancelled"
  ) {
    throw new BadRequestError("Booking is not available for new advert");
  }

  await Advert.create({
    name: realBooking.pitch.name,
    createdBy: userId,
    startsAt: realBooking.start,
    pitch: realBooking.pitch._id,
    "address.location.type": realBooking.pitch.location.type,
    "address.location.coordinates": realBooking.pitch.location.coordinates,
    "address.address": `${
      realBooking.pitch.location.address.neighborhood + " mahallesi/"
    }  ${realBooking.pitch.location.address.street + " sokak/"}  ${
      realBooking.pitch.location.district
        ? realBooking.pitch.location.district + " /"
        : ""
    } ${realBooking.pitch.location.city || ""}`,
    "address.district": realBooking.pitch.location.address.district,
    "address.city": realBooking.pitch.location.address.city,

    booking: realBooking._id,
    playersNeeded,
    goalKeepersNeeded,
    participants: participants,
    notes,
  });
  res.status(StatusCodes.CREATED).json({
    message: "Advert created successfully",
  });
};

const requestAdvert = async (req, res) => {
  // Test this route imideately, here we got the sockets
  const { id } = req.params;
  const { userId, role } = req.user;
  if (!id) {
    throw new BadRequestError("Please provide required data");
  }
  if (role === "user") {
    const advert = await Advert.findOne({ _id: id }).lean();
    if (!advert) {
      throw new NotFoundError("Advert not found");
    }
    if (advert.status !== "open") {
      throw new BadRequestError("Advert is not open for requests");
    }
    if (advert.participants.some((p) => p.user.toString() === userId)) {
      throw new BadRequestError("You are already a participant in this advert");
    }
    if (advert.waitingList.some((w) => w.user.toString() === userId)) {
      throw new BadRequestError(
        "You have already requested to join this advert"
      );
    }

    const userSelectedFields = "-__v -isDeleted -archived ";
    const newAdvert = await Advert.findOneAndUpdate(
      {
        _id: id,
      },

      {
        $addToSet: {
          waitingList: { user: userId },
        },
      },
      {
        new: true,
        runValidators: true,
      }
    )
      .select(userSelectedFields)
      .lean();

    if (onlineUsers[newAdvert.createdBy.toString()]) {
      notificationNamespace
        .to(onlineUsers[newAdvert.createdBy])
        .emit("advertRequest", {
          advertId: newAdvert._id,
        });
    }

    res.status(StatusCodes.OK).json({
      advert: newAdvert,
    });
  }
  if (role === "admin") {
    const { candidateId } = req.body;
    if (!candidateId) {
      throw new BadRequestError("Please provide candidate id");
    }
    const advert = await Advert.findOne({ _id: id }).lean();
    if (!advert) {
      throw new NotFoundError("Advert not found");
    }
    if (advert.participants.some((p) => p.user.toString() === candidateId)) {
      throw new BadRequestError(
        "Candidate is already a participant in this advert"
      );
    }

    if (advert.waitingList.some((w) => w.user.toString() === candidateId)) {
      throw new BadRequestError(
        "Candidate has already requested to join this advert"
      );
    }
    const newAdvert = await Advert.findOneAndUpdate(
      {
        _id: id,
      },
      {
        $addToSet: {
          waitingList: { user: candidateId },
        },
      },
      { new: true, runValidators: true }
    ).lean();

    if (onlineUsers[newAdvert.createdBy]) {
      notificationNamespace
        .to(onlineUsers[newAdvert.createdBy])
        .emit("advertRequest", {
          advertId: newAdvert._id,
        });
    }
    res.status(StatusCodes.OK).json({
      advert: newAdvert,
    });
  }
};

const getAllAdverts = async (req, res) => {
  const { startsAt, pitch, address, district, city, status, sort } = req.body;
  const { role } = req.user;
  let defaultSort = { startsAt: -1 };
  const searchQuery = {};

  if (sort) {
    defaultSort = sort;
  }
  if (startsAt) {
    let upperLimit;
    let lowerLimit;
    if (startsAt.upperLimit) {
      const [upperDate, upperTime] = startsAt.upperLimit.split("-");
      const [upperDay, upperMonth, upperYear] = upperDate.split(".");
      const [upperHour, upperMinute] = upperTime.split(":");
      upperLimit = new Date(
        upperYear,
        upperMonth - 1,
        upperDay,
        upperHour,
        upperMinute
      );
    }
    if (startsAt.lowerLimit) {
      const [lowerDate, lowerTime] = startsAt.lowerLimit.split("-");
      const [lowerDay, lowerMonth, lowerYear] = lowerDate.split(".");
      const [lowerHour, lowerMinute] = lowerTime.split(":");
      lowerLimit = new Date(
        lowerYear,
        lowerMonth - 1,
        lowerDay,
        lowerHour,
        lowerMinute
      );
    }
    if (upperLimit && lowerLimit) {
      if (upperLimit < lowerLimit) {
        throw new BadRequestError(
          "Upper limit cannot be less than lower limit"
        );
      }
      if (upperLimit.getTime() === lowerLimit.getTime()) {
        searchQuery.startsAt = lowerLimit;
      }
      if (upperLimit.getTime() > lowerLimit.getTime()) {
        searchQuery.startsAt = {
          $gte: lowerLimit,
          $lte: upperLimit,
        };
      }
    }
    if (upperLimit && !lowerLimit) {
      searchQuery.startsAt = {
        $lte: upperLimit,
      };
    }
    if (!upperLimit && lowerLimit) {
      searchQuery.startsAt = {
        $gte: lowerLimit,
      };
    }
  }
  if (pitch) {
    searchQuery.name = { $regex: pitch, $options: "i" };
  }
  if (address) {
    searchQuery["address.address"] = { $regex: address, $options: "i" };
  }
  if (district) {
    searchQuery["address.district"] = district;
  }
  if (city) {
    searchQuery["address.city"] = city;
  }
  if (status) {
    searchQuery.status = status;
  }

  if (role === "user") {
    const limit = 20;
    const page = req.query.page ? parseInt(req.query.page) : 1;
    const skip = (page - 1) * limit;
    const userSelectedFields = "-__v -isDeleted -archived ";

    const adverts = await Advert.find({
      ...searchQuery,
      isDeleted: false,
      archived: false,
    })
      .select(userSelectedFields)
      .sort(defaultSort)
      .skip(skip)
      .limit(limit)
      .lean();
    if (!adverts || adverts.length === 0) {
      throw new NotFoundError("No adverts found");
    }
    const total = await Advert.countDocuments({});
    res.status(StatusCodes.OK).json({
      adverts,
      total,
      limit,
      count: adverts.length,
    });
  }
  if (role === "admin") {
    let { select } = req.body;
    if (select) {
      select = select.split(",").join(" ");
    } else {
      select = "-__v";
    }
    const limit = req.query.limit ? parseInt(req.query.limit) : 20;
    const page = req.query.page ? parseInt(req.query.page) : 1;
    const skip = (page - 1) * limit;

    const adverts = await Advert.find({
      ...searchQuery,
    })
      .select(select)
      .sort(defaultSort)
      .skip(skip)
      .limit(limit)
      .lean();
    if (!adverts || adverts.length === 0) {
      throw new NotFoundError("No adverts found");
    }
    const total = await Advert.countDocuments({});
    res.status(StatusCodes.OK).json({
      adverts,
      total,
      limit,
      count: adverts.length,
    });
  }
};

const getVicinityAdverts = async (req, res) => {
  //Current query problem with goespatial queries, fix it later
  const { coordinates } = req.body;
  const { role } = req.user;

  if (!coordinates || !Array.isArray(coordinates) || coordinates.length !== 2) {
    throw new BadRequestError("Please provide valid coordinates");
  }
  if (role === "user") {
    const userSelectedFields = "-__v -isDeleted -archived ";
    const limit = 20;
    const page = req.query.page ? parseInt(req.query.page) : 1;
    const skip = (page - 1) * limit;
    const adverts = await Advert.find({
      "address.location": {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: coordinates,
          },
          $maxDistance: 7000,
        },
      },
      isDeleted: false,
      archived: false,
    })
      .select(userSelectedFields)
      .skip(skip)
      .limit(limit)
      .lean();
    if (!adverts || adverts.length === 0) {
      throw new NotFoundError("No adverts found in vicinity");
    }

    const countDocuments = await Advert.find({
      "address.location": {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: coordinates,
          },
          $maxDistance: 7000,
        },
      },
    }).select("_id");
    const total = countDocuments.length;

    res.status(StatusCodes.OK).json({
      adverts,
      total,
      limit,
      count: adverts.length,
    });
  }
  if (role === "admin") {
    let { select } = req.query;
    if (select) {
      select = select.split(",").join(" ");
    } else {
      select = "-__v";
    }

    const limit = req.query.limit ? parseInt(req.query.limit) : 20;
    const page = req.query.page ? parseInt(req.query.page) : 1;
    const skip = (page - 1) * limit;
    const adverts = await Advert.find({
      "address.location": {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: coordinates,
          },
          $maxDistance: 7000,
        },
      },
    })
      .select(select)
      .skip(skip)
      .limit(limit)
      .lean();
    if (!adverts || adverts.length === 0) {
      throw new NotFoundError("No adverts found in vicinity");
    }

    const countDocuments = await Advert.find({
      "address.location": {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: coordinates,
          },
          $maxDistance: 7000,
        },
      },
    }).select("_id");
    const total = countDocuments.length;

    res.status(StatusCodes.OK).json({
      adverts,
      total,
      limit,
      count: adverts.length,
    });
  }
};

const getUserAdverts = async (req, res) => {
  const { id } = req.params;
  const { role } = req.user;
  if (!id) {
    throw new BadRequestError("Please required data");
  }
  const userSelectedFields = "-__v -isDeleted -archived ";
  if (role === "user") {
    const limit = 20;
    const page = req.query.page ? parseInt(req.query.page) : 1;
    const skip = (page - 1) * limit;
    const adverts = await Advert.find({
      createdBy: id,
      isDeleted: false,
      archived: false,
    })
      .select(userSelectedFields)
      .sort("-createdAt")
      .skip(skip)
      .limit(limit)
      .lean();
    if (!adverts || adverts.length === 0) {
      throw new NotFoundError("No adverts found for this user");
    }
    const total = await Advert.countDocuments({
      createdBy: id,
      isDeleted: false,
      archived: false,
    });
    res.status(StatusCodes.OK).json({
      adverts,
      total,
      limit,
      count: adverts.length,
    });
  }
  if (role === "admin") {
    let { select, sort } = req.query;
    if (select) {
      select = select.split(",").join(" ");
    } else {
      select = "-__v";
    }
    if (sort) {
      sort = sort.split(",").join(" ");
    } else {
      sort = "-createdAt";
    }
    const limit = req.query.limit ? parseInt(req.query.limit) : 20;
    const page = req.query.page ? parseInt(req.query.page) : 1;
    const skip = (page - 1) * limit;
    const adverts = await Advert.find({
      createdBy: id,
    })
      .select(select)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean();
    if (!adverts || adverts.length === 0) {
      throw new NotFoundError("No adverts found for this user");
    }
    const total = await Advert.countDocuments({
      createdBy: id,
      isDeleted: false,
      archived: false,
    });
    res.status(StatusCodes.OK).json({
      adverts,
      total,
      limit,
      count: adverts.length,
    });
  }
};

const getPerviousUserAdverts = async (req, res) => {
  const { id } = req.params;
  const { role } = req.user;
  if (!id) {
    throw new BadRequestError("Please provide required data");
  }
  if (role === "user") {
    const userSelectedFields = "-__v -isDeleted -archived ";
    const limit = 20;
    const page = req.query.page ? parseInt(req.query.page) : 1;
    const skip = (page - 1) * limit;
    const adverts = await Advert.find({
      createdBy: id,
      isDeleted: false,
      archived: false,
      status: { $in: ["cancelled", "expired", "completed"] },
    })
      .select(userSelectedFields)
      .sort("-createdAt")
      .skip(skip)
      .limit(limit)
      .lean();
    if (!adverts || adverts.length === 0) {
      throw new NotFoundError("No previous adverts found for this user");
    }
    const total = await Advert.countDocuments({
      createdBy: id,
      isDeleted: false,
      archived: false,
      status: { $in: ["cancelled", "expired", "completed"] },
    });
    res.status(StatusCodes.OK).json({
      adverts,
      total,
      limit,
      count: adverts.length,
    });
  }
  if (role === "admin") {
    let { select, sort } = req.query;
    if (select) {
      select = select.split(",").join(" ");
    } else {
      select = "-__v";
    }
    if (sort) {
      sort = sort.split(",").join(" ");
    } else {
      sort = "-createdAt";
    }
    const limit = req.query.limit ? parseInt(req.query.limit) : 20;
    const page = req.query.page ? parseInt(req.query.page) : 1;
    const skip = (page - 1) * limit;
    const adverts = await Advert.find({
      createdBy: id,
      isDeleted: false,
      archived: false,
      status: { $in: ["cancelled", "expired", "completed"] },
    })
      .select(select)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean();
    if (!adverts || adverts.length === 0) {
      throw new NotFoundError("No previous adverts found for this user");
    }
    const total = await Advert.countDocuments({
      createdBy: id,

      status: { $in: ["cancelled", "expired", "completed"] },
    });
    res.status(StatusCodes.OK).json({
      adverts,
      total,
      limit,
      count: adverts.length,
    });
  }
};

const getCurrentUserAdverts = async (req, res) => {
  const { id } = req.params;
  const { role } = req.user;
  if (!id) {
    throw new BadRequestError("Please provide required data");
  }
  if (role === "user") {
    const userSelectedFields = "-__v -isDeleted -archived ";
    const limit = 20;
    const page = req.query.page ? parseInt(req.query.page) : 1;
    const skip = (page - 1) * limit;
    const adverts = await Advert.find({
      createdBy: id,
      isDeleted: false,
      archived: false,
      status: { $in: ["open", "full"] },
    })
      .select(userSelectedFields)
      .sort("-createdAt")
      .skip(skip)
      .limit(limit)
      .lean();
    if (!adverts || adverts.length === 0) {
      throw new NotFoundError("No previous adverts found for this user");
    }
    const total = await Advert.countDocuments({
      createdBy: id,
      isDeleted: false,
      archived: false,
      status: { $in: ["open", "full"] },
    });
    res.status(StatusCodes.OK).json({
      adverts,
      total,
      limit,
      count: adverts.length,
    });
  }
  if (role === "admin") {
    let { select, sort } = req.query;
    if (select) {
      select = select.split(",").join(" ");
    } else {
      select = "-__v";
    }
    if (sort) {
      sort = sort.split(",").join(" ");
    } else {
      sort = "-createdAt";
    }
    const limit = req.query.limit ? parseInt(req.query.limit) : 20;
    const page = req.query.page ? parseInt(req.query.page) : 1;
    const skip = (page - 1) * limit;
    const adverts = await Advert.find({
      createdBy: id,

      status: { $in: ["open", "full"] },
    })
      .select(select)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean();
    if (!adverts || adverts.length === 0) {
      throw new NotFoundError("No previous adverts found for this user");
    }
    const total = await Advert.countDocuments({
      createdBy: id,
      isDeleted: false,
      archived: false,
      status: { $in: ["open", "full"] },
    });
    res.status(StatusCodes.OK).json({
      adverts,
      total,
      limit,
      count: adverts.length,
    });
  }
};

const getSingleAdvert = async (req, res) => {
  const { id } = req.params;
  const { role } = req.user;
  if (!id) {
    throw new BadRequestError("Please provide required data");
  }
  if (role === "user") {
    const userSelectedFields = "-__v -isDeleted -archived ";
    const advert = await Advert.findOne({
      _id: id,
      isDeleted: false,
      archived: false,
    })
      .select(userSelectedFields)
      .lean();
    if (!advert) {
      throw new NotFoundError("Advert not found");
    }
    res.status(StatusCodes.OK).json({
      advert,
    });
  }
  if (role === "admin") {
    let { select } = req.query;
    if (select) {
      select = select.split(",").join(" ");
    } else {
      select = "-__v";
    }
    const advert = await Advert.findOne({ _id: id }).select(select).lean();
    if (!advert) {
      throw new NotFoundError("Advert not found");
    }
    res.status(StatusCodes.OK).json({
      advert,
    });
  }
};

const updateAdvert = async (req, res) => {
  res.send("Update advert");
};

const softDeleteAdvert = async (req, res) => {
  res.send("Soft delete advert");
};

const cancelAdvert = async (req, res) => {
  res.send("Cancel advert");
};

const acceptRequestAdvert = async (req, res) => {
  res.send("Accept request advert");
};

const rejectRequestAdvert = async (req, res) => {
  res.send("Reject request advert");
};

const markAdvertRequestSeen = async (req, res) => {
  res.send("Mark advert request as seen");
};

const deleteAdvert = async (req, res) => {
  res.send("Delete advert");
};

const revokeRequestAdvert = async (req, res) => {
  res.send("Revoke request advert");
};

const leaveAdvert = async (req, res) => {
  res.send("Leave advert");
};

const expelFromAdvert = async (req, res) => {
  res.send("Expel from advert");
};

module.exports = {
  createAdvert,
  requestAdvert,
  getVicinityAdverts,
  getAllAdverts,
  getUserAdverts,
  getPerviousUserAdverts,
  getCurrentUserAdverts,
  getSingleAdvert,
  updateAdvert,
  softDeleteAdvert,
  cancelAdvert,

  acceptRequestAdvert,
  rejectRequestAdvert,

  deleteAdvert,
  revokeRequestAdvert,
  markAdvertRequestSeen,
  leaveAdvert,
  expelFromAdvert,
};
