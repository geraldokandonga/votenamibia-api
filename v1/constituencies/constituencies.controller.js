const excelToJson = require("convert-excel-to-json");
const Constituency = require("./constituency.model");
const factory = require("../_utils/handlerFactory");
const catchAsync = require("../_utils/catchAsync");
const AppError = require("../_utils/appError");
const upload = require("../_utils/multer");

exports.createWithFile = upload.single("upload_constituencies"); // END IMAGE UPLOAD

exports.setRegionId = (req, res, next) => {
  // Allow nested request
  if (!req.body.region) req.body.region = req.params.regionId;
  next();
};

/**
 * Create from file
 * Allow admin to upload constituencies from an excel file
 */
exports.createFromFile = catchAsync(async (req, res, next) => {
  if (!req.file) return next();

  const result = excelToJson({
    sourceFile: req.file.path,
    sheets: [
      {
        // Excel Sheet Name
        name: "Constituencies",

        // Header Row -> be skipped and will not be present at our result object.
        header: {
          rows: 1
        },

        // Mapping columns to keys
        columnToKey: {
          A: "name"
        }
      }
    ]
  });

  // store the result
  const responseData = result.Constituencies;

  if (responseData.length) {
    // loop through the result
    const newData = responseData.map(input => {
      return {
        name: input.name,
        region: req.params.regionId
      };
    });

    // save to body
    req.body = newData;
  } else {
    return next(new AppError("Invalid data!"));
  }

  next();
});

exports.createConstituency = factory.createOne(Constituency);
exports.getConstituency = factory.getOne(Constituency);
exports.getAllConstituencies = factory.getAll(Constituency);
exports.updateConstituency = factory.updateOne(Constituency);
exports.deleteConstituency = factory.deleteOne(Constituency);

/**
 * Get polling stations within a given distance
 */
exports.getConstituencyWithin = catchAsync(async (req, res, next) => {
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

  const constituencies = await Constituency.find({
    location: {
      $geoWithin: {
        $centerSphere: [[lng, lat], radius]
      }
    }
  });

  res.status(200).json({
    status: "success",
    results: constituencies.length,
    data: {
      data: constituencies
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

  const distances = await Constituency.aggregate([
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
