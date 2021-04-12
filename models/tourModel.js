const mongoose = require('mongoose');
const slugify = require('slugify');
// const User = require('./userModel')
// const validator = require('validator');

//creando el schema de tours
const tourSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'A tour must have a name'],
    unique: true, //aqui determinamos que un tour tenga nombre repetidos.
    trim: true,
    maxlength: [40, 'A tour name must have less o equal than 40 characters'],
    minlength: [10, 'A tour name must have more o equal than 10 characters'],
    //probando con validator
    // validate: [validator.isAlpha, 'The name must only contains characters']
  },
  duration: {
    type: Number,
    required: [true, 'A tour must have a duration']
  },
  maxGroupSize: {
    type: Number,
    required: [true, 'A tour must have a group size']
  },
  difficulty: {
    type: String,
    required: [true, 'A tour must have a difficulty'],
    enum: {
      values: ['easy', 'medium', 'difficult'],
      message: 'The difficulty is either: easy, medium, difficult',
    }
  },
  ratingsAverage: {
    type: Number,
    default: 4.5, //al crear un tour sin definirle el rating por defecto será 4.5
    min: [1, 'Rating must be above 1.0'],
    max: [5, 'Rating must be below 5.0'],
    set: val => Math.round(val * 10) / 10
  },
  ratingsQuantity: {
    type: Number,
    default: 0
  },
  price: {
    type: Number,
    required: [true, 'A tour must have a price'] //aqui determinamos que el campo price sea obligatorio y ponemos un mensaje de error
  },
  priceDiscount: {
    type: Number,
    validate: {
      validator: function (val) {
        // THIS. solamente apunta a actual documento cuando de CREA.
        return val < this.price
      },
      message: 'Discount price ({VALUE}) should be below regular price'
    }
  },
  summary: {
    type: String,
    trim: true //elimina espacios en blanco al inicio o al final del string
  },
  description: {
    type: String,
    trim: true,
    required: [true, 'A tour must have a description']
  },
  imageCover: {
    type: String,
    required: [true, 'A tour must have a cover image']
  },
  images: [String], //array de strings
  createdAt: {
    type: Date,
    default: Date.now(),
    select: false
  },
  startDates: [Date],
  slug: String,
  secretTour: {
    type: Boolean,
    default: false
  },
  startLocation: {
    //geo json
    type: {
      type: String,
      default: 'Point',
      enum: ['Point']
    },
    coordinates: [Number],
    address: String,
    description: String
  },
  locations: [
    {
      //geo json
      type: {
        type: String,
        default: 'Point',
        enum: ['Point']
      },
      coordinates: [Number],
      address: String,
      description: String,
      day: Number
    }
  ],
  guides: [
    {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    }
  ]
},
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

tourSchema.index({ price: 1, ratingsAverage: -1 });

tourSchema.index({ slug: 1 });

tourSchema.index({
  startLocation: "2dsphere",
});

tourSchema.virtual('durationsWeeks').get(function () {
  return this.duration / 7;
})

tourSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tour',
  localField: '_id'
})

// DOCUMENT MIDDLEWARE: corre antes del comando .save()  .create()
tourSchema.pre('save', function (next) {
  this.slug = slugify(this.name, {
    lower: true
  });
  next();
})

// embebing data
// tourSchema.pre('save', async function (next) {
//   const guidePromise = this.guides.map(async id => await User.findById(id));
//   this.guides = await Promise.all(guidePromise)
//   next()
// })

// tourSchema.post('save', function (doc, next) {
//   console.log(doc)
//   next();
// })

// QUERY MIDDLEWARE
//no se procesan documentos sino querys.
// /^find/ todos los string que comiencen con find
tourSchema.pre(/^find/, function (next) {
  this.find({ secretTour: { $ne: true } })

  this.start = Date.now()
  next();
})

tourSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'guides',
    select: '-__v -passwordChangedAt'
  });

  next();
})

// tourSchema.post(/^find/, function (docs, next) {
//   console.log(`Query took ${Date.now() - this.start} miliseconds`)
//   next();
// })

// AGGREGATION MIDDLEWARE
// tourSchema.pre('aggregate', function (next) {
//   this.pipeline().unshift({
//     $match: { secretTour: { $ne: true } }
//   });
//   console.log(this.pipeline())
//   next();
// })

//crear el modelo
const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;