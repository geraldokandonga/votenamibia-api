const express = require("express");
const validateRequest = require("./../_middleware/validate-request");
const userController = require("./users.controller");
const authController = require("../auth/auth.controller");
const auth = require("./../_middleware/auth");
const Joi = require("joi");
const Role = require("./../_helpers/role");

const router = express.Router();

// Protect all routes after this middleware
router.use(auth.protect);

router.patch(
  "/updateMyPassword",
  updateMyPasswordSchema,
  authController.updatePassword
);
router.get("/me", userController.getMe, userController.getUser);

// USER PUBLIC PROFILE
router.get("/:userId/detail", userController.getUserDetail);

router.patch(
  "/updateMe",
  updateSchema,
  userController.uploadUserPhoto,
  userController.resizeUserPhoto,
  userController.updateMe
);

// Protect all routes after this middleware | Admin access only
router.use(auth.restrictTo("admin"));

// USER ROUTE

router.route("/").get(userController.getAllUsers);

router
  .route("/:id")
  .get(userController.getUser)
  .patch(updateSchema, userController.updateUser)
  .delete(userController.deleteUser);

module.exports = router;

function createSchema(req, res, next) {
  const schema = Joi.object({
    name: Joi.string().required(),
    email: Joi.string()
      .email()
      .required(),
    password: Joi.string()
      .min(8)
      .required(),
    passwordConfirm: Joi.string()
      .valid(Joi.ref("password"))
      .required(),
    role: Joi.string()
      .valid(Role.ADMIN, Role.CUSTOMER, Role.RESTAURANT)
      .required()
  });
  validateRequest(req, next, schema);
}

function updateSchema(req, res, next) {
  const schemaRules = {
    name: Joi.string().empty(""),
    email: Joi.string()
      .email()
      .empty(""),
    photo: Joi.string().empty(""),
    password: Joi.string()
      .min(8)
      .empty(""),
    passwordConfirm: Joi.string()
      .valid(Joi.ref("password"))
      .empty("")
  };

  // only admins can update role
  if (req.user.role === Role.ADMIN) {
    schemaRules.role = Joi.string()
      .valid(Role.ADMIN, Role.CUSTOMER, Role.RESTAURANT)
      .empty("");
  }

  const schema = Joi.object(schemaRules).with("password", "passwordConfirm");
  validateRequest(req, next, schema);
}

function updateMyPasswordSchema(req, res, next) {
  const schema = Joi.object({
    passwordCurrent: Joi.string()
      .min(8)
      .required(),
    password: Joi.string()
      .min(8)
      .required(),
    passwordConfirm: Joi.string()
      .valid(Joi.ref("password"))
      .required()
  });
  validateRequest(req, next, schema);
}
