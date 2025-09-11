const listing = require("../models/listing.js")
const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const mapToken = process.env.MAP_TOKEN;
const geocodingClient = mbxGeocoding({ accessToken: mapToken });

const {listingSchema} = require('../schema.js')






module.exports.index =  (async(req,res)=>{

    const q = (req.query.q || '').trim();
    let allListingsRaw = [];

    if (q) {
        // Try geocoding the query into coordinates first
        let coords = null;
        try {
            if (process.env.MAP_TOKEN) {
                const response = await geocodingClient
                    .forwardGeocode({ query: q, limit: 1 })
                    .send();
                const feature = response?.body?.features?.[0];
                if (feature && feature.center && feature.center.length === 2) {
                    coords = feature.center; // [lng, lat]
                }
            }
        } catch (e) {
            // ignore geocoding errors and fall back to regex search
        }

        if (coords) {
            // Geo-near search within ~50km radius
            allListingsRaw = await listing
                .find({
                    geometry: {
                        $near: {
                            $geometry: { type: 'Point', coordinates: coords },
                            $maxDistance: 50_000,
                        }
                    }
                })
                .populate({ path: 'reviews', select: 'rating' })
                .lean();
        } else {
            // Textual fallback
            const query = {
                $or: [
                    { title: { $regex: q, $options: 'i' } },
                    { description: { $regex: q, $options: 'i' } },
                    { location: { $regex: q, $options: 'i' } },
                    { country: { $regex: q, $options: 'i' } },
                ]
            };
            allListingsRaw = await listing
                .find(query)
                .populate({ path: 'reviews', select: 'rating' })
                .lean();
        }
    } else {
        allListingsRaw = await listing
        .find({})
        .populate({ path: 'reviews', select: 'rating' })
        .lean();
    }

    const alllisting = allListingsRaw.map((l) => {
        const ratings = Array.isArray(l.reviews) ? l.reviews.map(r => r?.rating || 0).filter(n => typeof n === 'number') : [];
        const count = ratings.length;
        const avg = count > 0 ? (ratings.reduce((a,b)=>a+b,0) / count) : 0;
        // attach integer avg for display (1-5)
        return { ...l, _avgRating: Math.round(avg), _ratingCount: count };
    });

    res.render("listings/index.ejs",{alllisting, searchQuery: q});

    })




    
module.exports.renderNewForm=(req,res)=>{
   
        res.render("listings/new.ejs")
      
  }



module.exports.showListings = (async (req, res) => {

    let { id } = req.params;
    const Listing = await listing.findById(id)
        .populate({
            path: "reviews",
            populate: {
                path: "author",
            }
        })
        .populate("owner")
        .lean();
    if(!Listing){
        req.flash("success", "Listings you requested does not exist")
        res.redirect("/listings")
    }
    // Compute average rating for display
    const ratings = Array.isArray(Listing.reviews) ? Listing.reviews.map(r => r?.rating || 0).filter(n => typeof n === 'number') : [];
    const ratingCount = ratings.length;
    const avgRating = ratingCount > 0 ? (ratings.reduce((a,b)=>a+b,0) / ratingCount) : 0;
    const avgRatingRounded = Math.round(avgRating);

    res.render("listings/show.ejs", { Listing, avgRatingRounded, ratingCount })

})



module.exports.createListing = async (req, res, next) => {
console.log("hello")

    // Attempt geocoding only if we have a token; handle invalid/unauthorized token gracefully
    let geometryFromGeocode = null;
    try {
        if (process.env.MAP_TOKEN) {
            const response = await geocodingClient
                .forwardGeocode({ query: req.body.listing.location, limit: 1 })
                .send();
            geometryFromGeocode = response?.body?.features?.[0]?.geometry || null;
        }
    } catch (err) {
        // Common when MAPBOX token is missing/invalid: 401 Not Authorized - Invalid Token
        console.error("Geocoding failed:", err?.message || err);
        req.flash("error", "Location lookup failed. Saved listing without map location.");
    }

    const newlisting = new listing(req.body.listing);
    newlisting.owner = req.user._id;

    // Image from Cloudinary via multer can be optional
    if (req.file && req.file.path && req.file.filename) {
        newlisting.image = { url: req.file.path, filename: req.file.filename };
    }

    if (geometryFromGeocode) {
        newlisting.geometry = geometryFromGeocode;
    }

    const savedlisting = await newlisting.save();

    console.log(savedlisting)
    req.flash("success", "New Listing Created")
    res.redirect("/listings");
}








module.exports.renderEditForm=(async(req,res)=>{
    
    let{id} = req.params;
   const Listing = await listing.findById(id);
   if(!Listing){
    req.flash("success", "Listings you requested does not exist")
    res.redirect("/listings")
}

let originalImageUrl= Listing.image.url;
originalImageUrl = originalImageUrl.replace("/upload","/upload/w_250")
   res.render("listings/edit.ejs",{Listing,originalImageUrl})

})





module.exports.updateListing=(async(req,res)=>{
    let{id} = req.params;



    let Listing=await listing.findByIdAndUpdate(id,{...req.body.listing},{new:true})
    if (typeof req.file    !=="undefined"){
let url= req.file.path;
let filename = req.file.filename;
Listing.image = {url,filename}
await Listing.save();
}

    // Re-geocode if location changed or geometry is missing
    try {
        const locationFromForm = req.body?.listing?.location;
        const needsGeometry = !Listing.geometry || !Array.isArray(Listing.geometry.coordinates) || Listing.geometry.coordinates.length !== 2;
        const shouldGeocode = needsGeometry || !!locationFromForm;

        if (shouldGeocode) {
            const queryLocation = locationFromForm || Listing.location;
            if (queryLocation) {
                const response = await geocodingClient.forwardGeocode({
                query: queryLocation,
                limit: 1,
            }).send();

            if (response?.body?.features?.[0]?.geometry) {
                Listing.geometry = response.body.features[0].geometry;
                await Listing.save();
            }
            }
        }
    } catch (error) {
        // Non-fatal: continue even if geocoding fails
        console.error('Re-geocoding failed during update:', error?.message || error);
    }

    req.flash("success", "Listing Updated")
    res.redirect("/listings")
})



module.exports.destroyListing=(async (req, res) => {
    let { id } = req.params;
    let deletelist = await listing.findByIdAndDelete(id)
    console.log(deletelist)
    req.flash("success", "Listing Deleted")
    res.redirect("/listings")
})
















