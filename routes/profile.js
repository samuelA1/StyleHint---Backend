const router = require('express').Router();
const checkJwt = require('../middleware/check-jwt');
const User = require('../models/user');
const async = require('async');

//change email address
router.post('/email', checkJwt, (req, res) => {
    async.waterfall([
        function (callback) {
            User.findOne({email: req.body.email}, (err, userWithEmail) => {
                if (err) return err;

                callback(err, userWithEmail);
            });
        },
        function (userWithEmail) {
            if (userWithEmail) {
                res.json({
                    success: false,
                    message: 'Sorry, a user with that email already exist. Please try another email'
                });
            } else {
                User.findById(req.decoded.user._id)
                .select(['-friends', '-tips', '-myTips', '-closet'])
                .exec((err, userWithId) => {
                    if (err) return err;
            
                    if(req.body.email) userWithId.email = req.body.email;
                    userWithId.save();
                    res.json({
                        success: true,
                        user: userWithId,
                        message: 'Email update successful'
                    });
                });
            }
        }
    ])
    
});

//change username
router.post('/username', checkJwt, (req, res) => {
    async.waterfall([
        function (callback) {
            User.findOne({username: req.body.username}, (err, userWithUsername) => {
                if (err) return err;

                callback(err, userWithUsername);
            });
        },
        function (userWithUsername) {
            if (userWithUsername) {
                res.json({
                    success: false,
                    message: 'Sorry, a user with that username already exist. Please try another username'
                });
            } else {
                User.findById(req.decoded.user._id)
                .select(['-friends', '-tips', '-myTips', '-closet'])
                .exec((err, userWithId) => {
                    if (err) return err;
            
                    if(req.body.username) userWithId.username = req.body.username;
                    userWithId.save();
                    res.json({
                        success: true,
                        user: userWithId,
                        message: 'Username update successful'
                    });
                });
            }
        }
    ])
});

//change password
router.post('/password', checkJwt, (req, res) => {
    User.findById(req.decoded.user._id)
    .select(['-friends', '-tips', '-myTips', '-closet'])
    .exec((err, userWithId) => {
        if (err) return err;

        let validatePassword = userWithId.comparePassword(req.body.oldPassword);
        if (validatePassword) {
            if(req.body.newPassword) userWithId.password = req.body.newPassword;
            userWithId.save();
            res.json({
                success: true,
                user: userWithId,
                message: 'Password update successful'
            });
        } else {
            res.json({
                success: false,
                message: 'Sorry, you entered a wrong password. Pleas enter your current user password'
            })
        }
        
    });
});

//change country
router.post('/country', checkJwt, (req, res) => {
    User.findById(req.decoded.user._id)
    .select(['-friends', '-tips', '-myTips', '-closet'])
    .exec( (err, userWithId) => {
        if (err) return err;

        if(req.body.country) userWithId.country = req.body.country;
        userWithId.save();
        res.json({
            success: true,
            user: userWithId,
            message: 'Country update successful'
        });
    });
});

//change gender
router.post('/gender', checkJwt, (req, res) => {
    User.findById(req.decoded.user._id)
    .select(['-friends', '-tips', '-myTips', '-closet'])
    .exec((err, userWithId) => {
        if (err) return err;

        if(req.body.gender) userWithId.gender = req.body.gender;
        userWithId.save();
        res.json({
            success: true,
            user: userWithId,
            message: 'Gender update successful'
        });
    });
});

//change interest
router.post('/interest', checkJwt, (req, res) => {
    User.findById(req.decoded.user._id)
    .select(['-friends', '-tips', '-myTips', '-closet'])
    .exec( (err, userWithId) => {
        if (err) return err;

        if(req.body.interest) userWithId.interest = req.body.interest;
        userWithId.save();
        res.json({
            success: true,
            user: userWithId,
            message: 'Interest update successful'
        });
    });
});

//change size
router.post('/size', checkJwt, (req, res) => {
    User.findById(req.decoded.user._id)
    .select(['-friends', '-tips', '-myTips', '-closet'])
    .exec((err, userWithId) => {
        if (err) return err;

        if(req.body.size) userWithId.size = req.body.size;
        userWithId.save();
        res.json({
            success: true,
            user: userWithId,
            message: 'Size update successful'
        });
    });
});

module.exports = router;