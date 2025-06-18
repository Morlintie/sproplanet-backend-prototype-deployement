const Pitch = require("../models/Pitch");
const User = require("../models/User");
const Company = require("../models/Company");
const cloudinary = require("cloudinary").v2;
const fs = require("fs/promises");
const { StatusCodes } = require("http-status-codes");
const { BadRequestError, NotFoundError, ForbiddenError } = require("../errors");
const { pitchDeletionRequestEmail, adminPitchQuery } = require("../utils");

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
      : 100000000;
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

  if (!pitches || pitches.length === 0) {
    throw new NotFoundError("No pitch found.");
  }
  res
    .status(StatusCodes.OK)
    .json({ pitches, count: pitches.length, totalCount: countDocuments });
};

const getAllVicinityPitches = async (req, res) => {
  const { coordinates } = req.body;
  if (!coordinates) {
    throw new BadRequestError("Please provide required data.");
  }

  const userSelectedFields = "-status -__v -totalBookings -totalRevenue";
  const pitches = await Pitch.find({
    location: {
      $near: {
        $geometry: {
          type: "Point",
          coordinates: coordinates,
        },
        $maxDistance: 7000,
      },
    },
  }).select(userSelectedFields);
  const countDocuments = await Pitch.countDocuments({});
  if (!pitches || pitches.length === 0) {
    throw new NotFoundError("No pitch found.");
  }
  res
    .status(StatusCodes.OK)
    .json({ pitches, count: pitches.length, totalCount: countDocuments });
};

const getSinglePitch = async (req, res) => {
  const role = req?.user?.role;
  const userId = req?.user?.userId;
  const { id } = req.params;
  if (!id) {
    throw new BadRequestError("Please provide required data.");
  }
  if (role === "banned") {
    throw new ForbiddenError(
      "You have been banned, please get contact with our customer service."
    );
  }
  const userSelectedFields = "-status -__v -totalBookings -totalRevenue";
  const pitch = await Pitch.findOne({ _id: id }).select(userSelectedFields);
  if (!pitch) {
    throw new NotFoundError("No pitch found.");
  }
  if (userId) {
    const user = await User.findOne({ _id: userId });
    if (!user.recentlySearchedPitch.includes(pitch._id)) {
      await User.findOneAndUpdate(
        { _id: userId },
        {
          $push: {
            recentlySearchedPitch: {
              $each: [
                { pitchId: pitch._id, name: pitch.name, rating: pitch.rating },
              ],
              $slice: -10,
            },
          },
        },
        { new: true, runValidators: true }
      );
    }
  }
  res.status(StatusCodes.OK).json({ pitch });
};

const getAdminPitches = async (req, res) => {
  let { sort, select } = req.query;
  let { search } = req.body;
  if (!search) {
    search = "";
  }
  if (sort) {
    sort = sort.split(",").join(" ");
  } else {
    sort = "-createdAt";
  }
  if (select) {
    select = select.split(",").join(" ");
  }

  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;
  const skip = (page - 1) * limit;
  const adminQuery = adminPitchQuery(req);
  const pitches = await Pitch.find({
    $or: [
      { name: { $regex: search, $options: "i" } },
      { tags: { $regex: search, $options: "i" } },
      { searchKeywords: { $regex: search, $options: "i" } },
    ],
    ...adminQuery,
  })
    .sort(sort)
    .select(select)
    .limit(limit)
    .skip(skip);
  const countDocuments = await Pitch.countDocuments({});
  if (!pitches || pitches.length === 0) {
    throw new NotFoundError("pitch not found.");
  }
  res.status(StatusCodes.OK).json({
    pitches,
    count: pitches.length,
    totalCount: countDocuments,
  });
};

