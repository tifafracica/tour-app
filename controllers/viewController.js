const Tour = require('./../models/tourModel');
const Booking = require('../models/bookingModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('../utils/appError');
const User = require('../models/userModel');

exports.getOverview = catchAsync(async (req, res) => {
    const tours = await Tour.find()

    res.status(200)
        .set(
            'Content-Security-Policy',
            "connect-src 'self' https://*.tiles.mapbox.com https://api.mapbox.com https://events.mapbox.com https://api.stripe.com; default-src https://*.mapbox.com https://*.stripe.com ;base-uri 'self';block-all-mixed-content;font-src 'self' https: data:;frame-ancestors 'self';img-src 'self' data:;object-src 'none';script-src https://cdnjs.cloudflare.com https://api.mapbox.com https://js.stripe.com/v3/ 'self' blob: ;script-src-attr 'none';style-src 'self' https: 'unsafe-inline';upgrade-insecure-requests;"
        )
        .render('overview', {
            title: 'All Tours',
            tours
        });
});

exports.getTour = catchAsync(async (req, res, next) => {

    const tour = await Tour.findOne({ slug: req.params.slug }).populate({
        path: 'reviews',
        fields: 'review rating user'
    });
    if (!tour) {
        return next(new AppError('There is no tour with that name', 404))
    }
    res.status(200)
        .set(
            'Content-Security-Policy',
            "connect-src 'self' https://*.tiles.mapbox.com https://api.mapbox.com https://events.mapbox.com https://api.stripe.com; default-src 'self' https://*.mapbox.com https://*.stripe.com ;base-uri 'self';block-all-mixed-content;font-src 'self' https: data:;frame-ancestors 'self';img-src 'self' data:;object-src 'none';script-src https://cdnjs.cloudflare.com https://api.mapbox.com https://js.stripe.com 'self' blob: ;script-src-attr 'none';style-src 'self' https: 'unsafe-inline';upgrade-insecure-requests;"
        )
        .render('tour', {
            title: `${tour.name} Tour`,
            tour
        });
});

exports.getMyTours = catchAsync(async (req, res, next) => {
    const booking = await Booking.find({ user: req.user.id })

    const toursIds = booking.map(element => element.tour);
    const tours = await Tour.find({ _id: { $in: toursIds } });

    res.status(200)
        .set(
            'Content-Security-Policy',
            "default-src 'self' https://*.mapbox.com https://*.stripe.com ;base-uri 'self';block-all-mixed-content;font-src 'self' https: data:;frame-ancestors 'self';img-src 'self' data:;object-src 'none';script-src https://cdnjs.cloudflare.com https://api.mapbox.com https://js.stripe.com/v3/ 'self' blob: ;script-src-attr 'none';style-src 'self' https: 'unsafe-inline';upgrade-insecure-requests;"
        )
        .render('overview', {
            title: 'My Tours',
            tours
        });

})

exports.getLoginForm = catchAsync(async (req, res) => {

    res.status(200)
        .set(
            'Content-Security-Policy',
            "connect-src 'self' https://cdnjs.cloudflare.com"
        )
        .render('login', {
            title: 'Log into your account'
        })
});

exports.getAccount = (req, res) => {
    res.status(200)
        .set(
            'Content-Security-Policy',
            "connect-src 'self' https://cdnjs.cloudflare.com"
        )
        .render('account', {
            title: 'Your account'
        })
}

exports.updateUserData = catchAsync(async (req, res, next) => {
    const updatedUser = await User.findByIdAndUpdate(req.user.id, {
        name: req.body.name,
        email: req.body.email
    },
        {
            new: true,
            runValidators: true
        }
    );
    res.status(200)
        .set(
            'Content-Security-Policy',
            "connect-src 'self' https://cdnjs.cloudflare.com"
        )
        .render('account', {
            title: 'Your account',
            user: updatedUser
        })
});

exports.getSingupForm = (req, res) => {
    res.status(200).render('signup', {
        title: 'create your account!'
    });
};