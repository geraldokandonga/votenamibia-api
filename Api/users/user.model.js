const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const validator = require("validator");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const timestampPlugin = require("../_plugins/timestamp");

const userSchema = new Schema({
  name: {
    type: String,
    required: [true, "Please tell us your name!"]
  },

  email: {
    type: String,
    required: [true, "Please provide a valid email!"],
    unique: true,
    trim: true,
    lowercase: true,
    validator: [validator.isEmail, "Please provide a valid email!"]
  },

  photo: {
    type: String,
    default: "default.jpg"
  },

  role: {
    type: String,
    enum: ["voter", "admin"],
    default: "voter"
  },

  password: {
    type: String,
    required: [true, "Please provide a password!"],
    minlength: 8,
    select: false
  },

  passwordChangedAt: {
    type: Date
  },

  passwordResetToken: String,
  passwordResetExpires: Date,

  verificationToken: String,
  verificationExpires: Date,
  isVerified: {
    type: Boolean,
    default: false
  },

  verifiedDate: Date,

  active: {
    type: Boolean,
    default: true,
    select: false
  },

  email_notification: {
    type: Boolean,
    default: true
  },
  acceptTerms: Boolean
});

userSchema.plugin(timestampPlugin);

userSchema.virtual("verified").get(function() {
  return !!(this.verifiedDate || this.passwordChangedAt);
});

userSchema.pre("save", async function(next) {
  // Only run this function if password was actually modified
  if (!this.isModified("password")) return next();
  // Hash password with cost of 12
  this.password = await bcrypt.hash(this.password, 12);
  // Delete confirmation
  //this.passwordConfirm = undefined;
  next();
});

userSchema.pre("save", function(next) {
  if (!this.isModified("password") || this.isNew) return next();
  this.passwordChangedAt = Date.now() - 1000;
  next();
});

userSchema.pre(/^find/, function(next) {
  // this point to current query
  this.find({
    active: {
      $ne: false
    }
  });
  next();
});

userSchema.set("toJSON", {
  virtuals: true,
  versionKey: false,
  transform: function(doc, ret) {
    // remove these props when object is serialized
    delete ret._id;
    delete ret.password;
  }
});

userSchema.methods.correctPassword = async function(
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changedPasswordAfter = function(JWTTimeStamp) {
  if (this.passwordChangedAt) {
    const changedTimeStamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    return JWTTimeStamp < changedTimeStamp;
  }

  // False means not changed
  return false;
};

/**
 * Create Password Reset Token
 */
userSchema.methods.createPasswordResetToken = function() {
  const resetToken = crypto.randomBytes(32).toString("hex");

  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

/**
 * Create Account Verification Token
 */
userSchema.methods.createAccountVerificationToken = function() {
  const token = crypto.randomBytes(32).toString("hex");

  this.verificationToken = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");

  this.verificationExpires = Date.now() + 10 * 60 * 1000;

  return token;
};

const User = mongoose.model("User", userSchema);

module.exports = User;
