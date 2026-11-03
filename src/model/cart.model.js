const mongoose = require('mongoose')

const CartSchema = mongoose.Schema({
    userId: {
        type: String,
        trim: true,
        default: null
    },
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'products'
    },
    variantId: {
        type: String,
        required: true
    },
    quantity: {
        type: Number,
        default: 1
    }

},
    {
        versionKey: false,
        timestamps: true
    }
)


module.exports = mongoose.model('carts', CartSchema)