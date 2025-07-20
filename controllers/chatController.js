const sendMessage = async (req, res) => {
  res.send("Send message");
};

const getMessages = async (req, res) => {
  res.send("Get messages");
};

const getUnseenMessages = async (req, res) => {
  res.send("Get unread messages");
};

const getSingleMessage = async (req, res) => {
  res.send("Get single message");
};

const softDeleteMessage = async (req, res) => {
  res.send("Soft delete message");
};

const markMessageSeen = async (req, res) => {
  res.send("Mark message as seen");
};

const deleteMessage = async (req, res) => {
  res.send("Delete message");
};

module.exports = {
  sendMessage,
  getMessages,
  getUnseenMessages,
  getSingleMessage,
  softDeleteMessage,
  markMessageSeen,
  deleteMessage,
};
