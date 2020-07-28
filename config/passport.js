// needed for local authentication
const passport = require('passport');
// needed for local login
const LocalStrategy = require('passport-local').Strategy;
// needed for facebook authentication
//const FacebookStrategy = require('passport-facebook').Strategy;
const secret = require('../config/secret');
const User = require('../models/user');
const async = require('async');
//const Cart = require('../models/cart');

// serialize and deserialize
passport.serializeUser((user, done) => {
    done(null, user);
});

passport.deserializeUser((id, done) => {
    User.findById(id, (err, user) => {
        done(err, user);
    });
});

// give the middleware a name, and create a new anonymous instance of LocalStrategy
passport.use('local', new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password',
    passReqToCallback: true
}, async (req,email, password, done) => {
    try {
        // 1) Check if the email already exists
        const user = await User.findOne({ 'email': email });
        if (!user) {
            return done(null, false,req.flash('errors', 'No user with such credentials found'));
        }

        // 2) Check if the password is correct
        const isValid = await User.comparePasswords(password, user.password);
        if(!isValid)
        {
            return done(null,false,req.flash('errors', 'Incorrect Password'));
        }
        // 3) Check is the account is been Verified
        if(!user.active){

            return done(null,false,req.flash('errors', 'Please checkout your email first'));
        }

        if (isValid) {
            return done(null, user);
        } else {
            return done(null, false, req.flash('errors', 'No user with such credentials found'));
        }
    } catch(error) {
        return done(error, false);
    }
}));

// custom function validate
exports.isAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/login');
};
