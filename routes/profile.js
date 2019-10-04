const router = require('express').Router();
const checkJwt = require('../middleware/check-jwt');
const User = require('../models/user');
const async = require('async');
const cloudinary = require('cloudinary');
const formidable = require('formidable');
var API_KEY = 'key-cd89dbc925b95695b194ca3ea9eedf3e';
var DOMAIN = 'mg.thestylehint.com';
var mailgun = require('mailgun-js')({apiKey: API_KEY, domain: DOMAIN});

cloudinary.config({ 
    cloud_name: 'stylehint', 
    api_key: '829432514282953', 
    api_secret: 'CJnItspl_V5HLIl_phgAWYsdbL4' 
});

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
                .select(['-friends', '-tips', '-myTips', '-closet', '-addresses', '-cards', '-designers', '-cart'])
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
                            <p>--The StyleHints Team.</p>
                        </div>
                        `
                        const data = {
                            from: 'StyleHints <no-reply@thestylehint.com>',
                            to: `${req.body.email}`,
                            subject: 'Email update confirmation',
                            text: 'The StyleHints Team',
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
                .select(['-friends', '-tips', '-myTips', '-closet', '-addresses', '-cards', '-designers', '-cart'])
                .exec((err, userWithId) => {
                    if (err) return err;
            
                    if(req.body.username) userWithId.username = req.body.username;
                    userWithId.save();
                    //confirmation email
                    const output = `
                        <div style="text-align: center; font-size: medium">
                            <img style="width: 20%" src="https://res.cloudinary.com/stylehint/image/upload/v1563869996/towel_l5xkio.png" >
                            <h1>Username update confirmation</h1>
                            <p>Your recent attempt to update your username was successful. This email is to acknowledge that</p>
                            <p>your previous username is no longer accepted for authentication purposes, but your new username is.</p>
                        </div>
                        <div style="text-align: center; font-size: medium">
                            <h3>Account Details</h3>
                            <p><b>New username: </b>${req.body.username}</p>
                        
                            <p>Please feel free to customize any of your account details at any time on the app.</p>
                            <p>--The StyleHints Team.</p>
                        </div>
                        `
                        const data = {
                            from: 'StyleHints <no-reply@thestylehint.com>',
                            to: `${userWithId.email}`,
                            subject: 'Username update confirmation',
                            text: 'The StyleHints Team',
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
    .select(['-friends', '-tips', '-myTips', '-closet', '-addresses', '-cards', '-designers', '-cart'])
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
                <p>Your recent attempt to update your password was successful. This email is to acknowledge that</p>
                <p>your previous password is no longer accepted for authentication purposes, but your new password is.</p>
            </div>
            <div style="text-align: center; font-size: medium">
                <p>Please feel free to customize any of your account details at any time on the app.</p>
                <p>--The StyleHints Team.</p>
            </div>
            `
            const data = {
                from: 'StyleHints <no-reply@thestylehint.com>',
                to: `${userWithId.email}`,
                subject: 'Password update confirmation',
                text: 'The StyleHints Team',
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

//change name
router.post('/name', checkJwt, (req, res) => {
    User.findById(req.decoded.user._id)
    .select(['-friends', '-tips', '-myTips', '-closet', '-addresses', '-cards', '-designers', '-cart'])
    .exec( (err, userWithId) => {
        if (err) return err;

        if(req.body.name) userWithId.name = req.body.name;
        userWithId.save();
        res.json({
            success: true,
            user: userWithId,
            message: 'Name update successful'
        });
    });
});

//change country
router.post('/country', checkJwt, (req, res) => {
    User.findById(req.decoded.user._id)
    .select(['-friends', '-tips', '-myTips', '-closet', '-addresses', '-cards', '-designers', '-cart'])
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
    .select(['-friends', '-tips', '-myTips', '-closet', '-addresses', '-cards', '-designers', '-cart'])
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
    .select(['-friends', '-tips', '-myTips', '-closet', '-addresses', '-cards', '-designers', '-cart'])
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
    .select(['-friends', '-tips', '-myTips', '-closet', '-addresses', '-cards', '-designers', '-cart'])
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

//edit profile picture
router.post('/edit-picture', checkJwt, (req, res) => {
    let form = new formidable.IncomingForm();

    User.findById(req.decoded.user._id, (err, user) => {
        if (err) return err;

        form.parse(req, (err, fields, files) => {
            if (err) return err;

            cloudinary.uploader.upload(fields.image, function(error, result) {
                if (error.url) {
                    user.picture = error.secure_url;
                    user.save();
    
                    res.json({
                        success: true,
                        url: error.secure_url,
                        message: 'profile picture successfully updated'
                    });
                }
            });
        })
    });
});

//add address
router.post('/add-address', checkJwt, (req, res) => {
    User.findById(req.decoded.user._id, (err, user) => {
        if (err) return err;

        user.addresses.push(
            {
                main: req.body.main,
                city: req.body.city,
                state: req.body.state,
                country: req.body.country,
                zip: req.body.zip,
            }
        )

        user.save();
        res.json({
            success: true,
            message: 'Address successfully added'
        });
    });
});

//get all cards and addresses
router.get('/card-address', checkJwt, (req, res) => {
    User.findById(req.decoded.user._id)
     .select('addresses', 'cards')
     .exec((err, user) => {
        if (err) return err;

        res.json({
            success: true,
            addresses: user.addresses,
            cards: user.cards
        });
    });
});


//edit address
router.post('/edit-address/:id', checkJwt, (req, res) => {
    User.findById(req.decoded.user._id, (err, user) => {
        if (err) return err;

       let addrIndex =  user.addresses.findIndex(a => a._id == req.params.id);
       if (req.body.main) user.addresses[addrIndex].main = req.body.main;
       if (req.body.city) user.addresses[addrIndex].city = req.body.city;
       if (req.body.country) user.addresses[addrIndex].country = req.body.country;
       if (req.body.state) user.addresses[addrIndex].state = req.body.state;
       if (req.body.zip) user.addresses[addrIndex].zip = req.body.zip;

       user.save();
        res.json({
            success: true,
            message: 'Address successfully updated'
        });
    });
});

//get single address
router.get('/single-address/:id', checkJwt, (req, res) => {
    User.findById(req.decoded.user._id, (err, user) => {
        if (err) return err;

       let address = user.addresses.find(a => a._id == req.params.id);

       user.save();
        res.json({
            success: true,
            address: address
        });
    });
});


//delete address
router.post('/delete-address/:id', checkJwt, (req, res) => {
    User.findById(req.decoded.user._id, (err, user) => {
        if (err) return err;

       user.addresses.splice(user.addresses.findIndex(a => a._id == req.params.id), 1);

       user.save();
        res.json({
            success: true,
            message: 'Address successfully deleted'
        });
    });
});

//add card
router.post('/add-card', checkJwt, (req, res) => {
    User.findById(req.decoded.user._id, (err, user) => {
        if (err) return err;

        user.cards.push(
            {
                number: req.body.number,
                expMonth: req.body.expMonth,
                expYear: req.body.expYear,
                cvc: req.body.cvc,
                zip: req.body.zip,
            }
        )

        user.save();
        res.json({
            success: true,
            message: 'Card successfully added'
        });
    });
});


//edit card
router.post('/edit-card/:id', checkJwt, (req, res) => {
    User.findById(req.decoded.user._id, (err, user) => {
        if (err) return err;

       let cardIndex =  user.cards.findIndex(a => a._id == req.params.id);
       if (req.body.number) user.cards[cardIndex].number = req.body.number;
       if (req.body.expMonth) user.cards[cardIndex].expMonth = req.body.expMonth;
       if (req.body.expYear) user.cards[cardIndex].expYear = req.body.expYear;
       if (req.body.zip) user.cards[cardIndex].zip = req.body.zip;
       if (req.body.cvc) user.cards[cardIndex].cvc = req.body.cvc;

       user.save();
        res.json({
            success: true,
            message: 'Card successfully updated'
        });
    });
});

//get single  card
router.get('/single-card/:id', checkJwt, (req, res) => {
    User.findById(req.decoded.user._id, (err, user) => {
        if (err) return err;

       let card = user.cards.find(a => a._id == req.params.id);

       user.save();
        res.json({
            success: true,
            card: card
        });
    });
});

//delete card
router.post('/delete-card/:id', checkJwt, (req, res) => {
    User.findById(req.decoded.user._id, (err, user) => {
        if (err) return err;

       user.cards.splice(user.cards.findIndex(a => a._id == req.params.id), 1);

       user.save();
        res.json({
            success: true,
            message: 'Card successfully deleted'
        });
    });
});

module.exports = router;