const { CreateReview, GetReviews,GetProductRevires } = require('../../controller/user/v1/review.controller')
const { verifyjwtAccessToken } = require('../../middleware/jwtToken')

const router = require('express').Router()

router.get('/get',verifyjwtAccessToken,GetReviews)
router.post('/create',verifyjwtAccessToken,CreateReview)
router.get('/product/:id',GetProductRevires)

module.exports = router