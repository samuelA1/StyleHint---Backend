const router = require('express').Router();
const Tip = require('../models/tip');
const User = require('../models/user');
const checkJwt = require('../middleware/check-jwt');
const async = require('async');

//add tip
router.post('/add-tip', checkJwt, (req, res) => {
    User.findById(req.decoded.user._id, (err, userSendingTip) => {
        if (err) return err;

        let tip = new Tip();
        tip.owner = req.decoded.user._id;
        tip.imageUrl = req.body.imageUrl;
        tip.hintId = req.body.hintId;
        req.body.friends.forEach(friendId => {
            User.findById(friendId, (err, friend) => {
                if (err) return err;

                friend.tips.push(tip._id);
                friend.save();
            });
            tip.usersToSee.push(friendId);
        });
        userSendingTip.myTips.push(tip._id);

        tip.save();
        userSendingTip.save();
        res.json({
            success: true,
            message: 'Tip sent'
        })
    });
    // async.waterfall([
    //     function (callback) {
    //         User.findById(req.params.id, (err, userToGetTip) => {
    //             if (err) return err;

    //             callback(err, userToGetTip);
    //         });
    //     },
    //     function (userToGetTip) {
    //         User.findById(req.decoded.user._id, (err, userSendingTip) => {
    //             if (err) return err;

    //             let tip = new Tip();
    //             tip.owner = req.decoded.user._id;
    //             tip.imageUrl = req.body.imageUrl;
    //             tip.hintId = req.body.hintId;
    //             tip.usersToSee.push(req.params.id)
    //             userToGetTip.tips.push(tip._id);
    //             userSendingTip.myTips.push(tip._id);

    //             tip.save();
    //             userToGetTip.save();
    //             userSendingTip.save();
    //             res.json({
    //                 success: true,
    //                 message: 'Tip sent'
    //             })
    //         });
    //     }
    // ]);
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