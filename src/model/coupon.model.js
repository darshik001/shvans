const mongoose = require('mongoose')

const CouponSchema = mongoose.Schema({
    couponCode: {
        type: String,
        minLangth: 6,
        unique: true,
        uppercase: true,
        require: true
    },
    summary: {
        type: String,
        trim: true,
        require: true
    },
    description: {
        type: String,
        trim: true,
        required: true
    },
    value: {
        type: Number,
        required: true
    },
    value_type: {
        type: String,
        enum: ["fixed_amount", "percentage"]
    },
    cart_value: {
        type: Number,
        default: null
    },
    limit: {
        type: Number,
        default: null
    },
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: "active"
    },

},
    {
        versionKey: false,
        timestamps: true
    }
)


module.exports = mongoose.model('coupons', CouponSchema)