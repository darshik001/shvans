const router = require('express').Router()


router.use('/api/v1/admin', require('./admin/admin.routes'))
router.use('/api/v1/user',require('./user/user.routes'))
router.use('/webhook',require('./webhook.routes'))

router.get('/helth-check', (req, res, next) => {
    try {
        res.status(200).json({ success: true, message: "Server is running successfully" })
    } catch (error) {
        return next(error)
    }
})




module.exports = router