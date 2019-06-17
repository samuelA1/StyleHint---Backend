const router = require('express').Router();
const checkJwt = require('../middleware/check-jwt');
const User = require('../models/user');

//route to customize size, gender and interest
router.post('/customize', checkJwt, (req, res) => {
    User.findById(req.decoded.user._id)
    .select(['-friends', '-tips', '-myTips', '-closet'])
    .exec((err, userWithId) => {
        if (err) return err;

        if (req.body.size) userWithId.size = req.body.size;
        if (req.body.gender) userWithId.gender = req.body.gender;
        if (req.body.interest) userWithId.interest = req.body.interest;
        userWithId.save();

        res.json({
            success: true,
            message: ' Customization successful',
            user: userWithId
        });
    });
});

module.exports = router;