const router = require('express').Router();
const Hint = require('../models/hint');
const isAdmin = require('../middleware/is-admin');
const cloudinary = require('cloudinary');

cloudinary.config({ 
    cloud_name: 'stylehint', 
    api_key: '555951259724868', 
    api_secret: 'CJnItspl_V5HLIl_phgAWYsdbL4' 
});

router.post('/add-hint', isAdmin, (req, res) => {

    let hint = new Hint();
    hint.owner = req.decoded.user._id;
    if (req.body.overview) hint.overview = req.body.overview;
    if (req.body.recommendations) hint.recommendations = req.body.recommendations;
    if (req.body.alternatives) hint.alternatives = req.body.alternatives;
    if (req.body.do) hint.do = req.body.do;
    if (req.body.dont) hint.dont = req.body.dont;
    if (req.body.image) {
        cloudinary.uploader.upload(req.body.image, (err, result) => {
            if (err) return err;

            hint.url = result.url;
            console.log(result);
        });
    }
    hint.save();

    res.json({
        succes: true,
        message: 'Hint successfully added'
    });
});
module.exports = router;