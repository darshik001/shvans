const { GetAnnounc, GetUserBanner,NewInquiry } = require('../../controller/user/v1/common.controller')

const router = require('express').Router()


router.get('/announc',GetAnnounc)
router.get('/banner',GetUserBanner)
router.post('/inquiry',NewInquiry)
module.exports = router