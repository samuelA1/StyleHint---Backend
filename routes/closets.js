const router = require('express').Router();
const Closet = require('../models/closet');
const Hint = require('../models/hint');
const checkJwt = require('../middleware/check-jwt');
const async = require('async');

router.post('/add-closet', checkJwt, (req, res) => {
    async.waterfall([
        function (callback) {
            Hint.findById(req.body.hintId, (err, hint) => {
                if (err) return err;

                callback(err, hint);
            });
        },
        function (hint) {
            Closet.findOne({owner: req.decoded.user._id}, (err, closetGot) => {
                if (err) return err;
        
                if (closetGot == null) {
                    let closet = new Closet();
                    closet.owner = req.decoded.user._id;
                    closet.collections.push({
                        name: 'all',
                        hints: hints.push(req.body.hintId)
                    });
                    hint.likedBy.push(req.decoded.user._id);

                    hint.save();
                    closet.save();
                } else {
                    let closetAdd = closetGot.collections.find(collection => 
                        collection['name'] == req.body.collectionName);
                    closetAdd.hints.push(req.body.hintId);
                    hint.likedBy.push(req.decoded.user._id);

                    hint.save();
                    closetGot.save();
                }
            })
        }
    ])
});

module.exports = router;