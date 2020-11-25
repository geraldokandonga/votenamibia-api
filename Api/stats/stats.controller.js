const Region = require("../regions/region.model");
const Constituency = require("../constituencies/constituency.model");
const PollingStation = require("../pollingstations/pollingstation.model");
const catchAsync = require("../_utils/catchAsync");
const AppError = require("../_utils/appError");

exports.countAll = catchAsync(async(req, res, next) => {
  // step 1) total regions
  const regions = await Region.estimatedDocumentCount();

  // step 2) total regions
  const constituencies = await Constituency.estimatedDocumentCount();

  // step 3) total regions
  const pollingStations = await PollingStation.estimatedDocumentCount();

  res.status(201).json({
    status: "success",
    data: {
      regions,
      constituencies,
      pollingStations
    }
  });

});


/** count region constituencies and polling stations */
exports.countStatsPerRegion = catchAsync(
  async (req, res, next) => {
    // step 1)  find region
    const query = Region.findById(req.params.id);

    const region = await query;

    if (!region) {
      return next(new AppError("No region found.", 404));
    }

    // step 2) count regions constituencies
    const totalConstituencies = await Constituency.countDocuments(
      { region: region.id },
      function(err, count) {
        if (err) return next(new AppError("Something went wrong!", 400));
        return count;
      }
    );

    // step 3) loop through all constituencies to find the one that match the region and return its id and pass it to get polling station count
    const constituencies = await Constituency.find(
      { region: region.id },
      function(err, doc) {
        // if error return
        if (err) return;
        return doc;
      }
    );

    let totalPollingStations = 0;

    constituencies.map(async doc => {
      const total = await PollingStation.find({ constituency: doc._id });
      if (total.length) return (totalPollingStations += total.length);
    });

    res.status(201).json({
      status: "success",
      data: {
        constituencies: totalConstituencies,
        pollingStations: totalPollingStations
      }
    });
  }
);
