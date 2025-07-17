const { BadRequestError, NotFoundError, ForbiddenError } = require("../errors");
const Booking = require("../models/Booking");
const Advert = require("../models/Advert");
const {
  onlineUsers,
  notificationNamespace,
} = require("../server/serverConfig");
const { StatusCodes } = require("http-status-codes");
const { dateToIso } = require("../utils");
const cloudinary = require("cloudinary").v2

const createAdvert = async (req, res) => {
  const { booking, playersNeeded, goalKeepersNeeded, participants, notes, adminAdvert } =
    req.body;
  const { userId } = req.user;

  if((!participants || !Array.isArray(participants)) ) {
throw new BadRequestError("Please provide participants array")
  }

    if((!adminAdvert || !Array.isArray(adminAdvert)) ) {
throw new BadRequestError("Please provide participants array")
  }

  let participantExists = false
  for (const participant of participants) {
    if(participant.user.toString() === userId) {
      participantExists = true
      break
    }
  }

  let adminExists = false
  for (const admin of adminAdvert) {
    if(admin.toString() === userId) {
      adminExists = true
      break
    }
  }

  if(!participantExists) {
    participants.push({user: userId})
  }

  if(!adminExists) {
    adminAdvert.push(userId)
  }

  

  if (!booking) {
    const { customPitch, startsAt } = req.body;
    if (!customPitch || !startsAt) {
      throw new BadRequestError("Please provide all required data");
    }

    

    if(customPitch.photo) {
      if(!customPitch.photo.startsWith("data:image/")) {
        throw new BadRequestError("Custom pitch photo must be an image")

      }
      const cleanBase64 = customPitch.photo.replace(
      /^data:image\/\w+;base64,/, "")
      const sizeInBytes = Buffer.from(cleanBase64, "base64")
      if(sizeInBytes.length / 1024 * 1024 * 5 > 1 ) {
        throw new BadRequestError("Custom pitch photo size must be less than 5MB")
      }
      const result = await cloudinary.uploader.upload(
        customPitch.photo, {
          folder: "adverts/customPitches",
           
        }

      )
      customPitch["photo.url"] = result.secure_url
      customPitch("photo.public_id") = result.public_id
     
        
      
    }

    

    const createObject = {
      name: customPitch.name,

      createdBy: userId,
      startsAt: dateToIso(startsAt),
      customPitch,
      "address.location.type": customPitch?.location?.type,
      "address.location.coordinates": customPitch?.location?.coordinates,
      "address.address": customPitch?.address,
      "address.district": customPitch?.district,
      "address.city": customPitch?.city,
      playersNeeded,
      goalKeepersNeeded,
      participants,
      notes,
      adminAdvert
    };
   
    Object.keys(createObject).forEach((key) => {
      if (createObject[key] === undefined || createObject[key] === null) {
        delete createObject[key];
      }
    });

    await Advert.create({
      ...createObject,
    });
    return res.status(StatusCodes.CREATED).json({
      message: "Advert created successfully",
    });
  }
  const realBooking = await Booking.findOne({ _id: booking }).lean().populate({
    path: "pitch",
    select:
      "name description location specifications facilities pricing media contact rating status refundAllowed ",
  });
  if (!realBooking) {
    throw new NotFoundError("Booking not found");
  }
  if (
    realBooking.status === "completed" ||
    realBooking.status === "cancelled"
  ) {
    throw new BadRequestError("Booking is not available for new advert");
  }

  const createObject = {
       name: realBooking.pitch.name,
    createdBy: userId,
    startsAt: realBooking.start,
    pitch: realBooking.pitch._id,
    "address.location.type": realBooking.pitch.location.type,
    "address.location.coordinates": realBooking.pitch.location.coordinates,
    "address.address": `${
      realBooking.pitch.location.address.neighborhood + " mahallesi/"
    }  ${realBooking.pitch.location.address.street + " sokak/"}  ${
      realBooking.pitch.location.district
        ? realBooking.pitch.location.district + " /"
        : ""
    } ${realBooking.pitch.location.city || ""}`,
    "address.district": realBooking.pitch.location.address.district,
    "address.city": realBooking.pitch.location.address.city,

    booking: realBooking._id,
    playersNeeded,
    goalKeepersNeeded,
    participants: participants,
    notes,
    adminAdvert

  }
  Object.keys(createObject).forEach((key) => {
    if(createObject[key] === undefined || createObject[key] === null) {
      delete createObject[key]
    }
  })

  await Advert.create({
    ...createObject
 
  });
  res.status(StatusCodes.CREATED).json({
    message: "Advert created successfully",
  });
};

const requestAdvert = async (req, res) => {
  // Test this route imideately, here we got the sockets
  const { id } = req.params;
  const { userId, role } = req.user;
  if (!id) {
    throw new BadRequestError("Please provide required data");
  }
  if (role === "user") {
    const advert = await Advert.findOne({ _id: id }).lean();
    if (!advert) {
      throw new NotFoundError("Advert not found");
    }
    if (advert.status !== "open") {
      throw new BadRequestError("Advert is not open for requests");
    }
    if (advert.participants.some((p) => p.user.toString() === userId)) {
      throw new BadRequestError("You are already a participant in this advert");
    }
    if (advert.waitingList.some((w) => w.user.toString() === userId)) {
      throw new BadRequestError(
        "You have already requested to join this advert"
      );
    }

    const userSelectedFields = "-__v -isDeleted -archived ";
    const newAdvert = await Advert.findOneAndUpdate(
      {
        _id: id,
      },

      {
        $addToSet: {
          waitingList: { user: userId },
        },
      },
      {
        new: true,
        runValidators: true,
      }
    )
      .select(userSelectedFields)
      .lean();



    if (advert.participants.some((p) => {
      return onlineUsers[p.user.toString()] !== undefined && onlineUsers[p.user.toString()] !== null
    })) {
      notificationNamespace
        .to(advert._id.toString())
        .emit("advertRequest", {
          advert: newAdvert,
        });
    }

    res.status(StatusCodes.OK).json({
      message: "Request sent successfully",
    });
  }
  if (role === "admin") {
    const { candidateId } = req.body;
    if (!candidateId) {
      throw new BadRequestError("Please provide candidate id");
    }
    const advert = await Advert.findOne({ _id: id }).lean();
    if (!advert) {
      throw new NotFoundError("Advert not found");
    }
    if (advert.participants.some((p) => p.user.toString() === candidateId)) {
      throw new BadRequestError(
        "Candidate is already a participant in this advert"
      );
    }

    if (advert.waitingList.some((w) => w.user.toString() === candidateId)) {
      throw new BadRequestError(
        "Candidate has already requested to join this advert"
      );
    }
    const newAdvert = await Advert.findOneAndUpdate(
      {
        _id: id,
      },
      {
        $addToSet: {
          waitingList: { user: candidateId },
        },
      },
      { new: true, runValidators: true }
    ).lean();
if (advert.participants.some((p) => {
      return onlineUsers[p.user.toString()] !== undefined && onlineUsers[p.user.toString()] !== null
    })) {
      notificationNamespace
        .to(advert._id.toString())
        .emit("advertRequest", {
          advert: newAdvert,
        });
    }
    res.status(StatusCodes.OK).json({
      advert: newAdvert,
    });
  }
};

