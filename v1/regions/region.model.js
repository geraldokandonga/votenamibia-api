const mongoose = require("mongoose");
const timestamp = require("../_plugins/timestamp");
const slugify = require("slugify");
const Schema = mongoose.Schema;

const regionSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "A Region must have a name!"],
      unique: true,
      trim: true,
      maxLength: [
        250,
        "A Region name must have less or equal then 250 characters"
      ],
      minLength: [1, "A Region name must have more or equal then 1 characters"]
    },
    slug: {
      type: String
    },
    description: {
      type: String,
      trim: true
    },
    imageCover: {
      type: String
    },
    constituencies: {
      type: Number
    }
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

regionSchema.index({ slug: 1 });
regionSchema.plugin(timestamp);

regionSchema.pre("save", function(next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

module.exports = mongoose.model("Region", regionSchema);
