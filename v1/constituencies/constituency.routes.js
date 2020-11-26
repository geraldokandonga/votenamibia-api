const express = require("express");
const constituencyController = require("./constituencies.controller");
const pollingStationRouter = require("../pollingstations/pollingstation.routes");
const auth = require("../_middleware/auth");

const router = express.Router({ mergeParams: true });

// POST /constituency/123454fd/polling-stations
// GET /polling-stations
router.use("/:constituencyId/polling-stations", pollingStationRouter);

router
  .route("/constituency-within/:distance/center/:latlng/unit/:unit")
  .get(constituencyController.getConstituencyWithin);
router
  .route("/distances/:latlng/unit/:unit")
  .get(constituencyController.getDistances);

router
  .route("/")
  .get(constituencyController.getAllConstituencies)
  .post(
    auth.protect,
    auth.restrictTo("admin"),
    constituencyController.createWithFile,
    constituencyController.createFromFile,
    constituencyController.setRegionId,
    constituencyController.createConstituency
  );

router
  .route("/:id")
  .get(constituencyController.getConstituency)
  .patch(
    auth.protect,
    auth.restrictTo("admin"),
    constituencyController.updateConstituency
  )
  .delete(
    auth.protect,
    auth.restrictTo("admin"),
    constituencyController.deleteConstituency
  );

module.exports = router;
