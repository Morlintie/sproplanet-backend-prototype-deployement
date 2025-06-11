const createPitch = async (req, res) => {
  res.send("Create a new pitch");
};

const getAllPitches = async (req, res) => {
  res.send("Get all pitches");
};

const getAllVicinityPitches = async (req, res) => {
  res.send("Get all pitches that are at the vicinity of the user");
};

const getSinglePitch = async (req, res) => {
  res.send("Get single pitch");
};

const getAdminPitches = async (req, res) => {
  res.send("Get all pitches for admin");
};

const getCompanyUserPitches = async (req, res) => {
  res.send("Get all pitches for company user");
};

const getCompanyUserPitch = async (req, res) => {
  res.send("Get single pitch for company user");
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
