const router = require('express').Router();
const Tip = require('../models/tip');
const Notification = require('../models/notification');
const User = require('../models/user');
const checkJwt = require('../middleware/check-jwt');
const async = require('async');

//add tip
router.post('/add-tip', checkJwt, (req, res) => {
    User.findById(req.decoded.user._id, (err, userSendingTip) => {
        if (err) return err;

        let tip = new Tip();
        let notification = new Notification();
        tip.owner = req.decoded.user._id;
        tip.ownerUsername = userSendingTip.username;
        tip.imageUrl = req.body.imageUrl;
        tip.message = req.body.message;
        tip.hintId = req.body.hintId;
        const friends = req.body.friends;
        for (let i = 0; i < friends.length; i++) {
            const friendId = friends[i];
            tip.usersToSee.push(friendId);
            notification.for.push(friendId);
            notification.from = req.decoded.user._id;
            notification.fromUsername = req.decoded.user.username;
            notification.typeOf = 'tip';
            notification.message = 'shared a hint with you';
            notification.route = `tip/${tip._id}`
            User.findById(friendId, (err, friend) => {
                if (err) return err;

                friend.tips.push(tip._id);
                friend.save();
            });
            
        }
        userSendingTip.myTips.push(tip._id);
        tip.save();
        userSendingTip.save();
        notification.save();
        res.json({
            success: true,
            message: 'Tip sent'
        })
        
    });
});

//get single tip
router.get('/get-single-tip/:id', checkJwt, (req, res) => {
    Tip.findById(req.params.id)
    .select(['-usersToSee'])
    .exec( (err, tipsGotten) => {
        if (err) return err;

        res.json({
            success: true,
            tip: tipsGotten
        })
    })
});

//get all tips
router.get('/get-tips', checkJwt, (req, res) => {
    User.findById(req.decoded.user._id)
    .populate(['tips', 'myTips'])
    .select(['tips', 'myTips'])
    .sort({"createdAt": -1})
    .exec((err, user) => {
        if (err) return err;

        res.json({
            success: true,
            allTips: user
        })
    });
});

//add comment to tip
router.post('/add-comment/:id', checkJwt, (req, res) => {
    async.waterfall([
        function (callback) {
            User.findById(req.decoded.user._id, (err, user) => {
                if (err) return err;

                callback(err, user);
            });
        },
        function (user) {
            Tip.findById(req.params.id, (err, tip) => {
                if (err) return err;
        
                let comment = {
                    commenter: user['username'],
                    comment: req.body.comment
                }
                tip.comments.push(comment);
                tip.save();
                res.json({
                    success: true,
                    message: 'Comment added'
                })
            });
        }
    ]);
});

//delete tip
router.delete('/delete-tip/:id', checkJwt, (req, res) => {
    async.waterfall([
        function (callback) {
            User.findById(req.decoded.user._id, (err, user) => {
                if (err) return err;

                callback(err, user);
            });
        },
        function (user) {
            Tip.findById(req.params.id, (err, tip) => {
                if (err) return err;
        
                if (tip.owner == req.decoded.user._id) {
                    //call auto delete
                    tip.usersToSee.forEach(userId => {
                        User.findById(userId, (err, userGotten) => {
                            if (err) return err;
        
                            const tipToRemove = userGotten.tips.indexOf(req.params.id)
                            userGotten.tips.splice(tipToRemove, 1);
                            userGotten.save();
                        });
                    });

                    Tip.findByIdAndDelete(req.params.id, (err) => {
                        if (err) return err;

                        
                        const tipToRemove = user.myTips.indexOf(req.params.id)
                        user.myTips.splice(tipToRemove, 1);
                        user.save();
                        res.json({
                            success: true,
                            message: 'Tip deleted'
                        });
                    });
                } else {
                    const tipToRemove = user.tips.indexOf(req.params.id)
                    user.tips.splice(tipToRemove, 1);
                    user.save();
                    res.json({
                        success: true,
                        message: 'Tip deleted'
                    });
                }
            });
        }
    ]);
});

//auto delete tip
router.post('/auto-delete/:id', (req, res) => {
    async.waterfall([
        function (callback) {
            Tip.findById(req.params.id, (err, tip) => {
                if (err) return err;

                callback(err, tip);
            });
        },
        function(tip) {
            tip.usersToSee.forEach(userId => {
                User.findById(userId, (err, userGotten) => {
                    if (err) return err;

                    const tipToRemove = userGotten.tips.indexOf(req.params.id)
                    userGotten.tips.splice(tipToRemove, 1);
                    userGotten.save();
                    res.json({success: true})
                });
            });
        }
    ]);
});
module.exports = router;