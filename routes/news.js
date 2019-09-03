const router = require('express').Router();
const News = require('../models/news');
const User = require('../models/user');
const Notification = require('../models/notification');
const checkJwt = require('../middleware/check-jwt');
const async = require('async');


//get all news
router.get('/all', checkJwt, (req, res) => {
    const perPage = 20;
    const page = req.query.page;
    async.waterfall([
        function (callback) {
            News.countDocuments({}, (err, count) => {
                if (err) return err;

                callback(err, count)
            });
        },
        function (count) {
            News.find({})
                .limit(perPage)
                .skip(page * perPage)
                .sort({createdAt: -1})
                .select(['-owner'])
                .exec( (err, news) => {
                    if (err) return err;

                    res.json({
                        success: true,
                        news: news,
                        totalNews: count
                    })
                });
        }
    ]);
});

//get a news
router.get('/single/:id', checkJwt, (req, res) => {
    News.findById(req.params.id,  (err, news) => {
        if (err) return err;

        res.json({
            success: true,
            news: news
        })
    });
});

//like and unlike a news
router.post('/toggle-like/:id', checkJwt, (req, res) => {
    News.findById(req.params.id, (err, news) => {
        if (err) return err;

        const userId = req.decoded.user._id;
        if (news['likedBy'].some(n => n == userId)) {
            news['likedBy'].splice(news['likedBy'].findIndex(n => n == userId), 1);
        } else {
            news['likedBy'].push(userId);
        }
        news.save();
        res.json({
            success: true        })
    });
});

//share news
router.post('/share-news/:id', checkJwt, (req, res) => {
    let notification = new Notification();
    const friends = req.body.friends;
    for (let i = 0; i < friends.length; i++) {
        const friendId = friends[i];
        notification.for.push(friendId);
        notification.from = req.decoded.user._id;
        notification.fromUsername = req.decoded.user.username;
        notification.typeOf = 'news';
        notification.message = 'shared some news with you';
        notification.route = req.params.id;
    }
    notification.save();
    res.json({
        success: true,
        message: 'News shared'
    })
});

//comment on news
router.post('/add-comment/:id', checkJwt, (req, res) => {
    async.waterfall([
        function (callback) {
            User.findById(req.decoded.user._id, (err, user) => {
                if (err) return err;

                callback(err, user);
            });
        },
        function (user) {
            News.findById(req.params.id, (err, news) => {
                if (err) return err;
        
                let comment = {
                    commenter: user['username'],
                    comment: req.body.comment,
                    commenterId: user['_id']
                }
                news.comments.push(comment);
                news.save();
                res.json({
                    success: true,
                    commentId: comment['_id'],
                    message: 'Comment added',
                })
            });
        }
    ]);
});

//delete news comment
router.post('/delete-comment/:id', checkJwt, (req, res) => {
    News.findById(req.params.id, (err, news) => {
        if (err) return err;

        news.comments.splice(news.comments.findIndex(i => i._id == req.query.id), 1);
        news.save();
        res.json({
            success: true,
            message: 'Comment deleted'
        })
    });
});

module.exports = router;