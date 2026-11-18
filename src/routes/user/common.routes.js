const { GetAnnounc, GetUserBanner } = require('../../controller/user/v1/common.controller')

const router = require('express').Router()


router.get('/announc',GetAnnounc)
router.get('/banner',GetUserBanner)

module.exports = router