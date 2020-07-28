// external imports
const router = require('express').Router();
const passport = require('passport');
const async = require('async');
const Joi = require('joi');
const randomstring = require('randomstring');
const mailer=require('../misc/mailer');
// custom imports
//const Cart = require('../models/cart');
const User = require('../models/user');
const passportConf = require('../config/passport');


const userSchema = Joi.object().keys({
  email: Joi.string() .min(6) .required() .email(),
  name: Joi.string() .min(6) .required(),
  phoneNumber: Joi.string() .required(),
  Account: Joi.string() .required(),
  ifsc : Joi.string(). required(),
  password: Joi.string().regex(/^[a-zA-Z0-9]{3,30}$/).required(),
  confirm_password: Joi.any().valid(Joi.ref('password'))
});

// Authorization 
const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  } else {
    req.flash('error', 'Sorry, but you must be registered first!');
    res.redirect('/');
  }
};

const isNotAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    req.flash('error', 'Sorry, but you are already logged in!');
    res.redirect('/');
  } else {
    return next();
  }
};


router.route('/register')
  .get(isNotAuthenticated, (req, res) => {
    res.render('accounts/signup',{message: req.flash('loginMessage'),errors: req.flash('errors')
    });
  })
  .post(async (req, res, next) => {
    try {
        const result = userSchema.validate(req.body);
    	    let person = new User();
            // populate the user properties based on what the user submitted
            person.profile.name = req.body.name;
            person.username = req.body.name;
            person.password = req.body.password;
            person.email = req.body.email;
            person.phoneNumber=req.body.phoneNumber;
            person.AccountNumber=req.body.Account;
            person.ifscCode=req.body.ifsc;
          //  person.profile.picture = person.gravatar();
			const secretToken = randomstring.generate();
            person.secretToken = secretToken;
            person.active = false;
      if (result.error) {
	    console.log(result.error);
        req.flash('error', 'Data is not valid. Please try again.');
        res.redirect('/register');
        return;
      }
      

      // Checking if email is already taken
      const user = await User.findOne({ 'email': result.value.email });
      if (user) {
	    console.log('already use email');
        req.flash('error', 'Email is already in use.');
        res.redirect('/user/register');
        return;
      }

      // Hash the password
      const hash = await User.hashPassword(result.value.password);

      
      result.value.secretToken = secretToken;
      result.value.active = false;
      // Save user to DB
      delete result.value.confirmationPassword;
      result.value.password = hash;

      const newUser = await new User(result.value); 
      console.log('newUser', newUser);
      await newUser.save();

      //new mailer foundation problem
      const html=`hi there,
      <br/>
      thanku for registering!
      <br/> <br/>
      please verify your email by typing the following details
      <br/>
      Token:<b>${secretToken}</b>
      <br/>
      On the following page:
      <a href="http://localhost:3000/verify">http://localhost:3000/verify</a>
      <br/><br/>
      have a pleasent day
      `;

  await mailer.sendEmail('admin@haribhari.com',result.value.email,'please verify your email content',html)
	console.log("hi this is hola hi how are you");
      req.flash('success', 'please check your email.');
      res.redirect('/login');
    } catch(error) {
      next(error);
    }
  });
  


/**
 *  Handles GET HTTP requests for user login
 */
router.get('/login', (req, res) => {
    // if user exists, then they have been logged in redirect to home page
    if (req.user) return res.redirect('/');
    // user was not logged in, show error message (No user with such credentials found)
    res.render('accounts/signup',{errors: req.flash('loginMessage')});
});

/**
 * Handles POST HTTP requests for user login - form submission
 */
router.post('/login', passport.authenticate('local', {
    successRedirect: '/campgrounds/new',
    failureRedirect: '/user/register',
    failureFlash: true
}));

/**
 * Handles GET HTTP requests for user profile
 */
router.get('/profile', passportConf.isAuthenticated, (req, res, next) => {
    // search for a single user given the user ID
    User.findOne({_id: req.user._id})
        .populate('history.item')
        .exec((err, foundUser) => {
            if (err) return next(err); // oops error might occur
            res.render('accounts/profile', {user: foundUser,message: req.flash('success')}); // user found, render the profile view
        });
});

/**
 * Handles GET HTTP requests for user sign-up
 */

 /**
 * Handles GET HTTP requests for user sign-up
 */
router.get('/register', (req, res, next) => {
    // user sign-up failed, show error message
    res.render('accounts/signup', {
        message: req.flash('loginMessage'),errors: req.flash('errors')
    });
});

