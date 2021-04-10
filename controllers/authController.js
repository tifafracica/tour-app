const crypto = require('crypto');
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const Email = require('./../utils/email');


const tokenGenerator = id => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN
    });
}

const createSendToken = (user, statusCode, res) => {
    const token = tokenGenerator(user._id);

    const cookieOptions = {
        expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000),
        httpOnly: true
    }

    if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

    res.cookie('jwt', token, cookieOptions);
    // quitar la contraseña en la respuesta
    user.password = undefined;

    res.status(statusCode).json({
        status: 'success',
        token,
        data: {
            user
        }
    });

};

exports.signUp = catchAsync(async (req, res, next) => {
    const newUser = await User.create({
        name: req.body.name,
        email: req.body.email,
        role: req.body.role,
        password: req.body.password,
        passwordConfirm: req.body.passwordConfirm,
        passwordChangedAt: req.body.passwordChangedAt,
        passwordResetToken: req.body.passwordResetToken,
        passwordResetExpires: req.passwordResetExpires
    });

    const url = `${req.protocol}://${req.get('host')}/me`;
    console.log(url)
    await new Email(newUser, url).sendWelcome();

    createSendToken(newUser, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
    const { email, password } = req.body;

    // 1. check if email and password exist
    if (!email || !password) {
        return next(new AppError('Please provide an email or a password', 400));
    }

    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await user.correctPassword(password, user.password))) {
        return next(new AppError('Invalid email or password', 401));
    }

    createSendToken(user, 200, res);
});

exports.protectAccess = catchAsync(async (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies.jwt) {
        token = req.cookies.jwt;
    }
    if (!token) {
        return next(new AppError('You are not logged in! Please log in to get access.', 401))
    }

    // verification token
    const decode = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

    // check if the user still exist
    const freshUser = await User.findById(decode.id);

    if (!freshUser) {
        return next(new AppError('The user belonging to this user does no longer exist.'), 401)
    }

    // check if user changed password after token was issued.
    if (freshUser.changePasswordAfterToken(decode.iat)) {
        return next(new AppError('User recently changed password. Please log in again!', 401))
    }

    // garantiza la proteccion a la ruta
    req.user = freshUser;
    res.locals.user = freshUser;

    next();
});

exports.isLoggedIn = async (req, res, next) => {
    try {
        if (req.cookies.jwt) {
            const decode = await promisify(jwt.verify)(req.cookies.jwt, process.env.JWT_SECRET);

            // check if the user still exist
            const currentUser = await User.findById(decode.id);
            if (!currentUser) {
                return next();
            }

            // check if user changed password after token was issued.
            if (currentUser.changePasswordAfterToken(decode.iat)) {
                return next();
            }

            res.locals.user = currentUser;
            return next();
        }

    } catch (error) {
        return next();
    }
    next();
};

exports.logout = (req, res) => {
    res.cookie('jwt', 'loggedout', {
        expires: new Date(Date.now() + 10 * 1000),
        httpOnly: true
    });
    res.status(200).json({ status: 'success' });
}

exports.restrictAccess = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            //403 is forbidden
            return next(new AppError("You can't have the permitions to perform this action", 403))
        }
        next();
    }
}

exports.forgotPassword = catchAsync(async (req, res, next) => {
    // 1) obtener el usuario segun el email enviado
    const user = await User.findOne({ email: req.body.email })

    if (!user) {
        return next(new AppError('There is no user with that email address', 404))
    }

    // 2) generar el nuevo token random
    const resetToken = user.createPasswordResetToken()
    await user.save({ validateBeforeSave: false });

    const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/reset_password/${resetToken}`;

    const message = `Forgot your password? Sumit a PATCH request with your new password and
    passwordConfirm to: ${resetURL}.\nIf you didn't forget your password, please ignore this
    email.`;

    try {
        await new Email(user, resetURL).passwordReset();

        res.status(200).json({
            status: 'success',
            message: 'Token sent to email!'
        })

    } catch (error) {
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save({ validateBeforeSave: false })

        return next(new AppError('There was an error sending this email. Try again later!', 500))

    }

});

exports.resetPassword = catchAsync(async (req, res, next) => {
    //1 ger the user base by token
    const hashedToken = crypto
        .createHash('sha256')
        .update(req.params.token)
        .digest('hex');




    const user = await User.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpires: { $gt: Date.now() }
    });

    // 2 if token has not expired, and theres is user, set the new password

    if (!user) {
        return next(new AppError('Token is invalid or has expired', 400))
    };

    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save()

    createSendToken(user, 200, res);

});

exports.updatePassword = catchAsync(async (req, res, next) => {
    // traer el usuario de la colection
    const user = await User.findById(req.user.id).select('+password')

    // verificar si la contraseña es correcta
    if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
        return next(new AppError('Your current password is wrong', 401))
    }
    // si es la correcta, actualizar la contraseña
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    await user.save();

    // loggear el usuario
    createSendToken(user, 200, res);
});