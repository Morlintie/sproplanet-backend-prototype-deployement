const { BadRequestError } = require("../errors");

const adminPitchQuery = (req) => {
  const {
    city,
    district,
    isIndoor,
    hasLighting,
    status,
    tags,

    description,
    street,
    neighborhood,
    country,
    coordinates,
    company,
    surfaceType,
    closed,
    searchKeywords,
  } = req.query;
  let {
    recommendedCapacity,
    facilities,
    pricing,
    media,
    contact,
    rating,
    totalRevenue,
    totalBookings,
    lastMaintenanceDate,
    nextMaintenanceDate,
    createdAt,
    updatedAt,
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

  if (createdAt) {
    const upperLimit = new Date(createdAt?.upperLimit);
    const lowerLimit = new Date(createdAt?.lowerLimit);
    if (upperLimit && lowerLimit) {
      queryObject.createdAt = { $gte: lowerLimit, $lte: upperLimit };
    } else if (upperLimit) {
      queryObject.createdAt = { $lte: upperLimit };
    } else if (lowerLimit) {
      queryObject.createdAt = { $gte: lowerLimit };
    }
  }

  if (updatedAt) {
    const upperLimit = new Date(updatedAt?.upperLimit);
    const lowerLimit = new Date(updatedAt?.lowerLimit);
    if (upperLimit && lowerLimit) {
      queryObject.updatedAt = { $gte: lowerLimit, $lte: upperLimit };
    } else if (upperLimit) {
      queryObject.updatedAt = { $lte: upperLimit };
    } else if (lowerLimit) {
      queryObject.updatedAt = { $gte: lowerLimit };
    }
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
    searchQuery.location = {
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
  if (company) {
    searchQuery["company"] = company;
  }
  if (surfaceType) {
    searchQuery["specifications.surfaceType"] = surfaceType;
  }
  if (closed) {
    searchQuery.closed = closed === "true" ? true : false;
  }
  if (media) {
    if (media.images) {
      if (media.images.url) {
        searchQuery["media.images.url"] = {
          $regex: media.images.url,
          $options: "i",
        };
      }
      if (media.images.caption) {
        searchQuery["media.images.caption"] = media.images.caption;
      }
    }
    if (media.videos) {
      if (media.videos.url) {
        searchQuery["media.videos.url"] = {
          $regex: media.videos.url,
          $options: "i",
        };
      }
      if (media.videos.caption) {
        searchQuery["media.videos.caption"] = media.videos.caption;
      }
      if (media.videos.thumbnail) {
        searchQuery["media.videos.caption.thumbnail"] = media.videos.thumbnail;
      }
    }
  }

  if (contact) {
    if (contact.phone) {
      searchQuery["contact.phone"] = contact.phone;
    }
    if (contact.email) {
      searchQuery["contact.email"] = contact.email;
    }
    if (contact.website) {
      searchQuery["contact.website"] = {
        $regex: contact.website,
        $options: "i",
      };
    }
    if (contact.instagram) {
      searchQuery["contact.socialMedia.instagram"] = contact.instagram;
    }
    if (contact.facebook) {
      searchQuery["contact.socialMedia.facebook"] = contact.facebook;
    }
    if (contact.twitter) {
      searchQuery["contact.socialMedia.twitter"] = contact.twitter;
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
  if (tags) {
    const tagsArray = tags.split(",");
    searchQuery.tags = { $all: tagsArray };
  }

  if (searchKeywords) {
    const searchKeywordsArray = searchKeywords.split(",");
    searchQuery.searchKeywords = {
      $all: searchKeywordsArray,
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

  return searchQuery;
};
module.exports = adminPitchQuery;
