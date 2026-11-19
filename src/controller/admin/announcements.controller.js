const { CustomeError } = require("../../middleware/globelError")
const announcementsModel = require("../../model/announcements.model")


exports.AddAnnouncements = async (req, res, next) => {
    try {
        const { title, status } = req.body || {}

        if (!title) {
            return next(CustomeError(422, "Title Is Required"))
        }

        const announc = await announcementsModel.create({ title, status })
        const announcements = await announcementsModel.find()

        return res.status(200).json({ success: true, message: "Add New Announcements", announcements })

    } catch (error) {
        return next(error)
    }
}


exports.GetAnnouncements = async (req, res, next) => {
    try {
        const announcements = await announcementsModel.find()

        return res.status(200).json({ success: true, message: "Get Announcements", announcements })
    } catch (error) {
        return next(error)

    }
}

exports.UpdateAnnouncements = async (req, res, next) => {
    try {
        const { title, status } = req.body || {}
        const announcId = req.params.id

        await announcementsModel.findByIdAndUpdate(announcId, { title, status })
        const announcements = await announcementsModel.find()

        return res.status(200).json({ success: true, message: "Update Announcements", announcements })

    } catch (error) {
        return next(error)
    }
}


exports.DeleteAnnouncements = async (req, res, next) => {
    try {
        const announcId = req.params.id
        await announcementsModel.findByIdAndDelete(announcId)
        const announcements = await announcementsModel.find()

        return res.status(200).json({ success: true, message: "Delete Announcements", announcements })

    } catch (error) {
        return next(error)
    }
}