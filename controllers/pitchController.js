const Pitch = require("../models/Pitch");
const { StatusCodes } = require("http-status-codes");
const { BadRequestError, NotFoundError, ForbiddenError } = require("../errors");

const createPitch = async (req, res) => {
  const {
    name,
    description,
    location,
    company,
    specifications,
    facilities,
    pricing,
    media,
    contact,
    tags,
    searchKeywords,
    lastMaintenanceDate,
    nextMaintenanceDate,
  } = req.body;
  const pitch = await Pitch.create({
    name,
    description,
    location,
    company,
    specifications,
    facilities,
    pricing,
    media,
    contact,
    tags,
    searchKeywords,
    lastMaintenanceDate,
    nextMaintenanceDate,
  });
  res
    .status(StatusCodes.CREATED)
    .json({ pitch, message: "Pitch created successfully!" });
};

const getAllPitches = async (req, res) => {
  const role = req?.user?.role;
  const { city, district, isIndoor, hasLighting, rating, sort } = req.query;
  let { search, recommendedCapacity, facilities, pricing } = req.body;
  if (role === "banned") {
    throw new ForbiddenError(
      "You have been banned, please get contact with our customer service."
    );
  }
  const searchQuery = {};
  const numericConverter = {
    ">": "$gt",
    "<": "$lt",
    ">=": "$gte",
    "<=": "$lte",
    "=": "$eq",
  };
  const queryOperators = ["$gt", "$lt", "$gte", "$lte", "$eq"];
  let sortBy = "-rating.averageRating pricing.hourlyRate";
  if (!search) {
    search = "";
  }
  if (city) {
    searchQuery["location.address.city"] = { $regex: city, $options: "i" };
  }
  if (district) {
    searchQuery["location.address.district"] = {
      $regex: district,
      $options: "i",
    };
  }
  if (isIndoor) {
    searchQuery["specifications.isIndoor"] = isIndoor === "true" ? true : false;
  }
  if (hasLighting) {
    searchQuery["specifications.hasLighting"] =
      hasLighting === "true" ? true : false;
  }
  if (recommendedCapacity) {
    if (recommendedCapacity.players) {
      searchQuery["specifications.recommendedCapacity.players"] = parseInt(
        recommendedCapacity.players
      );
    }

    if (recommendedCapacity.spectators) {
      searchQuery["specifications.recommendedCapacity.spectators"] = parseInt(
        recommendedCapacity.spectators
      );
    }
  }

  if (facilities) {
    if (facilities.changingRooms) {
      searchQuery["facilities.changingRooms"] =
        facilities.changingRooms === "true" ? true : false;
    }

    if (facilities.showers) {
      searchQuery["facilities.showers"] =
        facilities.showers === "true" ? true : false;
    }
    if (facilities.shoeRenting) {
      searchQuery["facilities.shoeRenting"] =
        facilities.shoeRenting === "true" ? true : false;
    }
    if (facilities.otherAmenities) {
      searchQuery["facilities.otherAmenities"] = {
        $regex: facilities.otherAmenities || "",
        $options: "i",
      };
    }
  }

  if (pricing) {
    const upperLimit = pricing.upperLimit
      ? parseFloat(pricing.upperLimit)
      : 1000000;
    const lowerLimit = pricing.lowerLimit ? parseFloat(pricing.lowerLimit) : 0;
    if (isNaN(upperLimit) || isNaN(lowerLimit)) {
      throw new BadRequestError("Please provide valid pricing limits");
    }
    searchQuery["pricing.hourlyRate"] = {
      $gte: lowerLimit,
      $lte: upperLimit,
    };
  }

  if (rating) {
    const adjustedRating = rating.replace(/(<=|>=|<|>|=)/g, (match) => {
      return `-${numericConverter[match]}-`;
    });
    const adjustedRatingArray = adjustedRating.split("-");
    if (!queryOperators.includes(adjustedRatingArray[1])) {
      throw new BadRequestError("Please provide a valid rating query.");
    }
    if (adjustedRatingArray.length !== 3) {
      throw new BadRequestError("Please provide a valid rating query.");
    }

    if (adjustedRatingArray[2] > 5) {
      throw new BadRequestError("Rating cannot be greater than 5.");
    }
    searchQuery["rating.averageRating"] = {
      [adjustedRatingArray[1]]: parseFloat(adjustedRatingArray[2]),
    };
  }
  if (sort) {
    sortBy = sort.split(",").join(" ");
  }

  const limit = 20;
  const page = Number(req.query.page) || 1;
  const skip = (page - 1) * limit;
  const userSelectedFields = "-status -__v -totalBookings -totalRevenue";

  const pitches = await Pitch.find({
    $or: [
      { name: { $regex: search, $options: "i" } },
      { tags: { $regex: search, $options: "i" } },
      { searchKeywords: { $regex: search, $options: "i" } },
    ],
    ...searchQuery,
  })
    .select(userSelectedFields)
    .limit(limit)
    .skip(skip)
    .sort(sortBy);
  const countDocuments = await Pitch.countDocuments({});

  if (!pitches) {
    throw new NotFoundError("No pitch found.");
  }
  res
    .status(StatusCodes.OK)
    .json({ pitches, count: pitches.length, totalCount: countDocuments });
};

const getAllVicinityPitches = async (req, res) => {
  res.send("Get all pitches that are at the vicinity of the user");
};

const getSinglePitch = async (req, res) => {
  const { id } = req.params;
  if (!id) {
    throw new BadRequestError("Please provide required data.");
  }
  const pitch = await Pitch.findOne({ _id: id }).select(
    "-status -__v -totalBookings -totalRevenue"
  );
  if (!pitch) {
    throw new NotFoundError("Pitch not found.");
  }
  res.status(StatusCodes.OK).json({ pitch });
};

const getAdminPitches = async (req, res) => {
  res.send("Get all pitches for admin");
};

const getCompanyUserPitches = async (req, res) => {
  res.send("Get all pitches for company user");
};

const getCompanyUserPitch = async (req, res) => {
  const { companyId } = req.user;
  const { id } = req.params;
  if (!id) {
    throw new BadRequestError("Please provide required data.");
  }
  const pitch = await Pitch.findOne({ _id: id }).select("");
};

const deletionRequest = async (req, res) => {
  res.send("Pitch deletion request for company user");
};

const updateAdminPitch = async (req, res) => {
  res.send("Update single pitch for admin");
};

const updateCompanyUserPitches = async (req, res) => {
  res.send("Update multiple pitches for company user");
};

const updateCompanyUserPitch = async (req, res) => {
  res.send("Update single pitch for company user");
};

const deletePitch = async (req, res) => {
  res.send("Delete single pitch for admin");
};

module.exports = {
  createPitch,
  getAllPitches,
  getAllVicinityPitches,
  getSinglePitch,
  getAdminPitches,
  getCompanyUserPitches,
  getCompanyUserPitch,
  deletionRequest,
  updateAdminPitch,
  updateCompanyUserPitches,
  updateCompanyUserPitch,
  deletePitch,
};
