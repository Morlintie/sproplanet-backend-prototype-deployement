const adminPitchReviewQuery = (req) => {
  const {
    pitch,
    user,
    company,
    id,
    title,
    comment,
    isDeleted,
    archived,

    likes,
    dislikes,
    isVerified,
    isEdited,
  } = req.query;
  const { replies, rating, archivedRating, createdAt, updatedAt, photos } =
    req.body;
  const queryObject = {};
  if (pitch) {
    queryObject.pitch = pitch;
  }

  if (user) {
    queryObject.user = user;
  }
  if (company) {
    queryObject.company = company;
  }

  if (rating) {
    const upperLimit = parseFloat(rating?.upperLimit);
    const lowerLimit = parseFloat(rating?.lowerLimit);
    if (upperLimit && lowerLimit) {
      queryObject.rating = { $gte: lowerLimit, $lte: upperLimit };
    } else if (upperLimit) {
      queryObject.rating = { $lte: upperLimit };
    } else if (lowerLimit) {
      queryObject.rating = { $gte: lowerLimit };
    }
  }

  if (id) {
    queryObject._id = id;
  }

  if (title) {
    queryObject.title = { $regex: title, $options: "i" };
  }

  if (comment) {
    queryObject.comment = { $regex: comment, $options: "i" };
  }
  if (photos) {
    if (photos.url) {
      queryObject.photos = {
        $elemMatch: { url: photos.url },
      };
    }
    if (photos.public_id) {
      queryObject.photos = { $elemMatch: { public_id: photos.public_id } };
    }
  }
  if (likes) {
    if (likes.startsWith("exact")) {
      const queryArray = likes.split(",").slice(1);

      queryObject.likes = queryArray;
    } else {
      const queryArray = likes.split(",");

      queryObject.likes = { $in: queryArray };
    }
  }
  if (dislikes) {
    if (dislikes.startsWith("exact")) {
      const queryArray = dislikes.split(",").slice(1);
      queryObject.dislikes = queryArray;
    } else {
      const queryArray = dislikes.split(",");
      queryObject.dislikes = { $all: queryArray };
    }
  }

  if (isVerified) {
    if (isVerified === "true") {
      queryObject.isVerified = true;
    } else if (isVerified === "false") queryObject.isVerified = false;
  }

  if (isEdited) {
    if (isEdited === "true") {
      queryObject.isEdited = true;
    } else if (isEdited === "false") {
      queryObject.isEdited = false;
    }
  }

  if (replies) {
    if (replies.user) {
      queryObject.replies = {
        $elemMatch: { user: replies.user },
      };
    }
    if (replies.comment) {
      queryObject.replies = {
        $elemMatch: { comment: { $regex: replies.comment, $options: "i" } },
      };
    }
    if (replies.isEdited) {
      if (replies.isEdited === "true") {
        queryObject.replies = {
          $elemMatch: { isEdited: true },
        };
      } else if (replies.isEdited === "false") {
        queryObject.replies = {
          $elemMatch: { isEdited: false },
        };
      }
    }
    if (replies.createdAt) {
      const upperLimit = new Date(replies.createdAt?.upperLimit);
      const lowerLimit = new Date(replies.createdAt?.lowerLimit);
      if (upperLimit && lowerLimit) {
        queryObject.replies = {
          $elemMatch: { createdAt: { $gte: lowerLimit, $lte: upperLimit } },
        };
      } else if (upperLimit) {
        queryObject.replies = {
          $elemMatch: { createdAt: { $lte: upperLimit } },
        };
      } else if (lowerLimit) {
        queryObject.replies = {
          $elemMatch: { createdAt: { $gte: lowerLimit } },
        };
      }
    }
    if (replies.updatedAt) {
      const upperLimit = new Date(replies.updatedAt?.upperLimit);
      const lowerLimit = new Date(replies.updatedAt?.lowerLimit);
      if (upperLimit && lowerLimit) {
        queryObject.replies = {
          $elemMatch: { updatedAt: { $gte: lowerLimit, $lte: upperLimit } },
        };
      } else if (upperLimit) {
        queryObject.replies = {
          $elemMatch: { updatedAt: { $lte: upperLimit } },
        };
      } else if (lowerLimit) {
        queryObject.replies = {
          $elemMatch: { updatedAt: { $gte: lowerLimit } },
        };
      }
    }
  }
  if (createdAt) {
    let upperLimit;
    let lowerLimit;
    if (createdAt.upperLimit) {
      const [upperDay, upperMonth, upperYear] = createdAt.upperLimit
        .split(".")
        .map(Number);

      upperLimit = new Date(upperYear, upperMonth - 1, upperDay);
    }
    if (createdAt.lowerLimit) {
      const [lowerDay, lowerMonth, lowerYear] = createdAt.lowerLimit
        .split(".")
        .map(Number);

      lowerLimit = new Date(lowerYear, lowerMonth - 1, lowerDay);
    }

    if (!upperLimit) {
      queryObject.createdAt = { $gte: lowerLimit };
    }

    if (!lowerLimit) {
      queryObject.createdAt = { $lte: upperLimit };
    }

    if (upperLimit && lowerLimit) {
      if (upperLimit < lowerLimit) {
        throw new BadRequestError(
          "Upper limit cannot be less than lower limit"
        );
      }
      if (upperLimit.getTime() === lowerLimit.getTime()) {
        queryObject.createdAt = upperLimit;
      }
      if (upperLimit.getTime() > lowerLimit.getTime()) {
        queryObject.createdAt = { $gte: lowerLimit, $lte: upperLimit };
      }
    }
  }
  if (updatedAt) {
    let upperLimit;
    let lowerLimit;
    if (updatedAt.upperLimit) {
      const [upperDay, upperMonth, upperYear] = updatedAt.upperLimit
        .split(".")
        .map(Number);

      upperLimit = new Date(upperYear, upperMonth - 1, upperDay);
    }
    if (updatedAt.lowerLimit) {
      const [lowerDay, lowerMonth, lowerYear] = updatedAt.lowerLimit
        .split(".")
        .map(Number);

      lowerLimit = new Date(lowerYear, lowerMonth - 1, lowerDay);
    }

    if (!upperLimit) {
      queryObject.updatedAt = { $gte: lowerLimit };
    }

    if (!lowerLimit) {
      queryObject.updatedAt = { $lte: upperLimit };
    }

    if (upperLimit && lowerLimit) {
      if (upperLimit < lowerLimit) {
        throw new BadRequestError(
          "Upper limit cannot be less than lower limit"
        );
      }
      if (upperLimit.getTime() === lowerLimit.getTime()) {
        queryObject.updatedAt = upperLimit;
      }
      if (upperLimit.getTime() > lowerLimit.getTime()) {
        queryObject.updatedAt = { $gte: lowerLimit, $lte: upperLimit };
      }
    }
  }

  if (isDeleted) {
    if (isDeleted === "true") {
      queryObject.isDeleted = true;
    } else if (isDeleted === "false") {
      queryObject.isDeleted = false;
    }
  }
  if (archived) {
    if (archived === "true") {
      queryObject.archived = true;
    } else if (archived === "false") {
      queryObject.archived = false;
    }
  }

  if (archivedRating) {
    const upperLimit = parseFloat(archivedRating?.upperLimit);
    const lowerLimit = parseFloat(archivedRating?.lowerLimit);
    if (upperLimit && lowerLimit) {
      queryObject.archivedRating = { $gte: lowerLimit, $lte: upperLimit };
    } else if (upperLimit) {
      queryObject.archivedRating = { $lte: upperLimit };
    } else if (lowerLimit) {
      queryObject.archivedRating = { $gte: lowerLimit };
    }
  }
  return queryObject;
};

