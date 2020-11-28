const express = require("express");
const authController = require("./auth.controller");
const validateRequest = require("../_middleware/validate-request");
const Joi = require("joi");

const router = express.Router();

// AUTHENTICATION ROUTE
router.post("/register", registerSchema, authController.register);
router.post("/login", loginSchema, authController.login);
router.get("/logout", authController.logout);

// RESET PASSWORD ROUTE
router.post(
  "/forgot-password",
  forgotPasswordSchema,
  authController.forgotPassword
);
router.patch(
  "/reset-password/:token",
  resetPasswordSchema,
  authController.resetPassword
);
router.post("/validate-reset-token", authController.validateResetToken);

// EMAIL VERIFICATION ROUTE
router.post("/verify-email", verifyEmailSchema, authController.verifyEmail);
router.post("/resend/:email", authController.resend);

module.exports = router;

function loginSchema(req, res, next) {
  const schema = Joi.object({
    email: Joi.string().required(),
    password: Joi.string().required()
  });
  validateRequest(req, next, schema);
}

function verifyEmailSchema(req, res, next) {
  const schema = Joi.object({
    token: Joi.string().required()
  });
  validateRequest(req, next, schema);
}

function forgotPasswordSchema(req, res, next) {
  const schema = Joi.object({
    email: Joi.string()
      .email()
      .required()
  });
  validateRequest(req, next, schema);
}

function registerSchema(req, res, next) {
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
    acceptTerms: Joi.boolean()
      .valid(true)
      .required()
  });
  validateRequest(req, next, schema);
}

function resetPasswordSchema(req, res, next) {
  const schema = Joi.object({
    token: Joi.string().required(),
    password: Joi.string()
      .min(8)
      .required(),
    passwordConfirm: Joi.string()
      .valid(Joi.ref("password"))
      .required()
  });
  validateRequest(req, next, schema);
}
