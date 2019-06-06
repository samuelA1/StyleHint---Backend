const router = require('express').Router();
const cloudinary = require('cloudinary');
const User = require('../models/user');
const checkJwt = require('../middlewares/check-jwt');

cloudinary.config({ 
    cloud_name: 'daydy3tvk', 
    api_key: '555951259724868', 
    api_secret: '9-IvSbBzpa9hFXsUkwB8qG_IXd8' 
});

router.post('/updateUser', checkJwt, (req, res) => {
    User.findOne({_id: req.decoded.user._id}, (err, user) => {
        if (err) return err;

        if (req.body.username) user.username = req.body.username;
        if (req.body.email) user.email = req.body.email;
        if (req.body.password) user.password = req.body.password;
        if (req.body.image) {
            cloudinary.uploader.upload(req.body.image, (err, result) => {
                if (err) return err;

                user.picVersion = result.version;
                user.picId = result.public_id
                user.images.push({imageVersion: result.version, imageId: result.public_id});
            });
        }

        user.save();
        res.json({
            success: true,
            message: 'Profile update successful'
        })
    })
})

router.get('/getUser', checkJwt, (req, res) => {
    res.json({
        decoded: req.decoded
    });
});

module.exports = router;