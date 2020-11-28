const catchAsync = require("./catchAsync");
const AppError = require("./appError");
const APIFeatures = require("./apiFeatures");

exports.deleteOne = Model =>
  catchAsync(async (req, res, next) => {
    // first find the resources
    let query = Model.findById(req.params.id);

    const model = await query;

    if (!model) {
      return next(new AppError("No document found with that ID.", 404));
    }

    // find and delete
    const doc = await Model.findByIdAndDelete(req.params.id);

    if (!doc) {
      return next(new AppError("No document found with that ID", 404));
    }

    res.status(204).json({
      status: "success",
      data: null
    });
  });

exports.updateOne = Model =>
  catchAsync(async (req, res, next) => {
    let query = Model.findById(req.params.id);

    const model = await query;

    if (!model) {
      return next(new AppError("No document found with that ID.", 404));
    }

    // find and update
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!doc) {
      return next(new AppError("No document found with that ID.", 404));
    }

    res.status(200).json({
      status: "success",
      data: doc
    });
  });

exports.createOne = Model =>
  catchAsync(async (req, res, next) => {
    // Insert single|multiple new `Model` documents
    const newDoc = await Model.create(req.body);

    res.status(201).json({
      status: "success",
      data: newDoc
    });
  });

exports.getOne = (Model, popOptions) =>
  catchAsync(async (req, res, next) => {
    let query = Model.findById(req.params.id);

    if (popOptions) query = query.populate(popOptions);

    const doc = await query;

    if (!doc) {
      return next(new AppError("No document found with that ID.", 404));
    }

    res.status(200).json({
      status: "success",
      data: doc
    });
  });

exports.getAll = Model =>
  catchAsync(async (req, res, next) => {
    // To allow for nested GET reviews on tour
    let filter = {};
    if (req.params.regionId) filter = { region: req.params.regionId };

    if (req.params.constituencyId)
      filter = { constituency: req.params.constituencyId };

    // EXECUTE QUERY
    const features = new APIFeatures(Model.find(filter), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();

    // const doc = await features.query.explain();
    const docs = await features.query;

    // SEND RESPONSE
    res.status(200).json({
      status: "success",
      results: docs.length,
      data: docs
    });
  });
