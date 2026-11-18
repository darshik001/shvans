const { CustomeError } = require("../../../middleware/globelError");
const announcementsModel = require("../../../model/announcements.model");
const bannerModel = require("../../../model/banner.model");
const inquiryModel = require("../../../model/inquiry.model");


exports.GetAnnounc = async (req, res, next) => {
    try {
        const announcements = await announcementsModel.find({ status: 'active' })
        const titles = announcements.map((item) => item.title);
        return res.status(200).json({ success: true, message: "get announcement", announcements: titles })
    } catch (error) {
        return next(error)

    }
}

exports.GetUserBanner = async (req, res, next) => {
    try {
        const banners = await bannerModel.find({ status: "active" })
        const updatedBanners = banners.map((banner) => ({
            ...banner._doc,
            bannerImage: `${process.env.BACKEND_DOMIN_URL}${banner.bannerImage}`,
        }));


        return res.status(200).json({ success: true, message: "get announcement", banners: updatedBanners })

    } catch (error) {
        return next(error)
    }
}


exports.NewInquiry = async (req, res, next) => {
    try {

        const { email, name, phone, subject, message } = req.body || {}
        if (!email) {
            return next(CustomeError(422, "Email Is Required"))
        }

        if (!name) {
            return next(CustomeError(422, "Name Is Required"))
        }

        if (!phone) {
            return next(CustomeError(422, "Phone Is Required"))
        }

        if (!subject) {
            return next(CustomeError(422, "Subject Is Required"))
        }
        if (!message) {
            return next(CustomeError(422, "Message Is Required"))
        }

        await inquiryModel.create({ name, email, phone, subject, message })

        return res.status(200).json({ success: true, message: "Your inquiry has been sent to our team successfully" })

    } catch (error) {
        return next(error)
    }
}