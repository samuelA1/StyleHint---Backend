const router = require('express').Router();
const Hint = require('../models/hint');
const checkJwt = require('../middleware/check-jwt');
const async = require('async');

//get hints based on criteria
router.post('/get-hints',checkJwt, (req, res) => {
    
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
            .select(['_id','url'])
            .sort({averageRating: -1})
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
            totalPages: Math.ceil(count / perPage)
        })
    })
});

//get a single hint
router.get('/get-single-hint/:id', checkJwt, (req, res) => {
    Hint.findById(req.params.id)
    .select(['_id','ratings','averageRating', 'url', 'overview', 'recommendations', 'alternatives', 'do', 'dont'])
    .exec((err, hint) => {
        if (err) return err;

        var rating = 0;
        if (hint.ratings == null) {
            rating = 0;
        }else {
            hint.ratings.map((rate) => {
                rating += rate
            });
            rating = rating / hint.ratings.length
        }
        
        res.json({
            success: true,
            hint: hint,
            averageRating: rating
        });
    });
});

//add rating
router.post('/add-rating/:id', checkJwt, (req, res) => {
    Hint.findById(req.params.id, (err, hint) => {
        if (err) return err;

        hint.ratings.push(req.body.rating);
        hint.save();
        res.json({
            success: true
        });
    });
});

module.exports = router;