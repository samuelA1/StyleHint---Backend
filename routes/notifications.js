const router = require('express').Router();
const checkJwt = require('../middleware/check-jwt');
const Notification = require('../models/notification');

router.get('/notifications', checkJwt, (req, res) => {
    // Notification.find({"for": `${req.decoded.user._id}`}, (err, notification) => {
    //     if (err) return err;

    //     res.json({
    //         success: true,
    //         notifications: notification
    //     })
    // });
        res.json({
            success: true,
        })
});

module.exports = router;