const jwt = require('jsonwebtoken');
const config = require('../config');

module.exports = function (req, res, next) {
    var token = req.headers["authorization"];

    if (!token) {
        res.status(403).json({
            success: false,
            message: 'No token provided. Login and try again'
        });
    } else {
        jwt.verify(token, config.secret, function (err, decoded){
            if (err) return err;
            if (decoded.user.isAdmin) {
                req.decoded = decoded;
                next();
            } else {
                res.status(403).json({
                    success: false,
                    message: 'Sorry, you must be an administrator to access this data'
                })
            }

        })
    }
}