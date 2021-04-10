const express = require('express');
const {
  aliasTopTours,
  getAllTours,
  createTour,
  getTour,
  updateTour,
  deleteTour,
  getTourStats,
  getMonthlyPlan,
  getToursWithin,
  getDistances,
  resizeTourImages,
  uploadTourImage } = require('./../controllers/tourController');
const { protectAccess, restrictAccess } = require('./../controllers/authController');
const reviewRouter = require('./../routes/reviewRoutes');
const router = express.Router();

// aqui hacemos un middleware para chequear que el id existe. recordemos que
// los middleware van por orden.
// router.param('id', checkID);

router.use('/:tourId/reviews', reviewRouter);


router
  .route('/tours-stats')
  .get(getTourStats)

router
  .route('/monthly-plan/:year')
  .get(protectAccess, restrictAccess('admin', 'lead-guide', 'guide'), getMonthlyPlan)

router
  .route('/top-5-cheap')
  .get(aliasTopTours, getAllTours);

router
  .route('/distances/:latlng/unit/:unit')
  .get(getDistances)

router
  .route('/tour-within/:distance/center/:latlng/unit/:unit')
  .get(getToursWithin)


router
  .route('/')
  .get(getAllTours)
  .post(protectAccess, restrictAccess('admin', 'lead-guide'), createTour); //chaining multiples middleware con una funcion que solo le concierne al post

router
  .route('/:id')
  .get(getTour)
  .patch(protectAccess, restrictAccess('admin', 'lead-guide'), uploadTourImage, resizeTourImages, updateTour)
  .delete(protectAccess, restrictAccess('admin', 'lead-guide'), deleteTour);


module.exports = router;