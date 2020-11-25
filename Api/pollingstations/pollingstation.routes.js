const express = require("express");
const pollingStationController = require("./pollingstations.controller");
const auth = require("../_middleware/auth");

const router = express.Router({ mergeParams: true });

router
  .route("/polling-stations-within/:distance/center/:latlng/unit/:unit")
  .get(pollingStationController.getPollingStationsWithin);
router
  .route("/distances/:latlng/unit/:unit")
  .get(pollingStationController.getDistances);

router
  .route("/clear-all/:constituencyId")
  .delete(pollingStationController.deleteAllByConstituency);

router
  .route("/")
  .get(pollingStationController.getAllPollingStations)
  .post(
    auth.protect,
    auth.restrictTo("admin"),
    pollingStationController.createWithFile,
    pollingStationController.createFromFile,
    pollingStationController.setConstituencyId,
    pollingStationController.createPollingStation
  );

router
  .route("/:id")
  .get(pollingStationController.getPollingStation)
  .patch(
    auth.protect,
    auth.restrictTo("admin"),
    pollingStationController.updatePollingStation
  )
  .delete(
    auth.protect,
    auth.restrictTo("admin"),
    pollingStationController.deletePollingStation
  );

module.exports = router;
