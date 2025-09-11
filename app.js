

if(process.env.NODE_ENV !="production")
    {require('dotenv').config()
}


const express = require("express");
const app = express();
const mongoose = require("mongoose");
const listing = require("./models/listing.js")
const path = require("path");
const methodOverride = require('method-override');
const ejsMate= require("ejs-mate");
const wrapasync = require("./utils/wrapasync.js");
const ExpressError = require("./utils/expresserr.js")
const session = require("express-session")
const MongoStore = require(`connect-mongo`);
const flash = require("connect-flash")
const { listingSchema,reviewSchema}= require("./schema.js")
const Review = require("./models/review.js");
const reviewRouter= require("./router/review.js");
const passport = require ("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user.js")
const userRouter=require("./router/user.js")
const listingRouter = require("./router/listing.js")

// const mongo_url="mongodb://127.0.0.1:27017/wanderlust";

const dbUrl = process.env.ATLASDB_URL;
if (!dbUrl) {
    console.error("ATLASDB_URL not set. Check your .env or environment variables.");
    process.exit(1);
}

app.set("view engine","ejs");
app.set("views",path.join(__dirname,"views"));
app.use(express.urlencoded({extended:true}));
app.use(methodOverride("_method"));
app.engine("ejs",ejsMate);
app.use(express.static(path.join(__dirname, "/public")));


const store = MongoStore.create({

mongoUrl : dbUrl,
crypto:{


    secret : process.env.SECRET,

},


touchAfter : 24*3600,


})


store.on("error",(err)=>{

    console.log("ERROR in MONGO SESSION STORE",err);
})

const sessionOptions={
store,
secret : process.env.SECRET,
resave : false,
saveUninitialized : true,
cookies:{

    expires: Date.now()+7*24*60*60*1000,
    maxage: 7*24*60*1000,
    httpOnly:true

}


}

// app.get("/",(req,res)=>{
//     res.send("hey,server is working")
// })

// Redirect root to listings
app.get("/", (req, res) => {
    res.redirect("/listings");
});







main()
.then(()=>{

    console.log("connected to db");
})

.catch((err)=>{
    console.log(err);
});




async function main(){
    await mongoose.connect(dbUrl);
}

app.listen(8080,()=>{
    console.log("server is listening at 8080")
});

app.use(session(sessionOptions));
app.use(flash())

app.use (passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy (User.authenticate()))
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());



app.use((req, res, next) => {
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.currUser = req.user;
    next()
})


    




app.use("/listings",listingRouter);
app.use("/listings/:id/reviews",reviewRouter)

app.use("/",userRouter);




 
 

 





app.all("*",(req,res,next)=>{

    next (new ExpressError(404,"page not found!"));
})



app.use((err, req, res, next)=>{
    let{statuscode = 500,message = "something went wrong"} = err;
   res.status(statuscode).send(message);
})



