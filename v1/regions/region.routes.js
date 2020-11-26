const express = require("express");
const regionController = require("./regions.controller");
const constituencyRouter = require("../constituencies/constituency.routes");
const auth = require("../_middleware/auth");

const router = express.Router();

// POST /region/123454fd/constituencies
// GET /constituencies
router.use("/:regionId/constituencies", constituencyRouter);

router
  .route("/")
  .get(regionController.getAllRegions)
  .post(auth.protect, auth.restrictTo("admin"), regionController.createRegion);

router
  .route("/:id")
  .get(regionController.getRegion)
  .patch(auth.protect, auth.restrictTo("admin"), regionController.updateRegion)
  .delete(
    auth.protect,
    auth.restrictTo("admin"),
    regionController.deleteRegion
  );

module.exports = router;
