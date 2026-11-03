const { AdminLogin, AdminLogout, AdminRegister } = require('../../controller/admin/auth.controller')
const { verifyjwtAccessToken, checkRole } = require('../../middleware/jwtToken')

const router = require('express').Router()


router.post('/admin-register', AdminRegister)
router.post('/admin-login', AdminLogin)
router.post('/admin-logout', verifyjwtAccessToken, checkRole('admin'), AdminLogout)


module.exports = router