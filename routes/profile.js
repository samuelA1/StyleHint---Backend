const router = require('express').Router();
const checkJwt = require('../middleware/check-jwt');
const User = require('../models/user');

//change email address
router.post('/email', checkJwt, (req, res) => {
    User.findById(req.decoded.user._id, (err, userWithId) => {
        if (err) return err;

        if(req.body.email) userWithId.email = req.body.email;
        userWithId.save();
        res.json({
            success: true,
            message: 'Email update successful'
        });
    });
});

//change country
router.post('/country', checkJwt, (req, res) => {
    User.findById(req.decoded.user._id, (err, userWithId) => {
        if (err) return err;

        if(req.body.country) userWithId.country = req.body.country;
        userWithId.save();
        res.json({
            success: true,
            message: 'Country update successful'
        });
    });
});

//change gender
router.post('/gender', checkJwt, (req, res) => {
    User.findById(req.decoded.user._id, (err, userWithId) => {
        if (err) return err;

        if(req.body.gender) userWithId.gender = req.body.gender;
        userWithId.save();
        res.json({
            success: true,
            message: 'Gender update successful'
        });
    });
});

//change interest
router.post('/interest', checkJwt, (req, res) => {
    User.findById(req.decoded.user._id, (err, userWithId) => {
        if (err) return err;

        if(req.body.interest) userWithId.interest = req.body.interest;
        userWithId.save();
        res.json({
            success: true,
            message: 'Interest update successful'
        });
    });
});

//change size
router.post('/size', checkJwt, (req, res) => {
    User.findById(req.decoded.user._id, (err, userWithId) => {
        if (err) return err;

        if(req.body.size) userWithId.size = req.body.size;
        userWithId.save();
        res.json({
            success: true,
            message: 'Size update successful'
        });
    });
});

module.exports = router;