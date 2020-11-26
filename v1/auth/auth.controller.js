const jwt = require('jsonwebtoken'),
    crypto = require('crypto'),
    User = require('../users/user.model'),
    catchAsync = require('../_utils/catchAsync'),
    AppError = require('../_utils/appError'),
    Role = require('../_helpers/role'),
    Email = require('../_utils/email');


const signToken = id => {
    return jwt.sign({
        id
    }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN
    });
}

const createSendToken = (user, statuscode, req, res) => {

    const token = signToken(user._id);

    res.cookie('jwt', token, {
        expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000),
        httpOnly: true,
        secure: req.secure || req.headers['x-forwarded-for'] === 'https'
    });

    // Remove the password from the output
    user.password = undefined;

    res.status(statuscode).json({
        status: 'success',
        token,
        data: user
    });
}

// login
exports.login = catchAsync(async(req, res, next) => {

    const {
        email,
        password
    } = req.body;

    // 1 ) Check if email and passwordConfirm exist
    if (!email || !password) {
        return next(new AppError('Please provide email and password', 400));
    }

    // 2 ) Check if user exist && password is correct
    const user = await User.findOne({
        email
    }).select('+password');

    if (!user || !(await user.correctPassword(password, user.password))) {
        return next(new AppError('Incorrect email or password', 401));
    }

    // incase of an account not verified
    const verifyMSg = `You must activate your account before you can login. To proceed please <a href='${req.protocol}://${req.get('host')}/api/v1/auth/resend/${encodeURI(user.email)}'>Click here</a> to resend activation code to your email address.`;

    // 3) Make sure the user has been verified
    if (!user.isVerified) {
        return next(new AppError(verifyMSg, 401));
    }

    // 4 ) If everything ok send token to client
    createSendToken(user, 200, req, res);
});

/**
 * Sign up
 */
exports.register = catchAsync(async(req, res, next) => {

    // validate
    if (await User.findOne({
            email: req.body.email
        })) {
        return next(new AppError(`Email ${req.body.email} is already registered`, 401));
    }

    //create verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');

    const newUser = await User.create({
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
        verificationToken: crypto
            .createHash('sha256')
            .update(verificationToken)
            .digest('hex'),
        verificationExpires: Date.now() + 10 * 60 * 1000,
        acceptTerms: req.body.acceptTerms
    });

    // get host url from the incoming request
    const url = `${req.protocol}://${req.get('host')}/users/me`;

    // send account verification
    const verifyURL = `${req.protocol}://${req.get('host')}/api/v1/auth/verify-email?token=${verificationToken}`;
    await new Email(newUser, verifyURL).sendEmailVerification();

    // send welcome email
    await new Email(newUser, url).sendWelcome();

    res.status(201).json({
        status: 'success',
        message: 'A verification email has been sent to ' + newUser.email + '. Check your inbox',
        data: newUser
    });
});

// ACCOUNT CONFIRMATION
exports.verifyEmail = catchAsync(async(req, res, next) => {
    // 1) Get user based Token
    const hashedToken = crypto.createHash('sha256').update(req.body.token).digest('hex');

    const user = await User.findOne({
        verificationToken: hashedToken,
        verificationExpires: {
            $gt: Date.now()
        }
    });

    // 2) If toke has not expired, and there is user, set the new password
    if (!user) {
        return next(new AppError('Verification failed Or Token has invalid or has expired', 400));
    }

    // Verify and save the user
    user.isVerified = true;
    user.verifiedDate = Date.now();
    user.verificationToken = undefined;
    user.verificationExpires = undefined;
    await user.save();

    // verified email
    const url = `${req.protocol}://${req.get('host')}/`;
    await new Email(user, url).sendEmailVerified();

    res.status(200).json({
        status: 'success',
        message: "Your account has been verified. You can now log in to use your account."
    });
});

// RESEND VERIFICATION TOKEN
exports.resend = catchAsync(async(req, res, next) => {

    // 1) Get user based on POSTed email
    const user = await User.findOne({
        email: req.params.email
    });

    if (!user) {
        return next(new AppError('There is no user with the given email address.', 404));
    }

    // 2) check if account is not verified already
    if (user.isVerified) {
        return next(new AppError('This account has already been verified. Please log in.'));
    };

    // 3) Create a verification token, save it, and send email
    const token = user.createAccountVerificationToken();

    await user.save({
        validateBeforeSave: false
    });

    // 4) Send it to user's email
    try {

        const resetURL = `${req.protocol}://${req.get('host')}/api/v1/auth/verify-email/?token=${token}`;

        await new Email(user, resetURL).sendAccountVerification();

        res.status(200).json({
            status: 'success',
            message: 'A verification email has been sent to ' + user.email + '.'
        });

    } catch (error) {
        user.verificationToken = undefined;
        user.verificationExpires = undefined;

        await user.save({
            validateBeforeSave: false
        });

        return next(new AppError('There was an error sending the email! Try again later.', 500));
    }

});




