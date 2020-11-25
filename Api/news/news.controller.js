const News = require("./news.model");
const Factory = require("../_utils/handlerFactory");

exports.getAllNews = Factory.getAll(News);
exports.getNews = Factory.getOne(News);
exports.createNews = Factory.createOne(News);
exports.updateNews = Factory.updateOne(News);
exports.deleteNews = Factory.deleteOne(News);
