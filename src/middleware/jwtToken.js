

const jwt = require('jsonwebtoken')
const crypto = require('crypto')
const mongoose = require('mongoose')

const { CustomeError } = require('./globelError.js')
const userModel = require('../model/user.model.js')




exports.generateJwtToken = (data) => {
    return jwt.sign({ id: data._id, role: data.role }, process.env.JWT_SECRET)
}

exports.ForgotgenerateJwtToken = (data) => {
    return jwt.sign({ id: data._id, role: data.role }, process.env.FORGOT_PASSWORD_JWT_SECRET, { expiresIn: "10m" })

}


exports.generatehashToken = (token) => {
    return crypto.createHash("sha256").update(token).digest('hex')
}


exports.verifyjwtAccessToken = async (req, res, next) => {
    try {
        const auth = req.headers.authorization
        if (!auth) {
            return next(CustomeError(401, "Unauthorized"))
        }
        const token = auth.split(" ")[1]

        if (!token) {
            return next(CustomeError(401, "invalid token"))
        }
        const decodeToken = jwt.verify(token, process.env.JWT_SECRET)
        if (!mongoose.isValidObjectId(decodeToken.id)) {
            return next(CustomeError(401, "invalid id"))
        }



        const user = await userModel.findById(decodeToken.id)

        if (!user) {
            return next(CustomeError(401, "invalid token"));
        }

        if (user.status == "block" || user.status == "inactive") {
            await userModel.findByIdAndUpdate(user._id, { accessToken: [] })
            return next(CustomeError(401, "invalid token"));
        }



        const hashaccessToken = this.generatehashToken(token)
        if (!user.accessToken?.includes(hashaccessToken)) {
            console.log(hashaccessToken)
            return next(CustomeError(401, "Invalid Token"));
        }



        if (user) {
            req.user = user,
                req.token = hashaccessToken;
            next()
        } else {
            return next(CustomeError(401, "invalid token"))
        }
    } catch (error) {
        next(error)
    }
}


exports.checkRole = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return next(CustomeError(401, "unauthorized"));
        }

        if (!roles.includes(req.user.role)) {
            return next(CustomeError(403, "access denied"));
        }
        next();
    };
};

