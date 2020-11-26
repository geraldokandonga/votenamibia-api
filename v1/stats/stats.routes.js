const express = require("express");
const statsController = require("./stats.controller");

const router = express.Router();

router.get("/", statsController.countAll);
router.get("/region/:id", statsController.countStatsPerRegion);


module.exports = router;
