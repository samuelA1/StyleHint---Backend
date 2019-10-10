const router = require('express').Router();
const Order = require('../models/order');
const Alert = require('../models/alert');
const Product = require('../models/product');
const Notification = require('../models/notification');
const isDesigner = require('../middleware/is-designer');
const cloudinary = require('cloudinary');
const formidable = require('formidable');
const async = require('async');
const User = require('../models/user');

cloudinary.config({ 
    cloud_name: 'stylehint', 
    api_key: '829432514282953', 
    api_secret: 'CJnItspl_V5HLIl_phgAWYsdbL4' 
});

//edit primary info
router.post('/edit-primary-info', isDesigner, (req, res) => {
    User.findById(req.decoded.user._id, (err, user) => {
        if (err) return err;

        if (req.body.description) user.description = req.body.description;
        if (req.body.occasions) {
            user.category = [];
            req.body.occasions.split(',').forEach(occasion => {
                user.category.push(occasion);
            });
        }
        user.save();
        res.json({
            success: true,
            message: 'Information successfully updated.'
        })
    });
});

//add product
router.post('/add-product', isDesigner, (req, res) => {
    let form = new formidable.IncomingForm();
    let product = new Product();

    form.parse(req, (err, fields, files) => {
        if (err) return err;

        product.owner = req.decoded.user._id;
        if (fields.price) product.price = fields.price;
        if (fields.whatYouSell) product.whatYouSell = fields.whatYouSell;
        if (fields.small) {
            product.info.push({size: 'small', quantity: fields.small})
        };
        if (fields.medium) {
            product.info.push({size: 'medium', quantity: fields.medium})
        };
        if (fields.large) {
            product.info.push({size: 'large', quantity: fields.large})
        };

        product.isPublished = 'review'
        
        cloudinary.uploader.upload(fields.mainImage, function(error, result) {
            if (error.url) {
                product.mainImage = error.secure_url;

                cloudinary.uploader.upload(fields.imgOne, function(error, result) {
                    if (error.url) {
                        product.imgOne = error.secure_url;

                        cloudinary.uploader.upload(fields.imgTwo, function(error, result) {
                            if (error.url) {
                                product.imgTwo = error.secure_url;

                                cloudinary.uploader.upload(fields.imgThree, function(error, result) {
                                    if (error.url) {
                                        product.imgThree = error.secure_url;
                                        product.save();
                                    }
                                });
                            }
                        });
                    }
                });
            }
        });

        Alert.find({}, (err, alert) => {
            if (err) return err;

            if (alert.length == 0) {
                let alert = new Alert();
                alert.numberOfAlerts = 1
                alert.save();
                res.json({
                    success: true,
                    message: 'Product successfully added.'
                });
            } else {
                alert[0].numberOfAlerts++
                alert[0].save();
                res.json({
                    success: true,
                    message: 'Product successfully added.'
                });
            }
        })

       
    });
    
});

//get all reviews by status products
router.post('/product-status', isDesigner, (req, res) => {
    const perPage = 20;
    const page = req.query.page;
    async.waterfall([
        function (callback) {
            Product.countDocuments({$and: [{owner: req.decoded.user._id}, {isPublished: req.body.statusType}]}, (err, count) => {
                if (err) return err;

                callback(err, count)
            });
        },
        function (count) {
            Product.find({$and: [{owner: req.decoded.user._id}, {isPublished: req.body.statusType}]})
            .limit(perPage)
            .skip(page * perPage)
            .sort({createdAt: -1})
            .exec((err, products) => {
                if (err) return err;
        
                res.json({
                    success: true,
                    products: products,
                    totalProducts: count
                })
            });

        }
    ]);
});

//delete product
router.delete('/delete-product/:id', isDesigner, (req, res) => {
    Product.findByIdAndRemove(req.params.id, (err) => {
        if (err) return err;

        res.json({
            success: true,
            message: 'Product successfully deleted.'
        })
    });
});