const getAllAdverts = async (req, res) => {
  const { startsAt, pitch, address, district, city, status, sort } = req.body;
  const  role  = req?.user?.role;
  let defaultSort = { startsAt: -1 };
  const searchQuery = {};

  if (sort) {
    defaultSort = sort;
  }
  if (startsAt) {
    let upperLimit;
    let lowerLimit;
    if (startsAt.upperLimit) {
      const [upperDate, upperTime] = startsAt.upperLimit.split("-");
      const [upperDay, upperMonth, upperYear] = upperDate.split(".");
      const [upperHour, upperMinute] = upperTime.split(":");
      upperLimit = new Date(
        upperYear,
        upperMonth - 1,
        upperDay,
        upperHour,
        upperMinute
      );
    }
    if (startsAt.lowerLimit) {
      const [lowerDate, lowerTime] = startsAt.lowerLimit.split("-");
      const [lowerDay, lowerMonth, lowerYear] = lowerDate.split(".");
      const [lowerHour, lowerMinute] = lowerTime.split(":");
      lowerLimit = new Date(
        lowerYear,
        lowerMonth - 1,
        lowerDay,
        lowerHour,
        lowerMinute
      );
    }
    if (upperLimit && lowerLimit) {
      if (upperLimit < lowerLimit) {
        throw new BadRequestError(
          "Upper limit cannot be less than lower limit"
        );
      }
      if (upperLimit.getTime() === lowerLimit.getTime()) {
        searchQuery.startsAt = lowerLimit;
      }
      if (upperLimit.getTime() > lowerLimit.getTime()) {
        searchQuery.startsAt = {
          $gte: lowerLimit,
          $lte: upperLimit,
        };
      }
    }
    if (upperLimit && !lowerLimit) {
      searchQuery.startsAt = {
        $lte: upperLimit,
      };
    }
    if (!upperLimit && lowerLimit) {
      searchQuery.startsAt = {
        $gte: lowerLimit,
      };
    }
  }
  if (pitch) {
    searchQuery.name = { $regex: pitch, $options: "i" };
  }
  if (address) {
    searchQuery["address.address"] = { $regex: address, $options: "i" };
  }
  if (district) {
    searchQuery["address.district"] = district;
  }
  if (city) {
    searchQuery["address.city"] = city;
  }
  if (status) {
    searchQuery.status = status;
  }

    if (role === "admin") {
    let { select } = req.body;
    if (select) {
      select = select.split(",").join(" ");
    } else {
      select = "-__v";
    }
    const limit = req.query.limit ? parseInt(req.query.limit) : 20;
    const page = req.query.page ? parseInt(req.query.page) : 1;
    const skip = (page - 1) * limit;

    const adverts = await Advert.find({
      ...searchQuery,
    })
      .select(select)
      .sort(defaultSort)
      .skip(skip)
      .limit(limit)
      .lean()
    if (!adverts || adverts.length === 0) {
      throw new NotFoundError("No adverts found");
    }
    const total = await Advert.countDocuments({});
    return res.status(StatusCodes.OK).json({
      adverts,
      total,
      limit,
      count: adverts.length,
    });
  }

 
    const limit = 20;
    const page = req.query.page ? parseInt(req.query.page) : 1;
    const skip = (page - 1) * limit;
    const userSelectedFields = "-__v -isDeleted -archived ";

    const adverts = await Advert.find({
      ...searchQuery,
      status: {$nin: "completed expired"},
      isDeleted: false,
      archived: false,
    })
      .select(userSelectedFields)
      .sort(defaultSort)
      .skip(skip)
      .limit(limit)
      .lean().populate({
        path: "booking",
        select : "start status totalPlayers price notes "
      }).populate({
        path: "participants.user",
        select: "name email school age profilePicture goalKeeper phoneNumber description"
      }).populate({
        path: "waitingList.user",
        select: "name email school age profilePicture goalKeeper phoneNumber description"
      }).populate({
        path: "pitch",
        select:"name description specifications facilities pricing media contact rating status refundAllowed"
      });;
    if (!adverts || adverts.length === 0) {
      throw new NotFoundError("No adverts found");
    }
    const total = await Advert.countDocuments({});
    res.status(StatusCodes.OK).json({
      adverts,
      total,
      limit,
      count: adverts.length,
    });
  

};

const getVicinityAdverts = async (req, res) => {
  //Current query problem with goespatial queries, fix it later
  const { coordinates } = req.body;
  const  role  = req?.user?.role;

  if (!coordinates || !Array.isArray(coordinates) || coordinates.length !== 2) {
    throw new BadRequestError("Please provide valid coordinates");
  }


  if (role === "admin") {
    let { select } = req.body;
    if (select) {
      select = select.split(",").join(" ");
    } else {
      select = "-__v";
    }
    const limit = req.query.limit ? parseInt(req.query.limit) : 20;
    const page = req.query.page ? parseInt(req.query.page) : 1;
    const skip = (page - 1) * limit;

    const adverts = await Advert.find({
      "address.location": {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: coordinates,
          },
          $maxDistance: 7000,
        },
      },
  
      
    })
      .select(select)
      .skip(skip)
      .limit(limit)
      .lean();
    if (!adverts || adverts.length === 0) {
      throw new NotFoundError("No adverts found in vicinity");
    }
    const countDocuments = await Advert.find({
      "address.location": {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: coordinates,
          },
          $maxDistance: 7000,
        },
      },
     
    }).select("_id");
    const total = countDocuments.length
   return  res.status(StatusCodes.OK).json({
      adverts,
      total,
      limit,
      count: adverts.length,
    });
  }
  
    const userSelectedFields = "-__v -isDeleted -archived ";
    const limit = 20;
    const page = req.query.page ? parseInt(req.query.page) : 1;
    const skip = (page - 1) * limit;
    const adverts = await Advert.find({
      "address.location": {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: coordinates,
          },
          $maxDistance: 7000,
        },
      },
      status: {$nin: "completed expired"},
      isDeleted: false,
      archived: false,
    })
      .select(userSelectedFields)
      .skip(skip)
      .limit(limit)
      .lean().populate({
        path: "booking",
        select : "start status totalPlayers price notes "
      }).populate({
        path: "participants.user",
        select: "name email school age profilePicture goalKeeper phoneNumber description"
      }).populate({
        path: "waitingList.user",
        select: "name email school age profilePicture goalKeeper phoneNumber description"
      }).populate({
        path: "pitch",
        select:"name description specifications facilities pricing media contact rating status refundAllowed"
      });;
    if (!adverts || adverts.length === 0) {
      throw new NotFoundError("No adverts found in vicinity");
    }

    const countDocuments = await Advert.find({
      "address.location": {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: coordinates,
          },
          $maxDistance: 7000,
        },
      },
      isDeleted: false,
      archived: false,
      status: {$nin: "completed expired"},
    }).select("_id");
    const total = countDocuments.length;

    res.status(StatusCodes.OK).json({
      adverts,
      total,
      limit,
      count: adverts.length,
    });
  
 
};

