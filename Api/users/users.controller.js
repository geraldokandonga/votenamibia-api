const multer = require("multer");
const sharp = require("sharp");
const catchAsync = require("../_utils/catchAsync");
const AppError = require("../_utils/appError");
const User = require("./user.model");
const usersService = require("./user.service");
const filterObj = require("./../_utils/filterObj");

const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image")) {
    cb(null, true);
  } else {
    cb(new AppError("Not an image! Please upload only images.", 400), false);
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter
});

exports.uploadUserPhoto = upload.single("photo"); // END IMAGE UPLOAD

// IMAGE RESIZING
exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
  if (!req.file) return next();

  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;

  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat("jpeg")
    .jpeg({
      quality: 90
    })
    .toFile(`public/img/users/${req.file.filename}`);

  next();
});

exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

// USER ROUTES HANDLERS
exports.updateMe = catchAsync(async (req, res, next) => {
  // 1) create error if user POSTs password data
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        "This route is not for password update. Please use /updateMyPassword.",
        400
      )
    );
  }

  // 2)creat error if user is trying to change their user role
  if (req.body.role)
    return next(
      new AppError("Action not permitted! Role cannot be changed.", 401)
    );

  // Filtered out unwanted fields names that are
  const filteredBody = filterObj(req.body, "name", "email");

  if (req.file) filteredBody.photo = req.file.filename;

  // 3) Update user  document
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    status: "success",
    data: updatedUser
  });
});

// DELETE CURRENT
exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, {
    active: false
  });
  res.status(204).json({
    status: "success",
    data: null
  });
});

// GET USER PUBLIC PROFILE
exports.getUserDetail = catchAsync(async (req, res, next) => {
  // EXECUTE QUERY
  let query = User.findById(req.params.userId);

  const user = await query;

  if (!user) {
    return next(new AppError("No user found with that username.", 404));
  }

  // RETURN RESPONSE
  res.status(200).json({
    status: "success",
    data: {
      name: user.name,
      avatar: user.photo,
      email: user.email,
      id: user.id
    }
  });
});

exports.getAllUsers = usersService.getAllUsers();
exports.getUser = usersService.getById();
exports.updateUser = usersService.update();
exports.deleteUser = usersService.delete();
