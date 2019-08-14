const router = require('express').Router();
const Hint = require('../models/hint');
const Statistics = require('../models/statistics');
const checkJwt = require('../middleware/check-jwt');
const isAdmin = require('../middleware/is-admin');
const cloudinary = require('cloudinary');
const formidable = require('formidable');
const User = require('../models/user');

cloudinary.config({ 
    cloud_name: 'stylehint', 
    api_key: '829432514282953', 
    api_secret: 'CJnItspl_V5HLIl_phgAWYsdbL4' 
});

//add hint
router.post('/add-hint', isAdmin, (req, res) => {
    let form = new formidable.IncomingForm();
    let hint = new Hint();

    form.parse(req, (err, fields, files) => {
        if (err) return err;

        hint.owner = req.decoded.user._id;
        if (fields.overview) hint.overview = fields.overview;
        if (fields.recommendations) hint.recommendations = fields.recommendations;
        if (fields.alternatives) hint.alternatives = fields.alternatives;
        if (fields.dont) hint.dont = fields.dont;
        if (fields.gender) hint.gender = fields.gender;
        if (fields.size) {
            fields.size.split(',').forEach(element => {
                hint.size.push(element);
            });
        }
        if (fields.interest) {
            fields.interest.split(',').forEach(element => {
                hint.interest.push(element);
            });
        }
        if (fields.weather) {
            fields.weather.split(',').forEach(element => {
                hint.weather.push(element);
            });
        }
        if (fields.season) {
            fields.season.split(',').forEach(element => {
                hint.season.push(element);
            });
        }
        if (fields.occasion) {
            fields.occasion.split(',').forEach(element => {
                hint.occasion.push(element);
            });
        }
        cloudinary.uploader.upload(fields.image, function(error, result) {
            if (error.url) {
                hint.url = error.secure_url;
                hint.save();

                res.json({
                    success: true,
                    message: 'Hint successfully added'
                });
            }
        });
    });
    
});

//update number of active and daily users
router.post('/update-statistics', checkJwt, (req, res) => {
    Statistics.findOne({createdAt: {$lt: new Date(), 
        $gte: new Date(new Date().setDate(new Date().getDate()-1))}}, (err, stats) => {
        if (err) return err;
        
        
        if (stats == null) {
            let statistic = new Statistics();
            statistic.dailyUsers++
            statistic.save();
            res.json({
                success: true
            })
        } else {
            stats.dailyUsers++
            stats.save();
            res.json({
                success: true
            })
        }
    });
});

router.get('/all-users', isAdmin, (req, res) => {
    User.find({})
        .sort({username: 1})
        .exec((err, users) => {
            if (err) return err;

            res.json({
                success: true,
                users: users
            })
        });
});

//sort users
router.post('/sort-users', isAdmin, (req, res) => {
    const exp = "/^" +`${req.body.sort}` + "/i"
    User.find({gender : {$regex : exp}})
            .sort({username: 1})
            .exec((err, users) => {
                if (err) return err;

                console.log(req.body.sort)
                console.log(exp)
                res.json({
                    success: true,
                    users: users
                })
    });
});

//get single users
router.get('/single-user/:id', isAdmin, (req, res) => {
    User.findById(req.params.id, (err, user) => {
        if (err) return err;

        res.json({
            success: true,
            user: user
        })
    });
});

//update user info
router.post('/update-user/:id', isAdmin, (req, res) => {
    User.findById(req.params.id, (err, user) => {
        if (err) return err;

        if (req.body.username) user.username = req.body.username;
        if (req.body.email) user.email = req.body.email;
        if (req.body.password) user.password = req.body.password;
        if (req.body.gender) user.gender = req.body.gender;
        if (req.body.interest) user.interest = req.body.interest;
        if (req.body.size) user.size = req.body.size;
        if (req.body.isAdmin) user.isAdmin = req.body.isAdmin;
        if (req.body.country) user.country = req.body.country;
        res.json({
            success: true,
            message: 'update successful'
        })
    });
});

//total number of users
router.get('/total-users', isAdmin, (req, res) => {
    User.countDocuments({}, (err, count) => {
        if (err) return err;

        res.json({
            success: true,
            totalUsers: count
        })
    })
});

//total number of hints
router.get('/total-hints', isAdmin, (req, res) => {
    Hint.countDocuments({}, (err, count) => {
        if (err) return err;

        res.json({
            success: true,
            totalHints: count
        })
    })
});

//get number of active and daily users
router.get('/get-statistics', isAdmin, (req, res) => {
    Statistics.findOne({createdAt: {$lt: new Date(), 
        $gte: new Date(new Date().setDate(new Date().getDate()-1))}}, (err, stats) => {
        if (err) return err;

        res.json({
            success: true,
            dailyUsers: stats.dailyUsers
        })
    });
});

//get number of weekly users
router.get('/week-statistics', isAdmin, (req, res) => {
    Statistics.find({createdAt: {$lt: new Date(), 
        $gte: new Date(new Date().setDate(new Date().getDate()-7))}}, (err, stats) => {
        if (err) return err;

        let weeklyTotal = 0;
        if (stats.length !== 0) {
            stats.forEach(record => {
                weeklyTotal += record['dailyUsers']
            });
        }
        res.json({
            success: true,
            weeklyUsers: weeklyTotal
        })
    });
});

//get number of monthly users
router.post('/month-statistics', isAdmin, (req, res) => {
    Statistics.find({createdAt: {$gte: new Date(req.body.year, req.body.month, 1),
         $lt: new Date(req.body.year, req.body.month + 1, 1)}}, (err, stats) => {
        if (err) return err;

        let monthlyTotal = 0;
        if (stats.length !== 0) {
            stats.forEach(record => {
                monthlyTotal += record['dailyUsers']
            });
        }
        res.json({
            success: true,
            monthlyUsers: monthlyTotal
        })
    });
});

//get number of yearly users
router.post('/year-statistics', isAdmin, (req, res) => {
    Statistics.find({createdAt: {$gte: new Date(req.body.year, 1, 1),
         $lt: new Date(req.body.year + 1, 1, 1)}}, (err, stats) => {
        if (err) return err;

        let yearlyTotal = 0;
        if (stats.length !== 0) {
            stats.forEach(record => {
                yearlyTotal += record['dailyUsers']
            });
        }
        res.json({
            success: true,
            yearlyUsers: yearlyTotal
        })
    });
});

module.exports = router;