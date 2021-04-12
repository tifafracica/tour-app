const express = require('express');
const path = require('path');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');
const compression = require('compression')

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController')
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const bookingRouter = require('./routes/bookingRoutes');
const viewRouter = require('./routes/viewRoutes');
const { urlencoded } = require('express');


const app = express();

app.enable('trust proxy');

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));


// middleware globales

// ejemplo de como traer archivos estaticos como htmls o imagenes desde el folder y no como ruta.
app.use(express.static(path.join(__dirname, 'public')));

//HTTP headers - seteo de seguridad
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'", 'https://*.mapbox.com', 'https://*.stripe.com', "'blob'"],
      baseUri: ["'self'"],
      fontSrc: ["'self'", 'https:', 'data:'],
      scriptSrc: ["'self'", 'https://*.cloudflare.com'],
      imgSrc: ["'self'", 'https://www.gstatic.com'],
      scriptSrc: [
        "'self'",
        'https://*.stripe.com',
        'https://cdnjs.cloudflare.com',
        'https://api.mapbox.com',
        'https://js.stripe.com',
        "'blob'",
      ],
      frameSrc: ["'self'", 'https://*.stripe.com'],
      objectSrc: ["'none'"],
      styleSrc: ["'self'", 'https:', 'unsafe-inline'],
      upgradeInsecureRequests: [],
    },
  })
);

// development loggin
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'))
}

// limit request from same API
const limiter = rateLimit({
  max: 100, // esta cantidad puede ser mayor por ejemplo cuando estas construyendo una api.
  windowMs: 60 * 60 * 1000,
  message: 'Too many request from this IP, please try again in an hour!'
})
// aca afectamos todas la rutas.
app.use('/api', limiter);


// body parsing, lee la data de body dentro del req.body

app.use(express.json({ limit: '10kb' })); //this is a middleware
app.use(urlencoded({
  extended: true,
  limit: '10kb'
}))
app.use(cookieParser());

// data sanitization contra Nosql query injection
app.use(mongoSanitize()); //verifica si en el body hay alguna query de mongodb

// data sanitization contra ataques XSS
app.use(xss());

//prevenir parameters polutions
app.use(hpp({
  whitelist: [
    'duration',
    'ratingsAverage',
    'difficulty',
    'maxGroupSize',
    'price'
  ]
}));

app.use(compression())

//el argunmento next se le llama asi por convencion, podemos llamarlo como queramos
//pero recuerda que siempre es convention over configuration


//crear un middleware que nos diga cuando se hizo el request. - TEST
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString(); //toISOString() es un metodo que nos ayuda a leer mejor las fechas.
  next();
});


app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookings', bookingRouter);


// cuando la URL no existe, lo ideal es crear un middleware que envie el mensaje de error
// .all() se refiere a todos los verbos. '*' todas las url.
app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server`, 400));
});

app.use(globalErrorHandler)

module.exports = app;