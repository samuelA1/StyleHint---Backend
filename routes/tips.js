const router = require('express').Router();
const Tip = require('../models/tip');
const User = require('../models/user');
const checkJwt = require('../middleware/check-jwt');
const async = require('async');
const fetch = require('node-fetch');

//add tip
router.post('/add-tip/:id', checkJwt, (req, res) => {
    async.waterfall([
        function (callback) {
            User.findById(req.params.id, (err, userToGetTip) => {
                if (err) return err;

                callback(err, userToGetTip);
            });
        },
        function (userToGetTip) {
            User.findById(req.decoded.user._id, (err, userSendingTip) => {
                if (err) return err;

                let tip = new Tip();
                tip.owner = req.decoded.user._id;
                tip.imageUrl = req.body.imageUrl;
                tip.hintId = req.body.hintId;
                tip.usersToSee.push(req.params.id)
                userToGetTip.tips.push(tip._id);
                userSendingTip.myTips.push(tip._id);

                tip.save();
                userToGetTip.save();
                userSendingTip.save();
                res.json({
                    success: true,
                    message: 'Tip sent'
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
                    fetch(`http://www.thestylehint.com/api/tips/auto-delete/${req.params.id}`, { method: 'POST' }).then(res => res.json())
                        .then(json => console.log(json));
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

                    const tipToRemove = userGotten.ttips.indexOf(req.params.id)
                    userGotten.tips.splice(tipToRemove, 1);
                    userGotten.save();
                    res.json({success: true})
                });
            });
        }
    ]);
});
module.exports = router;