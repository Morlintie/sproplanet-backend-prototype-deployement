const User = require("../models/User");

const adminUserQuery = async (req) => {
  const {
    sort,
    select,
    name,
    email,
    validationNumber,
    isValid,
    passwordNumber,
    deleteNumber,
    role,
    archived,
    isDeleted,
    school,
    age,
    profilePicture,
    friendRequests,
    friends,
    goalKeeper,
    createdAt,
    updatedAt,
  } = req.query;

  const queryOperator = {};

  if (name) {
    console.log(name);
    queryOperator.name = { $regex: name, $options: "i" };
  }
  if (email) {
    queryOperator.email = { $regex: email, $options: "i" };
  }

  if (validationNumber) {
    queryOperator.validationNumber = validationNumber;
  }
  if (isValid) {
    queryOperator.isValid = isValid === "true" ? true : false;
  }

  if (passwordNumber) {
    queryOperator.passwordNumber = passwordNumber;
  }

  if (deleteNumber) {
    queryOperator.deleteNumber = deleteNumber;
  }

  if (role) {
    queryOperator.role = role;
  }
  if (archived) {
    queryOperator.archived = archived === "true" ? true : false;
  }

  if (isDeleted) {
    queryOperator.isDeleted = isDeleted === "true" ? true : false;
  }
  if (school) {
    queryOperator.school = { $regex: school, $options: "i" };
  }
  if (age) {
    queryOperator.age = Number(age);
  }
  if (profilePicture) {
    queryOperator.profilePicture = profilePicture;
  }

  if (friendRequests) {
    if (friendRequests.startsWith("exact")) {
      const exactSearchArray = friendRequests.split(",").filter((request) => {
        return !(request === "exact");
      });
      queryOperator.friendRequests = exactSearchArray;
    } else {
      const searchArray = friendRequests.split(",");
      queryOperator.friendRequests = { $all: searchArray };
    }
  }
  if (friends) {
    if (friends.startsWith("exact")) {
      const exactSearchArray = friends.split(",").filter((friend) => {
        return !(friend === "exact");
      });
      queryOperator.friends = exactSearchArray;
    } else {
      const searchArray = friends.split(",");
      queryOperator.friends = { $all: searchArray };
    }
  }
  if (goalKeeper) {
    queryOperator.goalKeeper = goalKeeper === "true" ? true : false;
  }

  if (createdAt) {
    queryOperator.createdAt = createdAt;
  }

  if (updatedAt) {
    queryOperator.updatedAt = updatedAt;
  }

  let result = User.find(queryOperator);

  if (sort) {
    const functionalSort = sort.split(",").join(" ");
    result = result.sort(functionalSort);
  }

  if (select) {
    const functionalSelect = select
      .split(",")
      .filter((select) => {
        return !(select === "password");
      })
      .join(" ");
    result = result.select(`-password ${functionalSelect}`);
  }

  const limit = req.query.limit || 10;
  const page = req.query.page || 1;
  const skipAdmin = (page - 1) * limit;
  result = result.limit(limit).skip(skipAdmin);

  const users = await result;

  return users;
};

module.exports = adminUserQuery;
