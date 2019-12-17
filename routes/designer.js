const router = require('express').Router();
const Order = require('../models/dorder');
const Alert = require('../models/alert');
const Product = require('../models/product');
const isDesigner = require('../middleware/is-designer');
const cloudinary = require('cloudinary');
const formidable = require('formidable');
const async = require('async');
const User = require('../models/user');
var API_KEY = 'key-cd89dbc925b95695b194ca3ea9eedf3e';
var DOMAIN = 'mg.thestylehint.com';
var mailgun = require('mailgun-js')({apiKey: API_KEY, domain: DOMAIN});

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
        if (req.body.category) {
            user.category = [];
            user.category.push(req.body.category);
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
            Order.countDocuments({$and: [{for: req.decoded.user._id}, {isShipped: req.body.status}]}, (err, count) => {
                if (err) return err;

                Order.countDocuments({for: req.decoded.user._id}, (err, grandTotal) => {
                    if (err) return err;
    
                    callback(err, count, grandTotal)
                });
            });
        },
        function (count, grandTotal) {
            Order.find({$and: [{for: req.decoded.user._id}, {isShipped: req.body.status}]})
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

//change from unshipped to shipped
router.post('/change-status/:id', isDesigner, (req, res) => {
    Order.findById(req. params.id)
        .populate('from')
        .exec((err, order) => {
            if (err) return err;
    
            order.isShipped = true;
            order.shippedAt = new Date().toLocaleDateString('en-US', {timeZone: 'UTC'});
            
    
    
            //email notification for customer
            const confirmation = `
            <div style="text-align: center; font-size: medium">
                <img style="width: 20%" src="https://res.cloudinary.com/stylehint/image/upload/v1563869996/towel_l5xkio.png" >
                <h1>Product shipped.</h1>
                <p>Hello ${order.from.name}</p>
                <p>This is to inform you that, one or more of the products you purchased on ${order.orderedAt} has been shipped. See below for more details</p>
                <p><b>Shipped on: ${order.shippedAt}</b></p>
                
    
                <div style="text-align: center; font-size: medium">
                        <h2>Details</h2>
                        <p><b>Order#: ${order._id}</b></p>
                        <p><b>Order total: $${order.totalPaid}</b></p>
                        <p>--The StyleHints Team.</p>
                </div>
    
            </div>
            `
            const cnfrm = {
                from: 'StyleHints <no-reply@thestylehint.com>',
                to: `${order.from.email}`,
                subject: 'Product shipped',
                text: 'The StyleHints Team',
                html: confirmation
            };
                
            mailgun.messages().send(cnfrm, (error, body) => {
                if (error) return error;
            });
    
            order.save();
            res.json({
                success: true,
                message: 'Product shipped confirmation'
            })
        })
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