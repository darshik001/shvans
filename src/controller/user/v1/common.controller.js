const announcementsModel = require("../../../model/announcements.model")


exports.GetAnnounc = async (req, res, next) => {
    try {
        const announcements = await announcementsModel.find({ status: 'active' })
        const titles = announcements.map((item) => item.title);
        return res.status(200).json({ success: true, message: "get announcement", announcements: titles })
    } catch (error) {
        return next(error)

    }
}