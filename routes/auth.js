const router = require('express').Router();
const User = require('../models/user');
const jwt = require('jsonwebtoken');
const config = require('../config');
const async = require('async');
const checkJwt = require('../middleware/check-jwt');
var API_KEY = 'key-cd89dbc925b95695b194ca3ea9eedf3e';
var DOMAIN = 'mg.thestylehint.com';
var mailgun = require('mailgun-js')({apiKey: API_KEY, domain: DOMAIN});


//login route
router.post('/login', (req, res) => {
    User.findOne({$or: [{ email: req.body.email }, { username: req.body.username }]})
    .select(['-friends', '-tips', '-myTips', '-closet', '-addresses', '-cards', '-designers', '-cart'])
    .exec((err, userExist) => {
        if (err) return err;

        if (userExist) {
            let validatePassword = userExist.comparePassword(req.body.password);
            if (validatePassword) {
                const token = jwt.sign({user: userExist}, config.secret, {expiresIn: '365d'});
                res.json({
                    success: true,
                    message: 'Login successful',
                    user: userExist,
                    token: token
                })
            } else {
                res.json({
                    success: false,
                    message: 'Authentication failed. Wrong user password'
                })
            }
        } else {
            res.json({
                success: false,
                message: 'Authentication failed. Wrong user email or username'
            })
        }
    })
});

router.post('/auto-login', (req, res) => {
    User.findOne({$or: [{ email: req.body.email }, { username: req.body.username }]}, (err, userExist) => {
        if (err) return err;

        if (userExist) {
            const token = jwt.sign({user: userExist}, config.secret, {expiresIn: '365d'});
            res.json({
                success: true,
                message: 'Login successful',
                token: token
            })
        } else {
            res.json({
                success: false,
                message: 'Authentication failed. Wrong user email or username'
            })
        }
    })

});

router.post('/onesignal-id/:id', (req, res) => {
    User.findOne({ username: req.body.username}, (err, userExist) => {
        if (err) return err;

        userExist.oneSignalId = req.params.id;
        userExist.save();
        res.json({
            success: true
        });
    });

});

//registration route
router.post('/register', (req, res) => {
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
                let user = new User();
                if (req.body.email) user.email = req.body.email;
                if (req.body.country) user.country = req.body.country;
                if (req.body.password) user.password = req.body.password;
                if (req.body.username) user.username = req.body.username;

                User.findOne({email: req.body.email}, (err, userExist) => {
                    if (err) return err;
                    if (userExist) {
                        res.json({
                            success: false,
                            message: ' Sorry, a user with that email already exist. Try another email.'
                        })
                    } else {
                        user.save();
                        const token = jwt.sign({user: user}, config.secret, {expiresIn: '365d'})

                        //send email
                        const output = `
                        <div style="text-align: center; font-size: medium">
                            <img style="width: 20%" src="https://res.cloudinary.com/stylehint/image/upload/v1563869996/towel_l5xkio.png" >
                            <h1>Welcome to StyleHints</h1>
                            <p>Thank you for creating a StyleHints account. We're glad you have chosen us to help</p>
                            <p>you improve upon your fashion and style by providing you with millions of fashion</p>
                            <p>ideas or hints, which take into account the climatic condition of your current location.</p>
                            <p>This will greatly improve your confidence in fashion and also save you time in picking out</p>
                            <p>the right clothes to wear for any major event.</p>
                        </div>
                        <div style="text-align: center; font-size: medium">
                            <h3>Account Details</h3>
                            <p><b>Email: </b>${req.body.email}</p>
                            <p style="margin-right: 140px"><b>Username: </b>${req.body.username}</p>
                        
                            <p>Please feel free to customize any of your account details at any time on the app.</p>
                            <p>--The StyleHints Team.</p>
                        </div>
                        `
                        const data = {
                            from: 'StyleHints <no-reply@thestylehint.com>',
                            to: `${req.body.email}`,
                            subject: 'Welcome to StyleHints',
                            text: 'The StyleHints Team',
                            html: output
                        };
                          
                        mailgun.messages().send(data, (error, body) => {
                            if (error) return error;
                        });

                        res.json({
                            success: true,
                            message: 'Registration successsful',
                            token: token
                        });
                    }
                });
            }
        }
    ]);
});

//delete a user from database
router.delete('/remove', checkJwt, (req, res) => {
    User.findByIdAndRemove(req.decoded.user._id, (err) => {
        if (err) return err;

        res.json({
            success: true
        });
    });
});

module.exports = router;