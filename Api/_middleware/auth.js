const {
    promisify
} = require('util');
const jwt = require('jsonwebtoken');

const User = require('../users/user.model');
const catchAsync = require('../_utils/catchAsync');
const AppError = require('../_utils/appError');

// Only for rendered pages , no error
exports.isLoggedIn = async(req, res, next) => {
    if (req.cookies.jwt) {
        try {
            // Verify the token
            const decoded = await promisify(jwt.verify)(req.cookies.jwt, process.env.JWT_SECRET);

            // 3) Check if user still exists exist
            const currentUser = await User.findById(decoded.id);
            if (!currentUser) {
                return next()
            }

            // 4) Check if user changed password after jsonwebtoken was issued
            if (currentUser.changedPasswordAfter(decoded.iat)) {
                return next();
            };

            // THERE IS A LOGGED IN USER
            res.locals.user = currentUser;
            return next();
        } catch (err) {
            return next();
        }
    }
    next();
};


/**
 * Protect

 Restrict to logged in users only
 */
exports.protect = catchAsync(async(req, res, next) => {

    // 1) Getting the token and check if its there
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1]
    } else if (req.cookies.jwt) {
        token = req.cookies.jwt;
    }

    if (!token) {
        return next(new AppError('You are not logged in! Please login to get access.', 401));
    }

    // 2) Verification token
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

    // 3) Check if user still exists exist
    const currentUser = await User.findById(decoded.id);

    if (!currentUser) {
        return next(new AppError('The user belonging to this token no longer exist.', 401))
    }

    // 4) Check if user changed password after jsonwebtoken was issued
    if (currentUser.changedPasswordAfter(decoded.iat)) {
        return next(new AppError('User recently changed password! Please login again.', 401));
    };

    // GRANT ACCESS TO PROTECT ROUTE
    req.user = currentUser;
    res.locals.user = currentUser;
    next();
});


exports.restrictTo = (...roles) => {
    return (req, res, next) => {
        // Roles ['user', 'team']
        if (!roles.includes(req.user.role)) {
            return next(new AppError('You do not have permission to perform this action.', 403))
        }
        next();
    }
};
