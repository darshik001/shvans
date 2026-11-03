const { UserGetOrder,CanceleOrder,ReturnOrder } = require('../../controller/user/v1/order.controller')
const { verifyjwtAccessToken } = require('../../middleware/jwtToken')

const router = require('express').Router()



router.get('/get',verifyjwtAccessToken,UserGetOrder)
router.post('/canele-order/:id',CanceleOrder)
router.post('/return/:id',verifyjwtAccessToken,ReturnOrder)

module.exports = router