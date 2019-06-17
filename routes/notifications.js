const router = require('express').Router();
const checkJwt = require('../middleware/check-jwt');
const Notification = require('../models/notification');
const User = require('../models/user');
const async = require('async');

//get amount of new notifications
router.get('/notifyNumber', checkJwt, (req, res) => {
    async.waterfall([
        function (callback) {
            User.findById(req.decoded.user._id)
            .select(['notifications'])
            .exec((err, userWithNotify) => {
                if (err) return err;

                callback(err, userWithNotify);
            });
        },
        function (userWithNotify) {
            console.log(userWithNotify)
            Notification.find({for: req.decoded.user._id}, (err, notification) => {
                if (err) return err;

                const newNotify = notification.length;
                console.log(newNotify)
                res.json({
                    success: true,
                    notifyNumber: newNotify - userWithNotify
                })
            })
        }
    ]);
});

//get all notifications
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

router.post('/change-notify', checkJwt, (req, res) => {
    User.findById(req.decoded.user._id, (err, user) => {
        if (err) return err;

        user.notifications = req.body.notify;
        user.save();
        res.json({
            success: true
        })
    })
});

module.exports = router;