//edit product
router.post('/edit-product/:id', isDesigner, (req, res) => {
    Product.findById(req.params.id, (err, product) => {
        if (err) return err;

        if (req.body.small) product.info[0].quantity = req.body.small;
        if (req.body.medium) product.info[1].quantity = req.body.medium;
        if (req.body.large) product.info[2].quantity = req.body.large;
        if (req.body.price) product.price = req.body.price;
        if (req.body.whatYouSell) product.whatYouSell = req.body.whatYouSell;

        if (product.info[0].quantity > 0 && product.info[1].quantity > 0 && product.info[2].quantity > 0) {
            product.oos = false;
        }

        product.save();
        res.json({
            success: true,
            message: 'Product successfully updated.'
        });
    });
});

//get all orders
router.get('/all-orders', isDesigner, (req, res) => {
    Order.find({for: req.decoded.user._id})
        .populate('from')
        .populate('product')
        .exec((err, orders) => {
            if (err) return err;
    
            res.json({
                success: true,
                orders: orders
            });
        });
});

//shipped orders
router.post('/order-status', isDesigner, (req, res) => {
    Order.find({$and: [{for: req.decoded.user._id}, {isShipped: req.body.status}]})
        .populate('from')
        .populate('product')
        .exec((err, orders) => {
            if (err) return err;
    
            res.json({
                success: true,
                orders: orders
            });
        });
});

//change from unshipped to shipped
router.post('/change-status/:id', isDesigner, (req, res) => {
    Order.findById(req. params.id, (err, order) => {
        if (err) return err;

        order.isShipped = true;
        order.shippedAt = new Date().toLocaleDateString('en-US', {timeZone: 'UTC'});

        order.save();
        res.json({
            success: true,
            message: 'Product shipped confirmation'
        })
    });
});