const getUserAdverts = async (req, res) => {
  const { id } = req.params;
  const { role } = req.user;
  if (!id) {
    throw new BadRequestError("Please required data");
  }
  const userSelectedFields = "-__v -isDeleted -archived ";
  if (role === "user") {
    const limit = 20;
    const page = req.query.page ? parseInt(req.query.page) : 1;
    const skip = (page - 1) * limit;
    const adverts = await Advert.find({
      createdBy: id,
      isDeleted: false,
      archived: false,
    })
      .select(userSelectedFields)
      .sort("-createdAt")
      .skip(skip)
      .limit(limit)
      .lean().populate({
        path: "booking",
        select : "start status totalPlayers price notes "
      }).populate({
        path: "participants.user",
        select: "name email school age profilePicture goalKeeper phoneNumber description"
      }).populate({
        path: "waitingList.user",
        select: "name email school age profilePicture goalKeeper phoneNumber description"
      }).populate({
        path: "pitch",
        select:"name description specifications facilities pricing media contact rating status refundAllowed"
      });;
    if (!adverts || adverts.length === 0) {
      throw new NotFoundError("No adverts found for this user");
    }
    const total = await Advert.countDocuments({
      createdBy: id,
      isDeleted: false,
      archived: false,
    });
    res.status(StatusCodes.OK).json({
      adverts,
      total,
      limit,
      count: adverts.length,
    });
  }
  if (role === "admin") {
    let { select, sort } = req.query;
    if (select) {
      select = select.split(",").join(" ");
    } else {
      select = "-__v";
    }
    if (sort) {
      sort = sort.split(",").join(" ");
    } else {
      sort = "-createdAt";
    }
    const limit = req.query.limit ? parseInt(req.query.limit) : 20;
    const page = req.query.page ? parseInt(req.query.page) : 1;
    const skip = (page - 1) * limit;
    const adverts = await Advert.find({
      createdBy: id,
    })
      .select(select)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean();
    if (!adverts || adverts.length === 0) {
      throw new NotFoundError("No adverts found for this user");
    }
    const total = await Advert.countDocuments({
      createdBy: id,
      isDeleted: false,
      archived: false,
    });
    res.status(StatusCodes.OK).json({
      adverts,
      total,
      limit,
      count: adverts.length,
    });
  }
};

const getPerviousUserAdverts = async (req, res) => {
  const { id } = req.params;
  const { role } = req.user;
  if (!id) {
    throw new BadRequestError("Please provide required data");
  }
  if (role === "user") {
    const userSelectedFields = "-__v -isDeleted -archived ";
    const limit = 20;
    const page = req.query.page ? parseInt(req.query.page) : 1;
    const skip = (page - 1) * limit;
    const adverts = await Advert.find({
      createdBy: id,
      isDeleted: false,
      archived: false,
      status: { $in: ["cancelled", "expired", "completed"] },
    })
      .select(userSelectedFields)
      .sort("-createdAt")
      .skip(skip)
      .limit(limit)
      .lean().populate({
        path: "booking",
        select : "start status totalPlayers price notes "
      }).populate({
        path: "participants.user",
        select: "name email school age profilePicture goalKeeper phoneNumber description"
      }).populate({
        path: "waitingList.user",
        select: "name email school age profilePicture goalKeeper phoneNumber description"
      }).populate({
        path: "pitch",
        select:"name description specifications facilities pricing media contact rating status refundAllowed"
      });;
    if (!adverts || adverts.length === 0) {
      throw new NotFoundError("No previous adverts found for this user");
    }
    const total = await Advert.countDocuments({
      createdBy: id,
      isDeleted: false,
      archived: false,
      status: { $in: ["cancelled", "expired", "completed"] },
    });
    res.status(StatusCodes.OK).json({
      adverts,
      total,
      limit,
      count: adverts.length,
    });
  }
  if (role === "admin") {
    let { select, sort } = req.query;
    if (select) {
      select = select.split(",").join(" ");
    } else {
      select = "-__v";
    }
    if (sort) {
      sort = sort.split(",").join(" ");
    } else {
      sort = "-createdAt";
    }
    const limit = req.query.limit ? parseInt(req.query.limit) : 20;
    const page = req.query.page ? parseInt(req.query.page) : 1;
    const skip = (page - 1) * limit;
    const adverts = await Advert.find({
      createdBy: id,
      isDeleted: false,
      archived: false,
      status: { $in: ["cancelled", "expired", "completed"] },
    })
      .select(select)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean();
    if (!adverts || adverts.length === 0) {
      throw new NotFoundError("No previous adverts found for this user");
    }
    const total = await Advert.countDocuments({
      createdBy: id,

      status: { $in: ["cancelled", "expired", "completed"] },
    });
    res.status(StatusCodes.OK).json({
      adverts,
      total,
      limit,
      count: adverts.length,
    });
  }
};

const getCurrentUserAdverts = async (req, res) => {
  const { id } = req.params;
  const { role } = req.user;
  if (!id) {
    throw new BadRequestError("Please provide required data");
  }
  if (role === "user") {
    const userSelectedFields = "-__v -isDeleted -archived ";
    const limit = 20;
    const page = req.query.page ? parseInt(req.query.page) : 1;
    const skip = (page - 1) * limit;
    const adverts = await Advert.find({
      createdBy: id,
      isDeleted: false,
      archived: false,
      status: { $in: ["open", "full"] },
    })
      .select(userSelectedFields)
      .sort("-createdAt")
      .skip(skip)
      .limit(limit)
      .lean().populate({
        path: "booking",
        select : "start status totalPlayers price notes "
      }).populate({
        path: "participants.user",
        select: "name email school age profilePicture goalKeeper phoneNumber description"
      }).populate({
        path: "waitingList.user",
        select: "name email school age profilePicture goalKeeper phoneNumber description"
      }).populate({
        path: "pitch",
        select:"name description specifications facilities pricing media contact rating status refundAllowed"
      });;
    if (!adverts || adverts.length === 0) {
      throw new NotFoundError("No previous adverts found for this user");
    }
    const total = await Advert.countDocuments({
      createdBy: id,
      isDeleted: false,
      archived: false,
      status: { $in: ["open", "full"] },
    });
    res.status(StatusCodes.OK).json({
      adverts,
      total,
      limit,
      count: adverts.length,
    });
  }
  if (role === "admin") {
    let { select, sort } = req.query;
    if (select) {
      select = select.split(",").join(" ");
    } else {
      select = "-__v";
    }
    if (sort) {
      sort = sort.split(",").join(" ");
    } else {
      sort = "-createdAt";
    }
    const limit = req.query.limit ? parseInt(req.query.limit) : 20;
    const page = req.query.page ? parseInt(req.query.page) : 1;
    const skip = (page - 1) * limit;
    const adverts = await Advert.find({
      createdBy: id,

      status: { $in: ["open", "full"] },
    })
      .select(select)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean();
    if (!adverts || adverts.length === 0) {
      throw new NotFoundError("No previous adverts found for this user");
    }
    const total = await Advert.countDocuments({
      createdBy: id,
      isDeleted: false,
      archived: false,
      status: { $in: ["open", "full"] },
    });
    res.status(StatusCodes.OK).json({
      adverts,
      total,
      limit,
      count: adverts.length,
    });
  }
};

