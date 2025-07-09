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
    favoritePitches,

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

  const queryObject = {};

  if (id) {
    queryObject._id = id;
  }

  if (name) {
    queryObject.name = { $regex: name, $options: "i" };
  }

  if (email) {
    queryObject.email = { $regex: email, $options: "i" };
  }

  if (validationNumber) {
    queryObject.validationNumber = validationNumber;
  }
  if (isValid) {
    queryObject.isValid = isValid === "true" ? true : false;
  }

  if (passwordNumber) {
    queryObject.passwordNumber = passwordNumber;
  }

  if (deleteNumber) {
    queryObject.deleteNumber = deleteNumber;
  }

  if (role) {
    queryObject.role = role;
  }
  if (archived) {
    queryObject.archived = archived === "true" ? true : false;
  }

  if (isDeleted) {
    queryObject.isDeleted = isDeleted === "true" ? true : false;
  }
  if (school) {
    queryObject.school = { $regex: school, $options: "i" };
  }
  if (age) {
    queryObject.age = Number(age);
  }
  if (profilePicture) {
    queryObject.profilePicture = profilePicture;
  }

  if (location) {
    const locationArray = location.split(",");
    if (locationArray.length > 1) {
      queryObject["location.city"] = locationArray[0];
      queryObject["location.district"] = locationArray[1];
    } else {
      queryObject["location.city"] = locationArray[0];
    }
  }

  if (recentlySearchedUser) {
    if (recentlySearchedUser.startsWith("exact")) {
      const queryArray = recentlySearchedUser.split(",").slice(1);

      queryObject.recentlySearchedUser = queryArray;
    } else {
      const queryArray = recentlySearchedUser.split(",");

      queryObject.recentlySearchedUser = { $in: queryArray };
    }
  }

  if (recentlySearchedPitch) {
    if (recentlySearchedPitch.startsWith("exact")) {
      const queryArray = recentlySearchedPitch.split(",").slice(1);

      queryObject.recentlySearchedPitch = queryArray;
    } else {
      const queryArray = recentlySearchedPitch.split(",");

      queryObject.recentlySearchedPitch = { $in: queryArray };
    }
  }

  if (friendRequests) {
    if (friendRequests.startsWith("exact")) {
      const queryArray = friendRequests.split(",").slice(1);

      queryObject.friendRequests = queryArray;
    } else {
      const queryArray = friendRequests.split(",");

      queryObject.friendRequests = { $in: queryArray };
    }
  }
  if (friends) {
    if (friends.startsWith("exact")) {
      const queryArray = friends.split(",").slice(1);

      queryObject.friends = queryArray;
    } else {
      const queryArray = friends.split(",");

      queryObject.friends = { $in: queryArray };
    }
  }

  if (favoritePitches) {
    if (favoritePitches.startsWith("exact")) {
      const queryArray = favoritePitches.split(",").slice(1);
      queryObject.favoritePitches = queryArray;
    } else {
      const queryArray = favoritePitches.split(",");
      queryObject.favoritePitches = { $in: queryArray };
    }
  }

  if (selfFriendRequests) {
    if (selfFriendRequests.startsWith("exact")) {
      const queryArray = selfFriendRequests.split(",").slice(1);

      queryObject.selfFriendRequests = queryArray;
    } else {
      const queryArray = selfFriendRequests.split(",");

      queryObject.selfFriendRequests = { $in: queryArray };
    }
  }
  if (goalKeeper) {
    queryObject.goalKeeper = goalKeeper === "true" ? true : false;
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
    queryObject.validationExpirationDate = validationExpirationDate;
  }
  if (passwordExpirationDate) {
    queryObject.passwordExpirationDate = passwordExpirationDate;
  }
  if (deleteExpirationDate) {
    queryObject.deleteExpirationDate = deleteExpirationDate;
  }
  if (phoneNumber) {
    queryObject.phoneNumber = phoneNumber;
  }
  if (description) {
    queryObject.description = { $regex: description, $options: "i" };
  }

  return queryObject;
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
    favoritePitchesUpdate: favoritePitches,
  } = req.body;

  const updateObject = {};

  if (validationNumber) {
    updateObject.validationNumber = validationNumber;
  }

  if (validationExpirationDate) {
    updateObject.validationExpirationDate = validationExpirationDate;
  }

  if (isValid) {
    updateObject.isValid = isValid;
  }
  if (passwordNumber) {
    updateObject.passwordNumber = passwordNumber;
  }
  if (passwordExpirationDate) {
    updateObject.passwordExpirationDate = passwordExpirationDate;
  }

  if (deleteNumber) {
    updateObject.deleteNumber = deleteNumber;
  }
  if (deleteExpirationDate) {
    updateObject.deleteExpirationDate = deleteExpirationDate;
  }

  if (archived) {
    updateObject.archived = archived;
  }
  if (isDeleted) {
    updateObject.isDeleted = isDeleted;
  }
  if (school) {
    updateObject.school = school;
  }
  if (age) {
    updateObject.age = age;
  }
  if (profilePicture) {
    updateObject.profilePicture = profilePicture;
  }
  if (recentlySearchedUser) {
    if (recentlySearchedUser.add) {
      updateObject.$addToSet = {
        recentlySearchedUser: { $each: recentlySearchedUser.add },
      };
    }
    if (recentlySearchedUser.remove) {
      updateObject.$pull = {
        recentlySearchedUser: { $in: recentlySearchedUser.remove },
      };
    }
  }

  if (recentlySearchedPitch) {
    if (recentlySearchedPitch.add) {
      updateObject.$addToSet = {
        recentlySearchedPitch: { $each: recentlySearchedPitch.add },
      };
    }
    if (recentlySearchedPitch.remove) {
      updateObject.$pull = {
        recentlySearchedPitch: { $in: recentlySearchedPitch.remove },
      };
    }
  }

  if (friendRequests) {
    if (friendRequests.add) {
      updateObject.$addToSet = {
        friendRequests: { $each: friendRequests.add },
      };
    }
    if (friendRequests.remove) {
      updateObject.$pull = {
        friendRequests: { $in: friendRequests.remove },
      };
    }
  }

  if (selfFriendRequests) {
    if (selfFriendRequests.add) {
      updateObject.$addToSet = {
        selfFriendRequests: { $each: selfFriendRequests.add },
      };
    }
    if (selfFriendRequests.remove) {
      updateObject.$pull = {
        selfFriendRequests: { $in: selfFriendRequests.remove },
      };
    }
  }
  if (friends) {
    if (friends.add) {
      updateObject.$addToSet = { friends: { $each: friends.add } };
    }
    if (friends.remove) {
      updateObject.$pull = { friends: { $in: friends.remove } };
    }
  }
  if (favoritePitches) {
    if (favoritePitches.add) {
      updateObject.$addToSet = {
        favoritePitches: { $each: favoritePitches.add },
      };
    }
    if (favoritePitches.remove) {
      updateObject.$pull = { favoritePitches: { $in: favoritePitches.remove } };
    }
  }
  if (goalKeeper) {
    updateObject.goalKeeper = goalKeeper;
  }
  if (location) {
    updateObject.location = location;
  }
  if (phoneNumber) {
    updateObject.phoneNumber = phoneNumber;
  }
  if (description) {
    updateObject.description = description;
  }
  if (name) {
    updateObject.name = name;
  }
  if (email) {
    updateObject.email = email;
  }

  if (role) {
    updateObject.role = role;
  }

  return updateObject;
};

module.exports = {
  adminUserQuery,

  adminUserUpdateQuery,
};