//oders for day
router.get('/daily-orders', isDesigner, (req, res) => {
    Order.find({$and: [{for: req.decoded.user._id}, {orderedAt: {$lt: new Date(), 
        $gte: new Date(new Date().setDate(new Date().getDate()-1))}}]})
        .populate('from')
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
router.get('/weekly-orders', isDesigner, (req, res) => {
    Order.find({$and: [{for: req.decoded.user._id}, {orderedAt: {$lt: new Date(), 
        $gte: new Date(new Date().setDate(new Date().getDate()-7))}}]})
        .populate('from')
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
router.get('/monthly-orders', isDesigner, (req, res) => {
    Order.find({$and: [{for: req.decoded.user._id}, {orderedAt: {$gte: new Date(req.body.year, req.body.month, 1),
        $lt: new Date(req.body.year, req.body.month + 1, 1)}}]})
        .populate('from')
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
router.get('/yearly-orders', isDesigner, (req, res) => {
    Order.find({$and: [{for: req.decoded.user._id}, {orderedAt: {$gte: new Date(req.body.year, 1, 1),
        $lt: new Date(req.body.year + 1, 1, 1)}}]})
        .populate('from')
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
router.post('/chart-orders', isDesigner, (req, res) => {
    const months = [{month:'January', rep: 0},{month:'February', rep: 1}, {month:'March', rep: 2}, {month:'April', rep: 3}, {month:'May', rep: 4},
    {month:'June', rep: 5}, {month:'July', rep: 6}, {month:'August', rep: 7}, {month:'September', rep: 8}, {month:'October', rep: 9},
    {month:'November', rep: 10}, {month:'December', rep: 11}, ]
    if (req.body.year) {
        let data = [];
        months.forEach(month => {
            Order.find({$and: [{for: req.decoded.user._id}, {orderedAt: {$gte: new Date(req.body.year, month.rep, 1),
                $lt: new Date(req.body.year, month.rep + 1, 1)}}]}, (err, stats) => {
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
router.get('/daily-finances', isDesigner, (req, res) => {
    Order.find({$and: [{for: req.decoded.user._id}, {orderedAt: {$lt: new Date(), 
        $gte: new Date(new Date().setDate(new Date().getDate()-1))}}]})
        .populate('from')
        .populate('product')
        .exec((err, orders) => {
            if (err) return err;

            let totalOrders = orders.length;
            let totalSold = 0;
            let totalQuantity = 0;

            for (let i = 0; i < orders.length; i++) {
                totalSold += orders[i].designerReceived;
                totalQuantity += orders[i].quantity;
               if (i == orders.length) {
                res.json({
                    success: true,
                    totalOrders: totalOrders,
                    totalSold: totalSold,
                    totalQuantity: totalQuantity
    
                })
               }
                
            }
           
        });
});

//finances for week
router.get('/weekly-finances', isDesigner, (req, res) => {
    Order.find({$and: [{for: req.decoded.user._id}, {orderedAt: {$lt: new Date(), 
        $gte: new Date(new Date().setDate(new Date().getDate()-7))}}]})
        .populate('from')
        .populate('product')
        .exec((err, orders) => {
            if (err) return err;

            let totalOrders = orders.length;
            let totalSold = 0;
            let totalQuantity = 0;

            for (let i = 0; i < orders.length; i++) {
                totalSold += orders[i].designerReceived;
                totalQuantity += orders[i].quantity;
               if (i == orders.length) {
                res.json({
                    success: true,
                    totalOrders: totalOrders,
                    totalSold: totalSold,
                    totalQuantity: totalQuantity
    
                })
               }
                
            }
        });
});

//finances for month
router.get('/monthly-finances', isDesigner, (req, res) => {
    Order.find({$and: [{for: req.decoded.user._id}, {orderedAt: {$gte: new Date(req.body.year, req.body.month, 1),
        $lt: new Date(req.body.year, req.body.month + 1, 1)}}]})
        .populate('from')
        .populate('product')
        .exec((err, orders) => {
            if (err) return err;

            let totalOrders = orders.length;
            let totalSold = 0;
            let totalQuantity = 0;

            for (let i = 0; i < orders.length; i++) {
                totalSold += orders[i].designerReceived;
                totalQuantity += orders[i].quantity;
               if (i == orders.length) {
                res.json({
                    success: true,
                    totalOrders: totalOrders,
                    totalSold: totalSold,
                    totalQuantity: totalQuantity
    
                })
               }
                
            }
        });
});

//finances for year
router.get('/yearly-finances', isDesigner, (req, res) => {
    Order.find({$and: [{for: req.decoded.user._id}, {orderedAt: {$gte: new Date(req.body.year, 1, 1),
        $lt: new Date(req.body.year + 1, 1, 1)}}]})
        .populate('from')
        .populate('product')
        .exec((err, orders) => {
            if (err) return err;

            let totalOrders = orders.length;
            let totalSold = 0;
            let totalQuantity = 0;

            for (let i = 0; i < orders.length; i++) {
                totalSold += orders[i].designerReceived;
                totalQuantity += orders[i].quantity;
               if (i == orders.length) {
                res.json({
                    success: true,
                    totalOrders: totalOrders,
                    totalSold: totalSold,
                    totalQuantity: totalQuantity
    
                })
               }
                
            }
        });
});

//chart data for finances
router.post('/chart-finances', isDesigner, (req, res) => {
    const months = [{month:'January', rep: 0},{month:'February', rep: 1}, {month:'March', rep: 2}, {month:'April', rep: 3}, {month:'May', rep: 4},
    {month:'June', rep: 5}, {month:'July', rep: 6}, {month:'August', rep: 7}, {month:'September', rep: 8}, {month:'October', rep: 9},
    {month:'November', rep: 10}, {month:'December', rep: 11}, ]
    if (req.body.year) {
        let data = [];
        months.forEach(month => {
            Order.find({$and: [{for: req.decoded.user._id}, {orderedAt: {$gte: new Date(req.body.year, month.rep, 1),
                $lt: new Date(req.body.year, month.rep + 1, 1)}}]}, (err, stats) => {
               if (err) return err;
       
               if (stats.length !== 0) {
                   var monthlyTotal = 0;
                   stats.forEach(order => {
                       monthlyTotal += order.designerReceived;
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


module.exports = router;