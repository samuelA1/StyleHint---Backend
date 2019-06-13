const router = require('express').Router();
const User = require('../models/user');
const checkJwt = require('../middleware/check-jwt');

//add firends
router.post('/add-friend/:id', checkJwt, (req, res) => {
    User.findById(req.decoded.user._id, (err, userWithId) => {
        if (err) return err;

        userWithId.friends.push(req.params.id);
        userWithId.save();
        res.json({
            success: true,
            message: 'Friend added'
        });
    });
});

router.post('/delete-friend/:id', checkJwt, (req, res) => {
    User.findById(req.decoded.user._id, (err, userWithId) => {
        if (err) return err;

        const userToRemove = userWithId.friends.indexOf(req.params.id)
        userWithId.friends.splice(userToRemove, 1);
        res.json({
            success: true,
            message: 'Friend removed'
        })
    });
});
module.exports = router;