/**
 * Handles POST HTTP request for user sign-up
 */
 /*
router.post('/register', (req, res, next) => {
    // executes array of functions in series, passing result of previous function to the next
    async.waterfall([
        // function 1

        (callback) => {
		     
			const result = Joi.validate(req.body, userSchema);
            // create new user model
            let user = new User();
            // populate the user properties based on what the user submitted
            user.profile.name = req.body.name;
            user.name = req.body.name;
            user.password = req.body.password;
            user.email = req.body.email;
            user.profile.picture = user.gravatar();
			const secretToken = randomstring.generate();
            user.secretToken = secretToken;
            user.active = false;
            
        
		try 
		{
		// check submitted email against the database
          User.findOne({email: req.body.email}, (err, existingUser) => {
                // does the user already exist?
                if (existingUser) {
                    // return an error message to indicate user already exists
                    req.flash('errors', 'Account with that email address already exists');
                    // redirect the user back to signup page with the error
                    return res.redirect('/register')
                } 
            });

      // Hash the password
      //const hash =  User.hashPassword();

      const secretToken = randomstring.generate();
      result.value.secretToken = secretToken;
      result.value.active = false;
      // Save user to DB
      //delete result.value.confirmationPassword;
      //result.value.password = hash;

      //const newUser = new User(result.value); 
      //console.log('newUser', newUser);
	  user.save((err, user) => {
                        // oops error might occur
                        if (err) return next(err);
                        // success set user to the callback
                        callback(null, user);
						});
      //newUser.save();

      //new mailer foundation problem
      const html=`hi there,
      <br/>
      thanku for registering!
      <br/> <br/>
      please verify your email by typing the following details
      <br/>
      Token:<b>${secretToken}</b>
      <br/>
      On the following page:
      <a href="http://localhost:3000/verify">http://localhost:3000/verify</a>
      <br/><br/>
      have a pleasent day
      `;
      mailer.sendEmail('admin@haribhari.com',result.value.email,'please verify your email content',html)
	  console.log('after mailer');
	  
                        // success set user to the callback
      callback(null, user);
      req.flash('success', 'please check your email.');
      res.redirect('/login');
    } catch(error) {
      next(error);
    }
        },
        // function 2 - receives result of function 1, see line 83 above
        (user) => {
            // create a new cart model
            const cart = new Cart();
            // set cart owner as the current user
            cart.owner = user._id;
            // save cart to mongo
            cart.save((err) => {
                // oops error might occur
                if (err) return next(err);
                // log user in
                req.logIn(user, (err) => {
                    // error occurred
                    if (err) return next(err);
                    // sucess, redirect user to their profile page
                    res.redirect('/profile');
                });
            });
        }
    ]);
});
*/

router.route('/verify')
 .get(isNotAuthenticated, (req, res)=>
  {
    res.render('accounts/verify');
  })
 .post(async (req,res,next) => { 
   try{
   const { secretToken }= req.body;
   const user = await User.findOne({ 'secretToken' :secretToken });
   console.log(user);
   if(!user)
   {
     req.flash("error","No user FOund");
     res.redirect('/user/register');
     return;
   }
   user.active=true;
   user.secretToken = '';
   await user.save();

   req.flash('success','thank you now you may logged in');
   res.redirect('/login');
  }
   catch(error){
    next(error);
   }
 })




/**
 * Handles GET HTTP requests for user logout
 */
router.get('/logout', (req, res, next) => {
    // terminate existing login session
    req.logout();
    // send user back to the home/landing page
    return res.redirect('/');
});

/**
 * Handles GET HTTP requests for editing user profile
 */
router.get('/edit-profile', (req, res, next) => {
    // load the edit profile view
    res.render('accounts/edit-profile', {message: req.flash('success')});
});

/**
 * Handles POST HTTP requests for editing user profile
 */
router.post('/profile', (req, res, next) => {
    // check submitted user id against the database
    User.findOne({_id: req.user._id}, (err, user) => {
        // error occurred
        if (err) return next(err);
        // success - update user's name
        if (req.body.username) user.profile.name = req.body.username;
        // update user address

		if (req.body.phoneNumber) user.phoneNumber = req.body.phoneNumber;

        if (req.body.address) user.address = req.body.address;

		if (req.body.city) user.city = req.body.city;

		if (req.body.district) user.district = req.body.district;

		if (req.body.address) user.postcode = req.body.pincode;
	

        // save the newly updated user details
        user.save((err) => {
            // oops error might occur
            if (err) return next(err);
            // success - render success notification
            req.flash('success', 'You have successfully edited your profile information');
            // redirect user to the edit profile view
            return res.redirect('/profile');
        });
    });

});

/**
 * Handle GET HTTP requests from Facebook authentication
 */
router.get('/auth/facebook', passport.authenticate('facebook', {scope: 'email'}));

/**
 * Handles GET HTTP results from Facebook authentication
 */
router.get('/auth/facebook/callback', passport.authenticate('facebook', {
    successRedirect: '/profile',
    failureRedirect: '/login'
}));

// make route accessible to other files
module.exports = router;
