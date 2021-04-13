const express = require('express');
const { getOverview, getTour, getLoginForm, getAccount, updateUserData, getMyTours, getSingupForm, alerts } = require('../controllers/viewController');
const { isLoggedIn, protectAccess } = require('../controllers/authController');
// const { createBookingCheckout } = require('../controllers/bookingController');

const router = express.Router();

router.use(alerts);

router.get('/', isLoggedIn, getOverview)
router.get('/signup', getSingupForm);
router.get('/tour/:slug', isLoggedIn, getTour)
router.get('/login', isLoggedIn, getLoginForm)
router.get('/me', protectAccess, getAccount)
router.post('/submit-user-data', protectAccess, updateUserData)
router.get('/my_tours', protectAccess, getMyTours)


module.exports = router;