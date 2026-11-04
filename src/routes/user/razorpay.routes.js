const { RazorpayPaymentOrder, RazorpayGetPromotion, RazorpayGetPromotionApplay, RazorapayVerifyPayment, RazorpayShippingInfo, CreateCODOrder } = require('../../controller/user/v1/razorpay.controller')

const router = require('express').Router()


router.post('/payment-order', RazorpayPaymentOrder)

router.post('/shipping-charge', RazorpayShippingInfo)
router.get('/shipping-charge', RazorpayShippingInfo)

router.post('/promotion', RazorpayGetPromotion)
router.get('/promotion', RazorpayGetPromotion)

router.post('/promotion-applay', RazorpayGetPromotionApplay)
router.get('/promotion-applay', RazorpayGetPromotionApplay)

router.post('/varify-payment', RazorapayVerifyPayment)

router.post('/dummy-order',CreateCODOrder)

module.exports = router