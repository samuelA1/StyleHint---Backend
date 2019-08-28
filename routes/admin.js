const router = require('express').Router();
const Hint = require('../models/hint');
const Statistics = require('../models/statistics');
const checkJwt = require('../middleware/check-jwt');
const isAdmin = require('../middleware/is-admin');
const cloudinary = require('cloudinary');
const formidable = require('formidable');
const User = require('../models/user');
const News = require('../models/news');

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

//add news
router.post('/add-news', isAdmin, (req, res) => {
    let form = new formidable.IncomingForm();
    let news = new News();

    form.parse(req, (err, fields, files) => {
        if (err) return err;

        news.owner = req.decoded.user._id;
        if (fields.overview) news.overview = fields.overview;
        if (fields.headline) news.headline = fields.headline;
        if (fields.genre) news.genre = fields.genre;
        cloudinary.uploader.upload(fields.image, function(error, result) {
            if (error.url) {
                news.url = error.secure_url;
                news.save();

                res.json({
                    success: true,
                    message: 'Hint successfully added'
                });
            }
        });
    });
    
});

//update hint
router.post('/update-hint/:id', isAdmin, (req, res) => {
    Hint.findById(req.params.id, (err, hint) => {
        if (err) return err;

        let form = new formidable.IncomingForm();

        form.parse(req, (err, fields, files) => {
            if (err) return err;

            hint.owner = req.decoded.user._id;
            if (fields.overview) hint.overview = fields.overview;
            if (fields.recommendations) hint.recommendations = fields.recommendations;
            if (fields.alternatives) hint.alternatives = fields.alternatives;
            if (fields.dont) hint.dont = fields.dont;
            if (fields.gender) hint.gender = fields.gender;
            if (fields.size) {
                hint.size = [];
                fields.size.split(',').forEach(element => {
                    hint.size.push(element);
                });
            }
            if (fields.interest) {
                hint.interest = [];
                fields.interest.split(',').forEach(element => {
                    hint.interest.push(element);
                });
            }
            if (fields.weather) {
                hint.weather = [];
                fields.weather.split(',').forEach(element => {
                    hint.weather.push(element);
                });
            }
            if (fields.season) {
                hint.season = [];
                fields.season.split(',').forEach(element => {
                    hint.season.push(element);
                });
            }
            if (fields.occasion) {
                hint.occasion = [];
                fields.occasion.split(',').forEach(element => {
                    hint.occasion.push(element);
                });
            }
            hint.save();
            res.json({
                success: true,
                message: 'Hint successfully updated'
            });
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

//all hints
router.get('/all-hints', isAdmin, (req, res) => {
    Hint.find({})
        .sort({createdAt: -1})
        .select(['_id', 'url'])
        .exec((err, hints) => {
            if (err) return err;

            res.json({
                success: true,
                hints: hints
            })
        });
});

//sort users
router.post('/sort-users', isAdmin, (req, res) => {
    if (req.body.sort == 'male') {
        User.find({gender : {$regex : /^male/i}})
            .sort({username: 1})
            .exec((err, users) => {
                if (err) return err;

                res.json({
                    success: true,
                    users: users
                })
        });
    } else if (req.body.sort == 'female') {
        User.find({gender : {$regex : /^female/i}})
            .sort({username: 1})
            .exec((err, users) => {
                if (err) return err;

                res.json({
                    success: true,
                    users: users
                })
        });
    } else {
        User.find({gender: req.body.sort})
            .sort({username: 1})
            .exec((err, users) => {
                if (err) return err;

                res.json({
                    success: true,
                    users: users
                })
        });
    }
});

router.post('/sort-hints', (req, res) => {
    if (req.body.gender && !req.body.occasion && !req.body.interest) {
        Hint.find({gender: req.body.gender})
        .sort({createdAt: -1})
        .select(['_id','url', 'overview'])
        .exec((err, hints) => {
            if (err) return err;

                res.json({
                    success: true,
                    hints: hints
                })
        });
    } else if (!req.body.gender && req.body.occasion  && !req.body.interest) {
        Hint.find({occasion: req.body.occasion})
        .sort({createdAt: -1})
        .select(['_id','url', 'overview'])
        .exec((err, hints) => {
            if (err) return err;

                res.json({
                    success: true,
                    hints: hints
                })
        });
    } else if (!req.body.gender && !req.body.occasion  && req.body.interest) {
        Hint.find({interest: req.body.interest})
        .sort({createdAt: -1})
        .select(['_id','url', 'overview'])
        .exec((err, hints) => {
            if (err) return err;

                res.json({
                    success: true,
                    hints: hints
                })
        });
    } else if (req.body.gender && req.body.occasion ) {
        Hint.find({$and: [{gender: req.body.gender}, {occasion: req.body.occasion}]})
        .sort({createdAt: -1})
        .select(['_id','url', 'overview'])
        .exec((err, hints) => {
            if (err) return err;

                res.json({
                    success: true,
                    hints: hints
                })
        });
    } else if (req.body.gender  && req.body.interest ) {
        Hint.find({$and: [{gender: req.body.gender}, {interest: req.body.interest}]})
        .sort({createdAt: -1})
        .select(['_id','url', 'overview'])
        .exec((err, hints) => {
            if (err) return err;

                res.json({
                    success: true,
                    hints: hints
                })
        });
    } else if (req.body.occasion && req.body.interest) {
        Hint.find({$and: [{occasion: req.body.occasion}, {interest: req.body.interest}]})
        .sort({createdAt: -1})
        .select(['_id','url', 'overview'])
        .exec((err, hints) => {
            if (err) return err;

                res.json({
                    success: true,
                    hints: hints
                })
        });
    } else {
        Hint.find({})
        .sort({createdAt: -1})
        .select(['_id', 'url'])
        .exec((err, hints) => {
            if (err) return err;

            res.json({
                success: true,
                hints: hints
            })
        });
    }
    
});

//get single users
router.get('/single-user/:id', isAdmin, (req, res) => {
    User.findById(req.params.id)
        .select(['-friends', '-tips', '-myTips', '-closet'])
        .exec((err, user) => {
            if (err) return err;

            res.json({
                success: true,
                user: user
            })
        });
});

//get single hint
router.get('/single-hint/:id', isAdmin, (req, res) => {
    Hint.findById(req.params.id)
        .select(['-likedBy'])
        .exec((err, hint) => {
            if (err) return err;

            res.json({
                success: true,
                hint: hint
            })
        });
});

//delete hint
router.delete('/delete-hint/:id', isAdmin, (req, res) => {
    Hint.findByIdAndDelete(req.params.id, (err) => {
        if (err) return err;

        res.json({
            success: true,
            message: 'Hint deleted'
        })
    });
});

//delete news
router.delete('/delete-news/:id', isAdmin, (req, res) => {
    News.findByIdAndDelete(req.params.id, (err) => {
        if (err) return err;

        res.json({
            success: true,
            message: 'News deleted'
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
        user.save();
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

//get chart data
router.post('/chart-statistics', isAdmin, (req, res) => {
    const months = [{month:'January', rep: 0},{month:'February', rep: 1}, {month:'March', rep: 2}, {month:'April', rep: 3}, {month:'May', rep: 4},
    {month:'June', rep: 5}, {month:'July', rep: 6}, {month:'August', rep: 7}, {month:'September', rep: 8}, {month:'October', rep: 9},
    {month:'November', rep: 10}, {month:'December', rep: 11}, ]
    if (req.body.year) {
        let data = [];
        months.forEach(month => {
            Statistics.find({createdAt: {$gte: new Date(req.body.year, month.rep, 1),
                $lt: new Date(req.body.year, month.rep + 1, 1)}}, (err, stats) => {
               if (err) return err;
       
               if (stats.length !== 0) {
                   var monthlyTotal = 0;
                   stats.forEach(record => {
                       monthlyTotal += record['dailyUsers'];
                   });
                   data.push(Object.assign({total: monthlyTotal}, month));
                   if (data.length == 12) {
                    res.json({
                        success: true,
                        userData: data
                    })
                   }
               } else {
                data.push(Object.assign({total: 0}, month))
                if (data.length == 12) {
                    res.json({
                        success: true,
                        userData: data
                    })
                }
               }
           });
        });
    }
    
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