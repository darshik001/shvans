const { GetOrders, AccepteOrder,GenerateLabels } = require('../../controller/admin/order.controller')

const router = require('express').Router()


router.get('/get',GetOrders)
router.post('/accepte',AccepteOrder)
router.post('/labels',GenerateLabels)
module.exports = router