const express = require("express");
 const router = express.Router({mergeParams : true});

 const wrapasync = require("../utils/wrapasync.js");
 const ExpressError = require("../utils/expresserr.js")
 
const { listingSchema,reviewSchema}= require("../schema.js")
const Review = require("../models/review.js");
const listing = require("../models/listing.js")

const{validateReview,isloggedIn,isReviewAuthor} = require("../middleware.js")


const reviewController = require("../controllers/reviews.js")







 //review/post route

router.post("/",isloggedIn,validateReview,wrapasync(reviewController.createReview));
    
    
    //DELETE REVIEW ROUTE
    
router.delete(
    "/:reviewId",
    isloggedIn,
    isReviewAuthor,
    wrapasync(reviewController.destroyReview)
);
    
    
    
    module.exports = router;