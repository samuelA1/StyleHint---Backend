const router = require('express').Router();
const Closet = require('../models/closet');
const Hint = require('../models/hint');
const checkJwt = require('../middleware/check-jwt');
const async = require('async');

//add hint to closet
router.post('/add-closet', checkJwt, (req, res) => {
    async.waterfall([
        function (callback) {
            Hint.findById(req.body.hintId, (err, hint) => {
                if (err) return err;

                callback(err, hint);
            });
        },
        function (hint) {
            Closet.findOne({owner: req.decoded.user._id}, (err, closetGot) => {
                if (err) return err;
        
                if (closetGot == null) {
                    let closet = new Closet();
                    closet.owner = req.decoded.user._id;
                    closet.collections.push({
                        name: req.body.collectionName,
                        hints: [req.body.hintId]
                    });
                    hint.likedBy.push(req.decoded.user._id);

                    hint.save();
                    closet.save();
                    res.json({
                        success: true,
                        message: 'Hint added to closet'
                    })
                } else {
                    if (closetGot.collections.some(collection => collection['name'] == req.body.collectionName)) {
                        let closetAdd = closetGot.collections.find(collection => 
                            collection['name'] == req.body.collectionName);
                        closetAdd.hints.push(req.body.hintId);
                        if (hint.likedBy.some(liked => liked == req.decoded.user._id)) {
                            closetGot.save();
                            res.json({
                                success: true,
                                message: 'Hint added to closet'
                            })
                        } else {
                            hint.likedBy.push(req.decoded.user._id);
                            hint.save();
                            closetGot.save();
                            res.json({
                                success: true,
                                message: 'Hint added to closet'
                            })
                        }
                    } else {
                        closetGot.collections.push({
                            name: req.body.collectionName,
                            hints: [req.body.hintId]
                        });
                        hint.likedBy.push(req.decoded.user._id);
    
                        hint.save();
                        closetGot.save();
                        res.json({
                            success: true,
                            message: 'Hint added to closet'
                        })
                    }
                }
            })
        }
    ])
});

//remove hint from closet
router.post('/remove-closet', checkJwt, (req, res) => {
    async.waterfall([
        function (callback) {
            Hint.findById(req.body.hintId, (err, hint) => {
                if (err) return err;

                callback(err, hint);
            });
        },
        function (hint) {
            Closet.findOne({owner: req.decoded.user._id}, (err, closetGot) => {
                if (err) return err;
        
                
                let closetAdd = closetGot.collections.find(collection => 
                    collection['name'] == req.body.collectionName);
                const toRemove = closetAdd.hints.indexOf(req.body.hintId)
                closetAdd.hints.splice(toRemove, 1);
                const hintRemove = hint.likedBy.indexOf(req.decoded.user._id)
                hint.likedBy.splice(hintRemove, 1);

                hint.save();
                closetGot.save();
                res.json({
                    success: true,
                    message: 'Hint removed from closet'
                })
            })
        }
    ])
});

//get closet
router.get('/my-closet', checkJwt, (req, res) => {
    Closet.findOne({owner: req.decoded.user._id})
    .populate('collections.hints')
    .exec( (err, closetGot) => {
        if (err) return err;

        res.json({
            success: true,
            closet: closetGot
        })
    })
});

//get name of collections
router.get('/collections-name/:id', checkJwt, (req, res) => {
    Closet.findOne({owner: req.decoded.user._id})
    .select(['collections'])
    .exec( (err, closetGot) => {
        if (err) return err;

        let foundCollection;
        closetGot.collections.forEach(collection => {
           foundCollection =  collection.hints.find(hint => hint == req.params.id)
        });
        res.json({
            success: true,
            closet: closetGot,
            found: foundCollection
        })
    })
});

//edit closet collection name
router.post('/edit-collection-name', checkJwt, (req, res) => {
    Closet.findOne({owner: req.decoded.user._id}, (err, closetGot) => {
        if (err) return err;

        
        let closetAdd = closetGot.collections.find(collection => 
            collection['name'] == req.body.collectionName);
        closetAdd.name = req.body.newName;

        closetGot.save();
        res.json({
            success: true,
            message: 'Collection name changed'
        })
    })
});

//delete collection
router.post('/delete-collection', checkJwt, (req, res) => {
    Closet.findOne({owner: req.decoded.user._id}, (err, closetGot) => {
        if (err) return err;

        let closetAdd = closetGot.collections.find(collection => 
            collection['name'] == req.body.collectionName);
        closetAdd.hints.forEach(hintId => {
            Hint.findById(hintId, (err, hint) => {
                if (err) return err;

                const hintRemove = hint.likedBy.indexOf(req.decoded.user._id)
                hint.likedBy.splice(hintRemove, 1);
                hint.save();
            });
        });
        
        const toRemove = closetGot.collections.indexOf(closetAdd._id)
        closetGot.collections.splice(toRemove, 1);

        closetGot.save();
        res.json({
            success: true,
            message: 'collection deleted'
        })
    })
});


module.exports = router;