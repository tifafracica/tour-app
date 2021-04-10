const mongoose = require('mongoose');
const Tour = require('./tourModel');

const reviewSchema = new mongoose.Schema(
    {
        review: {
            type: String,
            required: [true, 'Review can not be empty']
        },
        rating: {
            type: Number,
            min: [1, 'Rating must be above 1.0'],
            max: [5, 'Rating must be below 5.0']
        },
        createdAt: {
            type: Date,
            default: Date.now()
        },
        tour: {
            type: mongoose.Schema.ObjectId,
            ref: 'Tour',
            required: [true, 'Review must belong to a Tour']
        },
        user: {
            type: mongoose.Schema.ObjectId,
            ref: 'User',
            required: [true, 'Review must belong to a User']
        }
    },
    {
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

reviewSchema.pre(/^find/, function (next) {
    // this.populate({
    //     path: 'tour',
    //     select: '-guides name'
    // }).populate({
    //     path: 'user',
    //     select: 'name photo'
    // });

    this.populate({
        path: 'user',
        select: 'name photo'
    });

    next();
})

reviewSchema.index({ tour: 1, user: 1 }, { unique: true })

reviewSchema.statics.calcAverageRatings = async function (tourID) {
    const stats = await this.aggregate([
        {
            $match: { tour: tourID }
        },
        {
            $group: {
                _id: '$tour',
                nRatings: { $sum: 1 },
                avgRatings: { $avg: '$rating' }
            }
        }
    ]);
    // console.log(stats)

    if (stats.length > 0) {
        await Tour.findByIdAndUpdate(tourID, {
            ratingsQuantity: stats[0].nRatings,
            ratingsAverage: stats[0].avgRatings
        })
    } else {
        await Tour.findByIdAndUpdate(tourID, {
            ratingsQuantity: 0,
            ratingsAverage: 4.5
        })
    }
}

reviewSchema.post('save', function () {
    this.constructor.calcAverageRatings(this.tour)
});

reviewSchema.pre(/^findOneAnd/, async function (next) {
    this.review = await this.findOne();
    // console.log(this.review);
    next();
})

reviewSchema.post(/^findOneAnd/, async function () {
    await this.review.constructor.calcAverageRatings(this.review.tour)
})


//crear el modelo
const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;