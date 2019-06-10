const router = require('express').Router();
const Hint = require('../models/hint');
const isAdmin = require('../middleware/is-admin');
const cloudinary = require('cloudinary');

cloudinary.config({ 
    cloud_name: 'stylehint', 
    api_key: '829432514282953', 
    api_secret: 'CJnItspl_V5HLIl_phgAWYsdbL4' 
});

router.post('/add-hint', isAdmin, (req, res) => {
    let hint = new Hint();

    // if (err) return err;
    console.log(req.body)

    // hint.owner = req.decoded.user._id;
    // if (req.body.overview) hint.overview = req.body.overview;
    // if (req.body.recommendations) hint.recommendations = req.body.recommendations;
    // if (req.body.alternatives) hint.alternatives = req.body.alternatives;
    // if (req.body.do) hint.do = req.body.do;
    // if (req.body.dont) hint.dont = req.body.dont;
    // if (req.body.gender) hint.gender = req.body.gender;
    // if (req.body.size) {
    //     req.body.size.split(',').forEach(element => {
    //         hint.size.push(element);
    //     });
    // }
    // if (req.body.interest) {
    //     req.body.interest.split(',').forEach(element => {
    //         hint.interest.push(element);
    //     });
    // }
    // if (req.body.weather) {
    //     req.body.weather.split(',').forEach(element => {
    //         hint.weather.push(element);
    //     });
    // }
    // if (req.body.season) {
    //     req.body.season.split(',').forEach(element => {
    //         hint.season.push(element);
    //     });
    // }
    // if (req.body.occasion) {
    //     req.body.occasion.split(',').forEach(element => {
    //         hint.occasion.push(element);
    //     });
    // }
    // cloudinary.uploader.upload(req.body.image, function(error, result) {
    //     if (error.url) {
    //         hint.url = error.secure_url;
    //         hint.save();

    //         res.json({
    //             success: true,
    //             message: 'Hint successfully added'
    //         });
    //     }
    // });
    
});
module.exports = router;