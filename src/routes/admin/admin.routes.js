const router = require('express').Router()


router.use('/auth', require('./auth.routes'))
router.use('/category', require('./category.routes'))
router.use('/product',require('./product.routes'))
router.use('/coupon',require('./coupon.routes'))
router.use('/order',require('./order.routes'))
router.use('/announcements',require('../admin/announcements.routes'))
router.use('/banner',require('./banners.routes'))
module.exports = router