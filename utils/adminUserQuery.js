const User = require("../models/User");
const mongoose = require("mongoose");

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
    selfFriendRequests,
    goalKeeper,
    createdAt,
    updatedAt,
    location,
    validationExpirationDate,
    deleteExpirationDate,
    passwordExpirationDate,
    id,
  } = req.query;

  const queryOperator = {};

  if (id) {
    queryOperator._id = id;
  }
  if (name) {
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

  if (location) {
    queryOperator.location = location;
  }

  if (recentlySearched) {
    if (recentlySearched.startsWith("exact")) {
      const exactSearchArray = recentlySearched.split(",").filter((request) => {
        return !(request === "exact");
      });
      queryOperator.recentlySearched = exactSearchArray;
    } else {
      const searchArray = recentlySearched.split(",");
      queryOperator.recentlySearched = { $all: searchArray };
    }
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

  if (selfFriendRequests) {
    if (selfFriendRequests.startsWith("exact")) {
      const exactSearchArray = friends.split(",").filter((request) => {
        return !(request === "exact");
      });
      queryOperator.selfFriendRequests = exactSearchArray;
    } else {
      const searchArray = selfFriendRequests.split(",");
      queryOperator.selfFriendRequests = { $all: searchArray };
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
  if (validationExpirationDate) {
    queryOperator.validationExpirationDate = validationExpirationDate;
  }
  if (passwordExpirationDate) {
    queryOperator.passwordExpirationDate = passwordExpirationDate;
  }
  if (deleteExpirationDate) {
    queryOperator.deleteExpirationDate = deleteExpirationDate;
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

const adminUserQueryObject = (req) => {
  const {
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
    recentlySearched,
    friendRequests,
    friends,
    selfFriendRequests,
    goalKeeper,
    createdAt,
    updatedAt,
    location,
    validationExpirationDate,
    deleteExpirationDate,
    passwordExpirationDate,
    id,
  } = req.query;

  const queryOperator = {};

  if (id) {
    queryOperator._id = id;
  }
  if (name) {
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

  if (location) {
    queryOperator.location = location;
  }

  if (recentlySearched) {
    if (recentlySearched.startsWith("exact")) {
      const exactSearchArray = recentlySearched.split(",").filter((request) => {
        return !(request === "exact");
      });
      queryOperator.recentlySearched = exactSearchArray;
    } else {
      const searchArray = recentlySearched.split(",");
      queryOperator.recentlySearched = { $all: searchArray };
    }
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

  if (selfFriendRequests) {
    if (selfFriendRequests.startsWith("exact")) {
      const exactSearchArray = friends.split(",").filter((request) => {
        return !(request === "exact");
      });
      queryOperator.selfFriendRequests = exactSearchArray;
    } else {
      const searchArray = selfFriendRequests.split(",");
      queryOperator.selfFriendRequests = { $all: searchArray };
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
  if (validationExpirationDate) {
    queryOperator.validationExpirationDate = validationExpirationDate;
  }
  if (passwordExpirationDate) {
    queryOperator.passwordExpirationDate = passwordExpirationDate;
  }
  if (deleteExpirationDate) {
    queryOperator.deleteExpirationDate = deleteExpirationDate;
  }

  return queryOperator;
};

const adminUserUpdateQuery = async (req) => {
  const {
    validationNumber,
    validationExpirationDate,
    isValid,
    passwordNumber,
    passwordExpirationDate,
    deleteNumber,
    deleteExpirationDate,
    recentlySearched: importedRecentlySearched,
    archived,
    isDeleted,
    school,
    age,
    profilePicture,
    friendRequests: importedFriendRequests,
    friends: importedFriends,
    goalKeeper,
    location,
    selfFriendRequests: importedSelfFriendRequests,
  } = req.body;

  const queryOperator = adminUserQueryObject(req);
  const queryUpdateOperator = {};
  if (name) {
    queryUpdateOperator.name = name;
  }
  if (email) {
    queryUpdateOperator.email = email;
  }
  if (validationNumber) {
    queryUpdateOperator.validationNumber = validationNumber;
  }

  if (validationExpirationDate) {
    queryUpdateOperator.validationExpirationDate = validationExpirationDate;
  }

  if (isValid) {
    queryUpdateOperator.isValid = isValid;
  }
  if (passwordNumber) {
    queryUpdateOperator.passwordNumber = passwordNumber;
  }
  if (passwordExpirationDate) {
    queryUpdateOperator.passwordExpirationDate = passwordExpirationDate;
  }

  if (deleteNumber) {
    queryUpdateOperator.deleteNumber = deleteNumber;
  }
  if (deleteExpirationDate) {
    queryUpdateOperator.deleteExpirationDate = deleteExpirationDate;
  }
  if (role) {
    queryUpdateOperator.role = role;
  }
  if (archived) {
    queryUpdateOperator.archived = archived;
  }
  if (isDeleted) {
    queryUpdateOperator.isDeleted = isDeleted;
  }
  if (school) {
    queryUpdateOperator.school = school;
  }
  if (age) {
    queryUpdateOperator.age = age;
  }
  if (profilePicture) {
    queryUpdateOperator.profilePicture = profilePicture;
  }
  if (importedRecentlySearched) {
    if (importedRecentlySearched.remove) {
      const objectRemove = importedRecentlySearched.remove.items.map((item) => {
        return new mongoose.Types.ObjectId(item);
      });
      queryOperator.$pull = { recentlySearched: { $in: objectRemove } };
    }
    if (importedRecentlySearched.add) {
      const objectAdd = importedRecentlySearched.add.items.map((item) => {
        return new mongoose.Types.ObjectId(item);
      });
      queryOperator.$addToSet = { recentlySearched: { $each: objectAdd } };
    }
  }

  if (importedFriendRequests) {
    if (importedFriendRequests.remove) {
      const objectRemove = importedFriendRequests.remove.items.map((item) => {
        return new mongoose.Types.ObjectId(item);
      });
      queryUpdateOperator.$pull = { friendRequests: { $in: objectRemove } };
    }
    if (importedFriendRequests.add) {
      const objectAdd = importedFriendRequests.add.items.map((item) => {
        return new mongoose.Types.ObjectId(item);
      });
      queryUpdateOperator.$addToSet = { friendRequests: { $each: objectAdd } };
    }
  }
  if (importedFriends) {
    if (importedFriends.remove) {
      const objectRemove = importedFriends.remove.items.map((item) => {
        return new mongoose.Types.ObjectId(item);
      });
      queryUpdateOperator.$pull = { friends: { $in: objectRemove } };
    }
    if (importedFriends.add) {
      const objectAdd = importedFriends.add.items.map((item) => {
        return new mongoose.Types.ObjectId(item);
      });
      console.log(objectAdd);
      queryUpdateOperator.$addToSet = { friends: { $each: objectAdd } };
    }
  }
  if (importedSelfFriendRequests) {
    if (importedSelfFriendRequests.remove) {
      const objectRemove = importedSelfFriendRequests.remove.items.map(
        (item) => {
          return new mongoose.Types.ObjectId(item);
        }
      );
      queryUpdateOperator.$pull = { selfFriendRequests: { $in: objectRemove } };
    }
    if (importedSelfFriendRequests.add) {
      const objectAdd = importedSelfFriendRequests.add.items.map((item) => {
        return new mongoose.Types.ObjectId(item);
      });
      queryUpdateOperator.$addToSet = {
        selfFriendRequests: { $each: objectAdd },
      };
    }
  }
  if (goalKeeper) {
    queryUpdateOperator.goalKeeper = goalKeeper;
  }
  if (location) {
    queryUpdateOperator.location = location;
  }

  const newUsers = await User.updateMany(queryOperator, queryUpdateOperator, {
    new: true,
    runValidators: true,
    timestamps: true,
  });

  return newUsers;
};

const adminUpdateQueryObject = (req) => {
  const {
    name,
    email,
    validationNumber,
    validationExpirationDate,
    isValid,
    passwordNumber,
    passwordExpirationDate,
    deleteNumber,
    deleteExpirationDate,
    role,
    archived,
    isDeleted,
    school,
    age,
    profilePicture,
    friendRequests,
    friends,
    goalKeeper,
    location,
    selfFriendRequests,
  } = req.body;

  const queryUpdateOperator = {};
  if (name) {
    queryUpdateOperator.name = name;
  }
  if (email) {
    queryUpdateOperator.email = email;
  }
  if (validationNumber) {
    queryUpdateOperator.validationNumber = validationNumber;
  }

  if (validationExpirationDate) {
    queryUpdateOperator.validationExpirationDate = validationExpirationDate;
  }

  if (isValid) {
    queryUpdateOperator.isValid = isValid;
  }
  if (passwordNumber) {
    queryUpdateOperator.passwordNumber = passwordNumber;
  }
  if (passwordExpirationDate) {
    queryUpdateOperator.passwordExpirationDate = passwordExpirationDate;
  }

  if (deleteNumber) {
    queryUpdateOperator.deleteNumber = deleteNumber;
  }
  if (deleteExpirationDate) {
    queryUpdateOperator.deleteExpirationDate = deleteExpirationDate;
  }
  if (role) {
    queryUpdateOperator.role = role;
  }
  if (archived) {
    queryUpdateOperator.archived = archived;
  }
  if (isDeleted) {
    queryUpdateOperator.isDeleted = isDeleted;
  }
  if (school) {
    queryUpdateOperator.school = school;
  }
  if (age) {
    queryUpdateOperator.age = age;
  }
  if (profilePicture) {
    queryUpdateOperator.profilePicture = profilePicture;
  }
  if (friendRequests) {
    if (friendRequests.remove) {
      queryUpdateOperator.friendRequests = {
        $pull: { $in: friendRequests.remove.items },
      };
    }
    if (friendRequests.add) {
      queryUpdateOperator.friendRequests = {
        $addToSet: { $each: friendRequests.add.items },
      };
    }
  }
  if (friends) {
    if (friends.remove) {
      queryUpdateOperator.friends = { $pull: { $in: friends.remove.items } };
    }
    if (friends.add) {
      queryUpdateOperator.friends = { $addToSet: { $each: friends.add.items } };
    }
  }
  if (selfFriendRequests) {
    if (selfFriendRequests.remove) {
      queryUpdateOperator.selfFriendRequests = {
        $pull: { $in: selfFriendRequests.remove.items },
      };
    }
    if (selfFriendRequests.add) {
      queryUpdateOperator.selfFriendRequests = {
        $addToSet: { $each: selfFriendRequests.add.items },
      };
    }
  }
  if (goalKeeper) {
    queryUpdateOperator.goalKeeper = goalKeeper;
  }
  if (location) {
    queryUpdateOperator.location = location;
  }

  return queryUpdateOperator;
};

module.exports = {
  adminUserQuery,
  adminUserQueryObject,
  adminUserUpdateQuery,
  adminUpdateQueryObject,
};
