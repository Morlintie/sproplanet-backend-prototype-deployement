const createAdvert = async (req, res) => {
  res.send("Create advert");
};

const requestAdvert = async (req, res) => {
  res.send("Request advert");
};

const inviteToAdvert = async (req, res) => {
  res.send("Invite to advert");
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

const replyToRequestAdvert = async (req, res) => {
  res.send("Reply to request advert");
};

const replyToInviteAdvert = async (req, res) => {
  res.send("Reply to invite advert");
};

const deleteAdvert = async (req, res) => {
  res.send("Delete advert");
};

const revokeRequestAdvert = async (req, res) => {
  res.send("Revoke request advert");
};

const revokeInviteAdvert = async (req, res) => {
  res.send("Revoke invite advert");
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
  inviteToAdvert,
  getAllAdverts,
  getUserAdverts,
  getPerviousUserAdverts,
  getCurrentUserAdverts,
  getSingleAdvert,
  updateAdvert,
  softDeleteAdvert,
  cancelAdvert,
  replyToRequestAdvert,
  replyToInviteAdvert,
  deleteAdvert,
  revokeRequestAdvert,
  revokeInviteAdvert,
  leaveAdvert,
  expelFromAdvert,
};
