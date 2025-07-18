const sendMessage = async (req, res) => {
  res.send("send message");
};

const getMessages = async (req, res) => {
  res.send("get messages");
};

const getUnseenMessages = async (req, res) => {
  res.send("get unseen messages");
};

const updateMessage = async (req, res) => {
  res.send("update message");
};

const softDeleteMessage = async (req, res) => {
  res.send("soft delete message");
};

const markMessageSeen = async (req, res) => {
  res.send("mark message seen");
};

const deleteMessage = async (req, res) => {
  res.send("delete message");
};

module.exports = {
  sendMessage,
  getMessages,
  getUnseenMessages,
  updateMessage,
  softDeleteMessage,
  markMessageSeen,
  deleteMessage,
};
