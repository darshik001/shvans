const { AddCCategory, GetCategory, UpdateCategory } = require('../../controller/admin/category.controller')
const UploadImage = require('../../middleware/imageUploading')
const { verifyjwtAccessToken, checkRole } = require('../../middleware/jwtToken')
const router = require('express').Router()


router.post('/add', verifyjwtAccessToken, checkRole('admin'), UploadImage.single('categoryImage'), AddCCategory)
router.get('/get', verifyjwtAccessToken, checkRole('admin'), GetCategory)
router.patch('/update', verifyjwtAccessToken, checkRole('admin'), UploadImage.single('categoryImage'), UpdateCategory)


module.exports = router