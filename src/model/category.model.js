const mongoose = require('mongoose');

const CategorySchema = new mongoose.Schema(
    {
        name: {
            type: String,
            unique: true,
            trim: true,
            required: true
        },
        categoryImage: {
            type: String,
            default: ''
        },
        description: {
            type: String,
            trim: true,
            default: ''
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

module.exports = mongoose.model('categories', CategorySchema);
