const adminPitchReviewQuery = (req) => {
  const {
    pitch,
    user,
    company,
    id,
    title,
    comment,

    likes,
    dislikes,
    isVerified,
    isEdited,
  } = req.query;
  const { replies, rating, createdAt, updatedAt, photos } = req.body;
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
  return queryObject;
};
module.exports = adminPitchReviewQuery;
