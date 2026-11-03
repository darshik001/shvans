const mongoose = require('mongoose')

const UserSchema = mongoose.Schema({
    name: {
        type: String
    },
    email: {
        type: String,
        default: null
    },
    phone: {
        type: String,
        minlength: 10,
        maxlength: 10,
        default: null
    },
    password: {
        type: String,
        default: null
    },
    googleId: {
        type: String,
        default: null
    },
    profile: {
        type: String,
        default: null
    },
    accessToken: {
        type: [String],
        default: []
    },
    deviceToken: {
        type: [String],
        default: [],
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    }

},
    {
        versionKey: false,
        timestamps: true
    }
)


module.exports = mongoose.model("users", UserSchema)