const getCompanyUserPitches = async (req, res) => {
  const { companyId } = req.user;
  const {
    city,
    district,
    isIndoor,
    hasLighting,
    sort,
    description,
    createdAt,
    updatedAt,
    status,
    surfaceType,
  } = req.query;
  let {
    search,
    recommendedCapacity,
    facilities,
    pricing,
    rating,
    totalRevenue,
    totalBookings,
    nextMaintenanceDate,
    lastMaintenanceDate,
  } = req.body;

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
    if (facilities.parking) {
      searchQuery["facilities.parking"] =
        facilities.parking === "true" ? true : false;
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
      : 100000000;
    const lowerLimit = pricing.lowerLimit ? parseFloat(pricing.lowerLimit) : 0;
    if (isNaN(upperLimit) || isNaN(lowerLimit)) {
      throw new BadRequestError("Please provide valid pricing limits");
    }
    searchQuery["pricing.hourlyRate"] = {
      $gte: lowerLimit,
      $lte: upperLimit,
    };
    if (pricing.specialDayMultiplier) {
      const specialDayMultiplier = parseFloat(pricing.specialDayMultiplier);
      if (isNaN(specialDayMultiplier) || specialDayMultiplier < 0) {
        throw new BadRequestError(
          "Please provide a valid special day multiplier."
        );
      }
      searchQuery["pricing.specialDayMultiplier"] = specialDayMultiplier;
    }
    if (pricing.weekendMultiplier) {
      const weekendMultiplier = parseFloat(pricing.weekendMultiplier);
      if (isNaN(weekendMultiplier) || weekendMultiplier < 0) {
        throw new BadRequestError("Please provide a valid weekend multiplier.");
      }
      searchQuery["pricing.weekendMultiplier"] = weekendMultiplier;
    }
    if (pricing.currency) {
      if (!["TRY", "USD", "EUR"].includes(pricing.currency)) {
        throw new BadRequestError("Please provide a valid currency.");
      }
      searchQuery["pricing.currency"] = pricing.currency;
    }
  }

  if (rating) {
    if (rating.averageRating) {
      const adjustedRating = rating.averageRating.replace(
        /(<=|>=|<|>|=)/g,
        (match) => {
          return `-${numericConverter[match]}-`;
        }
      );
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
    if (rating.totalReviews) {
      const adjustedTotalReviews = rating.totalReviews.replace(
        /(<=|>=|<|>|=)/g,
        (match) => {
          return `-${numericConverter[match]}-`;
        }
      );
      const adjustedTotalReviewsArray = adjustedTotalReviews.split("-");
      if (!queryOperators.includes(adjustedTotalReviewsArray[1])) {
        throw new BadRequestError(
          "Please provide a valid total reviews query."
        );
      }
      if (adjustedTotalReviewsArray.length !== 3) {
        throw new BadRequestError(
          "Please provide a valid total reviews query."
        );
      }
      if (adjustedTotalReviewsArray[2] < 0) {
        throw new BadRequestError("Total reviews cannot be negative.");
      }
      searchQuery["rating.totalReviews"] = {
        [adjustedTotalReviewsArray[1]]: parseInt(adjustedTotalReviewsArray[2]),
      };
    }
  }

  if (status) {
    if (
      status === "active" ||
      status === "inactive" ||
      status === "maintenance"
    ) {
      searchQuery.status = status;
    } else {
      throw new BadRequestError("Please provide a valid status.");
    }
  }
  if (description) {
    searchQuery.description = {
      $regex: description,
      $options: "i",
    };
  }
  if (createdAt) {
    const lowerDate = new Date(createdAt);
    const upperDateArray = createdAt.split("-");
    upperDateArray[1] = `${Number(upperDateArray[1]) + 1}`;
    const upperDate = new Date(upperDateArray.join("-"));

    searchQuery.createdAt = {
      $gte: lowerDate,
      $lt: upperDate,
    };
  }

  if (updatedAt) {
    const lowerDate = new Date(updatedAt);
    const upperDateArray = updatedAt.split("-");
    upperDateArray[1] = `${Number(upperDateArray[1]) + 1}`;
    const upperDate = new Date(upperDateArray.join("-"));

    searchQuery.updatedAt = {
      $gte: lowerDate,
      $lt: upperDate,
    };
  }
  if (surfaceType) {
    searchQuery["specifications.surfaceType"] = {
      $regex: surfaceType,
      $options: "i",
    };
  }
  if (totalBookings) {
    const lowerLimit = totalBookings.lowerLimit
      ? parseFloat(totalBookings.lowerLimit)
      : 0;
    const upperLimit = (totalBookings.upperLimit =
      parseFloat(totalBookings.upperLimit) || 100000000);
    if (isNaN(lowerLimit) || isNaN(upperLimit)) {
      throw new BadRequestError("Please provide valid total booking limits.");
    }
    searchQuery.totalBookings = {
      $gte: lowerLimit,
      $lte: upperLimit,
    };
  }
  if (totalRevenue) {
    const lowerLimit = totalRevenue.lowerLimit
      ? parseFloat(totalRevenue.lowerLimit)
      : 0;
    const upperLimit = (totalRevenue.upperLimit =
      parseFloat(totalRevenue.upperLimit) || 100000000);
    if (isNaN(lowerLimit) || isNaN(upperLimit)) {
      throw new BadRequestError("Please provide valid total revenue limits.");
    }
    searchQuery.totalRevenue = {
      $gte: lowerLimit,
      $lte: upperLimit,
    };
  }

  if (lastMaintenanceDate) {
    const lowerDate = new Date(lastMaintenanceDate.lowerLimit);
    const upperDate = new Date(lastMaintenanceDate.upperLimit);
    if (isNaN(lowerDate.getTime()) || isNaN(upperDate.getTime())) {
      throw new BadRequestError(
        "Please provide valid last maintenance date limits."
      );
    }
    searchQuery.lastMaintenanceDate = {
      $gte: lowerDate,
      $lte: upperDate,
    };
  }
  if (nextMaintenanceDate) {
    const lowerDate = new Date(nextMaintenanceDate.lowerLimit);
    const upperDate = new Date(nextMaintenanceDate.upperLimit);
    if (isNaN(lowerDate.getTime()) || isNaN(upperDate.getTime())) {
      throw new BadRequestError(
        "Please provide valid next maintenance date limits."
      );
    }
    searchQuery.nextMaintenanceDate = {
      $gte: lowerDate,
      $lte: upperDate,
    };
  }
  if (sort) {
    sortBy = sort.split(",").join(" ");
  }

  const limit = 20;
  const page = Number(req.query.page) || 1;
  const skip = (page - 1) * limit;
  const userSelectedFields = " -__v ";

  const pitches = await Pitch.find({
    $or: [
      { name: { $regex: search, $options: "i" } },
      { tags: { $regex: search, $options: "i" } },
      { searchKeywords: { $regex: search, $options: "i" } },
    ],
    company: companyId,
    ...searchQuery,
  })
    .select(userSelectedFields)
    .limit(limit)
    .skip(skip)
    .sort(sortBy);
  const countDocuments = await Pitch.countDocuments({ company: companyId });

  if (!pitches || pitches.length === 0) {
    throw new NotFoundError("No pitch found.");
  }
  res
    .status(StatusCodes.OK)
    .json({ pitches, count: pitches.length, totalCount: countDocuments });
};

const getCompanyUserPitch = async (req, res) => {
  const { companyId } = req.user;
  const { id } = req.params;
  if (!id) {
    throw new BadRequestError("Please provide required data.");
  }
  const userSelectedFields = "-__v";
  const pitch = await Pitch.findOne({ _id: id, company: companyId }).select(
    userSelectedFields
  );
  if (!pitch) {
    throw new NotFoundError("No pitch found.");
  }

  res.status(StatusCodes.OK).json({ pitch });
};

const deletionRequest = async (req, res) => {
  const { companyId } = req.user;
  const { id } = req.params;
  if (!id) {
    throw new BadRequestError("Please provide required data.");
  }
  const pitch = await Pitch.findOne({ _id: id });
  const company = await Company.findOne({ _id: companyId });
  if (!pitch) {
    throw new NotFoundError("No pitch found.");
  }
  if (!company) {
    throw new NotFoundError("No company found.");
  }
  if (pitch.company.toString() !== companyId) {
    throw new ForbiddenError("You are not authorized to perform that action.");
  }
  await pitchDeletionRequestEmail(company.email, company.phone, company.name);
  res.status(StatusCodes.OK).json({
    message:
      "Deletion request has been sent successfully. We will contact you soon.",
  });
};

const updateAdminPitch = async (req, res) => {
  const { id } = req.params;
  const {
    name,
    description,
    street,
    neighborhood,
    city,
    district,
    postalCode,
    country,
    coordinates,
    length,
    width,
    surfaceType,
    isIndoor,
    hasLighting,
    players,
    spectators,
    changingRooms,
    showers,
    parking,
    shoeRenting,
    hourlyRate,
    currency,
    specialDayMultiplier,
    weekendMultiplier,
    phone,
    email,
    website,
    instagram,
    facebook,
    twitter,
    status,
    lastMaintenanceDate,
    nextMaintenanceDate,
  } = req.body;
  if (!id) {
    throw new BadRequestError("Please provide required data.");
  }
  const update = {
    name,
    description,
    "location.address.street": street,
    "location.address.neighborhood": neighborhood,
    "location.address.city": city,
    "location.address.district": district,
    "location.address.postalCode": postalCode,
    "location.address.country": country,
    "location.coordinates": coordinates,
    "specifications.dimensions.length": length,
    "specifications.dimensions.width": width,
    "specifications.surfaceType": surfaceType,
    "specifications.isIndoor":
      isIndoor === undefined ? undefined : isIndoor === "true" ? true : false,
    "specifications.hasLighting":
      hasLighting === undefined
        ? undefined
        : hasLighting === "true"
        ? true
        : false,
    "specifications.recommendedCapacity.players": players,
    "specifications.recommendedCapacity.spectators": spectators,
    "facilities.changingRooms":
      changingRooms === undefined
        ? undefined
        : changingRooms === "true"
        ? true
        : false,
    "facilities.showers":
      showers === undefined ? undefined : showers === "true" ? true : false,
    "facilities.parking":
      parking === undefined ? undefined : parking === "true" ? true : false,
    "facilities.shoeRenting":
      shoeRenting === undefined
        ? undefined
        : shoeRenting === "true"
        ? true
        : false,
    "pricing.hourlyRate": hourlyRate,
    "pricing.currency": currency,
    "pricing.specialDayMultiplier": specialDayMultiplier,
    "pricing.weekendMultiplier": weekendMultiplier,
    "contact.phone": phone,
    "contact.email": email,
    "contact.website": website,
    "contact.socialMedia.instagram": instagram,
    "contact.socialMedia.facebook": facebook,
    "contact.socialMedia.twitter": twitter,
    status,
    lastMaintenanceDate,
    nextMaintenanceDate,
  };
  Object.keys(update).forEach((key) => {
    if (update[key] === undefined || update[key] === null) {
      delete update[key];
    }
  });

  const pitch = await Pitch.findOneAndUpdate({ _id: id }, update, {
    new: true,
    runValidators: true,
    timestamps: true,
  });
  if (!pitch) {
    throw new NotFoundError("Pitch not found.");
  }
  res.status(StatusCodes.OK).json({ pitch });
};

const updateCompanyUserPitches = async (req, res) => {
  const { companyId } = req.user;

  const {
    length,
    width,
    surfaceType,
    isIndoor,
    hasLighting,
    players,
    spectators,
    changingRooms,
    showers,
    parking,
    shoeRenting,
    hourlyRate,
    currency,
    specialDayMultiplier,
    weekendMultiplier,
    phone,
    email,
    website,
    instagram,
    facebook,
    twitter,
    status,
    lastMaintenanceDate,
    nextMaintenanceDate,
  } = req.body;

  const update = {
    "specifications.dimensions.length": length,
    "specifications.dimensions.width": width,
    "specifications.surfaceType": surfaceType,
    "specifications.isIndoor":
      isIndoor === undefined ? undefined : isIndoor === "true" ? true : false,
    "specifications.hasLighting":
      hasLighting === undefined
        ? undefined
        : hasLighting === "true"
        ? true
        : false,
    "specifications.recommendedCapacity.players": players,
    "specifications.recommendedCapacity.spectators": spectators,
    "facilities.changingRooms":
      changingRooms === undefined
        ? undefined
        : changingRooms === "true"
        ? true
        : false,
    "facilities.showers":
      showers === undefined ? undefined : showers === "true" ? true : false,
    "facilities.parking":
      parking === undefined ? undefined : parking === "true" ? true : false,
    "facilities.shoeRenting":
      shoeRenting === undefined
        ? undefined
        : shoeRenting === "true"
        ? true
        : false,
    "pricing.hourlyRate": hourlyRate,
    "pricing.currency": currency,
    "pricing.specialDayMultiplier": specialDayMultiplier,
    "pricing.weekendMultiplier": weekendMultiplier,
    "contact.phone": phone,
    "contact.email": email,
    "contact.website": website,
    "contact.socialMedia.instagram": instagram,
    "contact.socialMedia.facebook": facebook,
    "contact.socialMedia.twitter": twitter,
    status,
    lastMaintenanceDate,
    nextMaintenanceDate,
  };
  Object.keys(update).forEach((key) => {
    if (update[key] === undefined || update[key] === null) {
      delete update[key];
    }
  });
  const pitches = await Pitch.updateMany(
    {
      company: companyId,
    },
    update,
    { new: true, runValidators: true, timestamps: true }
  );
  if (!pitches || pitches.length === 0) {
    throw new NotFoundError("No pitch found.");
  }
  res.status(StatusCodes.OK).json({
    pitches,
  });
};

const updateCompanyUserPitch = async (req, res) => {
  const { companyId } = req.user;
  const { id } = req.params;
  const {
    name,
    description,
    street,
    neighborhood,
    city,
    district,
    postalCode,
    country,
    coordinates,
    length,
    width,
    surfaceType,
    isIndoor,
    hasLighting,
    players,
    spectators,
    changingRooms,
    showers,
    parking,
    shoeRenting,
    hourlyRate,
    currency,
    specialDayMultiplier,
    weekendMultiplier,
    phone,
    email,
    website,
    instagram,
    facebook,
    twitter,
    status,
    lastMaintenanceDate,
    nextMaintenanceDate,
  } = req.body;
  if (!id) {
    throw new BadRequestError("Please provide required data.");
  }
  const update = {
    name,
    description,
    "location.address.street": street,
    "location.address.neighborhood": neighborhood,
    "location.address.city": city,
    "location.address.district": district,
    "location.address.postalCode": postalCode,
    "location.address.country": country,
    "location.coordinates": coordinates,
    "specifications.dimensions.length": length,
    "specifications.dimensions.width": width,
    "specifications.surfaceType": surfaceType,
    "specifications.isIndoor":
      isIndoor === undefined ? undefined : isIndoor === "true" ? true : false,
    "specifications.hasLighting":
      hasLighting === undefined
        ? undefined
        : hasLighting === "true"
        ? true
        : false,
    "specifications.recommendedCapacity.players": players,
    "specifications.recommendedCapacity.spectators": spectators,
    "facilities.changingRooms":
      changingRooms === undefined
        ? undefined
        : changingRooms === "true"
        ? true
        : false,
    "facilities.showers":
      showers === undefined ? undefined : showers === "true" ? true : false,
    "facilities.parking":
      parking === undefined ? undefined : parking === "true" ? true : false,
    "facilities.shoeRenting":
      shoeRenting === undefined
        ? undefined
        : shoeRenting === "true"
        ? true
        : false,
    "pricing.hourlyRate": hourlyRate,
    "pricing.currency": currency,
    "pricing.specialDayMultiplier": specialDayMultiplier,
    "pricing.weekendMultiplier": weekendMultiplier,
    "contact.phone": phone,
    "contact.email": email,
    "contact.website": website,
    "contact.socialMedia.instagram": instagram,
    "contact.socialMedia.facebook": facebook,
    "contact.socialMedia.twitter": twitter,
    status,
    lastMaintenanceDate,
    nextMaintenanceDate,
  };
  Object.keys(update).forEach((key) => {
    if (update[key] === undefined || update[key] === null) {
      delete update[key];
    }
  });
  const pitch = await Pitch.findOneAndUpdate(
    { _id: id, company: companyId },
    update,
    { new: true, runValidators: true, timestamps: true }
  );
  if (!pitch) {
    throw new NotFoundError("Pitch not found.");
  }
  res.status(StatusCodes.OK).json({ pitch });
};

const deletePitch = async (req, res) => {
  const { id } = req.params;
  if (!id) {
    throw new BadRequestError("Please provide required data.");
  }
  const pitch = await Pitch.findOne({ _id: id });
  if (!pitch) {
    throw new NotFoundError("Pitch not found.");
  }
  await Pitch.deleteOne({ _id: id });
  res
    .status(StatusCodes.NO_CONTENT)
    .json({ message: "Pitch deleted successfully!" });
};
const insertImage = async (req, res) => {
  const { id } = req.params;
  const { role } = req.user;
  const { caption, isPrimary } = req.body;
  const { image } = req.files;
  if (!id) {
    throw new BadRequestError("Please provide required data.");
  }
  if (!image) {
    throw new BadRequestError("Please provide an image.");
  }
  if (!image.mimetype.startsWith("image")) {
    throw new BadRequestError("Please provide a valid image file.");
  }
  if (!image.size || image.size > process.env.MAX_IMAGE_SIZE) {
    throw new BadRequestError("Please provide an image smaller than 1KB.");
  }

  if (role === "owner") {
    const { companyId } = req.user;

    const checkPitch = await Pitch.findOne({ _id: id, company: companyId });

    if (!checkPitch) {
      throw new NotFoundError("Pitch not found.");
    }
    const result = await cloudinary.uploader.upload(image.tempFilePath, {
      use_filename: true,
      folder: "pitch-images",
    });
    await fs.unlink(image.tempFilePath);
    const pitch = await Pitch.findOneAndUpdate(
      { _id: id, company: companyId },
      {
        $push: {
          "media.images": {
            url: result.secure_url,
            caption,
            isPrimary,
            public_id: result.public_id,
          },
        },
      },
      {
        runValidators: true,
        new: true,
      }
    );

    res.status(StatusCodes.OK).json({ pitch });
  }

  if (role === "admin") {
    const checkPitch = await Pitch.findOne({ _id: id });
    if (!checkPitch) {
      throw new NotFoundError("Pitch not found.");
    }
    const result = await cloudinary.uploader.upload(image.tempFilePath, {
      use_filename: true,
      folder: "pitch-images",
    });
    await fs.unlink(image.tempFilePath);
    console.log(result);
    const pitch = await Pitch.findOneAndUpdate(
      { _id: id },
      {
        $push: {
          "media.images": {
            url: result.secure_url,
            caption,
            isPrimary,
            public_id: result.public_id,
          },
        },
      },
      {
        runValidators: true,
        new: true,
      }
    );
    if (!pitch) {
      throw new NotFoundError("Pitch not found.");
    }
    res.status(StatusCodes.OK).json({ pitch });
  }
};
const deleteImage = async (req, res) => {
  const { id } = req.params;
  const { role } = req.user;
  const { public_id } = req.body;
  if (!id || !public_id) {
    throw new BadRequestError("Please provide required data.");
  }
  if (role === "owner") {
    const { companyId } = req.user;

    const pitch = await Pitch.findOneAndUpdate(
      { _id: id, company: companyId },
      {
        $pull: {
          "media.images": { public_id },
        },
      },
      { runValidators: true, new: true }
    );
    if (!pitch) {
      throw new NotFoundError("Pitch not found.");
    }
    await cloudinary.uploader.destroy(public_id, {
      folder: "pitch-images",
    });
    res.status(StatusCodes.OK).json({ pitch });
  }
  if (role === "admin") {
    const pitch = await Pitch.findOneAndUpdate(
      { _id: id },
      {
        $pull: {
          "media.images": { public_id },
        },
      },
      { runValidators: true, new: true }
    );
    if (!pitch) {
      throw new NotFoundError("Pitch not found.");
    }
    await cloudinary.uploader.destroy(public_id, {
      folder: "pitch-images",
    });
    res.status(StatusCodes.OK).json({ pitch });
  }
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
  insertImage,
  deleteImage,
};
