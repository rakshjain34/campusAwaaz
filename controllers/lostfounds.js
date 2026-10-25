
const LostFound = require("../models/lostfound.js");
const fs = require("fs");
const path = require("path");

module.exports.index = async (req, res) => {
    const filters = {};
    const query = {};

    if (req.query.itemType) {
        filters.itemType = req.query.itemType;
        query.itemType = req.query.itemType;
    }

    if (req.query.category) {
        filters.category = req.query.category;
        query.category = req.query.category;
    }

    if (req.query.search) {
        const search = req.query.search.trim();
        query.$or = [
            { name: { $regex: search, $options: "i" } },
            { color: { $regex: search, $options: "i" } },
            { location: { $regex: search, $options: "i" } },
            { description: { $regex: search, $options: "i" } }
        ];
        filters.search = search;
    }

    query.status = "Active";

    const items = await LostFound.find(query)
        .populate("createdBy", "name branch accountType")
        .sort({ createdAt: -1 });

    res.render("lostfound/index.ejs", {
        items,
        filters,
        mine: false
    });
};

module.exports.mine = async (req, res) => {
    const items = await LostFound.find({ createdBy: req.user._id })
        .populate("createdBy", "name branch accountType")
        .sort({ createdAt: -1 });

    res.render("lostfound/index.ejs", {
        items,
        filters: {},
        mine: true
    });
};

module.exports.renderNewForm = (req, res) => {
    res.render("lostfound/new.ejs");
};

module.exports.create = async (req, res) => {
    const data = req.body.lostfound || {};

    const item = new LostFound({
        name: data.name,
        itemType: data.itemType,
        category: data.category,
        color: data.color,
        description: data.description,
        specifications: data.specifications,
        location: data.location,
        date: data.date,
        image: req.file ? "/uploads/lostfound/" + req.file.filename : "",
        createdBy: req.user._id
    });

    await item.save();

    const oppositeType = item.itemType === "Lost" ? "Found" : "Lost";

    const matches = await LostFound.find({
        _id: { $ne: item._id },
        itemType: oppositeType,
        category: item.category,
        color: { $regex: "^" + item.color.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "$", $options: "i" },
        status: "Active"
    });

    if (matches.length) {
        req.flash("success", "Report submitted. Possible matching items were found.");
    } else {
        req.flash("success", "Lost & Found report submitted successfully.");
    }

    res.redirect(`/lostfound/${item._id}`);
};

module.exports.show = async (req, res) => {
    const item = await LostFound.findById(req.params.id)
        .populate("createdBy", "name branch accountType");

    if (!item) {
        req.flash("error", "Item not found.");
        return res.redirect("/lostfound");
    }

    const oppositeType = item.itemType === "Lost" ? "Found" : "Lost";

    const matches = await LostFound.find({
        _id: { $ne: item._id },
        itemType: oppositeType,
        category: item.category,
        status: "Active"
    })
        .populate("createdBy", "name branch accountType")
        .sort({ createdAt: -1 })
        .limit(5);

    res.render("lostfound/show.ejs", { item, matches });
};

module.exports.renderEditForm = async (req, res) => {
    res.render("lostfound/edit.ejs", {
        item: res.locals.item
    });
};

module.exports.update = async (req, res) => {
    const item = res.locals.item;
    const data = req.body.lostfound || {};

    item.name = data.name;
    item.itemType = data.itemType;
    item.category = data.category;
    item.color = data.color;
    item.description = data.description;
    item.specifications = data.specifications;
    item.location = data.location;
    item.date = data.date;
    item.status = data.status;

    if (req.file) {
        if (item.image) {
            const oldPath = path.join(__dirname, "..", "public", item.image);
            if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
        }

        item.image = "/uploads/lostfound/" + req.file.filename;
    }

    await item.save();

    req.flash("success", "Report updated successfully.");
    res.redirect(`/lostfound/${item._id}`);
};

module.exports.resolve = async (req, res) => {
    const item = res.locals.item;
    item.status = "Resolved";

    await item.save();

    req.flash("success", "Item marked as resolved.");
    res.redirect(`/lostfound/${item._id}`);
};

module.exports.delete = async (req, res) => {
    const item = res.locals.item;

    if (item.image) {
        const imagePath = path.join(__dirname, "..", "public", item.image);
        if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
    }

    await item.deleteOne();

    req.flash("success", "Report deleted successfully.");
    res.redirect("/lostfound");
};
