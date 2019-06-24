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
            notification.route = tip._id;
            User.findById(friendId, (err, friend) => {
                if (err) return err;

                friend.tips.push(tip._id);
                friend.save();
            });
            
        }
        tip.notifyId = notification._id;
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
    .populate(['usersToSee'])
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
    .exec((err, user) => {
        if (err) return err;
        
        let tips = []
         user.tips.forEach(tip => {
          if (tip.seenBy.length === 0) {
            tips.push(Object.assign({toBeSeen: true}, tip._doc));
          } else {
            if (tip.seenBy.some(seen => seen == req.decoded.user._id)) {
                return tips.push(Object.assign({toBeSeen: false}, tip._doc));
            } else {
            return tips.push(Object.assign({toBeSeen: true}, tip._doc));
            }
          }
        });
        console.log(user.tips);
        res.json({
            success: true,
            allTips: user,
            tipsToSee: tips
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
            let notification = new Notification();
            Tip.findById(req.params.id, (err, tip) => {
                if (err) return err;

                notification.for.push(tip.owner);
                notification.from = req.decoded.user._id;
                notification.fromUsername = req.decoded.user.username;
                notification.typeOf = 'comment';
                notification.message = 'commented on one of your tips';
                notification.route = tip._id;
                let comment = {
                    commenter: user['username'],
                    comment: req.body.comment,
                    commenterId: user['_id']
                }
                tip.comments.push(comment);
                tip.save();
                notification.save();
                res.json({
                    success: true,
                    message: 'Comment added',
                    commenter: user['username']
                })
            });
        }
    ]);
});

//add seen to tip
router.post('/seenBy/:id', checkJwt, (req, res) => {
    Tip.findById(req.params.id, (err, tip) => {
        if (err) return err;
        
        if (tip.seenBy.length !== 0) {
            if ( tip.seenBy.some(seen => seen == req.decoded.user._id)) {
                 res.json({
                     success: true,
                     message: 'tip seen'
                 });
             } else {
                 tip.seenBy.push(req.decoded.user._id);
                 tip.save();
                 res.json({
                     success: true,
                     message: 'tip seen'
                 });
             }      
        } else {
            tip.seenBy.push(req.decoded.user._id);
            tip.save();
            res.json({
                success: true,
                message: 'tip seen'
            });
        }
    });
});

//delete comment
router.post('/delete-comment/:id', checkJwt, (req, res) => {
    Tip.findById(req.params.id, (err, tip) => {
        if (err) return err;

        const commentToRemove = tip.comments.indexOf(req.query.id);
        tip.comments.splice(commentToRemove, 1);
        tip.save();
        res.json({
            success: true,
            message: 'Comment deleted'
        })
    });
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
                    tip.usersToSee.forEach(userId => {
                        User.findById(userId, (err, userGotten) => {
                            if (err) return err;
        
                            const tipToRemove = userGotten.tips.indexOf(req.params.id)
                            userGotten.tips.splice(tipToRemove, 1);
                            if (userGotten.notifications == -1) {
                                userGotten.notifications = 0;
                            } else {
                                userGotten.notifications = userGotten.notifications - 1;
                            }
                            userGotten.save();
                        });
                    });

                    Notification.remove({route: req.params.id}, (err) => {
                        if (err) return err;
                    })

                    Tip.findByIdAndDelete(req.params.id, (err) => {
                        if (err) return err;

                        
                        const tipToRemove = user.myTips.indexOf(req.params.id)
                        user.myTips.splice(tipToRemove, 1);
                        if (user.notifications == -1) {
                            user.notifications = 0;
                        } else {
                            user.notifications = user.notifications - tip.comments.length;
                        }
                        user.save();
                        res.json({
                            success: true,
                            message: 'Tip deleted'
                        });
                    });
                } else {
                    Notification.findById(req.query.notifyId, (err, notification) => {
                        if (err) return err;

                        const notifyToRemove = notification.for.indexOf(user._id);
                        notification.for.splice(notifyToRemove, 1);
                        const tipToRemove = user.tips.indexOf(req.params.id)
                        user.tips.splice(tipToRemove, 1);
                        if (user.notifications == -1) {
                            user.notifications = 0;
                        } else {
                            user.notifications = user.notifications - 1;
                        }
                        user.save();
                        notification.save();
                        res.json({
                            success: true,
                            message: 'Tip deleted'
                        });
                    })
                }
            });
        }
    ]);
});

//auto delete tip
router.post('/auto-delete/:id', checkJwt, (req, res) => {
    async.waterfall([
        function (callback) {
            User.findById(req.decoded.user._id, (err, user) => {
                if (err) return err;

                callback(err, user);
            });
        },
        function (user, callback) {
            Notification.find({route: req.params.id}, (err, notification) => {
                if (err) return err;

                callback(err, user, notification.length)
            });
        },
        function (user, totalComments) {
            Tip.findById(req.params.id, (err, tip) => {
                if (err) return err;

                if (tip == null) {
                    User.find({tips: req.params.id}, (err, userWithMyTips) => {
                        if (err) return err;

                        for (let i = 0; i < userWithMyTips.length; i++) {
                            const tipToRemove = userWithMyTips[i].tips.indexOf(req.params.id)
                            userWithMyTips[i].tips.splice(tipToRemove, 1);
                            if (userWithMyTips[i].notifications == -1) {
                                userWithMyTips[i].notifications = 0;
                            } else {
                                userWithMyTips[i].notifications = userWithMyTips[i].notifications - 1;
                            }
                            userWithMyTips[i].save();
                        }
                    });

                    Notification.deleteMany({route: req.params.id}, (err) => {
                        if (err) return err;
                    })
        
                    const toRemove = user.myTips.indexOf(req.params.id)
                    user.myTips.splice(toRemove, 1);
                    if (user.notifications == -1) {
                        user.notifications = 0;
                    } else {
                        user.notifications = user.notifications - totalComments;
                    }
                    user.save();
                    res.json({
                        success: true
                    });
                }
            })
        }
    ])
});
module.exports = router;