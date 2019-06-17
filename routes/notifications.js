const router = require('express').Router();
const checkJwt = require('../middleware/check-jwt');
const Notification = require('../models/notification');

router.get('/notifications', checkJwt, (req, res) => {
    Notification.find({})
});

module.exports = router;