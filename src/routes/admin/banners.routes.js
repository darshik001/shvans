const { AddBanner, GetBanner, UpdateBanner, DeleteBanner } = require('../../controller/admin/banner.controller')
const UploadImage = require('../../middleware/imageUploading')
const { verifyjwtAccessToken, checkRole } = require('../../middleware/jwtToken')

const router = require('express').Router()

router.post('/add',verifyjwtAccessToken,checkRole('admin'),UploadImage.single('bannerImage'),AddBanner)
router.get('/get',verifyjwtAccessToken,checkRole('admin'),GetBanner)
router.patch('/update/:id',verifyjwtAccessToken,checkRole('admin'),UploadImage.single('bannerImage'),UpdateBanner)
router.delete('/delete/:id',verifyjwtAccessToken,checkRole('admin'),DeleteBanner)


module.exports = router