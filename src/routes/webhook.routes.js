const express = require('express')
const { RazorpayRefundWebhook, ShiproketWebhook } = require('../controller/webhook.controller')
const router = require('express').Router()



router.post('/razorpay-refund', express.raw({ type: "application/json" }), RazorpayRefundWebhook)
router.post('/shipping-status', ShiproketWebhook)


module.exports = router