const adminPitchReviewUpdateQuery = (req) => {
  const {
    pitch,
    user,
    company,
    rating,
    title,
    comment,
    likes,
    dislikes,
    isVerified,
    isEdited,
    isDeleted,
    archived,
    archivedRating,
    replies,
    createdAt,
    updatedAt,
  } = req.body;
  const updateObject = {};
  if (pitch) {
    updateObject.pitch = pitch;
  }
  if (user) {
    updateObject.user = user;
  }
  if (company) {
    updateObject.company = company;
  }
  if (rating) {
    updateObject.rating = rating;
  }
  if (title) {
    updateObject.title = title;
  }
  if (comment) {
    updateObject.comment = comment;
  }
  if (likes) {
    if (likes.add) {
      updateObject.$addToSet = { likes: { $each: likes.add } };
    }
    if (likes.remove) {
      updateObject.$pull = { likes: { $in: likes.remove } };
    }
  }
  if (dislikes) {
    if (dislikes.add) {
      updateObject.$addToSet = { dislikes: { $each: dislikes.add } };
    }
    if (dislikes.remove) {
      updateObject.$pull = { dislikes: { $in: dislikes.remove } };
    }
  }
  if (isVerified) {
    if (isVerified === "true") {
      updateObject.isVerified = true;
    } else if (isVerified === "false") {
      updateObject.isVerified = false;
    }
  }
  if (isEdited) {
    if (isEdited === "true") {
      updateObject.isEdited = true;
    } else if (isEdited === "false") {
      updateObject.isEdited = false;
    }
  }
  if (isDeleted) {
    if (isDeleted === "true") {
      updateObject.isDeleted = true;
    } else if (isDeleted === "false") {
      updateObject.isDeleted = false;
    }
  }
  if (archived) {
    if (isArchived === "true") {
      updateObject.isArchived = true;
    } else if (isArchived === "false") {
      updateObject.isArchived = false;
    }
  }

  if (archivedRating) {
    updateObject.archivedRating = archivedRating;
  }

  if (createdAt) {
    const [day, month, year] = createdAt.split(".").map(Number);
    updateObject.createdAt = new Date(year, month - 1, day).toISOString();
  }
  if (updatedAt) {
    const [day, month, year] = updatedAt.split(".").map(Number);
    updateObject.updatedAt = new Date(year, month - 1, day).toISOString();
  }
  if (replies) {
    if (replies.add) {
      updateObject.$addToSet = { replies: { $each: replies.add } };
    }
    if (replies.remove) {
      const replyRemoveObject = {};
      if (replies.remove.user) {
        replyRemoveObject.user = replies.remove.user;
      }
      if (replies.remove.comment) {
        replyRemoveObject.comment = {
          $regex: replies.remove.comment,
          $options: "i",
        };
      }
      if (replies.remove.createdAt) {
        let upperLimit;
        let lowerLimit;
        if (replies.remove.createdAt.upperLimit) {
          const [upperDay, upperMonth, upperYear] =
            replies.remove.createdAt.upperLimit.split(".").map(Number);
          upperLimit = new Date(upperYear, upperMonth - 1, upperDay);
        }
        if (replies.remove.createdAt.lowerLimit) {
          const [lowerDay, lowerMonth, lowerYear] =
            replies.remove.createdAt.lowerLimit.split(".").map(Number);
          lowerLimit = new Date(lowerYear, lowerMonth - 1, lowerDay);
        }
        if (upperLimit && lowerLimit) {
          replyRemoveObject.createdAt = { $gte: lowerLimit, $lte: upperLimit };
        } else if (upperLimit) {
          replyRemoveObject.createdAt = { $lte: upperLimit };
        } else if (lowerLimit) {
          replyRemoveObject.createdAt = { $gte: lowerLimit };
        }
      }

      if (replies.remove.updatedAt) {
        let upperLimit;
        let lowerLimit;
        if (replies.remove.updatedAt.upperLimit) {
          const [upperDay, upperMonth, upperYear] =
            replies.remove.updatedAt.upperLimit.split(".").map(Number);
          upperLimit = new Date(upperYear, upperMonth - 1, upperDay);
        }
        if (replies.remove.updatedAt.lowerLimit) {
          const [lowerDay, lowerMonth, lowerYear] =
            replies.remove.updatedAt.lowerLimit.split(".").map(Number);
          lowerLimit = new Date(lowerYear, lowerMonth - 1, lowerDay);
        }
        if (upperLimit && lowerLimit) {
          replyRemoveObject.updatedAt = { $gte: lowerLimit, $lte: upperLimit };
        } else if (upperLimit) {
          replyRemoveObject.updatedAt = { $lte: upperLimit };
        } else if (lowerLimit) {
          replyRemoveObject.updatedAt = { $gte: lowerLimit };
        }
      }

      updateObject.$pull = { replies: replyRemoveObject };
    }
  }
  return updateObject;
};

module.exports = { adminPitchReviewQuery, adminPitchReviewUpdateQuery };
