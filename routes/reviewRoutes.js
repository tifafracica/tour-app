const express = require('express');
const { getAllReviews, createReview, deleteReview, updateReview, getTourAndUserId, getReview, checkBooked } = require('./../controllers/reviewController');
const { protectAccess, restrictAccess } = require('./../controllers/authController');


const router = express.Router({ mergeParams: true });

router.use(protectAccess)

router
    .route('/')
    .get(getAllReviews)
    .post(restrictAccess('user'), getTourAndUserId, checkBooked, createReview)

router
    .route('/:id')
    .get(getReview)
    .patch(restrictAccess('user', 'admin'), updateReview)
    .delete(restrictAccess('user', 'admin'), deleteReview)


module.exports = router;