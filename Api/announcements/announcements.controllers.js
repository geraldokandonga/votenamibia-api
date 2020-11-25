const Announcement = require("./announcement.model");
const factory = require("../_utils/handlerFactory");

exports.createAnnouncement = factory.createOne(Announcement);
exports.getAnnouncement = factory.getOne(Announcement);
exports.getAllAnnouncements = factory.getAll(Announcement);
exports.updateAnnouncement = factory.updateOne(Announcement);
exports.deleteAnnouncement = factory.deleteOne(Announcement);
