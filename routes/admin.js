const router = require('express').Router();
const Hint = require('../models/hint');
const Statistics = require('../models/statistics');
const checkJwt = require('../middleware/check-jwt');
const isAdmin = require('../middleware/is-admin');
const cloudinary = require('cloudinary');
const formidable = require('formidable');

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
    Statistics.find({createdAt: new Date()}, (err, stats) => {
        if (err) return err;
        
        if (stats == null) {
            let statistic = new Statistics();
            statistic.currentlyActiveUsers++
            statistic.dailyUsers++
            statistic.save();
            res.json({
                success: true
            })
        } else {
            if (req.body.action == 'add') {
                stats.currentlyActiveUsers++
                stats.dailyUsers++
                stats.save();
                res.json({
                    success: true
                })
            } else if(req.body.action == 'subtract') {
                stats.currentlyActiveUsers--
                stats.dailyUsers--
                stats.save();
                res.json({
                    success: true
                })
            }
           
        }
    });
});

//get number of active and daily users
router.get('/get-statistics', isAdmin, (req, res) => {
    Statistics.find({createdAt: new Date()}, (err, stats) => {
        if (err) return err;

        res.json({
            success: true,
            activeUsers: stats.currentlyActiveUsers,
            dailyUsers: stats.dailyUsers
        })
    });
});
module.exports = router;