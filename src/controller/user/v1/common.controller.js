const announcementsModel = require("../../../model/announcements.model");
const bannerModel = require("../../../model/banner.model");


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

        console.log(updatedBanners)

        return res.status(200).json({ success: true, message: "get announcement", banners: updatedBanners })

    } catch (error) {
        return next(error)
    }
}