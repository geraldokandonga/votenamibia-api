const Region = require("./region.model");
const factory = require("../_utils/handlerFactory");

exports.createRegion = factory.createOne(Region);
exports.getRegion = factory.getOne(Region);
exports.getAllRegions = factory.getAll(Region);
exports.updateRegion = factory.updateOne(Region);
exports.deleteRegion = factory.deleteOne(Region);
