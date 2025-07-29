const adminCompanyQuery = (req) => {
  const {
    id,

    name,
    email,
    phone,
    address,
    postalCode,
    website,
    ip,
    description,
    logo,
    owner,
    taxLocation,
    VKN_TCKN,
    type,
  } = req.query;

  const { createdAt, updatedAt } = req.body;

  const queryObject = {};

  if (id) {
    queryObject._id = id;
  }

  if (createdAt) {
    let upperLimit;
    let lowerLimit;
    if (createdAt.upperLimit) {
      const [upperDay, upperMonth, upperYear] = createdAt.upperLimit
        .split(".")
        .map(Number);

      upperLimit = new Date(upperYear, upperMonth - 1, upperDay);
    }
    if (createdAt.lowerLimit) {
      const [lowerDay, lowerMonth, lowerYear] = createdAt.lowerLimit
        .split(".")
        .map(Number);

      lowerLimit = new Date(lowerYear, lowerMonth - 1, lowerDay);
    }

    if (!upperLimit) {
      queryObject.createdAt = { $gte: lowerLimit };
    }

    if (!lowerLimit) {
      queryObject.createdAt = { $lte: upperLimit };
    }

    if (upperLimit && lowerLimit) {
      if (upperLimit < lowerLimit) {
        throw new BadRequestError(
          "Upper limit cannot be less than lower limit"
        );
      }
      if (upperLimit.getTime() === lowerLimit.getTime()) {
        queryObject.createdAt = upperLimit;
      }
      if (upperLimit.getTime() > lowerLimit.getTime()) {
        queryObject.createdAt = { $gte: lowerLimit, $lte: upperLimit };
      }
    }
  }
  if (updatedAt) {
    let upperLimit;
    let lowerLimit;
    if (updatedAt.upperLimit) {
      const [upperDay, upperMonth, upperYear] = updatedAt.upperLimit
        .split(".")
        .map(Number);

      upperLimit = new Date(upperYear, upperMonth - 1, upperDay);
    }
    if (updatedAt.lowerLimit) {
      const [lowerDay, lowerMonth, lowerYear] = updatedAt.lowerLimit
        .split(".")
        .map(Number);

      lowerLimit = new Date(lowerYear, lowerMonth - 1, lowerDay);
    }

    if (!upperLimit) {
      queryObject.updatedAt = { $gte: lowerLimit };
    }

    if (!lowerLimit) {
      queryObject.updatedAt = { $lte: upperLimit };
    }

    if (upperLimit && lowerLimit) {
      if (upperLimit < lowerLimit) {
        throw new BadRequestError(
          "Upper limit cannot be less than lower limit"
        );
      }
      if (upperLimit.getTime() === lowerLimit.getTime()) {
        queryObject.updatedAt = upperLimit;
      }
      if (upperLimit.getTime() > lowerLimit.getTime()) {
        queryObject.updatedAt = { $gte: lowerLimit, $lte: upperLimit };
      }
    }
  }

  if (name) {
    queryObject.name = {
      $regex: name,
      $options: "i",
    };
  }

  if (email) {
    queryObject.email = email;
  }

  if (phone) {
    queryObject.phone = phone;
  }

  if (address) {
    queryObject.address = {
      $regex: address,
      $options: "i",
    };
  }

  if (postalCode) {
    queryObject.postalCode = postalCode;
  }

  if (website) {
    queryObject.website = website;
  }

  if (ip) {
    queryObject.ip = ip;
  }

  if (description) {
    queryObject.description = {
      $regex: description,
      $options: "i",
    };
  }

  if (logo) {
    queryObject.logo = logo;
  }

  if (owner) {
    queryObject.owner = owner;
  }

  if (taxLocation) {
    queryObject.taxLocation = {
      $regex: taxLocation,
      $options: "i",
    };
  }

  if (VKN_TCKN) {
    queryObject.VKN_TCKN = VKN_TCKN;
  }

  if (type) {
    queryObject.type = type;
  }

  return queryObject;
};

module.exports = adminCompanyQuery;
