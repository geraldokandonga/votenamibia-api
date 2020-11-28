const express = require("express");
const newsController = require("./news.controller");
const auth = require("../_middleware/auth");

const router = express.Router();

router
  .route("/")
  .get(newsController.getAllNews)
  .post(auth.protect, auth.restrictTo("admin"), newsController.createNews);

router
  .route("/:id")
  .get(newsController.getNews)
  .patch(auth.protect, auth.restrictTo("admin"), newsController.updateNews)
  .delete(auth.protect, auth.restrictTo("admin"), newsController.deleteNews);

module.exports = router;
