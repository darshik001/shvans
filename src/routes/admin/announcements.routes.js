const { AddAnnouncements, GetAnnouncements,UpdateAnnouncements, DeleteAnnouncements } = require('../../controller/admin/announcements.controller')
const { verifyjwtAccessToken, checkRole } = require('../../middleware/jwtToken')

const router = require('express').Router()


router.post('/add',verifyjwtAccessToken,checkRole('admin'),AddAnnouncements)
router.get('/get',verifyjwtAccessToken,checkRole('admin'),GetAnnouncements)
router.patch('/update/:id',verifyjwtAccessToken,checkRole('admin'),UpdateAnnouncements)
router.delete('/delete/:id',verifyjwtAccessToken,checkRole('admin'),DeleteAnnouncements)

module.exports = router