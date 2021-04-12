const mongoose = require('mongoose');
const dotenv = require('dotenv');

process.on('uncaughtException', err => {
  console.log('Uncaught Exception! shutting down...')
  console.log(err.name, err.message);
  // apagamos el server y cerramos los procesos.
  process.exit(1);
})

dotenv.config({ path: './.env' })

const app = require('./app');

// console.log(process.env)

const database = process.env.DATABASE.replace('<PASSWORD>', process.env.DATABASE_PASSWORD);

//connect cloud database
mongoose.connect(database, {
  // Handle Deprecation Warnings
  useNewUrlParser: true,
  useCreateIndex: true,
  useFindAndModify: false,
  useUnifiedTopology: true,
}).then(() => console.log('Database connection sucessful!'))

//connect local database
// mongoose.connect(process.env.DATABASE_LOCAL, {
//   // Handle Deprecation Warnings
//   useNewUrlParser: true,
//   useCreateIndex: true,
//   useFindAndModify: false,
// }).then(() => console.log('Database connection sucessful!'))


//este codigo era solo para testear.
// const testTour = new Tour({
//   name: 'The Snow Adventure',
//   price: 500
// })

// testTour.save().then(doc => {
//   console.log(doc);
// }).catch(err => {
//   console.log('ERROR: ', err)
// });

const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log(`App is running on port ${port}...`)
});

// handle error in connection with DB
process.on('unhandledRejection', err => {
  console.log('UNHANDLED REJECTION! shutting down...')
  console.log(err.name, err.message);
  // apagamos el server y cerramos los procesos.
  server.close(() => {
    process.exit(1);
  });
});

process.on('SIGTERM', () => {
  console.log('SIGTERM RECEIVED. Shutting down gracefully.');
  server.close(() => {
    console.log('Process terminated!');
  })
})