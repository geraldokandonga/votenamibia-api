const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const slugify = require("slugify");
const timestamp = require("../_plugins/timestamp");

const politicalPartySchema = new Schema({
  name: {
    type: String,
    required: [true, "A Item must have a name!"],
    unique: true,
    trim: true
  },
  slug: {
    type: String
  }
});

politicalPartySchema.plugin(timestamp);

politicalPartySchema.index({
  slug: 1
});

// DOCUMENT MIDDLEWARE: runs before . save() and .create()
politicalPartySchema.pre("save", function(next) {
  this.slug = slugify(this.name, {
    lower: true
  });
  next();
});

// QUERY MIDDLEWARE
politicalPartySchema.pre(/^find/, function(next) {
  this.start = Date.now();
  next();
});

politicalPartySchema.post(/^find/, function(docs, next) {
  console.log(`Query took ${Date.now() - this.start} mill seconds!`);
  console.log(docs);
  next();
});

module.exports = mongoose.model("PoliticalParty", politicalPartySchema);
