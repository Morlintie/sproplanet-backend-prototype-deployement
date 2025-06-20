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
