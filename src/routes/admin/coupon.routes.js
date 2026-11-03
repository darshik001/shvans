const { AddCoupon, GetCoupons, UpdateCoupon, DeleteCoupon } = require('../../controller/admin/coupon.controller')
const { verifyjwtAccessToken, checkRole } = require('../../middleware/jwtToken')

const router = require('express').Router()


router.post('/add',verifyjwtAccessToken,checkRole('admin'),AddCoupon)
router.get('/get',verifyjwtAccessToken,checkRole('admin'),GetCoupons)
router.patch('/update/:id',verifyjwtAccessToken,checkRole('admin'),UpdateCoupon)
router.delete('/delete/:id',verifyjwtAccessToken,checkRole('admin'),DeleteCoupon)
module.exports = router