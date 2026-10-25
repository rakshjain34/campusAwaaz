// const Listing = require("./models/listing");
// const Review = require("./models/review");
// const { reviewSchema, listingSchema } = require("./schema.js");
const ExpressError = require("./utils/ExpressError");
module.exports.isLoggedIn = (req,res, next)=>{
    if(!req.isAuthenticated()){
        req.session.redirectUrl = req.originalUrl;
        req.flash("error", "You must be logged in before adding a new listing");
        return res.redirect("/user/login");
    }
    next();   
}
module.exports.isShopkeeper = (req, res, next) => {
    if (req.user && req.user.accountType === "Shopkeeper") {
        return next();
    }

    req.flash("error", "Only shopkeepers can perform this action.");
    return res.redirect("/services");
};

module.exports.saveRedirectUrl = (req,res,next)=>{
    if(req.session.redirectUrl){
        res.locals.redirectUrl = req.session.redirectUrl;
    }
    next();
}

// module.exports.isOwner = async(req,res,next)=>{
//     let {id} = req.params;
//         let listing = await Listing.findById(id);
//         if(!listing.owner._id.equals(req.user._id)){
//             req.flash("error", "You are not the owner!");
//             res.redirect(`/listings/${id}`);
//         }
//         next();
// }
// module.exports.isAuthor = async(req,res,next)=>{
//     let {id, reviewId} = req.params;
//     let review = await Review.findById(reviewId);
//     if(!res.locals.currUser._id.equals(review.author._id)){
//         req.flash("error", "You are not the author!");
//         return res.redirect(`/listings/${id}`);
//     }
//     next();
// }
// module.exports.validateListing = (req,res,next) => {
// let {error} = listingSchema.validate(req.body);
//     if(error){
//         let errMssg = error.details.map((e)=> e.message).join(",")
//         throw new ExpressError(400,errMssg);
//     } else {
//         next();
//     }
// }

// module.exports.validateReview = (req,res,next) => {
// let {error} = reviewSchema.validate(req.body);
//     if(error){
//         let errMssg = error.details.map((e)=> e.message).join(",")
//         req.flash("error", errMssg);
//         return res.redirect(`/listings/${req.params.id}`);
//     } 
//         next();
    
// }
