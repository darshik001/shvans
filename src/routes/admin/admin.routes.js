const router = require('express').Router()


router.use('/auth', require('./auth.routes'))
router.use('/category', require('./category.routes'))
router.use('/product',require('./product.routes'))
router.use('/coupon',require('./coupon.routes'))
router.use('/order',require('./order.routes'))
module.exports = router