const getSingleAdvert = async (req, res) => {
  const { id } = req.params;
  const  role = req?.user?.role;
  const userId = req?.user?.userId
  if (!id) {
    throw new BadRequestError("Please provide required data");
  }
  if (role === "user") {
    const userSelectedFields = "-__v -isDeleted -archived ";
    
    let advert = await Advert.findOne({
      _id: id,
      isDeleted: false,
      archived: false,
    })
      .select(userSelectedFields)
      .lean().populate({
        path: "booking",
        select : "start status totalPlayers price notes "
      }).populate({
        path: "participants.user",
        select: "name email school age profilePicture goalKeeper phoneNumber description"
      }).populate({
        path: "waitingList.user",
        select: "name email school age profilePicture goalKeeper phoneNumber description"
      }).populate({
        path: "pitch",
        select:"name description specifications facilities pricing media contact rating status refundAllowed"
      });;
    if (!advert) {
      throw new NotFoundError("Advert not found");
    }
    if(advert.adminAdvert.some((a) => {
      return a.toString() === userId
    })) {
     advert = await Advert.findOneAndUpdate({
      _id: id,
      isDeleted: false,
      archived: false
     }, {
      "waitingList.$[].seen": true
     }, {
      new: true, runValidators: true
     }).select(userSelectedFields).lean()
    }
    return res.status(StatusCodes.OK).json({
      advert,
    });
  }
  if (role === "admin") {
    let { select } = req.query;
    if (select) {
      select = select.split(",").join(" ");
    } else {
      select = "-__v";
    }
    const advert = await Advert.findOne({ _id: id }).select(select).lean();
    if (!advert) {
      throw new NotFoundError("Advert not found");
    }
    return res.status(StatusCodes.OK).json({
      advert,
    });
  }

  const userSelectedFields = "-__v -isDeleted -archived ";
    
    let advert = await Advert.findOne({
      _id: id,
      isDeleted: false,
      archived: false,
    })
      .select(userSelectedFields)
      .lean();
    if (!advert) {
      throw new NotFoundError("Advert not found");
    }
    
    return res.status(StatusCodes.OK).json({
      advert,
    });
};

const getParticipantAdverts = async (req, res) => {
  const {userId, role} = req.user

  if(role === "user") {
    console.log("This is running")
  
    const userSelectedFields = "-__v -isDeleted -archived ";
    const adverts = await Advert.find({
      participants: {$elemMatch: {user: userId}, },
      status: {$nin: "completed expired"},
      isDeleted: false, archived: false
    }).select(userSelectedFields).lean().populate({
        path: "booking",
        select : "start status totalPlayers price notes "
      }).populate({
        path: "participants.user",
        select: "name email school age profilePicture goalKeeper phoneNumber description"
      }).populate({
        path: "waitingList.user",
        select: "name email school age profilePicture goalKeeper phoneNumber description"
      }).populate({
        path: "pitch",
        select:"name description specifications facilities pricing media contact rating status refundAllowed"
      });
    if(!adverts || adverts.length === 0) {
      throw new NotFoundError("No adverts found for this user")
    }
    res.status(StatusCodes.OK).json({
      adverts
    })
    }
    if(role === "admin") {
      const {participantId} = req.body
      let {select} = req.query
      if(!participantId) {
        throw new BadRequestError("Please provide participant id")

      }
      if(select) {
        select = select.split(",").join(" ")
      }else {
        select = "-__v"
      }
      const adverts = await Advert.find({
        participants: {$elemMatch: {user: participantId}},

      }).select(select).lean()
      if(!adverts || adverts.length === 0) {
        throw new NotFoundError("No adverts found for this user")
      }
      res.status(StatusCodes.OK).json({
        adverts,

      })
    }


  

  
  

}

const getWaitingListAdverts = async (req, res) => {
  const {userId, role} = req.user
  if(role === "user") {
    const userSelectedFields = "-__v -isDeleted -archived"
    const adverts = await Advert.find({
      waitingList: {$elemMatch: {user: userId}},
      isDeleted: false, archived: false
    }).select(userSelectedFields).lean().populate({
        path: "booking",
        select : "start status totalPlayers price notes "
      }).populate({
        path: "participants.user",
        select: "name email school age profilePicture goalKeeper phoneNumber description"
      }).populate({
        path: "waitingList.user",
        select: "name email school age profilePicture goalKeeper phoneNumber description"
      }).populate({
        path: "pitch",
        select:"name description specifications facilities pricing media contact rating status refundAllowed"
      });
    if(!adverts || adverts.length === 0) {
      throw new NotFoundError("No advert found for this user")
    }
    res.status(StatusCodes.OK).json({
      adverts,

    })
  }
  if(role === "admin") {
    const {candidateId} = req.body
    let {select} = req.query
    if(!candidateId) {
      throw new BadRequestError("Please provide required data")
    }
    if(select) {
      select = select.split(",").join(" ")
    }
    else {
      select = "-__v"
    }
    const adverts = await Advert.find({
      waitingList: {$elemMatch: {user: candidateId}}

    }).select(select).lean()
    if(!adverts || adverts.length === 0) {
      throw new NotFoundError("No advert found for this user")
    }
    res.status(StatusCodes.OK).json({
      adverts
    })
  }
}

