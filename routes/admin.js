const router = require('express').Router();
const Hint = require('../models/hint');
const Alert = require('../models/alert');
const Statistics = require('../models/statistics');
const checkJwt = require('../middleware/check-jwt');
const Product = require('../models/product');
const Notification = require('../models/notification');
const isAdmin = require('../middleware/is-admin');
const cloudinary = require('cloudinary');
const formidable = require('formidable');
const User = require('../models/user');
const News = require('../models/news');
const async = require('async');
var API_KEY = 'key-cd89dbc925b95695b194ca3ea9eedf3e';
var DOMAIN = 'mg.thestylehint.com';
var mailgun = require('mailgun-js')({apiKey: API_KEY, domain: DOMAIN});

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
        if (fields.citation) news.citation = fields.citation;
        cloudinary.uploader.upload(fields.image, function(error, result) {
            if (error.url) {
                news.url = error.secure_url;
                news.save();

                res.json({
                    success: true,
                    message: 'News successfully added'
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

//update news
router.post('/update-news/:id', isAdmin, (req, res) => {
    News.findById(req.params.id, (err, news) => {
        if (err) return err;

        let form = new formidable.IncomingForm();

        form.parse(req, (err, fields, files) => {
            if (err) return err;
    
            news.owner = req.decoded.user._id;
            if (fields.overview) news.overview = fields.overview;
            if (fields.headline) news.headline = fields.headline;
            if (fields.genre) news.genre = fields.genre;
            if (fields.citation) news.citation = fields.citation;
            if (fields.image) {
                cloudinary.uploader.upload(fields.image, function(error, result) {
                    if (error.url) {
                        news.url = error.secure_url;
                        news.save();
        
                        res.json({
                            success: true,
                            message: 'News successfully updated'
                        });
                    }
                });
            } else {
                news.save();
                res.json({
                    success: true,
                    message: 'News successfully updated'
                });
            }
        });
    })
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
        if (req.body.name) user.name = req.body.name;
        if (req.body.email) user.email = req.body.email;
        if (req.body.password) user.password = req.body.password;
        if (req.body.gender) user.gender = req.body.gender;
        if (req.body.interest) user.interest = req.body.interest;
        if (req.body.size) user.size = req.body.size;
        if (req.body.isAdmin) user.isAdmin = req.body.isAdmin;
        if (req.body.isDesigner) {
            user.isDesigner = req.body.isDesigner;
            if (req.body.isDesigner == 'true') {
                    //send email
                const output = `
                <div style="text-align: center; font-size: medium">
                    <img style="width: 20%" src="https://res.cloudinary.com/stylehint/image/upload/v1563869996/towel_l5xkio.png" >
                    <h1>Congratulations and Welcome</h1>
                    <p>Congratulation on opening a StyleHint Designer Account. We're glad you have chosen us to help</p>
                    <p>you promote your fashion, designer and clothing business. While this may be a sometimes tough journey,</p>
                    <p>we are here to make sure we can help you as much as possible, in order to make your business and journey</p>
                    <p>as easy as possible. We know this the first step in taking your online business to next level, and we will make sure</p>
                    <p>we treat it as such. Feel free to reach out to us at anytime with any questions and we'll be glad to help you as much as we can. </p>
                </div>
                <div style="text-align: center; font-size: medium">
                    <p>--The StyleHints Team.</p>
                </div>
                `
                const data = {
                    from: 'StyleHints <no-reply@thestylehint.com>',
                    to: `${req.body.email}`,
                    subject: 'Congratulations and Welcome',
                    text: 'The StyleHints Team',
                    html: output
                };
                
                mailgun.messages().send(data, (error, body) => {
                    if (error) return error;
                });
            }
        };
        if (req.body.stripeAcct) user.stripeAcct = req.body.stripeAcct;
        if (req.body.category) {
            user.category = [];
            req.body.category.forEach(cat => {
                user.category.push(cat);
            });
        }
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

/************************************************************************************************************************************** */
                                                                 // DESIGNERS
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

//product approval process
router.post('/review-process/:id', isAdmin, (req, res) => {
    Product.findById(req.params.id, (err, product) => {
        if (err) return err;

        let notification = new Notification();
        Alert.find({}, (err, alert) => {
            if (err) return err;

            alert[0].numberOfAlerts--
            alert[0].save();

            if (req.body.review == 'ok') {
                let hint = new Hint();
    
                hint.owner = product.owner;
                hint.url = product.mainImage;
                if (req.body.overview) hint.overview = req.body.overview;
                if (req.body.recommendations) hint.recommendations = req.body.recommendations;
                if (req.body.alternatives) hint.alternatives = req.body.alternatives;
                if (req.body.dont) hint.dont = req.body.dont;
                if (req.body.gender) hint.gender = req.body.gender;
                if (req.body.size) {
                    req.body.size.forEach(element => {
                        hint.size.push(element);
                    });
                }
                if (req.body.interest) {
                    req.body.interest.forEach(element => {
                        hint.interest.push(element);
                    });
                }
                if (req.body.weather) {
                    req.body.weather.forEach(element => {
                        hint.weather.push(element);
                    });
                }
                if (req.body.season) {
                    req.body.season.forEach(element => {
                        hint.season.push(element);
                    });
                }
                if (req.body.occasion) {
                    req.body.occasion.forEach(element => {
                        hint.occasion.push(element);
                    });
                }
                
                product.hintId = hint._id;
                product.isPublished = 'approved';
                product.reviewedBy = req.decoded.user._id;
    
                hint.save();
                product.save();
    
                User.findById(product.owner, (err, designer) => {
                    if (err) return err;
    
                        //push notification
                    userIds.push(designer['oneSignalId']);
                    var message = { 
                        app_id: "4e5b4450-3330-4ac4-a16e-c60e26ec271d",
                        headings:{"en": `Review decision`},
                        contents: {"en": `A decision has been made on one or more of your submitted products.`},
                        include_player_ids: userIds
                    };
                    sendNotification(message);
                    
                    //in app notification
                    notification.for.push(designer._id);
                    notification.fromUsername = 'StyleHints';
                    notification.typeOf = 'decision';
                    notification.message = 'One or more of your products is out of stock.';
                    notification.save();
    
                    res.json({
                        success: true
                    })
                });
            } else {
                product.isPublished = 'denied';
                product.reason = req.body.reason;
                product.reviewedBy = req.decoded.user._id;
    
    
                product.save();
    
                User.findById(product.owner, (err, designer) => {
                    if (err) return err;
    
                        //push notification
                    userIds.push(designer['oneSignalId']);
                    var message = { 
                        app_id: "4e5b4450-3330-4ac4-a16e-c60e26ec271d",
                        headings:{"en": `Review decision`},
                        contents: {"en": `A decision has been made on one or more of your submitted products.`},
                        include_player_ids: userIds
                    };
                    sendNotification(message);
                    
                    //in app notification
                    notification.for.push(designer._id);
                    notification.fromUsername = 'StyleHints';
                    notification.typeOf = 'decision';
                    notification.message = 'One or more of your products is out of stock.';
                    notification.save();
    
                    res.json({
                        success: true
                    })
                });
            }
        })
    });
});

router.get('/alerts', isAdmin, (req, res) => {
    Alert.find({}, (err, alert) => {
        if (err) return err;

        res.json({
            success: true,
            numberOfAlerts: alert[0].numberOfAlerts
        })
    });
});

//get all reviews by status products
router.post('/review-status', isAdmin, (req, res) => {
    const perPage = 20;
    const page = req.query.page;
    async.waterfall([
        function (callback) {
            Product.countDocuments({isPublished: req.body.reviewType}, (err, count) => {
                if (err) return err;

                callback(err, count)
            });
        },
        function (count) {
            Product.find({isPublished: req.body.reviewType})
            .limit(perPage)
            .skip(page * perPage)
            .sort({createdAt: -1})
            .exec((err, reviews) => {
                if (err) return err;
        
                res.json({
                    success: true,
                    reviews: reviews,
                    totalReviews: count
                })
            });

        }
    ]);
});

//reviewed by me
router.get('/me-reviewed', isAdmin, (req, res) => {
    Product.find({reviewedBy: req.decoded.user._id}, (err, reviews) => {
        if (err) return err;

        res.json({
            success: true,
            reviews: reviews
        })
    });
});


//oders for day
router.get('/daily-orders', isAdmin, (req, res) => {
    Order.find({orderedAt: {$lt: new Date(), 
        $gte: new Date(new Date().setDate(new Date().getDate()-1))}})
        .populate('from')
        .populate('for')
        .populate('product')
        .exec((err, orders) => {
            if (err) return err;

            res.json({
                success: true,
                orders: orders
            })
        });
});

//orders for week
router.get('/weekly-orders', isAdmin, (req, res) => {
    Order.find( {orderedAt: {$lt: new Date(), 
        $gte: new Date(new Date().setDate(new Date().getDate()-7))}})
        .populate('from')
        .populate('for')
        .populate('product')
        .exec((err, orders) => {
            if (err) return err;

            res.json({
                success: true,
                orders: orders
            })
        });
});

//orders for month
router.get('/monthly-orders', isAdmin, (req, res) => {
    Order.find({orderedAt: {$gte: new Date(req.body.year, req.body.month, 1),
        $lt: new Date(req.body.year, req.body.month + 1, 1)}})
        .populate('from')
        .populate('for')
        .populate('product')
        .exec((err, orders) => {
            if (err) return err;

            res.json({
                success: true,
                orders: orders
            })
        });
});

//orders for year
router.get('/yearly-orders', isAdmin, (req, res) => {
    Order.find({orderedAt: {$gte: new Date(req.body.year, 1, 1),
        $lt: new Date(req.body.year + 1, 1, 1)}})
        .populate('from')
        .populate('for')
        .populate('product')
        .exec((err, orders) => {
            if (err) return err;

            res.json({
                success: true,
                orders: orders
            })
        });
});

//chart data for orders
router.post('/chart-orders', isAdmin, (req, res) => {
    const months = [{month:'January', rep: 0},{month:'February', rep: 1}, {month:'March', rep: 2}, {month:'April', rep: 3}, {month:'May', rep: 4},
    {month:'June', rep: 5}, {month:'July', rep: 6}, {month:'August', rep: 7}, {month:'September', rep: 8}, {month:'October', rep: 9},
    {month:'November', rep: 10}, {month:'December', rep: 11}, ]
    if (req.body.year) {
        let data = [];
        months.forEach(month => {
            Order.find({orderedAt: {$gte: new Date(req.body.year, month.rep, 1),
                $lt: new Date(req.body.year, month.rep + 1, 1)}}, (err, stats) => {
               if (err) return err;
       
               if (stats.length !== 0) {
                   var monthlyTotal = 0;
                   stats.forEach(orders => {
                       monthlyTotal += orders.length;
                   });
                   data.push(Object.assign({total: monthlyTotal}, month));
                   if (data.length == 12) {
                    res.json({
                        success: true,
                        orderData: data
                    })
                   }
               } else {
                data.push(Object.assign({total: 0}, month))
                if (data.length == 12) {
                    res.json({
                        success: true,
                        orderData: data
                    })
                }
               }
           });
        });
    }
    
});

//finances for day
router.get('/daily-finances', isAdmin, (req, res) => {
    Order.find({orderedAt: {$lt: new Date(), 
        $gte: new Date(new Date().setDate(new Date().getDate()-1))}})
        .populate('from')
        .populate('for')
        .populate('product')
        .exec((err, orders) => {
            if (err) return err;

            let totalOrders = orders.length;
            let totalSold = 0;
            let totalCompanyReceived = 0;
            let totalDesignerReceived = 0;
            let totalQuantity = 0;

            for (let i = 0; i < orders.length; i++) {
                totalSold += orders[i].totalPaid;
                totalCompanyReceived += orders[i].companyReceived;
                totalDesignerReceived += orders[i].designerReceived;
                totalQuantity += orders[i].quantity;
               if (i == orders.length) {
                res.json({
                    success: true,
                    totalOrders: totalOrders,
                    totalSold: totalSold,
                    totalQuantity: totalQuantity,
                    totalCompanyReceived: totalCompanyReceived,
                    totalDesignerReceived: totalDesignerReceived
    
                })
               }
                
            }

        });
});

//finances for week
router.get('/weekly-finances', isAdmin, (req, res) => {
    Order.find( {orderedAt: {$lt: new Date(), 
        $gte: new Date(new Date().setDate(new Date().getDate()-7))}})
        .populate('from')
        .populate('for')
        .populate('product')
        .exec((err, orders) => {
            if (err) return err;

            let totalOrders = orders.length;
            let totalSold = 0;
            let totalCompanyReceived = 0;
            let totalDesignerReceived = 0;
            let totalQuantity = 0;

            for (let i = 0; i < orders.length; i++) {
                totalSold += orders[i].totalPaid;
                totalCompanyReceived += orders[i].companyReceived;
                totalDesignerReceived += orders[i].designerReceived;
                totalQuantity += orders[i].quantity;
               if (i == orders.length) {
                res.json({
                    success: true,
                    totalOrders: totalOrders,
                    totalSold: totalSold,
                    totalQuantity: totalQuantity,
                    totalCompanyReceived: totalCompanyReceived,
                    totalDesignerReceived: totalDesignerReceived
    
                })
               }
                
            }
        });
});

//finances for month
router.get('/monthly-finances', isAdmin, (req, res) => {
    Order.find({orderedAt: {$gte: new Date(req.body.year, req.body.month, 1),
        $lt: new Date(req.body.year, req.body.month + 1, 1)}})
        .populate('from')
        .populate('for')
        .populate('product')
        .exec((err, orders) => {
            if (err) return err;

            let totalOrders = orders.length;
            let totalSold = 0;
            let totalCompanyReceived = 0;
            let totalDesignerReceived = 0;
            let totalQuantity = 0;

            for (let i = 0; i < orders.length; i++) {
                totalSold += orders[i].totalPaid;
                totalCompanyReceived += orders[i].companyReceived;
                totalDesignerReceived += orders[i].designerReceived;
                totalQuantity += orders[i].quantity;
               if (i == orders.length) {
                res.json({
                    success: true,
                    totalOrders: totalOrders,
                    totalSold: totalSold,
                    totalQuantity: totalQuantity,
                    totalCompanyReceived: totalCompanyReceived,
                    totalDesignerReceived: totalDesignerReceived
    
                })
               }
                
            }
        });
});

//finances for year
router.get('/yearly-finances', isAdmin, (req, res) => {
    Order.find({orderedAt: {$gte: new Date(req.body.year, 1, 1),
        $lt: new Date(req.body.year + 1, 1, 1)}})
        .populate('from')
        .populate('for')
        .populate('product')
        .exec((err, orders) => {
            if (err) return err;

            let totalOrders = orders.length;
            let totalSold = 0;
            let totalCompanyReceived = 0;
            let totalDesignerReceived = 0;
            let totalQuantity = 0;

            for (let i = 0; i < orders.length; i++) {
                totalSold += orders[i].totalPaid;
                totalCompanyReceived += orders[i].companyReceived;
                totalDesignerReceived += orders[i].designerReceived;
                totalQuantity += orders[i].quantity;
               if (i == orders.length) {
                res.json({
                    success: true,
                    totalOrders: totalOrders,
                    totalSold: totalSold,
                    totalQuantity: totalQuantity,
                    totalCompanyReceived: totalCompanyReceived,
                    totalDesignerReceived: totalDesignerReceived
    
                })
               }
                
            }
        });
});

//chart data for finances
router.post('/chart-finances', isAdmin, (req, res) => {
    const months = [{month:'January', rep: 0},{month:'February', rep: 1}, {month:'March', rep: 2}, {month:'April', rep: 3}, {month:'May', rep: 4},
    {month:'June', rep: 5}, {month:'July', rep: 6}, {month:'August', rep: 7}, {month:'September', rep: 8}, {month:'October', rep: 9},
    {month:'November', rep: 10}, {month:'December', rep: 11}, ]
    if (req.body.year) {
        let data = [];
        months.forEach(month => {
            Order.find({orderedAt: {$gte: new Date(req.body.year, month.rep, 1),
                $lt: new Date(req.body.year, month.rep + 1, 1)}}, (err, stats) => {
               if (err) return err;
       
               if (stats.length !== 0) {
                   var monthlyTotal = 0;
                   stats.forEach(order => {
                       monthlyTotal += order.totalPaid;
                   });
                   data.push(Object.assign({total: monthlyTotal}, month));
                   if (data.length == 12) {
                    res.json({
                        success: true,
                        financesData: data
                    })
                   }
               } else {
                data.push(Object.assign({total: 0}, month))
                if (data.length == 12) {
                    res.json({
                        success: true,
                        financesData: data
                    })
                }
               }
           });
        });
    }
    
});

//get all orders and finances
router.get('/finances-orders', isAdmin, (req, res) => {
    Order.find({})
        .populate('from')
        .populate('product')
        .exec((err, orders) => {
            if (err) return err;
    
            totalSold = 0;
            orders.forEach(order => {
                totalSold += order.totalPaid;
            });
            res.json({
                success: true,
                orders: orders,
                totalSold: totalSold
            });
        });
});

module.exports = router;