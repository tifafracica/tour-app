const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const { strict } = require('assert');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        require: [true, 'Please tell us your name'],
    },
    email: {
        type: String,
        require: [true, 'Please provide your email'],
        trim: true,
        unique: true,
        lowercase: true,
        validate: [validator.isEmail, 'Please provide a valid email']
    },
    role: {
        type: String,
        enum: ['admin', 'lead-guide', 'guide', 'user'],
        default: 'user'
    },
    photo: {
        type: String,
        default: 'default.jpg'
    },
    password: {
        type: String,
        require: [true, 'Please provide a password'],
        minlength: 8,
        select: false
    },
    passwordConfirm: {
        type: String,
        require: [true, 'Please confirm you password'],
        validate: {
            validator: function (el) {
                return el === this.password
            },
            message: 'Password is not the same!'
        }
    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    active: {
        type: Boolean,
        default: true,
        select: false
    }
});

// middleware for encryp the pass

userSchema.pre('save', async function (next) {
    // only runs this function if password was actually modified
    if (!this.isModified('password')) return next();

    // Hash the password with cost 12
    this.password = await bcrypt.hash(this.password, 12);

    //delete passwordConfirm field
    this.passwordConfirm = undefined;
    next();
})

userSchema.pre('save', async function (next) {
    // only runs this function if password was actually modified
    if (!this.isModified('password') || this.isNew) return next();

    this.passwordChangedAt = Date.now() - 1000;
    next();
})


userSchema.pre(/^find/, function (next) {
    // this points to the current document
    this.find({ active: { $ne: false } })
    next()
});

userSchema.virtual('bookings', {
    ref: 'Booking',
    foreignField: 'user',
    localField: '_id',
});
//create a instance method to compare password

userSchema.methods.correctPassword = async function (requestPassword, userPassword) {
    return await bcrypt.compare(requestPassword, userPassword);
};

userSchema.methods.changePasswordAfterToken = function (JWTTimestamp) {
    if (this.passwordChangedAt) {
        const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
        return JWTTimestamp < changedTimestamp;
    }
    // false means not changed
    return false
}

userSchema.methods.createPasswordResetToken = function () {
    // crear el token que vamos a enviar al usuario.
    const resetToken = crypto
        .randomBytes(32)
        .toString('hex');

    // mejoramos la encriptacion pues esta data va estar en la base de datos
    this.passwordResetToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');

    console.log({ resetToken }, this.passwordResetToken)

    // expira en 10 min.
    this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

    return resetToken
}



const User = mongoose.model('User', userSchema);

module.exports = User;