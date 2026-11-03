const { AddCart, GetCart, UpdateCart, DeleteCart, ClearCart } = require('../../controller/user/v1/cart.controller')
const { verifyjwtAccessToken } = require('../../middleware/jwtToken')

const router = require('express').Router()

router.post('/add', verifyjwtAccessToken, AddCart)
router.get('/get', verifyjwtAccessToken, GetCart)
router.patch('/update/:id', verifyjwtAccessToken, UpdateCart)
router.patch('/update', verifyjwtAccessToken, UpdateCart)
router.delete('/delete/:id', verifyjwtAccessToken, DeleteCart)
router.delete('/clear', verifyjwtAccessToken, ClearCart)

module.exports = router