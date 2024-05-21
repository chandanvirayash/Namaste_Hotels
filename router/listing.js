const express = require("express");
 const router = express.Router();
 const wrapasync = require("../utils/wrapasync.js");
 const listing = require("../models/listing.js")
 const{isloggedIn,isOwner,validateListing } = require("../middleware.js")
 const listingController = require("../controllers/listings.js")

const multer  = require('multer')
const {storage}=require("../cloudConfig.js")
const upload = multer({storage})

 
// index,create route
router
.route("/")
.get(wrapasync ( listingController.index  ) )

.post(isloggedIn ,upload.single(`listing[image]`),validateListing, wrapasync( listingController.createListing))



//new route

router.get("/new",isloggedIn, listingController.renderNewForm )



// show,updates,delete route

router.route("/:id")
.get(wrapasync (listingController.showListings) )
.put(isloggedIn,isOwner,upload.single(`listing[image]`) ,validateListing,wrapasync(listingController.updateListing))
.delete(isloggedIn ,isOwner,wrapasync(listingController.destroyListing))


//edit route

router.get("/:id/edit",isloggedIn,isOwner,wrapasync(listingController.renderEditForm))







module.exports = router;