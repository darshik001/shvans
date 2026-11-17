const { CustomeError } = require("../../../middleware/globelError")
const orderModel = require("../../../model/order.model")
const productModel = require("../../../model/product.model")
const reviewModel = require("../../../model/review.model")

exports.GetReviews = async (req, res, next) => {
    try {
        const userId = req.user._id
        const reviews = await reviewModel.find({ userId })
        return res.status(200).json({ success: true, message: "get all revires", reviews })
    } catch (error) {
        return next(error)
    }
}

exports.CreateReview = async (req, res, next) => {
    try {

        const userId = req.user._id
        const { orderId, productId, rating, comment } = req.body || {}

        const order = await orderModel.findById(orderId)

        if (!order) {
            return next(CustomeError(422, 'Order Not Found'))
        }

        if (order.status !== "delivered") {
            return next(CustomeError(400, 'You have not reviewed this product at this time'))
        }

        if (!productId) {
            return next(CustomeError(422, 'Product productId Is Required'))
        }

        if (!rating) {
            return next(CustomeError(422, 'Rating Is Required'))
        }

        if (!comment) {
            return next(CustomeError(422, 'Comment Is Required'))
        }

        const product = await productModel.findById(productId)

        if (!product) {
            return next(CustomeError(400, 'Product Not Found'))

        }
        const alreadyreview = await reviewModel.findOne({ userId, productId: product._id })

        if (alreadyreview) {
            await reviewModel.findByIdAndUpdate(alreadyreview._id, { rating, comment })
            const reviews = await reviewModel.find({ userId: userId })

            return res.status(200).json({ success: true, message: "submitted a review for this product", reviews })
        }

        const review = await reviewModel.create({ userId, orderId, productId, rating, comment })

        const reviews = await reviewModel.find({ userId: userId })

        return res.status(200).json({ success: true, message: "submitted a review for this product", reviews })

    } catch (error) {
        return next(error)
    }
}


exports.GetProductRevires = async (req, res, next) => {
    try {
        const productId = req.params.id

        const reviews = await reviewModel.find({ productId: productId }).populate("userId")
        return res.status(200).json({ success: true, message: "get review", reviews })
    } catch (error) {
        return next(error)
    }
}