const express = require("express");
const announcementController = require("./announcements.controllers");
const auth = require("../_middleware/auth");

const router = express.Router();

router
  .route("/")
  .get(announcementController.getAllAnnouncements)
  .post(
    auth.protect,
    auth.restrictTo("admin"),
    announcementController.createAnnouncement
  );

router
  .route("/:id")
  .get(announcementController.getAnnouncement)
  .patch(
    auth.protect,
    auth.restrictTo("admin"),
    announcementController.updateAnnouncement
  )
  .delete(
    auth.protect,
    auth.restrictTo("admin"),
    announcementController.deleteAnnouncement
  );

module.exports = router;
