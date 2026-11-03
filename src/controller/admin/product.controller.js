const { GenerateSKU, DeleteImage } = require('../../helper/helper')
const { CustomeError } = require('../../middleware/globelError')
const categoryModel = require('../../model/category.model')
const productModel = require('../../model/product.model')


exports.AddProduct = async (req, res, next) => {
    try {
        const { categoryId, name, description, additionalInfo, packing, variants } = req.body || {}
        console.log("Variants:", req.body.variants);
        console.log("Packing:", req.body.packing);
        if (!categoryId) {
            return next(CustomeError(422, "Category Id Is Required"))
        }
        const category = await categoryModel.findById(categoryId)


        if (!category) {
            return next(CustomeError(400, "Invalid Category Id"))
        }

        if (!name) {
            return next(CustomeError(422, "Product Name Is Required"))
        }

        if (!packing) {
            return next(CustomeError(422, "Paking Inforomation Is Required"))
        }
        const images = []
        if (req.files) {
            req.files.map(file => {
                const path = `/uploads/${file.fieldname}/${file.filename}`
                images.push(path)
            })
        }

        const prodcutData = {
            categoryId,
            name,
            sku: GenerateSKU(),
            description: description || '',
            additionalInfo: additionalInfo || '',
            productImages: images,
            variants: JSON.parse(variants || '[]'),
            packing: JSON.parse(packing || '{}')
        }
        let product = await productModel.create(prodcutData)
        product = product.toObject();

        product.productImages = product.productImages.map(
            image => image ? `${process.env.BACKEND_DOMIN_URL}${image}` : ''
        );


        product.category = category.name;
        return res.status(200).json({ success: true, message: 'Product Add Successfully', product })

    } catch (error) {
        return next(error)
    }
}


exports.GetProduct = async (req, res, next) => {
    try {
        const products = await productModel.aggregate([
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

        return res.status(200).json({
            success: true,
            message: 'Get Products Successfully',
            products
        });
    } catch (error) {
        return next(error);
    }
};


exports.UpdateProduct = async (req, res, next) => {
    try {

        let { deleteImages, categoryId, name, description, additionalInfo, packing, variants, status } = req.body || {}
        const productId = req.params.id

        let product = await productModel.findById(productId)

        if (!product) {
            return next(CustomeError(404, 'Product Not Found'))
        }

        if (!categoryId) {
            return next(CustomeError(422, "Category Id Is Required"))
        }
        const category = await categoryModel.findById(categoryId)


        if (!category) {
            return next(CustomeError(400, "Invalid Category Id"))
        }

        if (!name) {
            return next(CustomeError(422, "Product Name Is Required"))
        }

        deleteImages = typeof deleteImages == "string" ? JSON.parse(deleteImages) : deleteImages

        if (Array.isArray(deleteImages) && deleteImages.length > 0) {
            const deletedPaths = deleteImages.map((imagePath) => DeleteImage(imagePath)).filter(Boolean);
            console.log(deletedPaths)
            if (deletedPaths.length > 0) {
                product = await productModel.findByIdAndUpdate(req.params.id, { $pull: { productImages: { $in: deletedPaths } } }, { returnDocument: 'after' });
            }
        }
        let images = product.productImages
        if (req.files) {
            req.files.map(file => {
                const path = `/uploads/${file.fieldname}/${file.filename}`
                images.push(path)
            })
        }
        const prodcutData = {
            categoryId,
            name,
            description: description || product.description,
            additionalInfo: additionalInfo || product.additionalInfo,
            productImages: images || product.productImages,
            variants: variants ? JSON.parse(variants) : product.variants,
            packing: packing ? JSON.parse(packing) : product.packing,
            status: status || product.status
        }


        product = await productModel.findByIdAndUpdate(productId, prodcutData, { returnDocument: 'after' })
        product = product.toObject();
        product.category = category.name;

        product.productImages = product.productImages.map(image => image ? `${process.env.BACKEND_DOMIN_URL}${image}` : '');

        res.status(200).json({ success: true, message: "Product Update Successfully", product })
    } catch (error) {
        return next(error)
    }
}


exports.DeleteProduct = async (req, res, next) => {
    try {
        const productId = req.params.id

        const product = await productModel.findByIdAndDelete(productId)

        if (!product) {
            return next(CustomeError(404, "Product Not Found"))
        }

        product.productImages.map(image => DeleteImage(image))


        return res.status(200).json({ success: true, message: "Product Delete Successfully", productId: product._id })
    } catch (error) {
        return next(error)
    }
}