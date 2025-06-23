const adminUserQuery = (req) => {
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

    location,
    validationExpirationDate,
    deleteExpirationDate,
    passwordExpirationDate,
    id,
    recentlySearchedUser,
    recentlySearchedPitch,
    friendRequests,
    friends,
    selfFriendRequests,

    phoneNumber,
    description,
  } = req.query;
  const { createdAt, updatedAt } = req.body;

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
    if (recentlySearchedUser.startsWith("exact")) {
      const queryArray = recentlySearchedUser.split(",").slice(1);

      queryOperator.recentlySearchedUser = queryArray;
    } else {
      const queryArray = recentlySearchedUser.split(",");

      queryOperator.recentlySearchedUser = { $in: queryArray };
    }
  }

  if (recentlySearchedPitch) {
    if (recentlySearchedPitch.startsWith("exact")) {
      const queryArray = recentlySearchedPitch.split(",").slice(1);

      queryOperator.recentlySearchedPitch = queryArray;
    } else {
      const queryArray = recentlySearchedPitch.split(",");

      queryOperator.recentlySearchedPitch = { $in: queryArray };
    }
  }

  if (friendRequests) {
    if (friendRequests.startsWith("exact")) {
      const queryArray = friendRequests.split(",").slice(1);

      queryOperator.friendRequests = queryArray;
    } else {
      const queryArray = friendRequests.split(",");

      queryOperator.friendRequests = { $in: queryArray };
    }
  }
  if (friends) {
    if (friends.startsWith("exact")) {
      const queryArray = friends.split(",").slice(1);

      queryOperator.friends = queryArray;
    } else {
      const queryArray = friends.split(",");

      queryOperator.friends = { $in: queryArray };
    }
  }

  if (selfFriendRequests) {
    if (selfFriendRequests.startsWith("exact")) {
      const queryArray = selfFriendRequests.split(",").slice(1);

      queryOperator.selfFriendRequests = queryArray;
    } else {
      const queryArray = selfFriendRequests.split(",");

      queryOperator.selfFriendRequests = { $in: queryArray };
    }
  }
  if (goalKeeper) {
    queryOperator.goalKeeper = goalKeeper === "true" ? true : false;
  }

  if (createdAt) {
    const upperLimit = new Date(createdAt?.upperLimit);
    const lowerLimit = new Date(createdAt?.lowerLimit);
    if (upperLimit && lowerLimit) {
      queryObject.createdAt = { $gte: lowerLimit, $lte: upperLimit };
    } else if (upperLimit) {
      queryObject.createdAt = { $lte: upperLimit };
    } else if (lowerLimit) {
      queryObject.createdAt = { $gte: lowerLimit };
    }
  }

  if (updatedAt) {
    const upperLimit = new Date(updatedAt?.upperLimit);
    const lowerLimit = new Date(updatedAt?.lowerLimit);
    if (upperLimit && lowerLimit) {
      queryObject.updatedAt = { $gte: lowerLimit, $lte: upperLimit };
    } else if (upperLimit) {
      queryObject.updatedAt = { $lte: upperLimit };
    } else if (lowerLimit) {
      queryObject.updatedAt = { $gte: lowerLimit };
    }
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
    validationNumberUpdate: validationNumber,
    validationExpirationDateUpdate: validationExpirationDate,
    isValidUpdate: isValid,
    passwordNumberUpdate: passwordNumber,
    passwordExpirationDateUpdate: passwordExpirationDate,
    deleteNumberUpdate: deleteNumber,
    deleteExpirationDateUpdate: deleteExpirationDate,
    recentlySearchedUserUpdate: recentlySearchedUser,
    recentlySearchedPitchUpdate: recentlySearchedPitch,
    archivedUpdate: archived,
    isDeletedUpdate: isDeleted,
    schoolUpdate: school,
    ageUpdate: age,
    profilePictureUpdate: profilePicture,
    friendRequestsUpdate: friendRequests,
    friendsUpdate: friends,
    goalKeeperUpdate: goalKeeper,
    locationUpdate: location,
    selfFriendRequestsUpdate: selfFriendRequests,
    phoneNumberUpdate: phoneNumber,
    descriptionUpdate: description,
    nameUpdate: name,
    emailUpdate: email,
    roleUpdate: role,
  } = req.body;

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
    if (recentlySearchedUser.add) {
      queryUpdateOperator.$addToSet = {
        recentlySearchedUser: { $each: recentlySearchedUser.add },
      };
    }
    if (recentlySearchedUser.remove) {
      queryUpdateOperator.$pull = {
        recentlySearchedUser: { $in: recentlySearchedUser.remove },
      };
    }
  }

  if (recentlySearchedPitch) {
    if (recentlySearchedPitch.add) {
      queryUpdateOperator.$addToSet = {
        recentlySearchedPitch: { $each: recentlySearchedPitch.add },
      };
    }
    if (recentlySearchedPitch.remove) {
      queryUpdateOperator.$pull = {
        recentlySearchedPitch: { $in: recentlySearchedPitch.remove },
      };
    }
  }

  if (friendRequests) {
    if (friendRequests.add) {
      queryUpdateOperator.$addToSet = {
        friendRequests: { $each: friendRequests.add },
      };
    }
    if (friendRequests.remove) {
      queryUpdateOperator.$pull = {
        friendRequests: { $in: friendRequests.remove },
      };
    }
  }

  if (selfFriendRequests) {
    if (selfFriendRequests.add) {
      queryUpdateOperator.$addToSet = {
        selfFriendRequests: { $each: selfFriendRequests.add },
      };
    }
    if (selfFriendRequests.remove) {
      queryUpdateOperator.$pull = {
        selfFriendRequests: { $in: selfFriendRequests.remove },
      };
    }
  }
  if (friends) {
    if (friends.add) {
      queryUpdateOperator.$addToSet = { friends: { $each: friends.add } };
    }
    if (friends.remove) {
      queryUpdateOperator.$pull = { friends: { $in: friends.remove } };
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

  return queryUpdateOperator;
};

module.exports = {
  adminUserQuery,

  adminUserUpdateQuery,
};