/**
 * Verify Reset token
 */
exports.validateResetToken = catchAsync(async(req, res, next) => {

    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

    const user = await User.findOne({
        verificationToken: hashedToken,
        verificationExpires: {
            $gt: Date.now()
        }
    });

    if (!user) return next(new AppError('Invalid token', 401));

    res.status(200).json({
        status: 'success',
    });
});




/**
 * Logout
 * @param {*} req
 * @param {*} res
 */
exports.logout = (req, res) => {
    res.cookie('jwt', 'loggedout', {
        expires: new Date(Date.now() + 10 * 1000),
        httpOnly: true
    });
    res.status(200).json({
        status: 'success'
    });
};


/**
 * forgot password
 */
exports.forgotPassword = catchAsync(async(req, res, next) => {
    // 1) Get user based on POSTed email
    const user = await User.findOne({
        email: req.body.email
    });

    if (!user) {
        return next(new AppError('There is no user with the given email address.', 404));
    }

    // 2) Generate the random reset token
    const resetToken = user.createPasswordResetToken();
    await user.save({
        validateBeforeSave: false
    });

    // 3) Send it to user's email
    try {

        const resetURL = `${req.protocol}://${req.get('host')}/api/v1/auth/reset-password/${resetToken}`;
        await new Email(user, resetURL).sendPasswordReset();

        res.status(200).json({
            status: 'success',
            message: 'Token send to email!'
        });
    } catch (error) {
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;

        await user.save({
            validateBeforeSave: false
        });

        return next(new AppError('There was an error sending the email. try again later!', 500));
    }
});


//reset password
exports.resetPassword = catchAsync(async(req, res, next) => {

    // 1) Get user based Token
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

    const user = await User.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpires: {
            $gt: Date.now()
        }
    });

    // 2) If toke has not expired, and there is user, set the new password
    if (!user) {
        return next(new AppError('Token is invalid or has expired', 400));
    }

    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    // send password changed email
    const url = `${req.protocol}://${req.get('host')}/`;
    await new Email(user, url).sendPasswordChanged();

    // 4) Log the user in send JWT
    createSendToken(user, 200, req, res);

});


// update password
exports.updatePassword = catchAsync(async(req, res, next) => {

    // 1) Get user from the collection
    const user = await User.findById(req.user.id).select('+password');

    // 2 ) Check if the posted password is correctPassword
    if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
        return next(new AppError('Your current password is wrong.', 401));
    }

    // 3) If so update passwordConfirm
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    user.save();

    // 4) Log  user in, send JWT
    createSendToken(user, 200, req, res);
});


/** sendVerificationEmail  */
async function sendVerificationEmail(account, origin) {
    let message;
    if (origin) {
        const verifyUrl = `${origin}/account/verify-email?token=${account.verificationToken}`;
        message = `<p>Please click the below link to verify your email address:</p>
                   <p><a href="${verifyUrl}">${verifyUrl}</a></p>`;
    } else {
        message = `<p>Please use the below token to verify your email address with the <code>/account/verify-email</code> api route:</p>
                   <p><code>${account.verificationToken}</code></p>`;
    }

    await sendEmail({
        to: account.email,
        subject: 'Sign-up Verification API - Verify Email',
        html: `<h4>Verify Email</h4>
               <p>Thanks for registering!</p>
               ${message}`
    });
}

/** sendAlreadyRegisteredEmail */
async function sendAlreadyRegisteredEmail(email, origin) {
    let message;
    if (origin) {
        message = `<p>If you don't know your password please visit the <a href="${origin}/account/forgot-password">forgot password</a> page.</p>`;
    } else {
        message = `<p>If you don't know your password you can reset it via the <code>/account/forgot-password</code> api route.</p>`;
    }

    await sendEmail({
        to: email,
        subject: 'Sign-up Verification API - Email Already Registered',
        html: `<h4>Email Already Registered</h4>
               <p>Your email <strong>${email}</strong> is already registered.</p>
               ${message}`
    });
}

/** sendPasswordResetEmail */
async function sendPasswordResetEmail(account, origin) {
    let message;
    if (origin) {
        const resetUrl = `${origin}/account/reset-password?token=${account.resetToken.token}`;
        message = `<p>Please click the below link to reset your password, the link will be valid for 1 day:</p>
                   <p><a href="${resetUrl}">${resetUrl}</a></p>`;
    } else {
        message = `<p>Please use the below token to reset your password with the <code>/account/reset-password</code> api route:</p>
                   <p><code>${account.resetToken.token}</code></p>`;
    }

    await sendEmail({
        to: account.email,
        subject: 'Sign-up Verification API - Reset Password',
        html: `<h4>Reset Password Email</h4>
               ${message}`
    });
}