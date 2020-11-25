const AppError = require('../_utils/appError');

const handleCastErrorDB = err => {
    const message = `Invalid ${err.path} : ${err.value}.`;
    return new AppError(message, 400);
}

const handleDuplicateFieldsDB = err => {
    const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
    const message = `Duplicate fileds value: ${value}. Please use another value`;
    return new AppError(message, 400);
}

const handleValidationErrorDB = err => {
    const errors = Object.values(err.errors).map(el => el.message);
    const message = `Invalid input data. ${errors.join('. ')}`;
    return new AppError(message, 400);
}

const handleJWTErrorDB = () => new AppError('Invalid token. Please log in again!', 401);
const handleJWTExpiredErrorDB = () => new AppError('Your token has expired! Please log in again.', 401);

const sendErrorDev = (err, req, res) => {
    // A) API
    if (req.originalUrl.startsWith('/api')) {
        return res.status(err.statusCode).json({
            status: err.status,
            error: err,
            message: err.message,
            stack: err.stack
        });
    }
    // B)RENDERED WEBSITE
    // console.log('ERROR', err);
    return res.status(err.statusCode).json({
        title: 'Something went wrong!',
        msg: err.message
    });
}

const sendErrorProd = (err, req, res) => {
    // A) API
    if (req.originalUrl.startsWith('/api')) {
        // A) Operational error: Send message to client
        if (err.isOperational) {
            return res.status(err.statusCode).json({
                status: err.status,
                message: err.message,
            });
        }
        // Programming error: or other unknown error: don't leak error detail
        // 1) Log error
        // console.log('ERROR', err);
        // 2 ) Send general message
        return res.status(err.statusCode).json({
            status: err.status,
            message: err.message
        });
    }

    // B) RENDERED WEBSITE
    // A) Operational error: Send message to client
    if (err.isOperational) {
        // console.log('ERROR', err);
        return res.status(err.statusCode).json({
            title: 'Something went wrong!',
            msg: err.message
        });
    };

    // Programming error: or other unknown error: don't leak error details
    // 1) Log error
    // console.log('ERROR', err);
    // 2 ) Send general message
    return res.status(err.statusCode).json({
        title: 'Something went wrong!',
        msg: 'Please try again later.'
    });
};

module.exports = (err, req, res, next) => {

    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    if (process.env.NODE_ENV === 'development') {
        sendErrorDev(err, req, res);
    } else if (process.env.NODE_ENV === 'production') {
        let error = {
            ...err
        };
        error.message = err.message;

        if (error.name === 'CastError') error = handleCastErrorDB(error);
        if (error.code === 11000) error = handleDuplicateFieldsDB(error);
        if (error.name === 'ValidationError') error = handleValidationErrorDB(error);
        if (error.name === 'jsonWebTokenError') error = handleJWTErrorDB();
        if (error.name === 'TokenExpiredError') error = handleJWTExpiredErrorDB();

        sendErrorProd(error, req, res);
    }
}