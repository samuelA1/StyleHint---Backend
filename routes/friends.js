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

//get friends
router.get('/get-friends', checkJwt, (req, res) => {
    User.findById(req.decoded.user._id)
    .select(['friends'])
    .populate('friends')
    .exec((err, user) => {
        if (err) return err;

        res.json({
            success: true,
            friends: user['friends']
        })
    });;
});

//remove friend
router.post('/delete-friend/:id', checkJwt, (req, res) => {
    User.findById(req.decoded.user._id, (err, userWithId) => {
        if (err) return err;

        const userToRemove = userWithId.friends.indexOf(req.params.id)
        userWithId.friends.splice(userToRemove, 1);
        userWithId.save();
        res.json({
            success: true,
            message: 'Friend removed'
        })
    });
});
module.exports = router;