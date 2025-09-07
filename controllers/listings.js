const listing = require("../models/listing.js")
const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const mapToken = process.env.MAP_TOKEN;
const geocodingClient = mbxGeocoding({ accessToken: mapToken });

const {listingSchema} = require('../schema.js')






module.exports.index =  (async(req,res)=>{

    

    const alllisting = await listing.find({});
    res.render("listings/index.ejs",{alllisting});

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
    res.render("listings/show.ejs", { Listing })

})



module.exports.createListing = async (req, res, next) => {
console.log("hello")

    let response = await geocodingClient.forwardGeocode({
        query: req.body.listing.location,
        limit: 1,
    })
        .send();

    let url = req.file.path;
    let filename = req.file.filename;
    const newlisting = new listing(req.body.listing);
    newlisting.owner = req.user._id;
    newlisting.image = { url, filename };

    newlisting.geometry = response.body.features[0].geometry;

    let savedlisting=await newlisting.save();

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
















