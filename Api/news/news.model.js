const mongoose = require("mongoose");
const timestamp = require("../_plugins/timestamp");

const newsSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "news title cannot be empty"]
    },
    body: {
      type: String,
      required: [true, "News body cannot be empty"]
    },
    imageCover: {
      type: String
    }
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

newsSchema.plugin(timestamp);

newsSchema.pre(/^find/, function(next) {
  this.populate({
    path: "user",
    select: "name, photo"
  });
  next();
});

newsSchema.pre(/^findOneAnd/, async function(next) {
  this.r = await this.findOne();
  // console.log(this.r);
  next();
});

module.exports = mongoose.model("News", newsSchema);
