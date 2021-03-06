const router = require('express').Router();
const Tip = require('../models/tip');
const Notification = require('../models/notification');
const User = require('../models/user');
const checkJwt = require('../middleware/check-jwt');
const async = require('async');


//send push notification
var sendNotification = function(data) {
    var headers = {
      "Content-Type": "application/json; charset=utf-8",
      "Authorization": "Basic OTBiYjk0YTUtZTM2Ny00ZTdkLWEwZWItZmQyNjdjNWVhODVl"
    };
    
    var options = {
      host: "onesignal.com",
      port: 443,
      path: "/api/v1/notifications",
      method: "POST",
      headers: headers
    };
    
    var https = require('https');
    var req = https.request(options, function(res) {  
      res.on('data', function(data) {
        console.log("Response:");
        console.log(JSON.parse(data));
      });
    });
    
    req.on('error', function(e) {
      console.log("ERROR:");
      console.log(e);
    });
    
    req.write(JSON.stringify(data));
    req.end();
  };

//add tip
router.post('/add-tip', checkJwt, (req, res) => {
    User.findById(req.decoded.user._id, (err, userSendingTip) => {
        if (err) return err;

        let tip = new Tip();
        let notification = new Notification();
        tip.owner = req.decoded.user._id;
        tip.picture = userSendingTip.picture
        tip.ownerUsername = userSendingTip.username;
        tip.imageUrl = req.body.imageUrl;
        tip.message = req.body.message;
        tip.hintId = req.body.hintId;
        const friends = req.body.friends;
        let userIds = [];
        for (let i = 0; i < friends.length; i++) {
            const friendId = friends[i];
            User.findById(friendId, (err, user) => {
                if (err) return err;
    
                userIds.push(user['oneSignalId']);
                if (userIds.length == friends.length) {
                    var message = { 
                        app_id: "4e5b4450-3330-4ac4-a16e-c60e26ec271d",
                        headings:{"en": `Tip`},
                        contents: {"en": `@${req.decoded.user.username} shared a hint with you.`},
                        include_player_ids: userIds
                    };
                    sendNotification(message);
                }
            })
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
        res.json({
            success: true,
            allTips: user,
            tipsToSee: tips
        })
    });
});

//get tips for auto delete
router.get('/get-auto-tips', checkJwt, (req, res) => {
    User.findById(req.decoded.user._id)
    .select(['myTips'])
    .exec((err, user) => {
        if (err) return err;

        res.json({
            success: true,
            allTips: user,
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
            let userIds = [];
            Tip.findById(req.params.id, (err, tip) => {
                if (err) return err;

                let currentUser = `${user['_id']}`;
                let owner = `${tip.owner}`;
                if (currentUser == owner) {
                    notification.for.push(tip._id);
                } else {
                    notification.for.push(tip.owner);
                    User.findById(tip.owner, (err, user) => {
                        if (err) return err;
            
                        userIds.push(user['oneSignalId']);
                        var message = { 
                            app_id: "4e5b4450-3330-4ac4-a16e-c60e26ec271d",
                            headings:{"en": `Comment`},
                            contents: {"en": `@${req.decoded.user.username} commented on one of your tips.`},
                            include_player_ids: userIds
                        };
                        sendNotification(message);
                    })
                }
                notification.from = req.decoded.user._id;
                notification.fromUsername = req.decoded.user.username;
                notification.typeOf = 'comment';
                notification.message = 'commented on one of your tips';
                notification.comment = tip._id;
                let comment = {
                    commenter: user['username'],
                    comment: req.body.comment,
                    commenterId: user['_id'],
                    picture: user['picture']
                }
                tip.comments.push(comment);
                tip.save();
                notification.save();
                res.json({
                    success: true,
                    message: 'Comment added',
                    commenter: user['username'],
                    commentId: comment['_id'],
                })
            });
        }
    ]);
});

//add seen to tip
router.post('/seenBy/:id', checkJwt, (req, res) => {
    Tip.findById(req.params.id, (err, tip) => {
        if (err) return err;

        if (tip == null) {
            res.json({
                success: false,
                message: 'This tip is no longer available'
            });
        } else {
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
        }
    });
});

//delete comment
router.post('/delete-comment/:id', checkJwt, (req, res) => {
    Tip.findById(req.params.id, (err, tip) => {
        if (err) return err;

        tip.comments.splice(tip.comments.findIndex(i => i._id == req.query.id), 1);
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
                            // if (userGotten.notifications == -1) {
                            //     userGotten.notifications = 0;
                            // } else {
                            //     userGotten.notifications = userGotten.notifications - 1;
                            // }
                            userGotten.save();
                        });
                    });

                    // Notification.remove({route: req.params.id}, (err) => {
                    //     if (err) return err;
                    // })

                    Tip.findByIdAndDelete(req.params.id, (err) => {
                        if (err) return err;

                        
                        const tipToRemove = user.myTips.indexOf(req.params.id)
                        user.myTips.splice(tipToRemove, 1);
                        // if (user.notifications == -1) {
                        //     user.notifications = 0;
                        // } else {
                        //     user.notifications = user.notifications - tip.comments.length;
                        // }
                        user.save();
                        res.json({
                            success: true,
                            message: 'Tip deleted'
                        });
                    });
                } else {
                    Notification.findById(req.query.notifyId, (err, notification) => {
                        if (err) return err;

                        if (notification !== null) {
                            const notifyToRemove = notification.for.indexOf(user._id);
                            notification.for.splice(notifyToRemove, 1);
                            if (user.notifications == -1) {
                                user.notifications = 0;
                            } else {
                                user.notifications = user.notifications - 1;
                            }
                            notification.save();
                        }
                        const tipToRemove = user.tips.indexOf(req.params.id)
                        user.tips.splice(tipToRemove, 1);
                        user.save();
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
    let tipId = req.params.id;
    async.waterfall([
        function (callback) {
            User.findById(req.decoded.user._id, (err, user) => {
                if (err) return err;

                callback(err, user);
            });
        },
        // function (user, callback) {
        //     Notification.find({comment: tipId}, (err, notification) => {
        //         if (err) return err;

        //         callback(err, user, notification.length)
        //     });
        // },
        function (user, totalComments) {
            Tip.findById(tipId, (err, tip) => {
                if (err) return err;

                if (tip == null) {
                    User.find({tips: tipId}, (err, userWithMyTips) => {
                        if (err) return err;

                        if (userWithMyTips.length == 0) {
                            const toRemove = user.myTips.indexOf(tipId)
                            user.myTips.splice(toRemove, 1);
                            user.save();
                            // if (user.notifications == -1) {
                            //     user.notifications = 0;
                            //     user.save();
                            // } else {
                            //     user.notifications = user.notifications - totalComments;
                            //     user.save();
                            // }
                        } else {
                            userWithMyTips.forEach(userWith => {
                                const toRemove = user.myTips.indexOf(tipId)
                                user.myTips.splice(toRemove, 1);
                                const tipToRemove = userWith.tips.indexOf(tipId)
                                userWith.tips.splice(tipToRemove, 1);
                                user.save();
                                // if (userWith.notifications == -1) {
                                //     userWith.notifications = 0;
                                //     userWith.save();
                                // } else {
                                //     userWith.notifications = userWith.notifications - 1;
                                //     userWith.save();
                                // }
                                // if (user.notifications == -1) {
                                //     user.notifications = 0;
                                //     user.save();
                                // } else {
                                //     user.notifications = user.notifications - totalComments;
                                //     user.save();
                                // }
                            });
                        }
                    });

                    // Notification.deleteMany({route: tipId}, (err) => {
                    //     if (err) return err;
                    // })

                    res.json({
                        success: true
                    });
                } else {
                    res.json({
                        success: true
                    });
                }
            })
        }
    ])
});
module.exports = router;