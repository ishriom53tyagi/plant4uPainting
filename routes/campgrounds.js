var express = require("express");
var router  = express.Router();
var Campground = require("../models/campground");
var middleware = require("../middleware");
var request = require("request");
var multer = require('multer');
var storage = multer.diskStorage({
  filename: function(req, file, callback) {
    callback(null, Date.now() + file.originalname);
  }
});
var imageFilter = function (req, file, cb) {
    // accept image files only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
        return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
};
var upload = multer({ storage: storage, fileFilter: imageFilter})

var cloudinary = require('cloudinary');
cloudinary.config({ 
  cloud_name: 'plan4upainting', 
  api_key: '984459182261487', 
  api_secret: 'niX34zAKb3tFLIJ33vI29mcZjxg'
});

//INDEX - show all campgrounds
router.get("/", function(req, res){
    // Get all campgrounds from DB
    Campground.find({}, function(err, allCampgrounds){
       if(err){
           console.log(err);
       } else {
           request('https://maps.googleapis.com/maps/api/geocode/json?address=sardine%20lake%20ca&key=AIzaSyBtHyZ049G_pjzIXDKsJJB5zMohfN67llM', function (error, response, body) {
            if (!error && response.statusCode == 200) {
                console.log(body); // Show the HTML for the Modulus homepage.
                res.render("campgrounds/index",{campgrounds:allCampgrounds});

            }
});
       }
    });
});



router.get("/tag",function(req,res)
{
    console.log("in the tag section i am right here");
    cloudinary.v2.api.resources_by_tag("mytag", 
  function(error, result) {
      console.log(result);
      for(var i=0;i<result.resources.length;i++)
      {
        console.log(result.resources[i].secure_url);    
      }
        //console.log("Secure Url is : "+result);
     });
     res.render("campgrounds/new"); 

});

//CREATE - add new campground to DB
router.post("/", middleware.isLoggedIn, upload.single('image'), function(req, res) {
   // cloudinary.uploader.upload(req.file.path , function(result) {
     //   console.log(result);
      // add cloudinary url for the image to the campground object under image property
      req.body.campground.image = "";
      req.body.campground.verified=false;
      // add author to campground
      req.body.campground.author = {
        id: req.user._id,
        username: req.user.username
      }
      Campground.create(req.body.campground, function(err, campground) {
        if (err) {
          req.flash('error', err.message);
          return res.redirect('back');
        }
        console.log("Campground Id is "+campground.id);

        cloudinary.v2.uploader.upload(req.file.path ,{ public_id:campground.id }, function(error,result) {
                Campground.findByIdAndUpdate(
                    { _id: campground.id },
                    { image:result.secure_url },
                    function(err, result) {
                      if (err) {
                        res.send(err);
                      } else {
                        res.redirect("/campgrounds/" + campground.id);
                      }
                    }); 
        })
      });
    });
//});

router.get('/gallery',function(req,res){

  res.render("save");

});

router.post('/gallery',function(req,res){
  var id=req.body.id;
  Campground.findById(id,function(err,user){
    if(err)
      {
        console.log(err);
      }
    else{
      Campground.findByIdAndUpdate(
        { _id: id},
        { verified:true },
        function(err, result) {
          if (err) {
            res.send(err);
          } else {
            res.render("success");
          }
        }); 
    }
  });

})
//NEW - show form to create new campground
router.get("/new", middleware.isLoggedIn, function(req, res){
   res.render("campgrounds/new"); 
});

// SHOW - shows more info about one campground
router.get("/:id", function(req, res){
    //find the campground with provided ID
    Campground.findById(req.params.id).populate("comments").exec(function(err, foundCampground){
        if(err){
            console.log(err);
        } else {
            console.log(foundCampground)
            //render show template with that campground
            res.render("campgrounds/show", {campground: foundCampground});
        }
    });
});

router.get("/:id/edit", middleware.checkUserCampground, function(req, res){
    console.log("IN EDIT!");
    //find the campground with provided ID
    Campground.findById(req.params.id, function(err, foundCampground){
        if(err){
            console.log(err);
        } else {
            //render show template with that campground
            res.render("campgrounds/edit", {campground: foundCampground});
        }
    });
});

router.put("/:id", function(req, res){
    var newData = {name: req.body.name, image: req.body.image, description: req.body.desc};
    Campground.findByIdAndUpdate(req.params.id, {$set: newData}, function(err, campground){
        if(err){
            req.flash("error", err.message);
            res.redirect("back");
        } else {
            req.flash("success","Successfully Updated!");
            res.redirect("/campgrounds/" + campground._id);
        }
    });
});


//middleware
// function isLoggedIn(req, res, next){
//     if(req.isAuthenticated()){
//         return next();
//     }
//     req.flash("error", "You must be signed in to do that!");
//     res.redirect("/login");
// }

module.exports = router;

