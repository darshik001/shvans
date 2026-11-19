const { DeleteImage } = require("../../helper/helper")
const { CustomeError } = require("../../middleware/globelError")
const bannerModel = require("../../model/banner.model")


exports.AddBanner = async (req, res, next) => {
    try {
        console.log("running")
        const { title, description, imageTitle, imageDescription, status } = req.body || {}


        if (!req.file) {
            return next(CustomeError(422, "Banner Image Is Required"))

        }
        if (!title) {
            return next(CustomeError(422, "Title Is Required"))
        }

        if (!description) {
            return next(CustomeError(422, "Description Is Required"))
        }

        if (!imageTitle) {
            return next(CustomeError(422, "ImageTitle Is Required"))
        }

        if (!imageDescription) {
            return next(CustomeError(422, "imageDescription Is Required"))
        }


        let bannerImage = ''
        if (req.file) {
            bannerImage = `/uploads/${req.file.fieldname}/${req.file.filename}`
        }

        const data = {
            ...req.body,
            bannerImage
        }

        const banner = await bannerModel.create(data)
        const banners = await bannerModel.find()
        const updatedBanners = banners.map((item) => ({
            ...item.toObject(),
            bannerImage: `${process.env.BACKEND_DOMIN_URL}${item.bannerImage}`,
        }));
        return res.status(200).json({ success: true, message: "Add New Banner", banners: updatedBanners })



    } catch (error) {
        return next(error)
    }
}


exports.GetBanner = async (req, res, next) => {
    try {
        const banners = await bannerModel.find()
        const updatedBanners = banners.map((item) => ({
            ...item.toObject(),
            bannerImage: `${process.env.BACKEND_DOMIN_URL}${item.bannerImage}`,
        }));

        return res.status(200).json({ success: true, message: "Get All Banners", banners: updatedBanners })
    } catch (error) {
        return next(error)
    }
}

exports.UpdateBanner = async (req, res, next) => {
    try {
        const { title, description, imageTitle, imageDescription, status } = req.body || {}

        const bannerId = req.params.id
        const banner = await bannerModel.findById(bannerId)
        if (!banner) {
            return next(CustomeError(404, "Banner Not Found"))
        }

        let bannerImage = banner.bannerImage
        if (req.file) {
            if (bannerImage !== "") {
                DeleteImage(bannerImage)
            }
            bannerImage = `/uploads/${req.file.fieldname}/${req.file.filename}`
        }

        const data = {
            title,
            description,
            imageTitle,
            imageDescription,
            status,
            bannerImage
        }

        await bannerModel.findByIdAndUpdate(bannerId, data)

        const banners = await bannerModel.find()
        const updatedBanners = banners.map((item) => ({
            ...item.toObject(),
            bannerImage: `${process.env.BACKEND_DOMIN_URL}${item.bannerImage}`,
        }));


        return res.status(200).json({ success: true, message: "Update Banner", banners: updatedBanners })

    } catch (error) {
        return next(error)
    }
}



exports.DeleteBanner = async (req, res, next) => {
    try {


        const bannerId = req.params.id
        const banner = await bannerModel.findById(bannerId)


        let bannerImage = banner.bannerImage

        if (bannerImage !== "") {
            DeleteImage(bannerImage)
        }



        await bannerModel.findByIdAndDelete(bannerId)

        const banners = await bannerModel.find()
        const updatedBanners = banners.map((item) => ({
            ...item.toObject(),
            bannerImage: `${process.env.BACKEND_DOMIN_URL}${item.bannerImage}`,
        }));


        return res.status(200).json({ success: true, message: "Delete Banner", banners: updatedBanners })

    } catch (error) {
        return next(error)
    }
}
