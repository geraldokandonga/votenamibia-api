const mongoose = require("mongoose");
const timestamp = require("../_plugins/timestamp");
const slugify = require("slugify");
const Schema = mongoose.Schema;

const constituencySchema = new Schema(
  {
    region: {
      type: mongoose.Schema.ObjectId,
      ref: "Region",
      require: [true, "Constituency must belong to a region!"]
    },
    name: {
      type: String,
      required: [true, "A Constituency must have a name!"],
      unique: true,
      trim: true,
      maxLength: [
        250,
        "A Constituency name must have less or equal then 250 characters"
      ],
      minLength: [
        1,
        "A Constituency name must have more or equal then 1 characters"
      ]
    },
    slug: {
      type: String
    },
    description: {
      type: String,
      trim: true
    },
    location: {
      type: {
        type: String,
        default: "Point",
        enum: ["Point"]
      },
      coordinates: [Number],
      address: String
    },
    contestants: [
      {
        name: {
          type: String
        },
        bio: {
          type: String
        },
        photo: {
          type: String,
          default: "default.jpg"
        },
        part: {
          type: String
        },
        campaign: {
          type: String
        }
      }
    ]
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

constituencySchema.index({ slug: 1 });
constituencySchema.plugin(timestamp);

constituencySchema.pre("save", function(next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

constituencySchema.pre("^/find/", function(next) {
  this.populate({
    path: "region",
    select: "name"
  });
  next();
});

module.exports = mongoose.model("Constituency", constituencySchema);
