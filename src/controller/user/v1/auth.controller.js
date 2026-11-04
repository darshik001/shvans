const { GenerateOTP } = require('../../../helper/helper')
const { CustomeError } = require('../../../middleware/globelError')
const userModel = require('../../../model/user.model')
const otpModel = require('../../../model/otp.model')
const { SendWhatsAppMessage } = require('../../../services/Whatsapp')
const { generateJwtToken, generatehashToken } = require('../../../middleware/jwtToken')
const firebaseadmin = require('../../../config/firebase')
const {getAuth} = require('firebase-admin/auth')


exports.SendUserLoginOtp = async (req, res, next) => {
  try {
    const { phone } = req.body || {}

    if (!phone) {
      return next(CustomeError(422, "Phone Number Required"))
    }

    let user = await userModel.findOne({ phone: phone })

    if (!user) {
      user = await userModel.create({ phone: phone })
    }

    const otp = GenerateOTP()
    const template_code = "shveraa_otp_login"
    const variables = {
      otp: otp,
      validity: "5"
    }


    let sentotp = await otpModel.findOne({ userId: user._id })

    if (!sentotp) {
      const otpsentres = await SendWhatsAppMessage(phone, template_code, variables)
      if (otpsentres?.status !== "success") {
        return next(CustomeError(400, 'Faild To Sent OTP Try Againe'))
      }
      sentotp = await otpModel.create({ userId: user._id, otp: otp })
      return res.status(200).json({ success: true, message: "OTP Send Your Wahtaspp Number", userId: sentotp.userId })
    }

    if (sentotp) {
      const otpsentres = await SendWhatsAppMessage(phone, template_code, variables)


      if (otpsentres.status !== "success") {
        return next(CustomeError(400, 'Faild To Sent OTP Try Againe'))
      }

      sentotp = await otpModel.findByIdAndDelete(sentotp._id)
      sentotp = await otpModel.create({ userId: user._id, otp: otp })
      return res.status(200).json({ success: true, message: "OTP Send Your Wahtaspp Number", userId: sentotp.userId })
    }

  } catch (error) {
    return next(error)
  }
}



exports.VerifyOtpAndLogin = async (req, res, next) => {
  try {

    const { userId, otp, deviceToken } = req.body || {}

    if (!userId) {
      return next(CustomeError(422, "User Id is Required"))
    }


    if (!otp) {
      return next(CustomeError(422, "Otp is Required"))
    }

    const dbotp = await otpModel.findOne({ userId })

    if (!dbotp) {
      return next(CustomeError(400, "otp is expired"))
    }

    if (String(dbotp.otp).trim() !== String(otp).trim()) {
      return next(CustomeError(400, "Invalid OTP"))
    }


    let user = await userModel.findById(userId)
    const token = generateJwtToken(user)
    const hashAccessToken = generatehashToken(token)



    const updateData = { $addToSet: { accessToken: hashAccessToken } };

    if (deviceToken) {
      updateData.$addToSet.deviceToken = deviceToken;
    }

    user = await userModel.findByIdAndUpdate(user._id, updateData, { returnDocument: 'after' }).select('name email phone profile createdAt')
    await otpModel.findByIdAndDelete(dbotp._id)
    return res.status(200).json({ success: true, message: "User Login Successfully", user, AccessToken: token })

  } catch (error) {
    return next(error)
  }
}

exports.UserGoogleLogin = async (req, res, next) => {
  try {
    const { deviceToken, GoogleIdToken } = req.body || {};

    if (!GoogleIdToken) {
      return next(CustomeError(422, "GoogleIdToken is Required"));
    }

    if (!firebaseadmin) {
      return next(CustomeError(500, "Firebase service is not initialized on the server"));
    }

    const decoded = await getAuth(firebaseadmin).verifyIdToken(GoogleIdToken);
    if (!decoded || !decoded.email) {
      return next(CustomeError(401, "Invalid Google user token"));
    }

    let user = await userModel.findOne({ email: decoded.email });

    if (user) {
      if (!user.googleId) {
        user.googleId = decoded.sub;
        await user.save();
      }
    } else {
      user = await userModel.create({
        name: decoded.name || decoded.email.split('@')[0],
        email: decoded.email,
        googleId: decoded.sub,
        profile: decoded.picture || '',
      });
    }

    const token = generateJwtToken(user);
    const hashAccessToken = generatehashToken(token);

    const updateData = { $addToSet: { accessToken: hashAccessToken } };

    if (deviceToken) {
      updateData.$addToSet.deviceToken = deviceToken;
    }

    user = await userModel.findByIdAndUpdate(user._id, updateData, { returnDocument: 'after' }).select('name email phone profile createdAt');

    return res.status(200).json({ success: true, message: "User Login Successfully", user, AccessToken: token });
  } catch (error) {
    return next(error);
  }
}





exports.UserLogout = async (req, res, next) => {
  try {
    const token = req.token

    if (token) {
      await userModel.findByIdAndUpdate(req.user._id, { $pull: { accessToken: token } }, { returnDocument: "after" })
    }

    return res.status(200).json({ success: true, message: 'User Logout Successfully' })
  } catch (error) {
    return next(error)
  }
}