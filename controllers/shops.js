
const Shop = require("../models/shop.js");

module.exports.renderNewForm = (req, res) => {
    res.render("pages/newShop.ejs");
};

module.exports.createShop = async (req, res) => {
    const newShop = new Shop({
        shopkeeper: req.user._id,
        shopName: req.body.shopName,
        location: req.body.location,
        timings: req.body.timings,
        description: req.body.description
    });

    await newShop.save();

    req.flash("success", "Shop details added successfully!");
    res.redirect("/services");
};

module.exports.index = async (req, res) => {
    const shops = await Shop.find({});
    res.render("pages/services.ejs", { shops });
};


module.exports.updateStatus = async (req, res) => {
    const { isOpen } = req.body;

    const updatedShop = await Shop.findOneAndUpdate(
        { _id: req.params.id, shopkeeper: req.user._id },
        { isOpen: isOpen === "true" }
    );

    if (!updatedShop) {
        req.flash("error", "Shop not found or you are not allowed to update it.");
        return res.redirect("/services");
    }

    req.flash("success", "Shop status updated successfully!");
    res.redirect("/services");
};

