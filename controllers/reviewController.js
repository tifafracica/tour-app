const Review = require('../models/reviewModel');
const User = require('../models/userModel');
const factory = require('./handlerFactory');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');

// const Tour = require('./../models/tourModel');

exports.getTourAndUserId = (req, res, next) => {
    // permitir nested routes
    if (!req.body.tour) req.body.tour = req.params.tourId;
    if (!req.body.user) req.body.user = req.user.id;
    next();
};

exports.getAllReviews = factory.getAll(Review);
exports.getReview = factory.getOne(Review);
exports.createReview = factory.createOne(Review);
exports.updateReview = factory.updateOne(Review);
exports.deleteReview = factory.deleteOne(Review);

// este metodo evita que un usuario que nunca reservo un tour pueda hacer algun review.
exports.checkBooked = catchAsync(async (req, res, next) => {
    //1) OBTENER EL ID DEL USUARIO QUE QUIERE HACER EL REVIEW
    const user = await User.findById(req.user.id).populate('bookings');
    const tourId = await req.body.tour;

    //2) OBTENER LA RESERVA Y DEVOLVER ERROR SI NO EXISTE RESERVA ALGUNA
    const userBookings = await user.bookings;
    if (!userBookings) {
        return next(
            new AppError('This user has no bookings so cannot post a review', 400)
        );
    }

    // VERIFICAR SI EL TOURID ESTA PRESENTE EN ALGUNA DE LAS RESERVAS
    const match = await userBookings.filter((el) => el.tour.id === tourId);

    if (match.length < 1) {
        return next(
            new AppError('You have not booked this tour so cannot review', 401)
        );
    }
});