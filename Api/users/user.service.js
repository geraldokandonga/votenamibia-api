const User = require("./user.model");
const catchAsync = require("../_utils/catchAsync");
const AppError = require("../_utils/appError");
const APIFeatures = require("../_utils/apiFeatures");
const filterObj = require("../_utils/filterObj");
const Role = require("../_helpers/role");
const { hasPermission } = require("./../_helpers/permissions");

/**
 * Delete User
 */
exports.delete = () =>
  catchAsync(async (req, res, next) => {
    // first find the resources
    let query = User.findById(req.params.id);

    const user = await query;

    if (!user) {
      return next(new AppError("No user found with the given detail.", 404));
    }

    // permission
    if (!hasPermission(req.user, user))
      return next(
        AppError("You do not have permission to perform this action!", 401)
      );

    // find and delete
    const doc = await User.findByIdAndDelete(req.params.id);

    if (!doc) {
      return next(new AppError("No user found with the given detail", 404));
    }

    res.status(204).json({
      status: "success",
      data: null
    });
  });

/**
 * Update user
 */
exports.update = () =>
  catchAsync(async (req, res, next) => {
    let query = User.findById(req.params.id);

    const user = await query;

    if (!user) {
      return next(new AppError("No user found with the given detail.", 404));
    }

    // validate (if email was changed)
    if (
      req.body.email &&
      user.email !== req.body.email &&
      (await User.findOne({
        email: req.body.email
      }))
    ) {
      return next(
        new AppError(`Email ${req.body.email} is already registered`)
      );
    }

    // permission
    if (!hasPermission(req.user, user))
      return next(
        AppError("You do not have permission to perform this action!", 401)
      );

    // Filtered out unwanted fields names that are
    const filteredBody = filterObj(req.body, "name", "email");
    if (req.file) filteredBody.photo = req.file.filename;

    // find and update
    const doc = await User.findByIdAndUpdate(req.params.id, filteredBody, {
      new: true,
      runValidators: true
    });

    if (!doc) {
      return next(new AppError("No user found with the given detail.", 404));
    }

    res.status(200).json({
      status: "success",
      data: doc
    });
  });

/**
 * Return a single user resource
 *
 * @param {*} popOptions
 */
exports.getById = popOptions =>
  catchAsync(async (req, res, next) => {
    // users can get their own account and admins can get any account
    if (req.params.id !== req.user.id && req.user.role !== Role.ADMIN) {
      console.log(req.user);
      return next(new AppError("Unauthorized", 401));
    }

    let query = User.findById(req.params.id);

    if (popOptions) query = query.populate(popOptions);

    const user = await query;

    if (!user) {
      return next(new AppError("No user found with the given detail.", 404));
    }

    res.status(200).json({
      status: "success",
      data: basicDetails(user)
    });
  });

/**
 * Returns all users

 * @param {*} Model
 */
exports.getAllUsers = () =>
  catchAsync(async (req, res, next) => {
    // EXECUTE QUERY
    const features = new APIFeatures(User.find(), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();

    // const doc = await features.query.explain();
    const users = await features.query;

    // SEND RESPONSE
    res.status(200).json({
      status: "success",
      results: users.length,
      data: users
    });
  });

/** Returns user basic details */
function basicDetails(user) {
  const {
    id,
    name,
    email,
    photo,
    role,
    createdAt,
    updatedAt,
    isVerified
  } = user;
  return { id, name, email, photo, role, createdAt, updatedAt, isVerified };
}
