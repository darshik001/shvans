const mongoose = require('mongoose')


const AnnouncementsSchema = new mongoose.Schema(
    {
        title:{
        type:String
    },
    status:{
        type:String,
        enum:['active','inactive'],
        default:'active'
    }
    },
    {
        versionKey: false,
        timestamps: true
    }
)


module.exports = mongoose.model('announcements',AnnouncementsSchema)