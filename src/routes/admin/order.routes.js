const { GetOrders, AccepteOrder, GenerateLabels } = require('../../controller/admin/order.controller')
const { verifyjwtAccessToken, checkRole } = require('../../middleware/jwtToken')

const router = require('express').Router()


router.get('/get', verifyjwtAccessToken, checkRole('admin'), GetOrders)
router.post('/accepte', verifyjwtAccessToken, checkRole('admin'), AccepteOrder)
router.post('/labels', verifyjwtAccessToken, checkRole('admin'), GenerateLabels)
module.exports = router