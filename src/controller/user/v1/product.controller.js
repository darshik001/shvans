const productModel = require("../../../model/product.model");
const categoryModel = require('../../../model/category.model')


exports.UserGetProduct = async (req, res, next) => {
    try {
        const products = await productModel.aggregate([
            { $match: { status: "active", } },
            {
                $lookup: {
                    from: 'categories',
                    localField: 'categoryId',
                    foreignField: '_id',
                    as: 'categoryData'
                }
            },
            {
                $addFields: {
                    category: { $arrayElemAt: ['$categoryData.name', 0] },
                    productImages: {
                        $map: {
                            input: { $ifNull: ['$productImages', []] },
                            as: 'image',
                            in: {
                                $cond: [
                                    { $ne: ['$$image', ''] },
                                    { $concat: [process.env.BACKEND_DOMIN_URL, '$$image'] },
                                    ''
                                ]
                            }
                        }
                    }
                }
            },
            {
                $project: {
                    categoryData: 0
                }
            }
        ]);

        return res.status(200).json({ success: true, message: 'Get Products Successfully', products });
    } catch (error) {
        return next(error)
    }
}


exports.UserGetCategories = async (req, res, next) => {
    try {
        const category = await categoryModel.aggregate([
            { $match: { status: 'active' } },
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
            },
            {
                $project:{
                    status:0,
                    createdAt:0,
                    updatedAt:0
                }
            }
        ]);


        return res.status(200).json({ success: true, message: 'Get Categories', category })
    } catch (error) {
        return next(error)
    }
}