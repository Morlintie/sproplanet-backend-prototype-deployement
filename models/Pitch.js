const mongoose = require("mongoose");

const pitchSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please provide pitch name."],
      trim: true,
      maxlength: [100, "Pitch name cannot exceed 100 characters"],
    },

    description: {
      type: String,
      trim: true,
      maxlength: [1000, "Description cannot exceed 1000 characters"],
    },

    location: {
      address: {
        street: { type: String, required: [true, "Please provide street."] },
        neighborhood: {
          type: String,
          required: [true, "Please provide neighborhood."],
        },
        city: { type: String, required: [true, "Please provide city."] },
        district: {
          type: String,
          required: [true, "Please provide district."],
        },
        postalCode: {
          type: String,
          required: [true, "Please provide postalCode."],
        },
        country: {
          type: String,
          default: "Turkey",
          required: [true, "Please provide country."],
        },
      },
      coordinates: {
        latitude: {
          type: Number,
          required: [true, "Please provide latitude."],
        },
        longitude: {
          type: Number,
          required: [true, "Please provide longitude."],
        },
      },
    },

    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: [true, "Please provide company ID."],
    },

    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Please provide owner ID."],
    },

    specifications: {
      dimensions: {
        length: { type: Number },
        width: { type: Number },
      },
      surfaceType: {
        type: String,
        enum: ["natural_grass", "artificial_turf", "concrete", "indoor_court"],
      },

      isIndoor: {
        type: Boolean,
        default: false,
      },
      hasLighting: {
        type: Boolean,
        default: false,
      },
      recommendedCapacity: {
        players: {
          type: Number,
          required: [true, "Please provide recommended player number."],
        },
        spectators: { type: Number, default: 0 },
      },
    },

    facilities: {
      changingRooms: { type: Number, default: 0 },
      showers: { type: Number, default: 0 },
      parking: {
        type: Boolean,
        default: false,
      },
      shooRenting: { type: Boolean, default: false },
      otherAmenities: [String], // cafe, wifi, etc.
    },

    pricing: {
      hourlyRate: {
        type: Number,
        required: [true, "Please provide hourly rate."],
        min: [0, "Hourly rate cannot be negative"],
      },
      currency: {
        type: String,
        default: "TRY",
      },
      peakHourMultiplier: {
        type: Number,
        default: 1.0,
        min: [1.0, "Peak hour multiplier cannot be less than 1.0"],
      },
      weekendMultiplier: {
        type: Number,
        default: 1.0,
        min: [1.0, "Weekend multiplier cannot be less than 1.0"],
      },
    },

    availability: {
      operatingHours: {
        monday: {
          "08.00-09.00": { type: Boolean, default: true },
          "09.00-10.00": { type: Boolean, default: true },
          "10.00-11.00": { type: Boolean, default: true },
          "11.00-12.00": { type: Boolean, default: true },
          "12.00-13.00": { type: Boolean, default: true },
          "13.00-14.00": { type: Boolean, default: true },
          "14.00-15.00": { type: Boolean, default: true },
          "15.00-16.00": { type: Boolean, default: true },
          "16.00-17.00": { type: Boolean, default: true },
          "17.00-18.00": { type: Boolean, default: true },
          "18.00-19.00": { type: Boolean, default: true },
          "19.00-20.00": { type: Boolean, default: true },
          "20.00-21.00": { type: Boolean, default: true },
          "21.00-22.00": { type: Boolean, default: true },
          "22.00-23.00": { type: Boolean, default: true },
          "23.00-00.00": { type: Boolean, default: true },
          "00.00-01.00": { type: Boolean, default: true },
          closed: { type: Boolean, default: false },
        },
        tuesday: {
          "08.00-09.00": { type: Boolean, default: true },
          "09.00-10.00": { type: Boolean, default: true },
          "10.00-11.00": { type: Boolean, default: true },
          "11.00-12.00": { type: Boolean, default: true },
          "12.00-13.00": { type: Boolean, default: true },
          "13.00-14.00": { type: Boolean, default: true },
          "14.00-15.00": { type: Boolean, default: true },
          "15.00-16.00": { type: Boolean, default: true },
          "16.00-17.00": { type: Boolean, default: true },
          "17.00-18.00": { type: Boolean, default: true },
          "18.00-19.00": { type: Boolean, default: true },
          "19.00-20.00": { type: Boolean, default: true },
          "20.00-21.00": { type: Boolean, default: true },
          "21.00-22.00": { type: Boolean, default: true },
          "22.00-23.00": { type: Boolean, default: true },
          "23.00-00.00": { type: Boolean, default: true },
          "00.00-01.00": { type: Boolean, default: true },
          closed: { type: Boolean, default: false },
        },
        wednesday: {
          "08.00-09.00": { type: Boolean, default: true },
          "09.00-10.00": { type: Boolean, default: true },
          "10.00-11.00": { type: Boolean, default: true },
          "11.00-12.00": { type: Boolean, default: true },
          "12.00-13.00": { type: Boolean, default: true },
          "13.00-14.00": { type: Boolean, default: true },
          "14.00-15.00": { type: Boolean, default: true },
          "15.00-16.00": { type: Boolean, default: true },
          "16.00-17.00": { type: Boolean, default: true },
          "17.00-18.00": { type: Boolean, default: true },
          "18.00-19.00": { type: Boolean, default: true },
          "19.00-20.00": { type: Boolean, default: true },
          "20.00-21.00": { type: Boolean, default: true },
          "21.00-22.00": { type: Boolean, default: true },
          "22.00-23.00": { type: Boolean, default: true },
          "23.00-00.00": { type: Boolean, default: true },
          "00.00-01.00": { type: Boolean, default: true },
          closed: { type: Boolean, default: false },
        },
        thursday: {
          "08.00-09.00": { type: Boolean, default: true },
          "09.00-10.00": { type: Boolean, default: true },
          "10.00-11.00": { type: Boolean, default: true },
          "11.00-12.00": { type: Boolean, default: true },
          "12.00-13.00": { type: Boolean, default: true },
          "13.00-14.00": { type: Boolean, default: true },
          "14.00-15.00": { type: Boolean, default: true },
          "15.00-16.00": { type: Boolean, default: true },
          "16.00-17.00": { type: Boolean, default: true },
          "17.00-18.00": { type: Boolean, default: true },
          "18.00-19.00": { type: Boolean, default: true },
          "19.00-20.00": { type: Boolean, default: true },
          "20.00-21.00": { type: Boolean, default: true },
          "21.00-22.00": { type: Boolean, default: true },
          "22.00-23.00": { type: Boolean, default: true },
          "23.00-00.00": { type: Boolean, default: true },
          "00.00-01.00": { type: Boolean, default: true },
          closed: { type: Boolean, default: false },
        },
        friday: {
          "08.00-09.00": { type: Boolean, default: true },
          "09.00-10.00": { type: Boolean, default: true },
          "10.00-11.00": { type: Boolean, default: true },
          "11.00-12.00": { type: Boolean, default: true },
          "12.00-13.00": { type: Boolean, default: true },
          "13.00-14.00": { type: Boolean, default: true },
          "14.00-15.00": { type: Boolean, default: true },
          "15.00-16.00": { type: Boolean, default: true },
          "16.00-17.00": { type: Boolean, default: true },
          "17.00-18.00": { type: Boolean, default: true },
          "18.00-19.00": { type: Boolean, default: true },
          "19.00-20.00": { type: Boolean, default: true },
          "20.00-21.00": { type: Boolean, default: true },
          "21.00-22.00": { type: Boolean, default: true },
          "22.00-23.00": { type: Boolean, default: true },
          "23.00-00.00": { type: Boolean, default: true },
          "00.00-01.00": { type: Boolean, default: true },
          closed: { type: Boolean, default: false },
        },
        saturday: {
          "08.00-09.00": { type: Boolean, default: true },
          "09.00-10.00": { type: Boolean, default: true },
          "10.00-11.00": { type: Boolean, default: true },
          "11.00-12.00": { type: Boolean, default: true },
          "12.00-13.00": { type: Boolean, default: true },
          "13.00-14.00": { type: Boolean, default: true },
          "14.00-15.00": { type: Boolean, default: true },
          "15.00-16.00": { type: Boolean, default: true },
          "16.00-17.00": { type: Boolean, default: true },
          "17.00-18.00": { type: Boolean, default: true },
          "18.00-19.00": { type: Boolean, default: true },
          "19.00-20.00": { type: Boolean, default: true },
          "20.00-21.00": { type: Boolean, default: true },
          "21.00-22.00": { type: Boolean, default: true },
          "22.00-23.00": { type: Boolean, default: true },
          "23.00-00.00": { type: Boolean, default: true },
          "00.00-01.00": { type: Boolean, default: true },
          closed: { type: Boolean, default: false },
        },
        sunday: {
          "08.00-09.00": { type: Boolean, default: true },
          "09.00-10.00": { type: Boolean, default: true },
          "10.00-11.00": { type: Boolean, default: true },
          "11.00-12.00": { type: Boolean, default: true },
          "12.00-13.00": { type: Boolean, default: true },
          "13.00-14.00": { type: Boolean, default: true },
          "14.00-15.00": { type: Boolean, default: true },
          "15.00-16.00": { type: Boolean, default: true },
          "16.00-17.00": { type: Boolean, default: true },
          "17.00-18.00": { type: Boolean, default: true },
          "18.00-19.00": { type: Boolean, default: true },
          "19.00-20.00": { type: Boolean, default: true },
          "20.00-21.00": { type: Boolean, default: true },
          "21.00-22.00": { type: Boolean, default: true },
          "22.00-23.00": { type: Boolean, default: true },
          "23.00-00.00": { type: Boolean, default: true },
          "00.00-01.00": { type: Boolean, default: true },
          closed: { type: Boolean, default: false },
        },
      },
    },

    media: {
      images: [
        {
          url: { type: String, required: true },
          caption: String,
          isPrimary: { type: Boolean, default: false },
        },
      ],
      videos: [
        {
          url: { type: String, required: true },
          caption: String,
          thumbnail: String,
        },
      ],
    },

    contact: {
      phone: {
        type: String,
        required: [true, "Please provide a contact phone number."],
        validate: {
          validator: function (v) {
            return /^(\+90|0)?[5][0-9]{9}$/.test(v); // Turkish phone format
          },
          message: "Please provide a valid Turkish phone number.",
        },
        validate: {
          validator: async function (v) {
            const phoneExists = await this.model("Pitch").findOne({
              "contact.phone": v,
            });
            return !phoneExists;
          },
        },
      },
      email: {
        type: String,
        required: [true, "Please provide a contact email."],
        validate: {
          validator: function (v) {
            return !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
          },
          message: "Please provide a valid email address",
        },
        validate: {
          validator: async function (v) {
            const emailExists = await this.model("Pitch").findOne({
              "contact.email": v,
            });
            return !emailExists;
          },
        },
      },
      website: String,
      socialMedia: {
        instagram: String,
        facebook: String,
        twitter: String,
      },
    },

    rating: {
      averageRating: {
        type: Number,
        default: 0,
        min: [0, "Rating cannot be negative"],
        max: [5, "Rating cannot exceed 5"],
      },
      totalReviews: {
        type: Number,
        default: 0,
        min: [0, "Total reviews cannot be negative"],
      },
    },

    // Administrative
    status: {
      type: String,
      enum: ["active", "inactive", "maintenance", "pending_verification"],
      default: "pending_verification",
    },

    // Business Logic
    totalBookings: {
      type: Number,
      default: 0,
      min: [0, "Total bookings cannot be negative"],
    },

    totalRevenue: {
      type: Number,
      default: 0,
      min: [0, "Total revenue cannot be negative"],
    },

    //SEO and Search Optimization
    tags: [String], // for search optimization
    searchKeywords: [String],

    lastMaintenanceDate: Date,
    nextMaintenanceDate: Date,
  },
  {
    timestamps: true,
  }
);

// Indexes for performance
pitchSchema.index({ "location.coordinates": "2dsphere" }); // Geospatial queries
pitchSchema.index({ "location.address.city": 1, status: 1 });
pitchSchema.index({ "specifications.pitchType": 1, status: 1 });
pitchSchema.index({ "pricing.hourlyRate": 1 });
pitchSchema.index({ "rating.averageRating": -1 });
pitchSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Pitch", pitchSchema);
