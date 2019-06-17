const router = require('express').Router();
const checkJwt = require('../middleware/check-jwt');
const Notification = require('../models/notification');

router.get('/notifications', checkJwt, (req, res) => {
    const perPage = 20;
    const page = req.query.page;
    Notification.find({for: req.decoded.user._id})
    .limit(perPage)
    .skip(page * perPage)
    .sort({createdAt: -1})
    .select(['-for'])
    .exec( (err, notification) => {
        if (err) return err;

        res.json({
            success: true,
            notifications: notification
        })
    });
});

module.exports = router;