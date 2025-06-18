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
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
        required: true,
      },
      coordinates: {
        type: [Number],
        required: [true, "Please provide pitch coordinates."],
      },
    },

    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: [true, "Please provide company ID."],
    },

    specifications: {
      dimensions: {
        length: { type: Number },
        width: { type: Number },
      },
      surfaceType: {
        type: String,
        enum: ["natural_grass", "artificial_turf", "indoor_court"],
      },

      isIndoor: {
        type: Boolean,
        default: false,
      },
      hasLighting: {
        type: Boolean,
        default: true,
      },
      recommendedCapacity: {
        players: {
          type: Number,
          required: [true, "Please provide recommended player number."],
          default: 14,
        },
        spectators: { type: Number, default: 0 },
      },
    },

    facilities: {
      changingRooms: { type: Boolean, default: true },
      showers: { type: Boolean, default: false },
      parking: {
        type: Boolean,
        default: false,
      },
      shoeRenting: { type: Boolean, default: false },
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
      specialDayMultiplier: {
        type: Number,
        default: 1.0,
        min: [1.0, "Special day multiplier cannot be less than 1.0"],
      },
      weekendMultiplier: {
        type: Number,
        default: 1.0,
        min: [1.0, "Weekend multiplier cannot be less than 1.0"],
      },
    },

    closed: { type: Boolean, default: false },

    media: {
      images: [
        {
          url: { type: String, required: true },
          caption: String,
          public_id: { type: String, required: true },
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
            return /^(\+90|0)?[5][0-9]{9}$/.test(v);
          },
          message: "Please provide a valid Turkish phone number.",
        },
      },
      email: {
        type: String,
        required: [true, "Please provide a contact email."],
        validate: {
          validator: function (v) {
            return (
              !v || /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(v)
            );
          },
          message: "Please provide a valid email address",
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
      enum: ["active", "inactive", "maintenance"],
      default: "active",
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
pitchSchema.index({ location: "2dsphere" }); // Geospatial queries
pitchSchema.index({ "location.address.district": 1, status: 1 });
pitchSchema.index({ "facilities.shooRenting": 1 });
pitchSchema.index({ "specifications.isIndoor": 1 });
pitchSchema.index({ "pricing.hourlyRate": 1 });
pitchSchema.index({ "rating.averageRating": -1 });
pitchSchema.index({ name: 1 });

module.exports = mongoose.model("Pitch", pitchSchema);