const updateAdvert = async (req, res) => {
  const { id } = req.params;
  const { role, userId } = req.user;
  const {
    startsAt,
    customPitch,
    
    booking,
    playersNeeded,
    goalKeepersNeeded,
    notes,
    status,
  } = req.body;
  if (!id) {
    throw new BadRequestError("Please provide required data");
  }
  if (role === "user") {
    const userSelectedFields = "-__v -isDeleted -archived ";
    const advert = await Advert.findOne({_id: id, isDeleted: false, archived: false}).lean()
    if(!advert) {
      throw new NotFoundError("Advert not found")
    }
    if(!advert.adminAdvert.includes(userId)) {
      throw new ForbiddenError("You are not allowed to update this advert ")
    }

      if(advert.status === "completed" || advert.status === "expired") {
        throw new BadRequestError("You cannot update this advert, it is already completed or expired")
      }

      if(advert.status === "full" && status === "open") {
        if(advert.participants.length >= advert.playersNeeded + advert.goalKeepersNeeded) {
          throw new BadRequestError("Advert is full, you cannot change status to open or cancelled")
        }
        
      }
    

    if (!booking) {

       if(customPitch?.photo) {
      if(!customPitch.photo.startsWith("data:image/")) {
        throw new BadRequestError("Custom pitch photo must be an image")

      }
      const cleanBase64 = customPitch.photo.replace(
      /^data:image\/\w+;base64,/, "")
      const sizeInBytes = Buffer.from(cleanBase64, "base64")
      if(sizeInBytes.length / 1024 * 1024 * 5 > 1 ) {
        throw new BadRequestError("Custom pitch photo size must be less than 5MB")
      }
      const result = await cloudinary.uploader.upload(
        customPitch.photo, {
          folder: "adverts/customPitches",
           
        }

      )
      customPitch["photo.url"] = result.secure_url
      customPitch("photo.public_id") = result.public_id
     
        
      
    }

      const updateObject = {
        startsAt: dateToIso(startsAt),
        customPitch,
        "address.location.type": customPitch?.location?.type || "Point",
        "address.location.coordinates": customPitch?.location?.coordinates || [0,0],
        "address.address": customPitch?.address,
        "address.district": customPitch?.district,
        "address.city": customPitch?.city,
        playersNeeded,
        goalKeepersNeeded,
        notes,
        status,
      };
      if(customPitch) {
        updateObject.$unset = {booking: ""}
      }
      Object.keys(updateObject).forEach((key) => {
        if (updateObject[key] === undefined || updateObject[key] === null) {
          delete updateObject[key];
        }
      });

      const updatedAdvert = await Advert.findOneAndUpdate(
        {
          _id: id,
         
          isDeleted: false,
          archived: false,
        },

        updateObject,
        { new: true, runValidators: true, timestamps: true }
      )
        .select(userSelectedFields)
        .lean().populate({
        path: "booking",
        select : "start status totalPlayers price notes "
      }).populate({
        path: "participants.user",
        select: "name email school age profilePicture goalKeeper phoneNumber description"
      }).populate({
        path: "waitingList.user",
        select: "name email school age profilePicture goalKeeper phoneNumber description"
      }).populate({
        path: "pitch",
        select:"name description specifications facilities pricing media contact rating status refundAllowed"
      });;
     
      return res.status(StatusCodes.OK).json({
        advert: updatedAdvert,
      });
    }
    const realBooking = await Booking.findOne({ _id: booking })
      .lean()
      .populate({
        path: "pitch",
        select:
          "name description location specifications facilities pricing media contact rating status refundAllowed ",
      });
    if (!realBooking) {
      throw new NotFoundError("Booking not found");
    }
    if (
      realBooking.status === "completed" ||
      realBooking.status === "cancelled"
    ) {
      throw new BadRequestError("Booking is not available for advert");
    }
    const updateObject = {
      name: realBooking.pitch.name,
      startsAt: realBooking.start,
      pitch: realBooking.pitch._id,
      "address.location.type": realBooking.pitch.location.type,
      "address.location.coordinates": realBooking.pitch.location.coordinates,
      "address.address": `${
        realBooking.pitch.location.address.neighborhood + " mahallesi/"
      }  ${realBooking.pitch.location.address.street + " sokak/"}  ${
        realBooking.pitch.location.district
          ? realBooking.pitch.location.district + " /"
          : ""
      } ${realBooking.pitch.location.city || ""}`,
      "address.district": realBooking.pitch.location.address.district,
      "address.city": realBooking.pitch.location.address.city,
      booking: realBooking._id,
      playersNeeded,
      goalKeepersNeeded,
      notes,
      status,
    };
    if(booking) {
      updateObject.$unset = {customPitch: ""}
    }
    Object.keys(updateObject).forEach((key) => {
      if (updateObject[key] === undefined || updateObject[key] === null) {
        delete updateObject[key];
      }
    });

    const updatedAdvert = await Advert.findOneAndUpdate(
      {
        _id: id,
     
        isDeleted: false,
        archived: false,
      },
      updateObject,
      { new: true, runValidators: true, timestamps: true }
    )
      .select(userSelectedFields)
      .lean().populate({
        path: "booking",
        select : "start status totalPlayers price notes "
      }).populate({
        path: "participants.user",
        select: "name email school age profilePicture goalKeeper phoneNumber description"
      }).populate({
        path: "waitingList.user",
        select: "name email school age profilePicture goalKeeper phoneNumber description"
      }).populate({
        path: "pitch",
        select:"name description specifications facilities pricing media contact rating status refundAllowed"
      });;
    if (!updatedAdvert) {
      throw new NotFoundError("Advert not found");
    }
    res.status(StatusCodes.OK).json({
      advert: updatedAdvert,
    });
  }
  if (role === "admin") {
    let { select } = req.query;
    if (select) {
      select = select.split(",").join(" ");
    } else {
      select = "-__v";
    }
    if (!booking) {

       if(customPitch?.photo) {
      if(!customPitch.photo.startsWith("data:image/")) {
        throw new BadRequestError("Custom pitch photo must be an image")

      }
      const cleanBase64 = customPitch.photo.replace(
      /^data:image\/\w+;base64,/, "")
      const sizeInBytes = Buffer.from(cleanBase64, "base64")
      if(sizeInBytes.length / 1024 * 1024 * 5 > 1 ) {
        throw new BadRequestError("Custom pitch photo size must be less than 5MB")
      }
      const result = await cloudinary.uploader.upload(
        customPitch.photo, {
          folder: "adverts/customPitches",
           
        }

      )
      customPitch["photo.url"] = result.secure_url
      customPitch("photo.public_id") = result.public_id
     
        
      
    }
      const updateObject = {
        startsAt: dateToIso(startsAt),
        customPitch,
        "address.location.type": customPitch?.location?.type || "Point",
        "address.location.coordinates": customPitch?.location?.coordinates || [0,0],
        "address.address": customPitch?.address,
        "address.district": customPitch?.district,
        "address.city": customPitch?.city,
        playersNeeded,
        goalKeepersNeeded,
        notes,
        status,
      };
      if(customPitch) {
        updateObject.$unset = {booking:""}
      }
      Object.keys(updateObject).forEach((key) => {
        if (updateObject[key] === undefined || updateObject[key] === null) {
          delete updateObject[key];
        }
      });

      const updatedAdvert = await Advert.findOneAndUpdate(
        {
          _id: id,
         
          
        },

        updateObject,
        { new: true, runValidators: true, timestamps: true }
      )
        .select(select)
        .lean();
      if (!updatedAdvert) {
        throw new NotFoundError("Advert not found");
      }
      return res.status(StatusCodes.OK).json({
        advert: updatedAdvert,
      });
    }
    const realBooking = await Booking.findOne({ _id: booking })
      .lean()
      .populate({
        path: "pitch",
        select:
          "name description location specifications facilities pricing media contact rating status refundAllowed ",
      });
    if (!realBooking) {
      throw new NotFoundError("Booking not found");
    }
    if (
      realBooking.status === "completed" ||
      realBooking.status === "cancelled"
    ) {
      throw new BadRequestError("Booking is not available for advert");
    }
    const updateObject = {
      name: realBooking.pitch.name,
      startsAt: realBooking.start,
      pitch: realBooking.pitch._id,
      "address.location.type": realBooking.pitch.location.type,
      "address.location.coordinates": realBooking.pitch.location.coordinates,
      "address.address": `${
        realBooking.pitch.location.address.neighborhood + " mahallesi/"
      }  ${realBooking.pitch.location.address.street + " sokak/"}  ${
        realBooking.pitch.location.district
          ? realBooking.pitch.location.district + " /"
          : ""
      } ${realBooking.pitch.location.city || ""}`,
      "address.district": realBooking.pitch.location.address.district,
      "address.city": realBooking.pitch.location.address.city,
      booking: realBooking - _id,
      playersNeeded,
      goalKeepersNeeded,
      notes,
      status,
    };
    if(booking) {
      updateObject.$unset = {customPitch:""}
    }
    Object.keys(updateObject).forEach((key) => {
      if (updateObject[key] === undefined || updateObject[key] === null) {
        delete updateObject[key];
      }
    });

    const updatedAdvert = await Advert.findOneAndUpdate(
      {
        _id: id,
        
      },
      updateObject,
      { new: true, runValidators: true, timestamps: true }
    )
      .select(select)
      .lean();
    if (!updatedAdvert) {
      throw new NotFoundError("Advert not found");
    }
    res.status(StatusCodes.OK).json({
      advert: updatedAdvert,
    });
  }
};

const softDeleteAdvert = async (req, res) => {
  const {id} = req.params
  const {role, userId} = req.user
  if(!id) {
    throw new BadRequestError("Please provide required data")
  }
  if(role === "user") {

   
    const advert = await Advert.findOneAndUpdate({
      _id: id,
      createdBy: userId,
      isDeleted: false,
      archived: false
    }, {
      isDeleted: true,
      archived: true
    }, {
      runValidators: true, new: true, timestamps:true
    }).lean()
    if(!advert) {
      throw new NotFoundError("Advert not found")
    }
    res.status(StatusCodes.NO_CONTENT).json({message: "Advert deleted successfully"})
  }
  if(role === "admin") {
    let {select} = req.query
    if(select) {
      select = select.split(",").join(" ")
    }else {
      select = "-__v"
    }
    const advert = await Advert.findOneAndUpdate({
      _id: id
    }, {
      isDeleted: true,
      archived:true
    }, {
      runValidators: true, new: true, timestamps:true}).select(select).lean()
      if(!advert) {
        throw new NotFoundError("advert not found")
      }
      res.status(StatusCodes.OK).json({
        advert
      })
  }
};

