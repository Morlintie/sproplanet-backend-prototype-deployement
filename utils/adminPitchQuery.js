const { BadRequestError } = require("../errors");

const adminPitchQuery = (req) => {
  const {
    city,
    district,
    isIndoor,
    hasLighting,
    rating,
    sort,
    updatedAt,
    createdAt,
    description,
    street,
    neighborhood,
    country,
    coordinates,
  } = req.query;
  let { recommendedCapacity, facilities, pricing } = req.body;
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

  if (createdAt) {
    const lowerDate = new Date(createdAt);
    const upperDateArray = createdAt.split("-");
    upperDateArray[1] = `${Number(upperDateArray[1]) + 1}`;
    const upperDate = new Date(upperDateArray.join("-"));
    queryObject.createdAt = {
      $gte: lowerDate,
      $lt: upperDate,
    };
  }
  if (updatedAt) {
    const lowerDate = new Date(updatedAt);
    const upperDateArray = updatedAt.split("-");
    upperDateArray[1] = `${Number(upperDateArray[1]) + 1}`;
    const upperDate = new Date(upperDateArray.join("-"));
    queryObject.updatedAt = {
      $gte: lowerDate,
      $lt: upperDate,
    };
  }
  if (description) {
    searchQuery.description = {
      $regex: description,
      $options: "i",
    };
  }

  if (street) {
    searchQuery["location.address.street"] = {
      $regex: street,
      $options: "i",
    };
  }
  if (neighborhood) {
    searchQuery["location.address.neighborhood"] = {
      $regex: neighborhood,
      $options: "i",
    };
  }
  if (country) {
    searchQuery["location.address.country"] = country;
  }

  if (coordinates) {
    const coordinatesArray = coordinates.split(",");
    if (coordinatesArray.length !== 2) {
      throw new BadRequestError(
        "Please provide valid coordinates in the format 'latitude, longitude'."
      );
    }
    coordinatesArray[0] = parseFloat(coordinatesArray[0]);
    coordinatesArray[1] = parseFloat(coordinatesArray[1]);
    if (isNaN(coordinatesArray[0]) || isNaN(coordinatesArray[1])) {
      throw new BadRequestError(
        "Please provide valid coordinates in the format 'latitude, longitude'."
      );
    }
    searchQuery["location"] = {
      $near: {
        $geometry: {
          type: "Point",
          coordinates: coordinatesArray,
        },
        $maxDistance: req.query.maxDistance
          ? parseInt(req.query.maxDistance)
          : 7000,
      },
    };
  }
};
