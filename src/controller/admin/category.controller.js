const { DeleteImage } = require("../../helper/helper")
const { CustomeError } = require("../../middleware/globelError")
const categoryModel = require('../../model/category.model')

exports.AddCCategory = async (req, res, next) => {
    try {

        const { name, description } = req.body || {}


        if (!name) {
            return next(CustomeError(422, " Category Name is Required"))
        }
        let categoryImage = ''
        if (req.file) {
            categoryImage = `/uploads/${req.file.fieldname}/${req.file.filename}`
        }

        const category = await categoryModel.create({ name, description, categoryImage })


        category.categoryImage = category.categoryImage ? `${process.env.BACKEND_DOMIN_URL}${category.categoryImage}` : '';

        return res.status(200).json({ success: true, message: "Category Add Successfully", category })

    } catch (error) {
        return next(error)
    }
}


exports.GetCategory = async (req, res, next) => {
    try {
        const category = await categoryModel.aggregate([
            {
                $addFields: {
                    categoryImage: {
                        $cond: [
                            { $ne: ['$categoryImage', ''] },
                            { $concat: [process.env.BACKEND_DOMIN_URL, '$categoryImage'] },
                            ''
                        ]
                    }
                }
            }
        ]);


        return res.status(200).json({ success: true, message: 'Get Categories', categories: category })


    } catch (error) {
        return next(error)
    }
}


exports.UpdateCategory = async (req, res, next) => {
    try {
        const { categoryId, name, description, status } = req.body || {}
        if (!categoryId) {
            return next(CustomeError(422, "Category Id Is Required"))
        }
        let category = await categoryModel.findById(categoryId)

        if (!category) {
            return next(CustomeError(404, 'Category Not Found'))
        }

        let categoryImage = category.categoryImage

        if (req.file) {
            if (categoryImage !== '') {
                DeleteImage(categoryImage)
            }
            categoryImage = `/uploads/${req.file.fieldname}/${req.file.filename}`
        }


        category = await categoryModel.findByIdAndUpdate(category._id, { name, description, categoryImage, status }, { returnDocument: 'after' })
        category.categoryImage = category.categoryImage ? `${process.env.BACKEND_DOMIN_URL}${category.categoryImage}` : '';
        
        return res.status(200).json({ success: true, message: "Category Update Successfully", category })
    } catch (error) {
        return next(error)
    }
}