const cancelAdvert = async (req, res) => {
  const {id} = req.params
  const {role, userId} = req.user
  if(!id) {
    throw new BadRequestError("Please provide required data")
  }
  if(role === "user") {

    const preAdvert = await Advert.findOne({_id: id, isDeleted: false, archived: false}).lean()
    if(!preAdvert) {
      throw new NotFoundError("Advert not found")
    }
    if(preAdvert.status === "cancelled" || preAdvert.status === "completed" || preAdvert.status === "expired") {
      throw new BadRequestError("Advert is not open for cancellation")
    }

    if(!preAdvert.adminAdvert.includes(userId)) {
      throw new ForbiddenError("You are not allowed to cancel this advert")
    }
    const userSelectedFields = "-__v -isDeleted -archived ";
    const advert = await Advert.findOneAndUpdate({
      _id: id,
  
      isDeleted: false,
      archived: false
    }, {
      status: "cancelled",

    }, {
      runValidators: true, new: true, timestamps:true
    }).select(userSelectedFields).lean().populate({
        path: "booking",
        select : "start status totalPlayers price notes "
      }).populate({
        path: "participants.user",
        select: "name email school age profilePicture goalKeeper phoneNumber description"
      }).populate({
        path: "waitingList.user",
        select: "name email school age profilePicture goalKeeper phoneNumber description"
      }).populate({
        path: "pitch",
        select:"name description specifications facilities pricing media contact rating status refundAllowed"
      });
    
    res.status(StatusCodes.OK).json({
      advert
    })
  }if(role === "admin") {
    let {select} = req.query
    if(select) {
      select = select.split(",").join(" ")
    }else {
      select = "-__v"
    }
    const advert = await Advert.findOneAndUpdate({
      _id: id
    }, {
      status: "cancelled"
    }, {runValidators: true, new: true, timestamps:true}).select(select).lean()
    if(!advert) {
      throw new NotFoundError("Advert not found")
    }
    res.status(StatusCodes.OK).json({
      advert
    })
  }
};

const acceptRequestAdvert = async (req, res) => {
 const {id} = req.params
 const {role , userId} = req.user
 const {requestId} = req.body
 if(!id || !requestId) {
  throw new BadRequestError("Please provide all required data")
 }

  const advert = await Advert.findOne({_id: id,  isDeleted: false, archived: false}).lean()
  if(!advert) {
    throw new NotFoundError("Advert not found")
  }
  
  if(!advert.waitingList.some((w) => {
    return w.user.toString() === requestId
  })) {
    throw new BadRequestError("Request not found in waiting list")
  }
  if(advert.participants.some((p) => {
    return p.user.toString() === requestId
  })) {
    throw new BadRequestError("User is already a participant in this advert")
  }

  
 
 if(role=== "user") {

  if(advert.status !== "open") {
    throw new BadRequestError("Advert is not open for requests")
  }


  if(!advert.adminAdvert.some((a) => {
    return a.toString() === userId
  })) {
    throw new ForbiddenError("You are not allowed to accept this request")
  }


  const userSelectedFields = "-__v -isDeleted -archived ";
  const updatedAdvert = await Advert.findOneAndUpdate({
    _id: id,
    
    isDeleted: false,
    archived: false,

  }, {
    $addToSet: {
      participants:{user: requestId}
    },
    $pull: {
      waitingList: {user: requestId}
    },
    

  },
{new: true, runValidators: true}).select(userSelectedFields).lean().populate({
        path: "booking",
        select : "start status totalPlayers price notes "
      }).populate({
        path: "participants.user",
        select: "name email school age profilePicture goalKeeper phoneNumber description"
      }).populate({
        path: "waitingList.user",
        select: "name email school age profilePicture goalKeeper phoneNumber description"
      }).populate({
        path: "pitch",
        select:"name description specifications facilities pricing media contact rating status refundAllowed"
      });
if(advert.participants.some((p) => {
  return onlineUsers[p.user.toString()] !== undefined && onlineUsers[p.user.toString()] !== null
})) {
  notificationNamespace.to(advert._id).emit("new-participant", {
    advert: updatedAdvert,
  })
}
res.status(StatusCodes.OK).json({
  advert: updatedAdvert
})

 } if(role === "admin") {
  let {select} = req.query
  if(select) {
    select = select.split(",").join(" ")
  }else {
    select = "-__v"
  }

   


  const updatedAdvert = await Advert.findOneAndUpdate({
    _id: id,
 

  }, {
    $addToSet: {
      participants:{user: requestId}
    },
    $pull: {
      waitingList: {user: requestId}
    },

  },
{new: true, runValidators: true}).select(select).lean()
if(advert.participants.some((p) => {
  return onlineUsers[p.user.toString()] !== undefined && onlineUsers[p.user.toString()] !== null
})) {
  notificationNamespace.to(advert._id).emit("new-participant", {
    advert: updatedAdvert,
  })
}
res.status(StatusCodes.OK).json({
  advert: updatedAdvert
})
 }
};

const rejectRequestAdvert = async (req, res) => {
  const {id} = req.params
  const {role, userId} = req.user
  const {requestId} = req.body
  if(!id || !requestId) {
    throw new BadRequestError("Please provide all required data")
  }

    const advert = await Advert.findOne({
      _id: id,
      
      isDeleted: false,
      archived: false,

    }).lean()
    if(!advert) {
      throw new NotFoundError("Advert not found")
    }
   
    if(!advert.waitingList.some((w) => {
      return w.user.toString() === requestId
    })) {
      throw new BadRequestError("Request not found in waiting list")
    }
    if(advert.participants.some((p) => {
      return p.user.toString() === requestId
    })) {
      throw new BadRequestError("User is already a participant in this advert")
    }
  if(role === "user") {
    const userSelectedFields = "-__v -isDeleted -archived"
  
    if(!advert.adminAdvert.includes(userId)) {
      throw new ForbiddenError("You are not allowed to reject this request")
    }

     if(advert.status !== "open") {
      throw new BadRequestError("Advert is not open for requests")
    }

   
    const updatedAdvert = await Advert.findOneAndUpdate({
      _id: id,

      isDeleted: false,
      archived: false,

    }, {
      $pull: {
        waitingList: {user: requestId}
      }
    }, {
      new: true,
      runValidators: true
    }).select(userSelectedFields).lean().populate({
        path: "booking",
        select : "start status totalPlayers price notes "
      }).populate({
        path: "participants.user",
        select: "name email school age profilePicture goalKeeper phoneNumber description"
      }).populate({
        path: "waitingList.user",
        select: "name email school age profilePicture goalKeeper phoneNumber description"
      }).populate({
        path: "pitch",
        select:"name description specifications facilities pricing media contact rating status refundAllowed"
      });;
    res.status(StatusCodes.OK).json({
      advert: updatedAdvert
    })
  }
  if(role === "admin") {
    let {select} = req.query
    if(select) {
      select = select.split(",").join(" ")
    }
    else {
      select = "-__v"
    }

       

    const updatedAdvert = await Advert.findOneAndUpdate({
      _id: id,
    
      isDeleted: false,
      archived: false,

    }, {
      $pull: {
        waitingList: {user: requestId}
      }
    }, {
      new: true,
      runValidators: true
    }).select(select).lean();
    res.status(StatusCodes.OK).json({
      advert: updatedAdvert
    })

  }


};

