const mongoose = require('mongoose')

const inquirySchema = new mongoose.Schema({
    name:{
        type:String,
        trim:true,
    },
    email:{
        type:String,
        trim:true,
    },
    phone:{
        type:String,
        trim:true,
    },
    phone:{
        type:String,
        trim:true,
    },
    subject:{
        type:String,
        trim:true,
    },
    message:{
        type:String,
        trim:true,
    },
    status:{
        type:String,
        enum: ["pending", "resolved"],
        default:"pending"
    }
},
{
    timestamps:true,
    versionKey:false
})

module.exports = mongoose.model('inquiry',inquirySchema)