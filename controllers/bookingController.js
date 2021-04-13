const stripe = require('stripe')(process.env.STRIPE_KEY);
const Tour = require('./../models/tourModel');
const Booking = require('../models/bookingModel')
const AppError = require('./../utils/appError');
const catchAsync = require('./../utils/catchAsync');
const factory = require('./handlerFactory');
const User = require('../models/userModel');


exports.getCheckoutSession = catchAsync(async (req, res, next) => {
  // 1. obtener el tour reservado
  const tour = await Tour.findById(req.params.tourId);

  // 2. crear la sesion de checkout
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    success_url: `${req.protocol}://${req.get('host')}/my_tours?alert=booking`,
    cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
    customer_email: req.user.email,
    client_reference_id: req.params.tourId,
    line_items: [
      {
        name: `${tour.name} Tour`,
        description: tour.summary,
        images: [`${req.protocol}://${req.get('host')}/${tour.imageCover}`],
        amount: tour.price * 100,
        currency: 'usd',
        quantity: 1
      }
    ]
  })

  // 3. enviar la respuesta al cliente
  res.status(200)
    .set(
      'Content-Security-Policy',
      "connect-src 'self' https://*.tiles.mapbox.com https://api.mapbox.com https://events.mapbox.com https://api.stripe.com"
    )
    .json({
      status: 'success',
      session
    });
});

// exports.createBookingCheckout = catchAsync(async (req, res, next) => {
//   // this is temporary because this solution is insecure.
//   const { tour, user, price } = req.query;

//   if (!tour && !user && !price) return next();
//   await Booking.create({ tour, user, price });

//   res.redirect(req.originalUrl.split('?')[0]);
// });

const createBookingCheckout = async session => {
  const tour = session.client_reference_id;
  const user = (await User.findOne({ email: session.customer_email })).id;
  const price = session.amount_total / 100;

  await Booking.create({ tour, user, price });

}

exports.webhookCheckout = (req, res, next) => {
  const signature = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (error) {
    return res.status(400).send(`Webhook error: ${error.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    createBookingCheckout(event.data.object)
  }
  res.status(200).json({ received: true });
}

exports.getAllBookings = factory.getAll(Booking);
exports.getBooking = factory.getOne(Booking)
exports.createBooking = factory.createOne(Booking);
exports.updateBooking = factory.updateOne(Booking);
exports.deleteBooking = factory.deleteOne(Booking);