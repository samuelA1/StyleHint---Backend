const router = require('express').Router();
const User = require('../models/user');
const Notification = require('../models/notification');
const checkJwt = require('../middleware/check-jwt');

//add firends
router.post('/add-friend/:id', checkJwt, (req, res) => {
    User.findById(req.params.id, (err, userWithId) => {
        if (err) return err;

        let notification = new Notification();

        notification.for.push(req.params.id);
        notification.from = req.decoded.user._id;
        notification.fromUsername = req.decoded.user.username;
        notification.typeOf = 'friend';
        notification.message = 'accepted your friend request';
        notification.route = req.params.id;

        notification.save();
        userWithId.friends.push(req.decoded.user._id);
        userWithId.save();
        res.json({
            success: true,
            message: 'Request accepted'
        });
    });
});

//delete friend notification
router.delete('/delete-notification/:id', checkJwt, (req, res) => {
    Notification.findByIdAndDelete(req.params.id, (err) => {
        if (err) return err;

        res.json({
            success: true
        })
    })
});

router.post('/request-friend/:id', checkJwt, (req, res) => {
    let notification = new Notification();

    notification.for.push(req.params.id);
    notification.from = req.decoded.user._id;
    notification.fromUsername = req.decoded.user.username;
    notification.typeOf = 'friend';
    notification.message = 'wants to add you as a friend';
    notification.route = req.params.id;

    notification.save();
    res.json({
        success: true,
        message: 'friend request sent'
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