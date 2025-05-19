const getManyUser = async (req, res) => {
  res.send("getManyUser");
};

const getSingleUser = async (req, res) => {
  res.send("getSingleUser");
};

const showUser = async (req, res) => {
  res.send("showUser");
};

const getManyGoalkeeper = async (req, res) => {
  res.send("getManyGoalkeeper");
};

const getManyBannedUser = async (req, res) => {
  res.send("getManyBannedUser");
};

const getManyDeletedUser = async (req, res) => {
  res.send("getManyDeleted");
};

const updateManyUser = async (req, res) => {
  res.send("updateManyUser");
};

const updateSingleUser = async (req, res) => {
  res.send("updateSingleUser");
};

const updatePasswordUser = async (req, res) => {
  res.send("updatePasswordUser");
};

const updateDeleteSingleUser = async (req, res) => {
  res.send("updateDeleteSingleUser");
};

const updateDeleteManyUser = async (req, res) => {
  res.send("updateDeleteManyUser");
};

const deleteSingleUser = async (req, res) => {
  res.send("deleteSingleUser");
};

const deleteManyUser = async (req, res) => {
  res.send("deleteManyUser");
};

module.exports = {
  getManyUser,
  getSingleUser,
  showUser,
  getManyBannedUser,
  getManyDeletedUser,
  getManyGoalkeeper,
  updateManyUser,
  updateSingleUser,
  updatePasswordUser,
  updateDeleteSingleUser,
  updateDeleteManyUser,
  deleteSingleUser,
  deleteManyUser,
};
