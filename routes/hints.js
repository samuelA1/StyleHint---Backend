const router = require('express').Router();
const Hint = require('../models/hint');
const checkJwt = require('../middleware/check-jwt');
const async = require('async');

//get hint based on criteria
router.get('/get-hints',checkJwt, (req, res) => {
    
    const perPage = 20;
    const page = req.query.page;
    async.parallel([
        function(callback) {
            Hint.countDocuments({$and: [{gender: req.body.gender}, {size: req.body.size}, 
                {interest: req.body.interest},{weather: req.body.weather},
                 {season: req.body.season}, {occasion: req.body.occasion}]},
                 (err, count) => {
                     if (err) return err;

                     callback(err, count)
                 })
        },
        function (callback) {
            Hint.find({$and: [{gender: req.body.gender}, {size: req.body.size},
                 {interest: req.body.interest},{weather: req.body.weather},
                  {season: req.body.season}, {occasion: req.body.occasion}]})
            .limit(perPage)
            .skip(page * perPage)
            // .sort({releaseDate: -1})
            .exec((err, hints) => {
                callback(err, hints)
            });
        }
    ], function(err, results) {
        if (err) return err;

        const count = results[0];
        const hints = results[1];
        res.json({
            success: true,
            message: 'Enjoy',
            totalHints: count,
            hints: hints,
        })
    })
});

module.exports = router;