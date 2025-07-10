const { StatusCodes } = require("http-status-codes");

const errorHandlerMiddleware = async (err, req, res, next) => {
  console.log(err);
  let customError = {
    statusCode: err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR,
    message: err.message || "Something went wrong, please try again later",
  };

  if (err.name === "ValidationError") {
    customError.statusCode = StatusCodes.BAD_REQUEST;
    customError.message =
      err?.errors?.name?.message || "Validation error occurred.";
  }

  if (err?.cause?.code === 11000) {
    customError.statusCode = StatusCodes.CONFLICT;
    customError.message = err.message || "Duplicate value entered.";
  }

  if (err.name === "CastError") {
    customError.statusCode = StatusCodes.BAD_REQUEST;
    customError.message = `The ${err.stringValue} that you provide is not a valid ${err.kind}. Please provide a valid ${err.kind} `;
  }

  if (err.name === "MongoServerError" && err.code === 11000) {
    customError.statusCode = StatusCodes.CONFLICT;
    if (Object.keys(err.keyValue).includes("pitch")) {
      customError.message =
        "This pitch is already booked for the selected time.";
    }
  }

  res.status(customError.statusCode).json({ msg: customError.message });
};

module.exports = errorHandlerMiddleware;
