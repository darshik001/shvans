const { AddProduct, GetProduct, UpdateProduct, DeleteProduct } = require('../../controller/admin/product.controller')
const UploadImage = require('../../middleware/imageUploading')
const { verifyjwtAccessToken, checkRole } = require('../../middleware/jwtToken')

const router = require('express').Router()


router.post('/add', verifyjwtAccessToken, checkRole('admin'), UploadImage.array('productImages'), AddProduct)
router.get('/get', verifyjwtAccessToken, checkRole('admin'), GetProduct)
router.patch('/update/:id', verifyjwtAccessToken, checkRole('admin'), UploadImage.array('productImages'), UpdateProduct)
router.delete('/delete/:id', verifyjwtAccessToken, checkRole('admin'), UploadImage.array('productImages'), DeleteProduct)

module.exports = router