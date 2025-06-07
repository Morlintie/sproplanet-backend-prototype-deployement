const adminCompanyQuery = (req) => {
  const {
    id,
    createdAt,
    updatedAt,
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

  const queryObject = {};

  if (id) {
    queryObject._id = id;
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
