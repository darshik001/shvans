const { GetDashboard } = require('../../controller/admin/report.controller')
const { verifyjwtAccessToken, checkRole } = require('../../middleware/jwtToken')

const router = require('express').Router()


router.get('/dashboard', GetDashboard)

module.exports = router