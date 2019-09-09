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
                {interest: req.body.interest},
                 {season: req.body.season}, {occasion: req.body.occasion}]},
                 (err, count) => {
                     if (err) return err;

                     callback(err, count)
                 })
        },
        function (callback) {
            Hint.find({$and: [{gender: req.body.gender}, {size: req.body.size},
                 {interest: req.body.interest},
                  {season: req.body.season}, {occasion: req.body.occasion}]})
            .limit(perPage)
            .skip(page * perPage)
            .sort({createdAt: -1})
            .select(['_id','url'])
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

router.get('/occasion-hints', checkJwt, (req, res) => {
    //occasion/event array
    occasions = [
        {name: 'school'},
        {name: 'sport'},
        {name: 'birthday party'},
        {name: 'halloween'},
        {name: 'christmas'},
        {name: 'church'},
        {name: 'date night'},
        {name: 'job interview'},
        {name: 'culture'},
    ]

    home = [];

    occasions.forEach(occasion => {
        Hint.find({occasion: occasion.name})
        .sort({createdAt: -1})
        .select(['url'])
        .exec((err, hints) => {
            if (err) return err;

            home.push({occasion: occasion.name, url: hints[0].url});
            if (home.length == 9) {
                res.json({
                    success: true,
                    hints: home
                })
            }
        });
    });
});

//get a single hint
router.get('/get-single-hint/:id', checkJwt, (req, res) => {
    async.waterfall([
        function (callback) {
            Hint.findById(req.params.id, (err, hint) => {
                if (err) return err;

                var rating = 0;
                var numberOfRatings = 0;
                if (hint.ratings == null) {
                    rating = 0;
                }else {
                    hint.ratings.map((rate) => {
                        rating += rate
                    });
                    rating = rating / hint.ratings.length;
                    numberOfRatings = hint.ratings.length;
                }

                callback(err, rating, numberOfRatings)
            });
        },
        function (rating, numberOfRatings) {
            Hint.findById(req.params.id)
            .select(['_id', 'url', 'overview', 'recommendations', 'alternatives', 'dont', 'likedBy', 'occasion'])
            .exec((err, hint) => {
                if (err) return err;
                
                res.json({
                    success: true,
                    hint: hint,
                    averageRating: Math.round(rating),
                    numberOfRatings: numberOfRatings
                });
            });
            
        }
    ])
});

//get suggestions
router.post('/suggestions', checkJwt, (req, res) => {
    Hint.find({$and: [{gender: req.body.gender}, {size: req.body.size},
        {interest: req.body.interest},
         {season: req.body.season}, {occasion: req.body.occasion}]})
         .sort({createdAt: -1})
         .select(['_id','url'])
         .exec((err, hints) => {
            if (err) return err;
        
            let suggestions = [];
            for (let i = 0; i < 5; i++) {
                suggestions.push(hints[Math.floor(Math.random()*hints.length)]);
            }
            res.json({
                success: true,
                suggestions: suggestions
            })
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