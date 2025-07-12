const createInvite = async (req, res) => {
  res.send("Create invite");
};

const getUserInvites = async (req, res) => {
  res.send("Get user invites");
};

const getSingleInvite = async (req, res) => {
  res.send("Get single invite");
};

const revokeInvite = async (req, res) => {
  res.send("Revoke invite");
};

const acceptInvite = async (req, res) => {
  res.send("Accept invite");
};

const rejectInvite = async (req, res) => {
  res.send("Reject invite");
};

const deleteInvite = async (req, res) => {
  res.send("Delete invite");
};

module.exports = {
  createInvite,
  getUserInvites,
  getSingleInvite,
  revokeInvite,
  acceptInvite,
  rejectInvite,
  deleteInvite,
};
