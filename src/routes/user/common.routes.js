const { GetAnnounc } = require('../../controller/user/v1/common.controller')

const router = require('express').Router()


router.get('/announc',GetAnnounc)

module.exports = router