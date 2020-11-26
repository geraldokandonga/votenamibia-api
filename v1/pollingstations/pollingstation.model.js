const mongoose = require("mongoose");
const timestamp = require("../_plugins/timestamp");
const slugify = require("slugify");
const Schema = mongoose.Schema;

const pollingStationSchema = new Schema(
  {
    constituency: {
      type: mongoose.Schema.ObjectId,
      ref: "Region",
      require: [true, "A Polling Station must belong to a Constituency!"]
    },
    name: {
      type: String,
      required: [true, "A Polling Station must have a name!"],
      unique: true,
      trim: true
    },
    slug: {
      type: String
    },
    type: {
      type: String
    },
    code: {
      type: String,
      required: [true, "Please provide polling station code!"]
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
    startDateTime: {
      type: Date,
      default: Date.now()
    },
    endDateTime: {
      type: Date,
      default: Date.now()
    }
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

pollingStationSchema.index({ slug: 1 });
pollingStationSchema.plugin(timestamp);

pollingStationSchema.pre("save", function(next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

pollingStationSchema.pre("^/find/", function(next) {
  // this.populate({
  //   path: "constituency",
  //   select: "name"
  // });
  next();
});

module.exports = mongoose.model("PollingStation", pollingStationSchema);
