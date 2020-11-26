const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const slugify = require("slugify");
const timestamp = require("../_plugins/timestamp");

const announcementSchema = new Schema({
  title: {
    type: String,
    required: [true, "A announcement must have a title!"],
    unique: true,
    trim: true
  },
  slug: {
    type: String
  },
  body: {
    type: String,
    required: [true, "Please fill in the content!"]
  }
});

announcementSchema.plugin(timestamp);

announcementSchema.index({
  slug: 1
});

// DOCUMENT MIDDLEWARE: runs before . save() and .create()
announcementSchema.pre("save", function(next) {
  this.slug = slugify(this.title, {
    lower: true
  });
  next();
});

// QUERY MIDDLEWARE
announcementSchema.pre(/^find/, function(next) {
  this.start = Date.now();
  next();
});

module.exports = mongoose.model("Announcement", announcementSchema);
