const router = require('express').Router()



router.use('/auth',require('./auth.routes'))
router.use('/product',require('./product.routes'))
router.use('/cart',require('./cart.routes'))
router.use('/razorpay',require('./razorpay.routes'))
router.use('/order',require('./order.routes'))
router.use('/review',require('./review.routes'))
router.use('/common',require('./common.routes'))
module.exports = router