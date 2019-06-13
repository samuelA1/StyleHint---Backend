const router = require('express').Router();
const Tip = require('../models/tip');
const User = require('../models/user');
const checkJwt = require('../middleware/check-jwt');
const async = require('async');

//auto delete tip
module.exports = function (req, res, next,  id) {
    res.json({success: true})
    // router.post('/auto-delete', (req, res) => {
        
        // async.waterfall([
        //     function (callback) {
        //         Tip.findById(id, (err, tip) => {
        //             if (err) return err;
    
        //             callback(err, tip);
        //         });
        //     },
        //     function(tip) {
        //         tip.usersToSee.forEach(userId => {
        //             User.findById(userId, (err, userGotten) => {
        //                 if (err) return err;
    
        //                 const tipToRemove = userGotten.tips.indexOf(id)
        //                 userGotten.tips.splice(tipToRemove, 1);
        //                 userGotten.save();
        //                 res.json({success: true})
        //             });
        //         });
        //     }
        // ]);
    // });   
}