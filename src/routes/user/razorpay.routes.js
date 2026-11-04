const { RazorpayPaymentOrder, RazorpayGetPromotion, RazorpayGetPromotionApplay, RazorapayVerifyPayment, RazorpayShippingInfo } = require('../../controller/user/v1/razorpay.controller')

const router = require('express').Router()


router.post('/payment-order', RazorpayPaymentOrder)
router.post('/shipping-charge', RazorpayShippingInfo)
router.post('/promotion', RazorpayGetPromotion)
router.post('/promotion-applay', RazorpayGetPromotionApplay)
router.post('/varify-payment', RazorapayVerifyPayment)

module.exports = router