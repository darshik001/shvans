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
        console.log(status)
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
        let parsedVariants = variants
            ? (typeof variants === 'string' ? JSON.parse(variants) : variants)
            : product.variants;

        if (Array.isArray(parsedVariants)) {
            const usedExistingIds = new Set();
            parsedVariants = parsedVariants.map((v, index) => {
                const variantObj = {
                    price: Number(v.price),
                    stock: Number(v.stock ?? 0),
                    unit: v.unit
                };

                // 1. If incoming variant already has an _id matching an existing variant in DB, preserve it
                if (v._id) {
                    const matchedExisting = (product.variants || []).find(
                        ev => ev._id.toString() === v._id.toString()
                    );
                    if (matchedExisting) {
                        variantObj._id = matchedExisting._id;
                        usedExistingIds.add(matchedExisting._id.toString());
                        return variantObj;
                    }
                }

                // 2. If no _id or not matched yet, match by unit with an unused existing variant
                const matchByUnit = (product.variants || []).find(
                    ev => ev.unit === v.unit && !usedExistingIds.has(ev._id.toString())
                );
                if (matchByUnit) {
                    variantObj._id = matchByUnit._id;
                    usedExistingIds.add(matchByUnit._id.toString());
                    return variantObj;
                }

                // 3. Fallback: match by index with an unused existing variant
                const matchByIndex = (product.variants || [])[index];
                if (matchByIndex && !usedExistingIds.has(matchByIndex._id.toString())) {
                    variantObj._id = matchByIndex._id;
                    usedExistingIds.add(matchByIndex._id.toString());
                    return variantObj;
                }

                // If newly added variant, leave _id undefined so Mongoose generates a new one
                return variantObj;
            });
        }

        const prodcutData = {
            categoryId,
            name,
            description: description || product.description,
            additionalInfo: additionalInfo || product.additionalInfo,
            productImages: images || product.productImages,
            variants: parsedVariants || product.variants,
            packing: packing ? (typeof packing === 'string' ? JSON.parse(packing) : packing) : product.packing,
            status: status || product.status
        }
        console.log(prodcutData)

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