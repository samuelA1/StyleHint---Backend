const router = require('express').Router();
const Order = require('../models/dorder');
const Alert = require('../models/alert');
const Product = require('../models/product');
const isDesigner = require('../middleware/is-designer');
const cloudinary = require('cloudinary');
const formidable = require('formidable');
const async = require('async');

cloudinary.config({ 
    cloud_name: 'stylehint', 
    api_key: '829432514282953', 
    api_secret: 'CJnItspl_V5HLIl_phgAWYsdbL4' 
});

//add product
router.post('/add-product', isDesigner, (req, res) => {
    let form = new formidable.IncomingForm();
    let product = new Product();

    form.parse(req, (err, fields, files) => {
        if (err) return err;

        product.owner = req.decoded.user._id;
        if (fields.price) product.price = fields.price;
        if (fields.type) product.type = fields.type;
        if (fields.whatYouSell) product.whatYouSell = fields.whatYouSell;
        if (fields.cloth) {
            const cloth = JSON.parse(fields.cloth);
            cloth.forEach(p => {
                product.cloth.push(p);
            });
        }
        if (fields.shoe) {
            const shoe = JSON.parse(fields.shoe);
            shoe.forEach(p => {
                product.shoe.push(p);
            });
        }       
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
                                    }
                                    product.save();
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

        if (req.body.price) product.price = req.body.price;
        if (req.body.whatYouSell) product.whatYouSell = req.body.whatYouSell;
        if (req.body.cloth) {
            product.cloth = [];
            const cloth = req.body.cloth;
            cloth.forEach(p => {
                product.cloth.push(p);
            });
        }
        if (req.body.shoe) {
            product.shoe = [];
            const shoe =req.body.shoe;
            shoe.forEach(p => {
                product.shoe.push(p);
            });
        }     

        product.save();
        res.json({
            success: true,
            message: 'Product successfully updated.'
        });
    });
});


//shipped and unshipped orders
router.post('/order-status', isDesigner, (req, res) => {
    const perPage = 20;
    const page = req.query.page;
    async.waterfall([
        function (callback) {
            Order.countDocuments({for: req.decoded.user._id}, (err, count) => {
                if (err) return err;

                Order.countDocuments({for: req.decoded.user._id}, (err, grandTotal) => {
                    if (err) return err;
    
                    callback(err, count, grandTotal)
                });
            });
        },
        function (count, grandTotal) {
            Order.find({for: req.decoded.user._id})
            .limit(perPage)
            .skip(page * perPage)
            .populate('for')
            .sort({orderedAt: -1})
            .exec((err, orders) => {
                if (err) return err;
        
                res.json({
                    success: true,
                    orders: orders,
                    totalOrders: count,
                    grandTotal: grandTotal
                })
            });

        }
    ]);
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
router.post('/monthly-orders', isDesigner, (req, res) => {
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
router.post('/yearly-orders', isDesigner, (req, res) => {
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
                   monthlyTotal = stats.length;
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

//sum of all finances and orders ever made
router.get('/total-finances-orders', isDesigner, (req, res) => {
    Order.find({for: req.decoded.user._id}, (err, orders) => {
        if (err) return err;

        let totalSold = 0;
        if (orders.length !== 0) {
            for (let i = 0; i < orders.length; i++) {
                totalSold += orders[i].designerReceived;
            }
            res.json({
                success: true,
                totalSold: totalSold,
                orders: orders

            })
        } else {
            res.json({
                success: true,
                orders: [],
                totalSold: 0,
            });
        }   

    });
});

//finances for day
router.get('/daily-finances', isDesigner, (req, res) => {
    Order.find({$and: [{for: req.decoded.user._id}, {orderedAt: {$lt: new Date(), 
        $gte: new Date(new Date().setDate(new Date().getDate()-1))}}]})
        .populate('from')
        .populate('product')
        .sort({orderedAt: -1})
        .exec((err, orders) => {
            if (err) return err;

            let totalOrders = orders.length;
            let totalSold = 0;
            let totalQuantity = 0;

            if (orders.length !== 0) {
                for (let i = 0; i < orders.length; i++) {
                    totalSold += orders[i].designerReceived;
                    totalQuantity += orders[i].products.length;
                }
                res.json({
                    success: true,
                    totalOrders: totalOrders,
                    totalSold: totalSold,
                    totalQuantity: totalQuantity,
                    orders: orders
    
                })
            } else {
                res.json({
                    success: true,
                    orders: [],
                    totalSold: 0,
                    totalOrders: totalOrders
                });
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
router.post('/monthly-finances', isDesigner, (req, res) => {
    Order.find({$and: [{for: req.decoded.user._id}, {orderedAt: {$gte: new Date(req.body.year, req.body.month, 1),
        $lt: new Date(req.body.year, req.body.month + 1, 1)}}]})
        .populate('from')
        .populate('product')
        .exec((err, orders) => {
            if (err) return err;

            let totalOrders = orders.length;
            let totalSold = 0;
            let totalQuantity = 0;

            if (orders.length !== 0) {
                for (let i = 0; i < orders.length; i++) {
                    totalSold += orders[i].designerReceived;
                    totalQuantity += orders[i].quantity;
                }
                res.json({
                    success: true,
                    totalOrders: totalOrders,
                    totalSold: totalSold,
                    totalQuantity: totalQuantity,
                    orders: orders
    
                })
            } else {
                res.json({
                    success: true,
                    totalOrders: totalOrders,
                    totalSold: 0,
                    orders: []
    
                })
            }

           
        });
});

//finances for year
router.post('/yearly-finances', isDesigner, (req, res) => {
    Order.find({$and: [{for: req.decoded.user._id}, {orderedAt: {$gte: new Date(req.body.year, 1, 1),
        $lt: new Date(req.body.year + 1, 1, 1)}}]})
        .populate('from')
        .populate('product')
        .exec((err, orders) => {
            if (err) return err;

            let totalOrders = orders.length;
            let totalSold = 0;
            let totalQuantity = 0;

            if (orders.length !== 0) {
                for (let i = 0; i < orders.length; i++) {
                    totalSold += orders[i].designerReceived;
                    totalQuantity += orders[i].quantity;
                }
                res.json({
                    success: true,
                    totalOrders: totalOrders,
                    totalSold: totalSold,
                    totalQuantity: totalQuantity
    
                })
            } else {
               res.json({
                   success: true,
                   totalOrders: totalOrders,
                   totalSold: 0,
               }); 
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