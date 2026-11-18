const { GetDashboard, GetAdminInquiryes, GetAdminInquiryUpdate } = require('../../controller/admin/report.controller')
const { verifyjwtAccessToken, checkRole } = require('../../middleware/jwtToken')

const router = require('express').Router()


router.get('/dashboard', verifyjwtAccessToken, checkRole("admin"), GetDashboard)
router.get('/inquiry', verifyjwtAccessToken, checkRole('admin'), GetAdminInquiryes)
router.patch('/inquiry/update/:id', verifyjwtAccessToken, checkRole('admin'), GetAdminInquiryUpdate)

module.exports = router