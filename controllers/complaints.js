const Complaint = require("../models/complaint.js");

const canSee = (complaint, user) =>
    complaint.visibility === "Public" ||
    user?.accountType === "Staff" ||
    complaint.createdBy?._id?.toString() === user?._id?.toString() ||
    complaint.createdBy?.toString() === user?._id?.toString();

module.exports.index = async (req, res) => {
    const filter = req.user.accountType === "Staff"
        ? { status: { $ne: "Done" } }
        : {
            status: { $ne: "Done" },
            $or: [
                { visibility: "Public" },
                { createdBy: req.user._id }
            ]
        };

    if (req.query.category) filter.category = req.query.category;
    if (req.query.subcategory) filter.subcategory = req.query.subcategory;

    if (req.user.accountType === "Staff" && req.query.urgency) {
        filter.urgency = req.query.urgency;
    }

    const complaints = await Complaint.find(filter)
        .populate("createdBy", "name accountType")
        .sort({ createdAt: -1 });

    const trending = (await Complaint.find({
        visibility: "Public",
        status: { $ne: "Done" }
    }))
        .sort((a, b) =>
            b.upvotes.length - a.upvotes.length ||
            b.createdAt - a.createdAt
        )
        .slice(0, 5);

    res.render("complaints/index.ejs", {
        complaints,
        trending,
        currUser: req.user,
        filters: req.query
    });
};

module.exports.mine = async (req, res) => {
    const complaints = await Complaint.find({ createdBy: req.user._id })
        .sort({ createdAt: -1 });

    res.render("complaints/mine.ejs", {
        complaints,
        currUser: req.user
    });
};

module.exports.renderNewForm = (req, res) => {
    res.render("complaints/new.ejs");
};

module.exports.create = async (req, res) => {
    if (req.user.accountType !== "Student") {
        req.flash("error", "Only students can submit complaints.");
        return res.redirect("/complaints");
    }

    const data = req.body.complaint || {};
    const complaint = new Complaint({
        title: data.title,
        description: data.description,
        category: data.category,
        subcategory: data.subcategory,
        urgency: data.urgency,
        visibility: data.visibility,
        createdBy: req.user._id
    });

    await complaint.save();
    req.flash("success", "Your complaint has been submitted.");
    res.redirect(`/complaints/${complaint._id}`);
};

module.exports.show = async (req, res) => {
    const complaint = await Complaint.findById(req.params.id)
        .populate("createdBy", "name accountType")
        .populate("updates.postedBy", "name designation");

    if (!complaint) {
        req.flash("error", "Complaint not found.");
        return res.redirect("/complaints");
    }

    if (!canSee(complaint, req.user)) {
        req.flash("error", "You do not have permission to view this private complaint.");
        return res.redirect("/complaints");
    }

    res.render("complaints/show.ejs", {
        complaint,
        currUser: req.user
    });
};

module.exports.renderEditForm = async (req, res) => {
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
        req.flash("error", "Complaint not found.");
        return res.redirect("/complaints");
    }

    res.render("complaints/edit.ejs", { complaint });
};

module.exports.updateStatus = async (req, res) => {
    const allowedStatuses = ["Unseen", "Seen", "In Process", "Done"];

    if (!allowedStatuses.includes(req.body.status)) {
        req.flash("error", "Choose a valid complaint status.");
        return res.redirect(`/complaints/${req.params.id}`);
    }

    const complaint = await Complaint.findByIdAndUpdate(
        req.params.id,
        { status: req.body.status },
        { runValidators: true }
    );

    if (!complaint) {
        req.flash("error", "Complaint not found.");
        return res.redirect("/complaints");
    }

    req.flash("success", "Complaint status updated.");

    if (req.body.status === "Done") {
        return res.redirect("/complaints");
    }

    res.redirect(`/complaints/${complaint._id}`);
};

module.exports.addUpdate = async (req, res) => {
    const text = (req.body.text || "").trim();
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
        req.flash("error", "Complaint not found.");
        return res.redirect("/complaints");
    }

    if (!text || text.length > 1000) {
        req.flash("error", "Update must be between 1 and 1000 characters.");
        return res.redirect(`/complaints/${complaint._id}`);
    }

    complaint.updates.push({
        text,
        postedBy: req.user._id
    });

    await complaint.save();
    req.flash("success", "Update posted.");
    res.redirect(`/complaints/${complaint._id}`);
};

module.exports.upvote = async (req, res) => {
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint || complaint.visibility !== "Public") {
        req.flash("error", "That public complaint could not be found.");
        return res.redirect("/complaints");
    }

    if (req.user.accountType !== "Student") {
        req.flash("error", "Only students can upvote complaints.");
        return res.redirect(`/complaints/${complaint._id}`);
    }

    const alreadyVoted = complaint.upvotes.some(
        id => id.toString() === req.user._id.toString()
    );

    if (!alreadyVoted) {
        complaint.upvotes.push(req.user._id);
        await complaint.save();
    }

    res.redirect(req.get("Referrer") || `/complaints/${complaint._id}`);
};

module.exports.delete = async (req, res) => {
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
        req.flash("error", "Complaint not found.");
        return res.redirect("/complaints");
    }

    await complaint.deleteOne();
    req.flash("success", "Complaint deleted.");
    res.redirect("/complaints");
};