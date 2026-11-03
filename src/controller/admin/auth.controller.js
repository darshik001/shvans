const bcrypt = require('bcrypt')
const { CustomeError } = require("../../middleware/globelError")
const { generateJwtToken, generatehashToken } = require('../../middleware/jwtToken')
const userModel = require('../../model/user.model')
const { hashUserPassword } = require('../../helper/helper')


exports.AdminRegister = async (req, res, next) => {
    try {
        const { name, email, phone, password, deviceToken } = req.body || {}

        if (!name) {
            return next(CustomeError(422, 'name is required'))
        }


        if (!email) {
            return next(CustomeError(422, 'email is required'))
        }

        if (!phone) {
            return next(CustomeError(422, 'contact number is required'))
        }

        if (!password) {
            return next(CustomeError(422, 'password is required'))
        }


        const hashPassword = await hashUserPassword(password)
        console.log(hashPassword)
        const userData = {
            name,
            email,
            phone,
            password: hashPassword
        }


        let user = await userModel.create(userData)

        const token = generateJwtToken(user)
        const hashAccessToken = generatehashToken(token)



        const updateData = { $addToSet: { accessToken: hashAccessToken } };

        if (deviceToken) {
            updateData.$addToSet.deviceToken = deviceToken;
        }

        user = await userModel.findByIdAndUpdate(user._id, updateData, { returnDocument: 'after' }).select('name email phone profile createdAt')


        return res.status(200).json({ success: true, message: "User Register", user, AccessToken: token })
    } catch (error) {
        return next(error)
    }
}

exports.AdminLogin = async (req, res, next) => {
    try {
        const { email, password, deviceToken } = req.body || {}
        console.log("ruuing")
        if (!email) {
            return next(CustomeError(422, "Email Is Require"))
        }

        if (!password) {
            return next(CustomeError(422, "Password is Requre"))
        }

        let user = await userModel.findOne({ email: email })
console.log(user)
        if (!user) {
            return next(CustomeError(400, "Invalid Credentials"));
        }

        if (user.role !== 'admin') {
            return next(CustomeError(400, "Invalid Credentials"));
        }

        const matchPassword = await bcrypt.compare(password, user.password)



        if (!matchPassword) {
            return next(CustomeError(403, "Invalid  Password"))
        }

        const token = generateJwtToken(user)
        const hashAccessToken = generatehashToken(token)



        const updateData = { $addToSet: { accessToken: hashAccessToken } };

        if (deviceToken) {
            updateData.$addToSet.deviceToken = deviceToken;
        }

        user = await userModel.findByIdAndUpdate(user._id, updateData, { returnDocument: 'after' }).select('name email phone profile createdAt')


        return res.status(200).json({ success: true, message: "Admin Login Successfully", user, AccessToken: token })

    } catch (error) {
        return next(error)
    }
}

exports.AdminLogout = async (req, res, next) => {
    try {
        const token = req.token

        if (token) {
            await userModel.findByIdAndUpdate(req.user._id, { $pull: { accessToken: token } }, { returnDocument: "after" })
        }

        return res.status(200).json({ success: true, message: 'User Logout', token })
    } catch (error) {
        return next(error)
    }
}