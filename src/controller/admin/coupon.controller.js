const { CustomeError } = require('../../middleware/globelError')
const couponModel = require('../../model/coupon.model')

exports.AddCoupon = async (req, res, next) => {
    try {
        const { couponCode, summary, description, value, value_type, limit, stauts, cart_value } = req.body || {}

        if (!couponCode) {
            return next(CustomeError(422, 'couponCode is Rrequired'))
        }

        if (!summary) {
            return next(CustomeError(422, 'summary is Rrequired'))
        }

        if (!description) {
            return next(CustomeError(422, 'description is Rrequired'))
        }

        if (!value) {
            return next(CustomeError(422, 'value is Rrequired'))
        }

        if (!value_type) {
            return next(CustomeError(422, 'value_type is Rrequired'))
        }

        const coupon = await couponModel.create({ ...req.body })

        return res.status(200).json({ success: true, message: "New Coupon Add Successfully", coupon })
    } catch (error) {
        return next(error)
    }
}

exports.GetCoupons = async (req, res, next) => {
    try {
        const coupons = await couponModel.find().select("-createdAt -updatedAt")

        return res.status(200).json({ success: true, message: "Coupon Get Successfully", coupons })

    } catch (error) {
        return next(error)
    }
}

exports.UpdateCoupon = async (req, res, next) => {
    try {
        const { summary, description, value, value_type, limit, status, cart_value } = req.body || {}

        const id = req.params.id
        const updatedata = {
            summary,
            description,
            value,
            value_type,
            cart_value,
            limit,
            status
        }


        console.log(updatedata)

        const coupon = await couponModel.findByIdAndUpdate(id, updatedata, { returnDocument: 'after' }).select("-createdAt -updatedAt")
        return res.status(200).json({ success: true, message: "Coupon Update Successfully", coupon })

    } catch (error) {
        return next(error)
    }
}


exports.DeleteCoupon = async (req, res, next) => {
    try {
        const id = req.params.id

        const coupon = await couponModel.findByIdAndDelete(id).select("-createdAt -updatedAt")
        return res.status(200).json({ success: true, message: "Coupon Delete Successfully", coupon })

    } catch (error) {
        return next(error)
    }
}