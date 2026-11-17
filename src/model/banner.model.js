const mongoose = require('mongoose')


const BannerSchema = new mongoose.Schema(
    {
        title: {
            type: String
        },
        description: {
            type: String
        },
        bannerImage: {
            type: String
        },
        imageTitle: {
            type: String
        },
        imageDescription: {
            type: String
        },

        status: {
            type: String,
            enum: ['active', 'inactive'],
            default: 'active'
        }
    },
    {
        versionKey: false,
        timestamps: true
    }
)


module.exports = mongoose.model('banners', BannerSchema)


