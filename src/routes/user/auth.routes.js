const { SendUserLoginOtp, VerifyOtpAndLogin, UserGoogleLogin, UserLogout, } = require('../../controller/user/v1/auth.controller')
const { verifyjwtAccessToken } = require('../../middleware/jwtToken')

const router = require('express').Router()



router.post('/sent-otp', SendUserLoginOtp)
router.post('/sent-otp-verify', VerifyOtpAndLogin)
router.post('/user-google-login', UserGoogleLogin)
router.post('/user-logout', verifyjwtAccessToken, UserLogout)

module.exports = router