const addAdminToAdvert = async (req, res) => {
  const {id} = req.params
  const {role, userId} = req.user
  const {adminId} = req.body
  if(!id || !adminId) {
    throw new BadRequestError("Please provide all required data")
  }
   const advert = await Advert.findOne({
      _id: id,
      isDeleted: false,
      archived: false
    })
    if(!advert) {
      throw new NotFoundError("Advert not found")
    }
    if(!advert.participants.some((p) => {
  return p.user.toString() === adminId
    })) {
      throw new BadRequestError("User is not a participant in this advert")
    }
  if(role === "user") {
   
    if(!advert.adminAdvert.includes(userId)) {
      throw new ForbiddenError("You are not allowed to add admin to this advert")
    }

    const userSelectedFields = "-__v -isDeleted -archived ";
    const updatedAdvert = await Advert.findOneAndUpdate({
      _id: id, 
      isDeleted: false,
      archived: false,

    }, {
      $addToSet: {
        adminAdvert: adminId

      },

    }, {
      new: true,
      runValidators: true,

    }).select(userSelectedFields).lean().populate({
        path: "booking",
        select : "start status totalPlayers price notes "
      }).populate({
        path: "participants.user",
        select: "name email school age profilePicture goalKeeper phoneNumber description"
      }).populate({
        path: "waitingList.user",
        select: "name email school age profilePicture goalKeeper phoneNumber description"
      }).populate({
        path: "pitch",
        select:"name description specifications facilities pricing media contact rating status refundAllowed"
      });
    res.status(StatusCodes.OK).json({
      advert: updatedAdvert
    })

  } if(role === "admin") {
    let {select} = req.query
    if(select) {
      select = select.split(",").join(" ")
    }else {
      select = "-__v"
    }
    const updatedAdvert = await Advert.findOneAndUpdate({
      _id: id,
      isDeleted: false,
      archived: false
    }, {
      $addToSet: {
        adminAdvert: adminId

      }
    }, {
      new: true, runValidators: true, timestamps: true
    }).select(select).lean()

    res.status(StatusCodes.OK).json({
      advert: updatedAdvert
    })

  }
}


const removeAdminFromAdvert = async(req, res) => {
  const {id} = req.params
  const {role, userId} = req.user
  const {adminId} = req.body
  if(!id || !adminId) {
    throw new BadRequestError("Please provide all required data")
  }
  if(role === "user") {
  const advert = await Advert.findOne({
    _id: id,
    isDeleted: false,
    archived: false,
    createdBy: userId
  })
  if(!advert) {
    throw new NotFoundError("Advert not found")
  }
  if(!advert.adminAdvert.includes(adminId)) {
    throw new BadRequestError("User is not an admin in this advert")
  }
  const userSelectedFields = "-__v -isDeleted -archived ";
  const updatedAdvert = await Advert.findOneAndUpdate({
    _id:id, 
    isDeleted: false,
    archived: false,
    createdBy: userId
  }, {
    $pull: {
      adminAdvert: adminId
    }
  }, {
    new: true, runValidators: true
  }).select(userSelectedFields).lean().populate({
        path: "booking",
        select : "start status totalPlayers price notes "
      }).populate({
        path: "participants.user",
        select: "name email school age profilePicture goalKeeper phoneNumber description"
      }).populate({
        path: "waitingList.user",
        select: "name email school age profilePicture goalKeeper phoneNumber description"
      }).populate({
        path: "pitch",
        select:"name description specifications facilities pricing media contact rating status refundAllowed"
      });
  res.status(StatusCodes.OK).json({
    advert: updatedAdvert
  })
}
if(role === "admin") {
  let {select} = req.query
  if(select) {
    select = select.split(",").join(" ")
  }else {
    select = "-__v"
  }
   const advert = await Advert.findOne({
    _id: id,
    isDeleted: false,
    archived: false
  })
  if(!advert) {
    throw new NotFoundError("Advert not found")
  }
  if(!advert.adminAdvert.includes(adminId)) {
    throw new BadRequestError("User is not an admin in this advert")
  }
  const updatedAdvert = await Advert.findOneAndUpdate({
    _id: id,
    
  }, {
    $pull: {
      adminAdvert: adminId
    }

  }, {
    new: true, runValidators: true
  }).select(select).lean()
  res.status(StatusCodes.OK).json({advert: updatedAdvert})
}

}

const markAdvertRequestSeen = async (req, res) => {
const {id} = req.params
const {role, userId} = req.user

if(!id) {
  throw new BadRequestError("Please provide required data")
}
const advert = await Advert.findOne({
  _id: id,
  isDeleted: false,
  archived: false
})
if(!advert) {
  throw new NotFoundError("Advert not found")
}
if(role === "user") {
  if(!advert.adminAdvert.includes(userId)) {
    throw new ForbiddenError("You are not allowed to mark this advert request as seen")
  }
  const userSelectedFields = "-__v -isDeleted -archived ";
  const updatedAdvert = await Advert.findOneAndUpdate({
    _id: id,
     isDeleted: false,
     archived: false
  }, {
    $set: {
      "waitingList.$[].seen": true
    }
  }, {
    new: true, runValidators: true
  }).select(userSelectedFields).lean().populate({
        path: "booking",
        select : "start status totalPlayers price notes "
      }).populate({
        path: "participants.user",
        select: "name email school age profilePicture goalKeeper phoneNumber description"
      }).populate({
        path: "waitingList.user",
        select: "name email school age profilePicture goalKeeper phoneNumber description"
      }).populate({
        path: "pitch",
        select:"name description specifications facilities pricing media contact rating status refundAllowed"
      });

  if(advert.participants.some((p) => {
  return onlineUsers[p.user.toString()] !== undefined && onlineUsers[p.user.toString()] !== null
  })) {
    notificationNamespace.to(advert._id.toString()).emit("advertRequestSeen", {
      advert: updatedAdvert
    })
  }

  
  res.status(StatusCodes.OK).json({
    advert: updatedAdvert
  })
}
if(role === "admin")  {
  let {select} = req.query
  if(select) {
    select = select.split(",").join(" ")
  }else {
    select = "-__v"
  }
  const updatedAdvert = await Advert.findOneAndUpdate({
    _id: id,
   
  }, {
    $set: {
      "waitingList.$[].seen": true
    }
  }, {
    new: true, runValidators: true
  }).select(select).lean()
  if(advert.participants.some((p) => {
    return onlineUsers[p.user.toString()] !== undefined && onlineUsers[p.user.toString()] !== null
    })) {
      notificationNamespace.to(advert._id.toString()).emit("advertRequestSeen", {
        advert: updatedAdvert
      })
    }
  res.status(StatusCodes.OK).json({
    advert: updatedAdvert
  })
}
};



const deleteAdvert = async (req, res) => {
 const {id} = req.params
 
 if(!id) {
  throw new BadRequestError("Please provide required data")
 }
 const advert = await Advert.findOne({_id: id})
 if(!advert) {
  throw new NotFoundError("Advert not found")
 }
 await Advert.deleteOne({_id:id})
 res.status(StatusCodes.NO_CONTENT).json({message: "Advert deleted successfully"})
};

