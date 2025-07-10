const { BadRequestError } = require("../errors");

const companyBookingQuery = (req) => {
  const { pitch, bookedBy, start, status, cancel, totalPlayers, notes, price } =
    req.body;
  const queryObject = {};
  if (pitch) {
    queryObject.pitch = pitch;
  }
  if (bookedBy) {
    queryObject.bookedBy = bookedBy;
  }
  if (start) {
    let upperLimit;
    let lowerLimit;
    if (start.upperLimit) {
      const [upperLimitDate, upperLimitTime] = start.upperLimit.split("-");
      const [upperDay, upperMonth, upperYear] = upperLimitDate
        .split(".")
        .map(Number);
      const [upperHours, upperMinutes] = upperLimitTime.split(":").map(Number);
      upperLimit = new Date(
        upperYear,
        upperMonth - 1,
        upperDay,
        upperHours,
        upperMinutes
      );
    }
    if (start.lowerLimit) {
      const [lowerLimitDate, lowerLimitTime] = start.lowerLimit.split("-");
      const [lowerDay, lowerMonth, lowerYear] = lowerLimitDate
        .split(".")
        .map(Number);
      const [lowerHours, lowerMinutes] = lowerLimitTime.split(":").map(Number);
      lowerLimit = new Date(
        lowerYear,
        lowerMonth - 1,
        lowerDay,
        lowerHours,
        lowerMinutes
      );
    }

    if (!upperLimit) {
      queryObject.start = { $gte: lowerLimit };
    }

    if (!lowerLimit) {
      queryObject.start = { $lte: upperLimit };
    }

    if (upperLimit && lowerLimit) {
      if (upperLimit < lowerLimit) {
        throw new BadRequestError(
          "Upper limit cannot be less than lower limit"
        );
      }
      if (upperLimit.getTime() === lowerLimit.getTime()) {
        queryObject.start = upperLimit;
      }
      if (upperLimit.getTime() > lowerLimit.getTime()) {
        queryObject.start = { $gte: lowerLimit, $lte: upperLimit };
      }
    }
  }
  if (status) {
    queryObject.status = status;
  }
  if (cancel) {
    const { at, by, reason } = cancel;

    if (at) {
      queryObject["cancel.at"] = at;
    }
    if (by) {
      queryObject["cancel.by"] = by;
    }
    if (reason) {
      queryObject["cancel.reason"] = reason;
    }
  }
  if (totalPlayers) {
    const { upperLimit, lowerLimit } = totalPlayers;
    if (upperLimit && lowerLimit) {
      if (upperLimit < lowerLimit) {
        throw new BadRequestError(
          "Upper limit cannot be less than lower limit"
        );
      }
      queryObject.totalPlayers = { $gte: lowerLimit, $lte: upperLimit };
    }
    if (upperLimit && !lowerLimit) {
      queryObject.totalPlayers = { $lte: upperLimit };
    }

    if (!upperLimit && lowerLimit) {
      queryObject.totalPlayers = { $gte: lowerLimit };
    }
  }
  if (notes) {
    queryObject.notes = { $regex: notes, $options: "i" };
  }

  if (price) {
    const {
      hourlyRate,
      currency,
      multiplier,
      discount,
      tax,
      middlemanShare,
      total,
      paid,
      method,
    } = price;

    if (hourlyRate) {
      const { upperLimit, lowerLimit } = hourlyRate;

      if (upperLimit && lowerLimit) {
        if (upperLimit < lowerLimit) {
          throw new BadRequestError(
            "Upper limit cannot be less than lower limit"
          );
        }
        queryObject["price.hourlyRate"] = {
          $gte: lowerLimit,
          $lte: upperLimit,
        };
      }
      if (upperLimit && !lowerLimit) {
        queryObject["price.hourlyRate"] = { $lte: upperLimit };
      }
      if (!upperLimit && lowerLimit) {
        queryObject["price.hourlyRate"] = { $gte: lowerLimit };
      }
    }
    if (currency) {
      queryObject["price.currency"] = currency;
    }
    if (multiplier) {
      const { upperLimit, lowerLimit } = multiplier;
      if (upperLimit && lowerLimit) {
        if (upperLimit < lowerLimit) {
          throw new BadRequestError(
            "Upper limit cannot be less than lower limit"
          );
        }
        queryObject["price.multiplier"] = {
          $gte: lowerLimit,
          $lte: upperLimit,
        };
      }
      if (upperLimit && !lowerLimit) {
        queryObject["price.multiplier"] = { $lte: upperLimit };
      }
      if (!upperLimit && lowerLimit) {
        queryObject["price.multiplier"] = { $gte: lowerLimit };
      }
    }
    if (discount) {
      const { upperLimit, lowerLimit } = discount;
      if (upperLimit && lowerLimit) {
        if (upperLimit < lowerLimit) {
          throw new BadRequestError(
            "Upper limit cannot be less than lower limit"
          );
        }
        queryObject["price.discount"] = { $gte: lowerLimit, $lte: upperLimit };
      }
      if (upperLimit && !lowerLimit) {
        queryObject["price.discount"] = { $lte: upperLimit };
      }
      if (!upperLimit && lowerLimit) {
        queryObject["price.discount"] = { $gte: lowerLimit };
      }
    }
    if (tax) {
      const { upperLimit, lowerLimit } = tax;
      if (upperLimit && lowerLimit) {
        if (upperLimit < lowerLimit) {
          throw new BadRequestError(
            "Upper limit cannot be less than lower limit"
          );
        }
        queryObject["price.tax"] = { $gte: lowerLimit, $lte: upperLimit };
      }
      if (upperLimit && !lowerLimit) {
        queryObject["price.tax"] = { $lte: upperLimit };
      }
      if (!upperLimit && lowerLimit) {
        queryObject["price.tax"] = { $gte: lowerLimit };
      }
    }
    if (middlemanShare) {
      const { upperLimit, lowerLimit } = middlemanShare;
      if (upperLimit && lowerLimit) {
        if (upperLimit < lowerLimit) {
          throw new BadRequestError(
            "Upper limit cannot be less than lower limit"
          );
        }
        queryObject["price.middlemanShare"] = {
          $gte: lowerLimit,
          $lte: upperLimit,
        };
      }
      if (upperLimit && !lowerLimit) {
        queryObject["price.middlemanShare"] = { $lte: upperLimit };
      }
      if (!upperLimit && lowerLimit) {
        queryObject["price.middlemanShare"] = { $gte: lowerLimit };
      }
    }
    if (total) {
      const { upperLimit, lowerLimit } = total;
      if (upperLimit && lowerLimit) {
        if (upperLimit < lowerLimit) {
          throw new BadRequestError(
            "Upper limit cannot be less than lower limit"
          );
        }
        queryObject["price.total"] = { $gte: lowerLimit, $lte: upperLimit };
      }
      if (upperLimit && !lowerLimit) {
        queryObject["price.total"] = { $lte: upperLimit };
      }
      if (!upperLimit && lowerLimit) {
        queryObject["price.total"] = { $gte: lowerLimit };
      }
    }
    if (paid !== undefined) {
      queryObject["price.paid"] = paid;
    }
    if (method) {
      queryObject["price.paid"] = method;
    }
  }

  return queryObject;
};

module.exports = companyBookingQuery;
