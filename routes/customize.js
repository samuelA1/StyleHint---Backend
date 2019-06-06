const router = require('express').Router();
const checkJwt = require('../middleware/check-jwt');
const User = require('../models/user');

//route to customize size, gender and interest
router.post('/customize', checkJwt, (req, res) => {
    User.findById(req.decoded.user._id, (err, userWithEmail) => {
        if (err) return err;

        if (req.body.size) userWithEmail.size = req.body.size;
        if (req.body.gender) userWithEmail.gender = req.body.gender;
        if (req.body.interest) userWithEmail.interest = req.body.interest;
        userWithEmail.save();

        res.json({
            success: true,
            message: ' Customization successful'
        });
    });
});

module.exports = router;