const revokeRequestAdvert = async (req, res) => {
  const {id} = req.params
  const {role, userId} = req.user
  if(!id) {
    throw new BadRequestError("Please provide required data")
  }
  const advert = await Advert.findOne({_id: id, isDeleted: false, archived: false}).lean()
  if(!advert) {
    throw new NotFoundError("Advert not found")
  }
  if(role === "user") {
    if(!advert.waitingList.some((w) => {
      return w.user.toString() === userId
    })) {
      throw new BadRequestError("You have not requested this advert")
    }
    const userSelectedFields = "-__v -isDeleted -archived ";
    const updatedAdvert = await Advert.findOneAndUpdate({
      _id:id,
      isDeleted: false,
      archived: false,

    }, {
      $pull: {
        waitingList: {user: userId}
      }
    }, {
      new: true, runValidators: true
    }).select(userSelectedFields).lean()
    res.status(StatusCodes.OK).json({
      advert: updatedAdvert
    })
  }if(role === "admin") {
    let {select} = req.query
    const {candidateId} = req.body
    if(!candidateId) {
      throw new BadRequestError("Please provide required data")
    }
    if(!advert.waitingList.some((w) => {
      return w.user.toString() === candidateId
    })) {
      throw new BadRequestError("User has not requested this advert")
    }
    if(select) {
      select = select.split(",").join(" ")
    }
    else {
      select = "-__v"
    }
    const updatedAdvert = await Advert.findOneAndUpdate({
      _id: id,

    }, {
      $pull: {
        waitingList: {user: candidateId}
      }
    }, {
      new: true, runValidators: true
    }).select(select).lean()
    res.status(StatusCodes.OK).json({
      advert: updatedAdvert
    })
    
    
  }

};

const leaveAdvert = async (req, res) => {
  const {id} = req.params
  const {role, userId} = req.user
  if(!id) {
    throw new BadRequestError("Please provide required data")
  }
  const advert = await Advert.findOne({_id: id, isDeleted: false, archived: false}).lean()
  if(!advert) {
    throw new NotFoundError("Advert not found")
  }
  if(role === "user") {
    if(!advert.participants.some((p) => {
      return p.user.toString() === userId
    })) {
      throw new BadRequestError("You are not a participant in this advert")
    }
    if(advert.createdBy.toString() === userId  ) {
      throw new BadRequestError("You cannot leave an advert you created, please delete it instead")

    }
    const userSelectedFields = "-__v -isDeleted -archived ";
    const updatedAdvert = await Advert.findOneAndUpdate({
      _id: id,
      isDeleted: false,
      archived: false
    }, {
      $pull: {
        participants: {user: userId},
        adminAdvert: userId
        
      }
    }, {
      new: true, runValidators: true
    }).select(userSelectedFields).lean().populate({
        path: "booking",
        select : "start status totalPlayers price notes "
      }).populate({
        path: "participants.user",
        select: "name email school age profilePicture goalKeeper phoneNumber description"
      }).populate({
        path: "waitingList.user",
        select: "name email school age profilePicture goalKeeper phoneNumber description"
      }).populate({
        path: "pitch",
        select:"name description specifications facilities pricing media contact rating status refundAllowed"
      });
    if(advert.participants.some((p) => {
  return onlineUsers[p.user.toString()] !== undefined && onlineUsers[p.user.toString()] !== null
})) {
  notificationNamespace.to(advert._id).emit("leave-participant", {
    advert: updatedAdvert,
  })
}
    res.status(StatusCodes.OK).json({
      message: "You have left the advert successfully"
    })
  }
  if(role === "admin") {
    let {select} = req.query
    const {participantId} = req.body
    if(!participantId) {
      throw new BadRequestError("Please provide required data")
    }
    if(!advert.participants.some((p) => {
      return p.user.toString() === participantId
    })) {
      throw new BadRequestError("User is not a participant in this advert")
    }
    if(select) {
      select = select.split(",").join(" ")

    }else {
      select = "-__v"
    }
    const updatedAdvert = await Advert.findOneAndUpdate({
      _id:id,
     


    }, {
      $pull: {
        participants: {user:participantId},
        adminAdvert: participantId
      }
    }, {
      new: true, runValidators: true
    }).select(select).lean()
    if(advert.participants.some((p) => {
  return onlineUsers[p.user.toString()] !== undefined && onlineUsers[p.user.toString()] !== null
})) {
  notificationNamespace.to(advert._id).emit("leave-participant", {
    advert: updatedAdvert,
  })
}
    res.status(StatusCodes.OK).json({
      advert: updatedAdvert
    })
  }
};

const expelFromAdvert = async (req, res) => {
 const {id} = req.params
 const {role, userId} = req.user
 const {participantId} = req.body
 if(!id || !participantId) {
  throw new BadRequestError("Please provide required data")
 }
 if(role === "user" && userId === participantId) {
  throw new BadRequestError("You cannot expel yourself from an advert, please leave it instead")
 }
 const advert = await Advert.findOne({_id: id, isDeleted: false, archived: false}).lean()
 if(!advert) {
  throw new NotFoundError("Advert not found")
 }
 if(role === "user") {
  if(!advert.adminAdvert.some((p) => {
    return p.toString() === userId
  })) {
    throw new ForbiddenError("You are not allowed to expel participant from this advert")
  }
 
  if(!advert.participants.some((p) => {
    return p.user.toString() === participantId
  })) {
    throw new BadRequestError("User is not a participant in this advert")
  }

  if(advert.createdBy.toString() === participantId) {
    throw new BadRequestError("You cannot expel the creator of this advert, please delete it instead")
  }
   const userSelectedFields = "-__v -isDeleted -archived ";
   const updatedAdvert = await Advert.findOneAndUpdate({
    _id: id,
    isDeleted: false,
    archived: false
   }, {
    $pull: {
      participants: {user: participantId},
      adminAdvert: participantId
    }
   }, {
    new: true, runValidators: true}).select(userSelectedFields).lean().populate({
        path: "booking",
        select : "start status totalPlayers price notes "
      }).populate({
        path: "participants.user",
        select: "name email school age profilePicture goalKeeper phoneNumber description"
      }).populate({
        path: "waitingList.user",
        select: "name email school age profilePicture goalKeeper phoneNumber description"
      }).populate({
        path: "pitch",
        select:"name description specifications facilities pricing media contact rating status refundAllowed"
      });
    if(advert.participants.some((p) => {
  return onlineUsers[p.user.toString()] !== undefined && onlineUsers[p.user.toString()] !== null
})) {
  notificationNamespace.to(advert._id).emit("expel-participant", {
    advert: updatedAdvert,
  })
}
    res.status(StatusCodes.OK).json({
      advert: updatedAdvert
    })
 }if(role === "admin") {
  let {select} = req.query
  if(select) {
    select = select.split(",".join(" "))
  }else {
    select = "-__v"
  }
  if(!advert.participants.some((p) => {
    return p.user.toString() === participantId
  })) {
    throw new BadRequestError("User is not a participant in this advert")
  }
  const updatedAdvert = await Advert.findOneAndUpdate({
    _id: id,
   
  }, {
    $pull: {
      participants: {user: participantId},
      adminAdvert: participantId
    }
  }, {
    new: true, runValidators: true
  }).select(select).lean()
  if(advert.participants.some((p) => {
  return onlineUsers[p.user.toString()] !== undefined && onlineUsers[p.user.toString()] !== null
})) {
  notificationNamespace.to(advert._id).emit("expel-participant", {
    advert: updatedAdvert,
  })
}
  res.status(StatusCodes.OK).json({
    advert: updatedAdvert
  })
 }
};

module.exports = {
  createAdvert,
  requestAdvert,
  getVicinityAdverts,
  getAllAdverts,
  getUserAdverts,
  getPerviousUserAdverts,
  getCurrentUserAdverts,
  getSingleAdvert,
  updateAdvert,
  softDeleteAdvert,
  cancelAdvert,
  addAdminToAdvert,
  acceptRequestAdvert,
  rejectRequestAdvert,
 getParticipantAdverts,
  deleteAdvert,
  revokeRequestAdvert,
  markAdvertRequestSeen,
  leaveAdvert,
  expelFromAdvert,
  removeAdminFromAdvert,
  getWaitingListAdverts
};
