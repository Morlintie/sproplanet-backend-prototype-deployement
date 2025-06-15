const User = require("../models/User");
const mongoose = require("mongoose");
const { BadRequestError } = require("../errors");

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

    goalKeeper,
    createdAt,
    updatedAt,
    location,
    validationExpirationDate,
    deleteExpirationDate,
    passwordExpirationDate,
    id,

    phoneNumber,
    description,
  } = req.query;
  const {
    recentlySearchedUser,
    recentlySearchedPitch,
    friendRequests,
    friends,
    selfFriendRequests,
  } = req.body;

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
    const locationArray = location.split(",");
    if (locationArray.length > 1) {
      queryOperator["location.city"] = locationArray[0];
      queryOperator["location.district"] = locationArray[1];
    } else {
      queryOperator["location.city"] = locationArray[0];
    }
  }

  if (recentlySearchedUser) {
    if (recentlySearchedUser.name) {
      queryOperator.recentlySearchedUser = {
        $elemMatch: {
          name: { $regex: recentlySearchedUser.name, $options: "i" },
        },
      };
    }
    if (recentlySearchedUser.email) {
      queryOperator.recentlySearchedUser = {
        $elemMatch: {
          email: { $regex: recentlySearchedUser.email, $options: "i" },
        },
      };
    }
    if (recentlySearchedUser.role) {
      queryOperator.recentlySearchedUser = {
        $elemMatch: { role: recentlySearchedUser.role },
      };
    }
    if (recentlySearchedUser.goalKeeper) {
      queryOperator.recentlySearchedUser = {
        $elemMatch: {
          goalKeeper:
            (recentlySearchedUser.goalKeeper ===
              recentlySearchedUser.goalKeeper) ===
            "true"
              ? true
              : false,
        },
      };
    }
    if (recentlySearchedUser.userId) {
      queryOperator.recentlySearchedUser = {
        $elemMatch: {
          userId: mongoose.Types.ObjectId(recentlySearchedUser.userId),
        },
      };
    }
  }

  if (recentlySearchedPitch) {
    if (recentlySearchedPitch.name) {
      queryOperator.recentlySearchedPitch = {
        $elemMatch: {
          name: { $regex: recentlySearchedPitch.name, $options: "i" },
        },
      };
    }
    if (recentlySearchedPitch.pitchId) {
      queryOperator.recentlySearchedPitch = {
        $elemMatch: {
          pitchId: mongoose.Types.ObjectId(recentlySearchedPitch.pitchId),
        },
      };
    }
    if (recentlySearchedPitch.rating) {
      queryOperator.recentlySearchedPitch = {
        ["rating.averageRating"]: {
          $elemMatch: {
            $gte: recentlySearchedPitch.rating.lowerRating,
            $lte: recentlySearchedPitch.rating.upperRating,
          },
        },
      };
    }
  }

  if (friendRequests) {
    if (friendRequests.userId) {
      queryOperator.friendRequests = {
        $elemMatch: { userId: mongoose.Types.ObjectId(friendRequests.userId) },
      };
    }
    if (friendRequests.name) {
      queryOperator.friendRequests = {
        $elemMatch: { name: { $regex: friendRequests.name, $options: "i" } },
      };
    }
    if (friendRequests.email) {
      queryOperator.friendRequests = {
        $elemMatch: { email: { $regex: friendRequests.email, $options: "i" } },
      };
    }
    if (friendRequests.role) {
      queryOperator.friendRequests = {
        $elemMatch: { role: friendRequests.role },
      };
    }
    if (friendRequests.goalKeeper) {
      queryOperator.friendRequests = {
        $elemMatch: {
          goalKeeper: friendRequests.goalKeeper === "true" ? true : false,
        },
      };
    }
  }
  if (friends) {
    if (friends.userId) {
      queryOperator.friends = {
        $elemMatch: { userId: mongoose.Types.ObjectId(friends.userId) },
      };
    }
    if (friends.name) {
      queryOperator.friends = {
        $elemMatch: { name: { $regex: friends.name, $options: "i" } },
      };
    }
    if (friends.email) {
      queryOperator.friends = {
        $elemMatch: { email: { $regex: friends.email, $options: "i" } },
      };
    }
    if (friends.role) {
      queryOperator.friends = {
        $elemMatch: { role: friends.role },
      };
    }
    if (friends.goalKeeper) {
      queryOperator.friends = {
        $elemMatch: {
          goalKeeper: friends.goalKeeper === "true" ? true : false,
        },
      };
    }
  }

  if (selfFriendRequests) {
    if (selfFriendRequests.userId) {
      queryOperator.selfFriendRequests = {
        $elemMatch: {
          userId: mongoose.Types.ObjectId(selfFriendRequests.userId),
        },
      };
    }
    if (selfFriendRequests.name) {
      queryOperator.selfFriendRequests = {
        $elemMatch: {
          name: { $regex: selfFriendRequests.name, $options: "i" },
        },
      };
    }
    if (selfFriendRequests.email) {
      queryOperator.selfFriendRequests = {
        $elemMatch: {
          email: { $regex: selfFriendRequests.email, $options: "i" },
        },
      };
    }
    if (selfFriendRequests.role) {
      queryOperator.selfFriendRequests = {
        $elemMatch: { role: selfFriendRequests.role },
      };
    }
    if (selfFriendRequests.goalKeeper) {
      queryOperator.selfFriendRequests = {
        $elemMatch: {
          goalKeeper: selfFriendRequests.goalKeeper === "true" ? true : false,
        },
      };
    }
  }
  if (goalKeeper) {
    queryOperator.goalKeeper = goalKeeper === "true" ? true : false;
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
  if (validationExpirationDate) {
    queryOperator.validationExpirationDate = validationExpirationDate;
  }
  if (passwordExpirationDate) {
    queryOperator.passwordExpirationDate = passwordExpirationDate;
  }
  if (deleteExpirationDate) {
    queryOperator.deleteExpirationDate = deleteExpirationDate;
  }
  if (phoneNumber) {
    queryOperator.phoneNumber = phoneNumber;
  }
  if (description) {
    queryOperator.description = { $regex: description, $options: "i" };
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
    result = result.select(functionalSelect);
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

    goalKeeper,
    createdAt,
    updatedAt,
    location,
    validationExpirationDate,
    deleteExpirationDate,
    passwordExpirationDate,
    id,
    phoneNumber,
    description,
  } = req.query;

  const {
    recentlySearchedUser,
    recentlySearchedPitch,
    friendRequests,
    friends,
    selfFriendRequests,
  } = req.body;

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
    const locationArray = location.split(",");
    if (locationArray.length > 1) {
      queryOperator["location.city"] = locationArray[0];
      queryOperator["location.district"] = locationArray[1];
    } else {
      queryOperator["location.city"] = locationArray[0];
    }
  }

  if (recentlySearchedUser) {
    if (recentlySearchedUser.name) {
      queryOperator.recentlySearchedUser = {
        $elemMatch: {
          name: { $regex: recentlySearchedUser.name, $options: "i" },
        },
      };
    }
    if (recentlySearchedUser.email) {
      queryOperator.recentlySearchedUser = {
        $elemMatch: {
          email: { $regex: recentlySearchedUser.email, $options: "i" },
        },
      };
    }
    if (recentlySearchedUser.role) {
      queryOperator.recentlySearchedUser = {
        $elemMatch: { role: recentlySearchedUser.role },
      };
    }
    if (recentlySearchedUser.goalKeeper) {
      queryOperator.recentlySearchedUser = {
        $elemMatch: {
          goalKeeper:
            (recentlySearchedUser.goalKeeper ===
              recentlySearchedUser.goalKeeper) ===
            "true"
              ? true
              : false,
        },
      };
    }
    if (recentlySearchedUser.userId) {
      queryOperator.recentlySearchedUser = {
        $elemMatch: {
          userId: mongoose.Types.ObjectId(recentlySearchedUser.userId),
        },
      };
    }
  }

  if (recentlySearchedPitch) {
    if (recentlySearchedPitch.name) {
      queryOperator.recentlySearchedPitch = {
        $elemMatch: {
          name: { $regex: recentlySearchedPitch.name, $options: "i" },
        },
      };
    }
    if (recentlySearchedPitch.pitchId) {
      queryOperator.recentlySearchedPitch = {
        $elemMatch: {
          pitchId: mongoose.Types.ObjectId(recentlySearchedPitch.pitchId),
        },
      };
    }
    if (recentlySearchedPitch.rating) {
      queryOperator.recentlySearchedPitch = {
        ["rating.averageRating"]: {
          $elemMatch: {
            $gte: recentlySearchedPitch.rating.lowerRating,
            $lte: recentlySearchedPitch.rating.upperRating,
          },
        },
      };
    }
  }

  if (friendRequests) {
    if (friendRequests.userId) {
      queryOperator.friendRequests = {
        $elemMatch: { userId: mongoose.Types.ObjectId(friendRequests.userId) },
      };
    }
    if (friendRequests.name) {
      queryOperator.friendRequests = {
        $elemMatch: { name: { $regex: friendRequests.name, $options: "i" } },
      };
    }
    if (friendRequests.email) {
      queryOperator.friendRequests = {
        $elemMatch: { email: { $regex: friendRequests.email, $options: "i" } },
      };
    }
    if (friendRequests.role) {
      queryOperator.friendRequests = {
        $elemMatch: { role: friendRequests.role },
      };
    }
    if (friendRequests.goalKeeper) {
      queryOperator.friendRequests = {
        $elemMatch: {
          goalKeeper: friendRequests.goalKeeper === "true" ? true : false,
        },
      };
    }
  }
  if (friends) {
    if (friends.userId) {
      queryOperator.friends = {
        $elemMatch: { userId: mongoose.Types.ObjectId(friends.userId) },
      };
    }
    if (friends.name) {
      queryOperator.friends = {
        $elemMatch: { name: { $regex: friends.name, $options: "i" } },
      };
    }
    if (friends.email) {
      queryOperator.friends = {
        $elemMatch: { email: { $regex: friends.email, $options: "i" } },
      };
    }
    if (friends.role) {
      queryOperator.friends = {
        $elemMatch: { role: friends.role },
      };
    }
    if (friends.goalKeeper) {
      queryOperator.friends = {
        $elemMatch: {
          goalKeeper: friends.goalKeeper === "true" ? true : false,
        },
      };
    }
  }

  if (selfFriendRequests) {
    if (selfFriendRequests.userId) {
      queryOperator.selfFriendRequests = {
        $elemMatch: {
          userId: mongoose.Types.ObjectId(selfFriendRequests.userId),
        },
      };
    }
    if (selfFriendRequests.name) {
      queryOperator.selfFriendRequests = {
        $elemMatch: {
          name: { $regex: selfFriendRequests.name, $options: "i" },
        },
      };
    }
    if (selfFriendRequests.email) {
      queryOperator.selfFriendRequests = {
        $elemMatch: {
          email: { $regex: selfFriendRequests.email, $options: "i" },
        },
      };
    }
    if (selfFriendRequests.role) {
      queryOperator.selfFriendRequests = {
        $elemMatch: { role: selfFriendRequests.role },
      };
    }
    if (selfFriendRequests.goalKeeper) {
      queryOperator.selfFriendRequests = {
        $elemMatch: {
          goalKeeper: selfFriendRequests.goalKeeper === "true" ? true : false,
        },
      };
    }
  }
  if (goalKeeper) {
    queryOperator.goalKeeper = goalKeeper === "true" ? true : false;
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
  if (validationExpirationDate) {
    queryOperator.validationExpirationDate = validationExpirationDate;
  }
  if (passwordExpirationDate) {
    queryOperator.passwordExpirationDate = passwordExpirationDate;
  }
  if (deleteExpirationDate) {
    queryOperator.deleteExpirationDate = deleteExpirationDate;
  }
  if (phoneNumber) {
    queryOperator.phoneNumber = phoneNumber;
  }
  if (description) {
    queryOperator.description = { $regex: description, $options: "i" };
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
    recentlySearchedUser,
    recentlySearchedPitch,
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
    phoneNumber,
    description,
    name,
    email,
    role,
  } = req.body;

  const queryOperator = adminUserQueryObject(req);
  const queryUpdateOperator = {};

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
  if (recentlySearchedUser) {
    if (recentlySearchedUser.remove) {
      const objectRemove = recentlySearchedUser.remove.items.map((item) => {
        return new mongoose.Types.ObjectId(item);
      });
      queryUpdateOperator.$pull = {
        recentlySearchedUser: { userId: { $in: objectRemove } },
      };
    }
    if (recentlySearchedUser.add) {
      const objectAdd = [];
      console.log(recentlySearchedUser);
      for (let i = 0; i < recentlySearchedUser.add.items.length; i++) {
        const user = await User.findOne({
          _id: recentlySearchedUser.add.items[i],
        });
        console.log(user);
        const userObject = {
          userId: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          profilePicture: user.profilePicture,
          goalKeeper: user.goalKeeper,
        };
        objectAdd.push(userObject);
      }
      queryUpdateOperator.$addToSet = {
        recentlySearchedUser: { $each: objectAdd },
      };
    }
  }

  if (recentlySearchedPitch) {
    if (recentlySearchedPitch.remove) {
      const objectRemove = recentlySearchedPitch.remove.items.map((item) => {
        return new mongoose.Types.ObjectId(item);
      });
      queryUpdateOperator.$pull = {
        recentlySearchedPitch: { pitchId: { $in: objectRemove } },
      };
    }
    if (recentlySearchedPitch.add) {
      const objectAdd = [];
      for (let i = 0; i < recentlySearchedPitch.add.items.length; i++) {
        const pitch = await Pitch.findOne({
          _id: recentlySearchedPitch.add.items[i],
        });
        const pitchObject = {
          pitchId: pitch._id,
          name: pitch.name,
          rating: pitch.rating.averageRating,
        };
        objectAdd.push(pitchObject);
      }
      queryUpdateOperator.$addToSet = {
        recentlySearchedPitch: { $each: objectAdd },
      };
    }
  }

  if (friendRequests) {
    if (friendRequests.remove) {
      const objectRemove = friendRequests.remove.items.map((item) => {
        return new mongoose.Types.ObjectId(item);
      });
      queryUpdateOperator.$pull = {
        friendRequests: { userId: { $in: objectRemove } },
      };
    }
    if (friendRequests.add) {
      const objectAdd = [];
      for (let i = 0; i < friendRequests.add.items.length; i++) {
        const user = await User.findOne({ _id: friendRequests.add.items[i] });
        const userObject = {
          userId: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          profilePicture: user.profilePicture,
          friends: user.friends.map((user) => {
            return {
              userId: user.userId,
              name: user.name,
              email: user.email,
              role: user.role,
              school: user.school,
              age: user.age,
              profilePicture: user.profilePicture,
              goalKeeper: user.goalKeeper,
            };
          }),
          goalKeeper: user.goalKeeper,
        };
        objectAdd.push(userObject);
      }
      queryUpdateOperator.$addToSet = { friendRequests: { $each: objectAdd } };
    }
  }
  if (friends) {
    if (friends.remove) {
      const objectRemove = friends.remove.items.map((item) => {
        return new mongoose.Types.ObjectId(item);
      });
      queryUpdateOperator.$pull = {
        friends: { userId: { $in: objectRemove } },
      };
    }
    if (friends.add) {
      const objectAdd = [];
      for (let i = 0; i < friends.add.items.length; i++) {
        const user = await User.findOne({ _id: friends.add.items[i] });
        const userObject = {
          userId: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          profilePicture: user.profilePicture,
          friends: user.friends.map((user) => {
            return {
              userId: user.userId,
              name: user.name,
              email: user.email,
              role: user.role,
              school: user.school,
              age: user.age,
              profilePicture: user.profilePicture,
              goalKeeper: user.goalKeeper,
            };
          }),
          goalKeeper: user.goalKeeper,
        };
        objectAdd.push(userObject);
      }
      queryUpdateOperator.$addToSet = { friends: { $each: objectAdd } };
    }
  }
  if (selfFriendRequests) {
    if (selfFriendRequests.remove) {
      const objectRemove = selfFriendRequests.remove.items.map((item) => {
        return new mongoose.Types.ObjectId(item);
      });
      queryUpdateOperator.$pull = {
        selfFriendRequests: { userId: { $in: objectRemove } },
      };
    }
    if (selfFriendRequests.add) {
      const objectAdd = [];
      for (let i = 0; i < selfFriendRequests.add.items.length; i++) {
        const user = await User.findOne({
          _id: selfFriendRequests.add.items[i],
        });
        const userObject = {
          userId: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          profilePicture: user.profilePicture,
          friends: user.friends.map((user) => {
            return {
              userId: user.userId,
              name: user.name,
              email: user.email,
              role: user.role,
              school: user.school,
              age: user.age,
              profilePicture: user.profilePicture,
              goalKeeper: user.goalKeeper,
            };
          }),
          goalKeeper: user.goalKeeper,
        };
        objectAdd.push(userObject);
      }
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
  if (phoneNumber) {
    queryUpdateOperator.phoneNumber = phoneNumber;
  }
  if (description) {
    queryUpdateOperator.description = description;
  }
  if (name) {
    queryUpdateOperator.name = name;
  }
  if (email) {
    queryUpdateOperator.email = email;
  }

  if (role) {
    queryUpdateOperator.role = role;
  }

  const newUsers = await User.updateMany(queryOperator, queryUpdateOperator, {
    new: true,
    runValidators: true,
    timestamps: true,
  });

  return newUsers;
};

module.exports = {
  adminUserQuery,
  adminUserQueryObject,
  adminUserUpdateQuery,
};
