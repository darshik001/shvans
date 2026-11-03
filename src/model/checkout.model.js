const mongoose = require('mongoose')



const CheckOutSchema = mongoose.Schema({
    order_id: {
        type: String,
        trim: true,
        required: true
    },
    line_items: {
        type: [mongoose.Schema.Types.Mixed],
        required: true
    },
    line_items_total: {
        type: Number,
        required: true
    },
    coupon_id:{
        type:String,
        default:null
    }
},
    {
        versionKey: false,
        timestamps: true
    }
)

CheckOutSchema.index({ createdAt: 1 }, { expireAfterSeconds: 3600 })


module.exports = mongoose.model('checkouts', CheckOutSchema)