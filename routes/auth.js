const router = require('express').Router();
const User = require('../models/user');
const jwt = require('jsonwebtoken');
const config = require('../config');
const async = require('async');
const nodemailer = require('nodemailer');


//login route
router.post('/login', (req, res) => {
    User.findOne({$or: [{ email: req.body.email }, { username: req.body.username }]})
    .select(['-friends', '-tips', '-myTips', '-closet'])
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
                        <div style="text-align: center">
                            <h1> StyleHint</h1>
                            <h2>Welcome to StyleHint</h2>
                            <p>Thank you for creating a StyleHint account.</p>
                            <p>We're glad you have chosen us to help you improve upon your fashion and style</p>
                            <p>by providing you with different fashion ideas or hints. This will greatly improve your confidence</p>
                            <p>in fashion and also save you time in picking out the right clothes to wear for any major event.</p>
                        
                            <h5>Account Details</h5>
                            <p><b>Email: </b>${req.body.email}</p>
                            <p><b>Username: </b>${req.body.username}</p>
                        
                            <p>Please feel free to customize any of your account deatils at any time on the app.</p>
                            <p>-- The StyleHint Team.</p>
                        </div>
                        `
                         // create reusable transporter object using the default SMTP transport
                        let transporter = nodemailer.createTransport({
                            host: "smtp.office365.com",
                            port: 587,
                            secure: false, // true for 465, false for other ports
                            auth: {
                            user: 'no-reply@thestylehint.com', // generated ethereal user
                            pass: 'sneakers36.' // generated ethereal password
                            }
                        });

                        // send mail with defined transport object
                        let info = transporter.sendMail({
                            from: '"StyleHint Inc" <no-reply@thestylehint.com>', // sender address
                            to: `${req.body.email}`, // list of receivers
                            subject: "Welcome to StyleHint", // Subject line
                            text: "Hello world?", // plain text body
                            html: output // html body
                        });

                        console.log("Message sent: %s", info.messageId);
                        console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));

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

module.exports = router;