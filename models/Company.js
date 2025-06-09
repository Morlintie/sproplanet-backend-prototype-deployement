const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const { BadRequestError } = require("../errors");

const companySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please provide company name"],
      unique: [true, "This company name has already been taken."],
    },

    password: {
      type: String,
      required: [true, "Please provide company password."],

      minlength: [10, "Password must be at least 10 characters long."],
    },
    email: {
      type: String,
      required: [true, "Please provide company email"],
      unique: [true, "This company email has already been taken."],
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Please provide a valid email."],
    },
    phone: {
      type: String,
      required: [true, "Please provide company phone number."],
      match: [/^\+?[\d\s\-().]{7,20}$/, "Please provide a valid phone number."],
      unique: [true, "This company phone number has already been taken."],
    },
    address: {
      type: String,
      required: [true, "Please provide company address."],
    },
    postalCode: {
      type: Number,
      required: [true, "Please provide company postal code."],
      match: [/\b\d{5}\b/g, "Please provide al valid postal code."],
    },

    taxLocation: {
      type: String,
      required: [true, "Please provide company tax location."],
    },
    VKN_TCKN: {
      type: Number,
      required: [true, "Please provide VKN_TCKN number."],
      match: [/\b\d{10,11}\b/g, "Please provide a valid VKN_TCKN number."],
      unique: [true, "VKN_TCKN number must be unique."],
    },
    type: {
      type: String,
      required: [true, "Please provide company type."],
      enum: {
        values: ["Limited", "Şahıs", "Anonim", "Kooperatif"],
        message: "Please provide a valid company type.",
      },
    },
    website: {
      type: String,
      match: [
        /^(https?:\/\/)?(www\.)?([a-zA-Z0-9-_]+\.)+[a-zA-Z]{2,}(:\d+)?(\/[^\s]*)?$/,
        "Please provide a valid website URL.",
      ],
      default: "",
    },

    ip: {
      type: String,
      required: [true, "Please provide company IP address."],
      match: [
        /^(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(?:\.(?!$)|$)){4}$|^(([0-9A-Fa-f]{1,4}:){7}([0-9A-Fa-f]{1,4}|:)|([0-9A-Fa-f]{1,4}:){1,7}:|([0-9A-Fa-f]{1,4}:){1,6}:[0-9A-Fa-f]{1,4}|([0-9A-Fa-f]{1,4}:){1,5}(:[0-9A-Fa-f]{1,4}){1,2}|([0-9A-Fa-f]{1,4}:){1,4}(:[0-9A-Fa-f]{1,4}){1,3}|([0-9A-Fa-f]{1,4}:){1,3}(:[0-9A-Fa-f]{1,4}){1,4}|([0-9A-Fa-f]{1,4}:){1,2}(:[0-9A-Fa-f]{1,4}){1,5}|[0-9A-Fa-f]{1,4}:((:[0-9A-Fa-f]{1,4}){1,6})|:((:[0-9A-Fa-f]{1,4}){1,7}|:))$/,
        "Please provide a valid IP address.",
      ],
    },

    role: {
      type: String,
      default: "owner",
      required: [true, "Please provide company rule as owner"],
    },

    description: {
      type: String,
      required: [true, "Please provide company description."],
      minLength: [10, "Description must be at least 10 characters long."],
      maxLength: [500, "Description must be at most 500 characters long."],
    },

    logo: {
      type: String,
      match: [
        /^(https?:\/\/)(www\.)?([a-zA-Z0-9-_]+\.)+[a-zA-Z]{2,}(\/[^\s?#]+)?\.(jpg|jpeg|png|gif|webp|svg|bmp|tiff)(\?[^\s]*)?$/i,
        "Please provide a valid logo URL.",
      ],
      default: "",
    },

    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Please provide the owner of the company."],
    },
  },
  { timestamps: true }
);

companySchema.pre("save", async function (next) {
  try {
    if (this.isModified("password")) {
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(this.password, salt);
    }
  } catch (err) {
    console.log(err);
    next(err);
  }
});

companySchema.pre("findOneAndUpdate", async function (next) {
  try {
    if (this.getUpdate().password) {
      const salt = await bcrypt.genSalt(10);
      this.getUpdate().password = await bcrypt.hash(
        this.getUpdate().password,
        salt
      );
    }
  } catch (err) {
    console.log(err);
    next(err);
  }
});

companySchema.methods.comparePassword = async function (candidatePassword) {
  try {
    const passwordValid = await bcrypt.compare(
      candidatePassword,
      this.password
    );
    return passwordValid;
  } catch (err) {
    console.log(err);
    throw new BadRequestError("Password comparison failed.");
  }
};

const Company = mongoose.model("Company", companySchema);

module.exports = Company;
/* This code defines a Mongoose schema for a Company model, which includes fields for name, email, phone, address, website, and description. 
Each field has validation rules to ensure data integrity. 
The schema is then compiled into a model that can be used to interact with the MongoDB database. 
The model is exported for use in other part of the application. 
The schema includes timestamps to automatically manage created and updated dates for each company document.*/
