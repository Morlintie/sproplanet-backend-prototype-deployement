const createAdvert = async (req, res) => {
  res.send("Create advert");
};

const requestAdvert = async (req, res) => {
  res.send("Request advert");
};

const getAllAdverts = async (req, res) => {
  res.send("get all adverts");
};

const getUserAdverts = async (req, res) => {
  res.send("Get user adverts");
};

const getPerviousUserAdverts = async (req, res) => {
  res.send("Get previous user adverts");
};

const getCurrentUserAdverts = async (req, res) => {
  res.send("Get current user adverts");
};

const getSingleAdvert = async (req, res) => {
  res.send("Get single advert");
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

  leaveAdvert,
  expelFromAdvert,
};
