const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema(
    {
        categoryId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'categories'
        },
        name: {
            type: String,
            trim: true,
            required: true
        },
        sku: {
            type: String,
            unique: true,

        },
        description: {
            type: String,
            trim: true,
            default: ''
        },
        additionalInfo: {
            type: String,
            trim: true,
            default: ''
        },
        productImages: {
            type: [String],
            default: []
        },
        variants: {
            type: [
                {
                    price: {
                        type: Number,
                        required: true
                    },
                    stock: {
                        type: Number,
                        default: 0
                    },
                    unit: {
                        type: String,
                        required: true
                    }
                }
            ],
            default: []
        },

        packing: {
            type: {
                width: { type: Number, default: 30 },
                length: { type: Number, default: 15 },
                height: { type: Number, default: 5 },
                weight: { type: Number, default: 0.5 }
            }
        },
        status: {
            type: String,
            enum: ['active', 'inactive'],
            default: "active"
        }
    },
    {
        versionKey: false,
        timestamps: true
    }
);

module.exports = mongoose.model('products', ProductSchema);
