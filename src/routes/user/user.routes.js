const router = require('express').Router()



router.use('/auth',require('./auth.routes'))
router.use('/product',require('./product.routes'))
router.use('/cart',require('./cart.routes'))
router.use('/razorpay',require('./razorpay.routes'))
router.use('/order',require('./order.routes'))
module.exports = router