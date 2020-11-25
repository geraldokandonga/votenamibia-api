const appError = require('./../_utils/appError');

module.exports = validateRequest;

function validateRequest(req, next, schema) {
    const options = {
        abortEarly: false, // include all errors
        allowUnknown: true, // ignore unknown props
        stripUnknown: true // remove unknown props
    };
    const { error, value } = schema.validate(req.body, options);
    if (error) {
        next(new appError(`Validation error: ${error.details.map(x => x.message).join(', ')}`));
    } else {
        req.body = value;
        next();
    }
}