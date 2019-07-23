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
                            <img style="width: 20%; background-color: #222" src="https://res.cloudinary.com/stylehint/image/upload/v1563863168/towel_vybo6b.svg" >
                            <h1>Welcome to StyleHint</h1>
                            <p>Thank you for creating a StyleHint account. We're glad you have chosen us to help</p>
                            <p>you improve upon your fashion and style by providing you with millions of fashion</p>
                            <p>ideas or hints, which take into account the climatic condition of your current location.</p>
                            <p>This will greatly improve your confidence in fashion and also save you time in picking out</p>
                            <p>the right clothes to wear for any major event.</p>
                        </div>
                        <div>
                            <h3 style="text-align: center">Account Details</h3>
                            <p><b>Email: </b>${req.body.email}</p>
                            <p><b>Username: </b>${req.body.username}</p>
                        
                            <p style="text-align: center">Please feel free to customize any of your account deatils at any time on the app.</p>
                            <p>--The StyleHint Team.</p>
                        </div>
                        `
                        // let transporter = nodemailer.createTransport({
                        //     host: "smtp.office365.com",
                        //     port: 587,
                        //     secure: false, // true for 465, false for other ports
                        //     auth: {
                        //       user: 'no-reply@thestylehint.com', // generated ethereal user
                        //       pass: 'sneakers36.' // generated ethereal password
                        //     }
                        //   });
                        
                        //   // send mail with defined transport object
                        //   transporter.sendMail({
                        //     from: '"StyleHint" <no-reply@thestylehint.com>', // sender address
                        //     to: `${req.body.email}`, // list of receivers
                        //     subject: "Welcome to StyleHint", // Subject line
                        //     text: "Hello world?", // plain text body
                        //     html: output // html body
                        //   }, (err, info) => {
                        //       if (err) return err;
                        //       console.log("Message sent: %s", info);

                        //       res.json({
                        //         success: true,
                        //         message: 'Registration successsful',
                        //         token: token
                        //       });

                        //   });
                        let mailerConfig = {    
                            host: "smtp.office365.com",  
                            secureConnection: true,
                            port: 587,
                            auth: {
                                user: "no-reply@thestylehint.com",
                                pass: "sneakers36."
                            }
                        };
                        let transporter = nodemailer.createTransport(mailerConfig);
                        
                        let mailOptions = {
                            from: '"StyleHint" <no-reply@thestylehint.com>',
                            to: `${req.body.email}`,
                            subject: 'Welcome to StyleHint',
                            html: output
                        };
                        
                        transporter.sendMail(mailOptions, (error) => {
                            if (err) return err;

                            console.log("Message sent: %s", info);
                            res.json({
                            success: true,
                            message: 'Registration successsful',
                            token: token
                            });
                        });
                    }
                });
            }
        }
    ]);
});

module.exports = router;