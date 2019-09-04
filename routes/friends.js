const router = require('express').Router();
const User = require('../models/user');
const Notification = require('../models/notification');
const checkJwt = require('../middleware/check-jwt');
const async = require('async');

//send push notification
var sendNotification = function(data) {
    var headers = {
      "Content-Type": "application/json; charset=utf-8",
      "Authorization": "Basic OTBiYjk0YTUtZTM2Ny00ZTdkLWEwZWItZmQyNjdjNWVhODVl"
    };
    
    var options = {
      host: "onesignal.com",
      port: 443,
      path: "/api/v1/notifications",
      method: "POST",
      headers: headers
    };
    
    var https = require('https');
    var req = https.request(options, function(res) {  
      res.on('data', function(data) {
        console.log("Response:");
        console.log(JSON.parse(data));
      });
    });
    
    req.on('error', function(e) {
      console.log("ERROR:");
      console.log(e);
    });
    
    req.write(JSON.stringify(data));
    req.end();
  };

//add firends
router.post('/add-friend/:id', checkJwt, (req, res) => {
    User.findById(req.params.id, (err, userWithId) => {
        if (err) return err;

        let notification = new Notification();
        let userIds = [];

        notification.for.push(req.params.id);
        notification.from = req.decoded.user._id;
        notification.fromUsername = req.decoded.user.username;
        notification.typeOf = 'accept';
        notification.message = 'accepted your friend request';
        notification.route = req.params.id;
        User.findById(req.params.id, (err, user) => {
            if (err) return err;
    
            userIds.push(user['oneSignalId']);
            var message = { 
                app_id: "4e5b4450-3330-4ac4-a16e-c60e26ec271d",
                headings:{"en": `Friend`},
                contents: {"en": `@${req.decoded.user.username} accepted your friend request.`},
                include_player_ids: userIds
            };
            sendNotification(message);
        })

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
    async.waterfall([
        function (callback) {
            User.findById(req.decoded.user._id, (err, user) => {
                if (err) return err;

                callback(err, user)
            });
        },
        function (user) {
            Notification.findByIdAndDelete(req.params.id, (err) => {
                if (err) return err;

                if (user.notifications == -1) {
                    user.notifications = 0;
                } else {
                    user.notifications = user.notifications - 1;
                }
                user.save();
                res.json({
                    success: true
                })
            })
        }
    ]);
});

router.post('/request-friend/:id', checkJwt, (req, res) => {
    let notification = new Notification();
    let userIds = [];

    notification.for.push(req.params.id);
    notification.from = req.decoded.user._id;
    notification.fromUsername = req.decoded.user.username;
    notification.typeOf = 'friend';
    notification.message = 'wants to add you as a friend';
    notification.route = req.params.id;
    User.findById(req.params.id, (err, user) => {
        if (err) return err;

        userIds.push(user['oneSignalId']);
        var message = { 
            app_id: "4e5b4450-3330-4ac4-a16e-c60e26ec271d",
            headings:{"en": `Friend`},
            contents: {"en": `@${req.decoded.user.username} wants to add you as a friend.`},
            include_player_ids: userIds
        };
        sendNotification(message);
    })

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