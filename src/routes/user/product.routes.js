const { UserGetProduct, UserGetCategories } = require('../../controller/user/v1/product.controller')
const { verifyjwtAccessToken } = require('../../middleware/jwtToken')

const router = require('express').Router()



router.get('/get',UserGetProduct)
router.get('/categories',UserGetCategories)

module.exports = router