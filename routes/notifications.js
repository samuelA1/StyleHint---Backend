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

                var notifyNumber;
                if (userWithNotify.notifications == -1) {
                    notifyNumber = 0;
                } else {
                    notifyNumber = userWithNotify.notifications
                }

                callback(err, notifyNumber);
            });
        },
        function (userWithNotify) {
            Notification.find({for: req.decoded.user._id}, (err, notification) => {
                if (err) return err;

                const newNotify = notification.length;
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
    async.waterfall([
        function (callback) {
            Notification.countDocuments({for: req.decoded.user._id}, (err, count) => {
                if (err) return err;

                callback(err, count)
            });
        },
        function (count) {
            Notification.find({for: req.decoded.user._id})
                .limit(perPage)
                .skip(page * perPage)
                .sort({createdAt: -1})
                .select(['-for'])
                .exec( (err, notification) => {
                    if (err) return err;

                    res.json({
                        success: true,
                        notifications: notification,
                        totalNotifications: count
                    })
                });
        }
    ])
});

//change number of notifications gotten
router.post('/change-notify', checkJwt, (req, res) => {
    User.findById(req.decoded.user._id, (err, user) => {
        if (err) return err;

        user.notifications = user.notifications +  req.body.notify;
        user.save();
        res.json({
            success: true
        })
    })
});

module.exports = router;