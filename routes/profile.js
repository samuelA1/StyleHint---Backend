const router = require('express').Router();
const checkJwt = require('../middleware/check-jwt');
const User = require('../models/user');
const async = require('async');
var API_KEY = 'key-cd89dbc925b95695b194ca3ea9eedf3e';
var DOMAIN = 'mg.thestylehint.com';
var mailgun = require('mailgun-js')({apiKey: API_KEY, domain: DOMAIN});

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
                    //confirmation email
                    const output = `
                        <div style="text-align: center; font-size: medium">
                            <img style="width: 20%" src="https://res.cloudinary.com/stylehint/image/upload/v1563869996/towel_l5xkio.png" >
                            <h1>Email update confirmation</h1>
                            <p>Your recent attempt to update your email was successful. This email is to acknowledge that</p>
                            <p>your previous email is no longer accepted for authentication purposes, but your new email is.</p>
                        </div>
                        <div style="text-align: center; font-size: medium">
                            <h3>Account Details</h3>
                            <p><b>New email: </b>${req.body.email}</p>
                        
                            <p>Please feel free to customize any of your account details at any time on the app.</p>
                            <p>--The StyleHint Team.</p>
                        </div>
                        `
                        const data = {
                            from: 'StyleHint <no-reply@thestylehint.com>',
                            to: `${req.body.email}`,
                            subject: 'Email update confirmation',
                            text: 'The StyleHint Team',
                            html: output
                        };
                          
                        mailgun.messages().send(data, (error, body) => {
                            if (error) return error;
                        });
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
                    //confirmation email
                    const output = `
                        <div style="text-align: center; font-size: medium">
                            <img style="width: 20%" src="https://res.cloudinary.com/stylehint/image/upload/v1563869996/towel_l5xkio.png" >
                            <h1>Username update confirmation</h1>
                            <p>Your recent attempt to update your username was successful. This username is to acknowledge that</p>
                            <p>your previous username is no longer accepted for authentication purposes, but your new username is.</p>
                        </div>
                        <div style="text-align: center; font-size: medium">
                            <h3>Account Details</h3>
                            <p><b>New username: </b>${req.body.username}</p>
                        
                            <p>Please feel free to customize any of your account details at any time on the app.</p>
                            <p>--The StyleHint Team.</p>
                        </div>
                        `
                        const data = {
                            from: 'StyleHint <no-reply@thestylehint.com>',
                            to: `${userWithId.email}`,
                            subject: 'Username update confirmation',
                            text: 'The StyleHint Team',
                            html: output
                        };
                          
                        mailgun.messages().send(data, (error, body) => {
                            if (error) return error;
                        });
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
            //confirmation email
            const output = `
            <div style="text-align: center; font-size: medium">
                <img style="width: 20%" src="https://res.cloudinary.com/stylehint/image/upload/v1563869996/towel_l5xkio.png" >
                <h1>Password update confirmation</h1>
                <p>Your recent attempt to update your password was successful. This password is to acknowledge that</p>
                <p>your previous password is no longer accepted for authentication purposes, but your new password is.</p>
            </div>
            <div style="text-align: center; font-size: medium">
                <p>Please feel free to customize any of your account details at any time on the app.</p>
                <p>--The StyleHint Team.</p>
            </div>
            `
            const data = {
                from: 'StyleHint <no-reply@thestylehint.com>',
                to: `${userWithId.email}`,
                subject: 'Password update confirmation',
                text: 'The StyleHint Team',
                html: output
            };
              
            mailgun.messages().send(data, (error, body) => {
                if (error) return error;
            });
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