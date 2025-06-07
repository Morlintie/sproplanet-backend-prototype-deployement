const Company = require("../models/Company");
const { StatusCodes } = require("http-status-codes");
const {
  adminCompanyQuery,
  updateCompanyEmail,
  resetCompanyPasswordEmail,
} = require("../utils");
const { NotFoundError, BadRequestError } = require("../errors");

const getManyCompany = async (req, res) => {
  const queryObject = adminCompanyQuery(req);
  let { sort, select } = req.query;
  if (sort) {
    const sortList = sort.split(",").join(" ");
    sort = sortList;
  }

  if (select) {
    const selectList = select.split(",").join(" ");
    select = selectList;
  }
  const page = req.query.page || 1;
  const limit = req.query.limit || 10;
  const skip = (page - 1) * limit;
  const companies = await Company.find(queryObject)
    .sort(sort)
    .select(select)
    .select("-password")
    .skip(skip)
    .limit(limit);
  if (!companies || companies.length === 0) {
    throw new NotFoundError("No companies found with the provided criteria.");
  }
  const companyCount = companies.length;
  res.status(StatusCodes.OK).json({ companies, companyCount });
};

const getSingleCompany = async (req, res) => {
  const { id } = req.params;
  if (!id) {
    throw new BadRequestError("Please provide required data.");
  }
  const company = await Company.findOne({ _id: id }).select("-password");
  if (!company) {
    throw new NotFoundError("Company not found.");
  }
  res.status(StatusCodes.OK).json({ company });
};

const showCompany = async (req, res) => {
  const { companyId } = req.user;

  const company = await Company.findOne({ _id: companyId }).select("-password");
  if (!company) {
    throw new NotFoundError("Company not found.");
  }
  res.status(StatusCodes.OK).json({ company });
};

const updateCompanyRequest = async (req, res) => {
  const { companyId } = req.user;
  const { password } = req.body;

  const company = await Company.findOne({ _id: companyId });
  if (!company) {
    throw new NotFoundError("Company not found.");
  }
  const isPasswordCorrect = await company.comparePassword(password);
  if (!isPasswordCorrect) {
    throw new BadRequestError("The password is not correct. ");
  }

  await updateCompanyEmail(company.email, company.phone, company.name);

  res.status(StatusCodes.OK).json({
    msg: "The update request email has been sent to our customer service. We will get contact with you as soon as possible.",
  });
};

const updateSingleCompany = async (req, res) => {
  const { id } = req.params;
  const {
    name,
    email,
    phone,
    address,
    website,
    ip,
    description,
    logo,
    taxLocation,
    VKN_TCKN,
    type,
    postalCode,
  } = req.body;
  if (!id) {
    throw new BadRequestError("Please provide required data.");
  }
  const company = await Company.findOneAndUpdate(
    { _id: id },
    {
      name,
      email,
      phone,
      address,
      website,
      ip,
      description,
      logo,
      taxLocation,
      VKN_TCKN,
      type,
      postalCode,
    },
    {
      new: true,
      runValidators: true,
      timestamps: true,
      writeConcnern: { w: "majority", j: true },
    }
  ).select("-password");
  if (!company) {
    throw NotFoundError("Company not found.");
  }
  res.status(StatusCodes.OK).json({ company });
};

const requestPasswordReset = async (req, res) => {
  const { companyId } = req.user;
  const { password } = req.body;

  const company = await Company.findOne({ _id: companyId });
  if (!company) {
    throw new NotFoundError("Company not found.");
  }
  const isPasswordCorrect = await company.comparePassword(password);
  if (!isPasswordCorrect) {
    throw new BadRequestError("The password is not correct. ");
  }

  await resetCompanyPasswordEmail(company.email, company.phone, company.name);

  res.status(StatusCodes.OK).json({
    msg: "The reset password email has been sent to our customer service. We will get contact with you as soon as possible.",
  });
};

const resetPasswordCompany = async (req, res) => {
  const { id } = req.params;
  const { oldPassword, newPassword, newBackupPassword } = req.body;
  if (!id || !oldPassword || !newPassword || !newBackupPassword) {
    throw new BadRequestError("Please provide all required data.");
  }

  const company = await Company.findOne({ _id: id });
  if (!company) {
    throw new NotFoundError("Company not found.");
  }
  const isPasswordCorrect = await company.comparePassword(oldPassword);
  if (!isPasswordCorrect) {
    throw new BadRequestError("The password is not correct.");
  }

  if (newPassword !== newBackupPassword) {
    throw new BadRequestError("Both passwords have to match with each other.");
  }

  const isSamePassword = await company.comparePassword(newPassword);
  if (isSamePassword) {
    throw new BadRequestError("New password cannot be same as old password.");
  }

  const newCompany = await Company.findOneAndUpdate(
    { _id: company._id },
    { password: newPassword },
    {
      runValidators: true,
      new: true,
      timestamps: true,
      writeConcern: { w: "majority", j: true },
    }
  );
  if (!newCompany) {
    throw new NotFoundError("Company not found.");
  }

  res
    .status(StatusCodes.OK)
    .json({ msg: "Company password successfully updated." });
};

module.exports = {
  getManyCompany,
  getSingleCompany,
  showCompany,
  updateSingleCompany,
  requestPasswordReset,
  resetPasswordCompany,
  updateCompanyRequest,
};
