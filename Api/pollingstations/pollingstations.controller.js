const excelToJson = require("convert-excel-to-json");
const PollingStation = require("./pollingstation.model");
const catchAsync = require("../_utils/catchAsync");
const AppError = require("../_utils/appError");
const factory = require("../_utils/handlerFactory");

const upload = require("../_utils/multer");

exports.setConstituencyId = (req, res, next) => {
  // Allow nested request
  if (!req.body.constituency) req.body.constituency = req.params.constituencyId;
  next();
};

exports.createWithFile = upload.single("upload_polling_stations");

/**
 * Create from file
 * Allow admin to upload polling-station from an excel file
 */
exports.createFromFile = catchAsync(async (req, res, next) => {
  if (!req.file) return next();

  const result = excelToJson({
    sourceFile: req.file.path,
    sheets: [
      {
        // Excel Sheet Name
        name: "PollingStations",

        // Header Row -> be skipped and will not be present at our result object.
        header: {
          rows: 1
        },

        // Mapping columns to keys
        columnToKey: {
          A: "code",
          B: "name",
          C: "type",
          D: "startDateTime",
          E: "endDateTime"
        }
      }
    ]
  });

  // store the result
  const responseData = result.PollingStations;

  // loop through the result
  if (responseData.length) {
    const newData = responseData.map(input => {
      return {
        code: input.code,
        name: input.name,
        type: input.type,
        startDateTime: input.startDateTime,
        endDateTime: input.endDateTime,
        constituency: req.params.constituencyId
      };
    });
    // save to body
    req.body = newData;
  } else {
    return next(new AppError("Invalid data!"));
  }

  next();
});

exports.deleteAllByConstituency = catchAsync(async (req, res, next) => {
  // first find the resources

  const docs = await PollingStation.deleteMany({
    constituency: req.params.constituencyId
  });

  if (!docs) {
    return next(new AppError("No document found with given param", 404));
  }

  res.status(204).json({
    status: "success",
    data: null
  });
});

exports.createPollingStation = factory.createOne(PollingStation);
exports.getPollingStation = factory.getOne(PollingStation);
exports.getAllPollingStations = factory.getAll(PollingStation);
exports.updatePollingStation = factory.updateOne(PollingStation);
exports.deletePollingStation = factory.deleteOne(PollingStation);

/**
 * Get polling stations within a given distance
 */
exports.getPollingStationsWithin = catchAsync(async (req, res, next) => {
  const { distance, latlng, unit } = req.params;
  const [lat, lng] = latlng.split(",");

  const radius = unit === "mi" ? distance / 3963.2 : distance / 6378.1;

  if (!lat || !lng) {
    next(
      new AppError(
        "Please provide latitude and longitude in the format like lat, lng.",
        400
      )
    );
  }

  const pollingStations = await PollingStation.find({
    location: {
      $geoWithin: {
        $centerSphere: [[lng, lat], radius]
      }
    }
  });

  res.status(200).json({
    status: "success",
    results: pollingStations.length,
    data: {
      data: pollingStations
    }
  });
});

/**
 * Get distance of a given polling station
 */
exports.getDistances = catchAsync(async (req, res, next) => {
  const { latlng, unit } = req.params;
  const [lat, lng] = latlng.split(",");

  const multiplier = unit === "mi" ? 0.000621371 : 0.001;

  if (!lat || !lng) {
    next(
      new AppError(
        "Please provide latitude and longitude in the format like lat, lng.",
        400
      )
    );
  }

  const distances = await PollingStation.aggregate([
    {
      $geoNear: {
        near: {
          type: "Point",
          coordinates: [lng * 1, lat * 1]
        },
        distanceField: "distance",
        distanceMultiplier: multiplier
      }
    },
    {
      $project: {
        distance: 1,
        name: 1
      }
    }
  ]);

  res.status(200).json({
    status: "success",
    data: {
      data: distances
    }
  });
});
