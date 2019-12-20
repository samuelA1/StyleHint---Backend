const router = require('express').Router();
const checkJwt = require('../middleware/check-jwt');
const User = require('../models/user');
const Order = require('../models/order');
const Dorder = require('../models/dorder');
const Notification = require('../models/notification');
const Product = require('../models/product');
const async = require('async');
const stripe = require('stripe')('sk_test_B6s4mzE9c5qSyvJ3B2oxUELh00k4vnnAVT');
var API_KEY = 'key-cd89dbc925b95695b194ca3ea9eedf3e';
var DOMAIN = 'mg.thestylehint.com';
var mailgun = require('mailgun-js')({apiKey: API_KEY, domain: DOMAIN});

//send push notification
var sendNotification = function(data) {
    var headers = {
      "Content-Type": "application/json; charset=utf-8",
      "Authorization": "Basic OTBiYjk0YTUtZTM2Ny00ZTdkLWEwZWItZmQyNjdjNWVhODVl"
    };
    
    var options = {
      host: "onesignal.com",
      port: 443,
      path: "/api/v1/notifications",
      method: "POST",
      headers: headers
    };
    
    var https = require('https');
    var req = https.request(options, function(res) {  
      res.on('data', function(data) {
        console.log("Response:");
        console.log(JSON.parse(data));
      });
    });
    
    req.on('error', function(e) {
      console.log("ERROR:");
      console.log(e);
    });
    
    req.write(JSON.stringify(data));
    req.end();
  };

//select designers
router.post('/select-design', checkJwt, (req, res) => {
    User.findById(req.decoded.user._id, (err, user) => {
        if (err) return err;

        req.body.designers.forEach(designer => {
            user.designers.push(designer);
        });

        user.save();
        res.json({
            success: true
        });
    });
});

//get all designers
router.get('/all-designs', checkJwt, (req, res) => {
    const occasions = ['school','sport','birthday party','halloween','christmas','church','date night','job interview','culture'];
    let designers = [];
    occasions.forEach(occasion => {
        User.find({$and: [{isDesigner: true}, {category: occasion}]}, (err, designs) => {
            if (err) return err;

            designers.push({occasion: occasion, designers: designs});
            if (designers.length == 9) {
                res.json({
                    success: true,
                    designers: designers
                })
            }
        });
    });
});

//get all prefered designers
router.get('/prefered-designers', checkJwt, (req, res) => {
    User.findById(req.decoded.user._id)
        .populate('designers')
        .select('designers')
        .exec((err, user) => {
            if (err) return err;

            res.json({
                success: true,
                designers: user.designers
            })
        })
});

//get unselected designers
router.get('/unchosen-designers', checkJwt, (req, res) => {
    User.findById(req.decoded.user._id)
        .populate('designers')
        .select('designers')
        .exec((err, user) => {
            if (err) return err;

            const occasions = ['school','sport','birthday party','halloween','christmas','church','date night','job interview','culture'];
            let designers = [];
            occasions.forEach(occasion => {
                User.find({$and: [{isDesigner: true}, {category: occasion}]}, (err, designs) => {
                    if (err) return err;

                    let filteredDesigners = [];
                    for (let i = 0; i < designs.length; i++) {
                        if(!filter(designs[i])) {
                           filteredDesigners.push(designs[i]);
                        }
                        
                    }
            
                    function filter(e) {
                         return user.designers.some((u) => {
                              return u.username == e.username
                        })
                    }
                    
        
                    designers.push({occasion: occasion, designers: filteredDesigners});
                    if (designers.length == 9) {
                        res.json({
                            success: true,
                            designers: designers
                        })
                    }
                });
            });
    })
});

//get all products of prefered designer
router.post('/product-status', checkJwt, (req, res) => {
    const perPage = 20;
    const page = req.query.page;
    async.waterfall([
        function (callback) {
            Product.countDocuments({$and: [{owner: req.body.owner}, {isPublished: 'approved'}]}, (err, count) => {
                if (err) return err;

                callback(err, count)
            });
        },
        function (count) {
            Product.find({$and: [{owner: req.body.owner}, {isPublished: 'approved'}]})
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

//get designers by occasion
router.post('/designer-occasion', checkJwt, (req, res) => {
    User.find({$and: [{isDesigner: true}, {category: req.body.occasion}]}, (err, designs) => {
        if (err) return err;

        let designers = [];
        designers.push({occasion: req.body.occasion, designers: designs});
        res.json({
            success: true,
            designers: designers
        })
    });
});


//remove designer
router.post('/remove-design/:id', checkJwt, (req, res) => {
    User.findById(req.decoded.user._id, (err, user) => {
        if (err) return err;

        user.designers.splice(user.designers.findIndex(d => d == req.params.id), 1);

        user.save();
        res.json({
            sucess: true,
            message: 'Designer removed'
        });
    });
});

// get number of items in cart and number of designers
router.get('/cart-designers', checkJwt, (req, res) => {
    User.findById(req.decoded.user._id, (err, user) => {
        if (err) return err;

        res.json({
            sucess: true,
            cart: user.cart.length,
            designers: user.designers.length
        });
    });
});

//add to cart
router.post('/add-cart', checkJwt, (req, res) => {
    User.findById(req.decoded.user._id, (err, user) => {
        if (err) return err;

        user.cart.push(req.body.item);

        user.save();
        res.json({
            success: true,
            message: 'Product added to cart'
        });
    });
});

//add to cart
router.post('/add-wishlist/:id', checkJwt, (req, res) => {
    User.findById(req.decoded.user._id, (err, user) => {
        if (err) return err;

        user.wishlist.push(req.body.item);
        user.cart.splice(user.cart.findIndex(c => c._id == req.params.id), 1);


        user.save();
        res.json({
            success: true,
            message: 'Product added to wishlist'
        });
    });
});

//get items in cart and wishlist
router.get('/get-cart-wishlist', checkJwt, (req, res) => {
    User.findById(req.decoded.user._id)
        .select(['cart', 'wishlist'])
        .exec((err, user) => {
            if (err) return err;
    
            res.json({
                success: true,
                cart: user.cart,
                wishlist: user.wishlist
            })
        })
});



//update item in cart
router.post('/update-cart/:id', checkJwt, (req, res) => {
    User.findById(req.decoded.user._id, (err, user) => {
        if (err) return err;

        Product.findById(req.body.id, (err, product) => {
            if (err) return err;

            if (product.type == 'clothing') {
                let clothIndex = product.cloth.findIndex(p => p.color == req.body.color);
                let sizeIndex = product.cloth[clothIndex].info.findIndex(p => p.size == req.body.size);
                if (req.query.quantity > product.cloth[clothIndex].info[sizeIndex].quantity) {
                    res.json({
                        success: false,
                        message: 'Sorry, the quantity you selected is more than the quantity of this product in stock. Please select a quantity lower than this.'
                    })
                } else {
                    const itemIndex = user.cart.findIndex(c => c._id == req.params.id);
                    user.cart[itemIndex].quantity = req.query.quantity;

                    user.save();
                    res.json({
                        success: true,
                    });
                }
            } else {
                let shoeIndex = product.shoe.findIndex(p => p.color == req.body.color);
                let sizeIndex = product.shoe[shoeIndex].info.findIndex(p => p.size == req.body.size)
                if (req.query.quantity >  product.shoe[shoeIndex].info[sizeIndex].quantity) {
                    res.json({
                        success: false,
                        message: 'Sorry, the quantity you selected is more than the quantity of this product in stock. Please select a quantity lower than this.'
                    })
                } else {
                    const itemIndex = user.cart.findIndex(c => c._id == req.params.id);
                    user.cart[itemIndex].quantity = req.query.quantity;

                    user.save();
                    res.json({
                        success: true,
                    });
                }
            }
        });
    });
});

//remove item from cart
router.post('/remove-from-cart/:id', checkJwt, (req, res) => {
    User.findById(req.decoded.user._id, (err, user) => {
        if (err) return err;

        user.cart.splice(user.cart.findIndex(c => c._id == req.params.id), 1);

        user.save();
        res.json({
            success: true,
            message: 'Product removed from cart'
        })
    });
});

//remove item from wishlist
router.post('/remove-from-wishlist/:id', checkJwt, (req, res) => {
    User.findById(req.decoded.user._id, (err, user) => {
        if (err) return err;

        user.wishlist.splice(user.wishlist.findIndex(c => c._id == req.params.id), 1);
        user.cart.push(req.body.item);

        user.save();
        res.json({
            success: true,
            message: 'Product added to cart'
        })
    });
});

//clear all items in cart
router.post('/clear-cart', checkJwt, (req, res) => {
    User.findById(req.decoded.user._id, (err, user) => {
        if (err) return err;

        user.cart = [];

        user.save();
        res.json({
            success: true,
        })
    });
});

//charge or payments
router.post('/pay', checkJwt, (req, res) => {

    const today = new Date().toLocaleDateString('en-US', {timeZone: "UTC"});
    Math.round10 = function(value, exp) {
        return decimalAdjust('round', value, exp);
    };

    function decimalAdjust(type, value, exp) {
        // If the exp is undefined or zero...
        if (typeof exp === 'undefined' || +exp === 0) {
          return Math[type](value);
        }
        value = +value;
        exp = +exp;
        // If the value is not a number or the exp is not an integer...
        if (isNaN(value) || !(typeof exp === 'number' && exp % 1 === 0)) {
          return NaN;
        }
        // Shift
        value = value.toString().split('e');
        value = Math[type](+(value[0] + 'e' + (value[1] ? (+value[1] - exp) : -exp)));
        // Shift back
        value = value.toString().split('e');
        return +(value[0] + 'e' + (value[1] ? (+value[1] + exp) : exp));
    }
    

    let order = new Order();

    //create order for customer
    order.for = order._id;
    order.from = req.decoded.user._id;
    if (req.body.address.zip) order.address.zip = req.body.address.zip;
    if (req.body.address.main) order.address.main = req.body.address.main;
    if (req.body.address.city) order.address.city = req.body.address.city;
    if (req.body.address.state) order.address.state = req.body.address.state;
    if (req.body.address.country) order.address.country = req.body.address.country;
    
    
    order.totalPaid = req.body.amount;
    order.cardNumber = req.body.card.number;
    order.companyReceived = req.body.amount - order.fees;
    order.designerReceived = order.companyReceived - ((15 * order.totalPaid) / 100);
    order.save();

    req.body.products.forEach(p => {
        order.products.push(p);

        Product.findById(p.productId, (err, product) => {
            if (err) return err;

            

            //email notification for customer
            const confirmation = `
            <div style="text-align: center; font-size: medium">
                <img style="width: 20%" src="https://res.cloudinary.com/stylehint/image/upload/v1563869996/towel_l5xkio.png" >
                <h1>Order confirmation.</h1>
                <p>Hello ${req.decoded.user.name}</p>
                <p>This is to inform you that, your purchase of one or more products on our platform was successful.</p>

                <div style="text-align: center; font-size: medium">
                        <h2>Details</h2>
                        <p><b>Order#: ${order._id}</b></p>
                        <p><b>Total products: ${p.quantity}</b></p>
                        <p><b>Order total: $${req.body.amount}</b></p>
                        <p><b>Ordered on: ${today}</b></p>
                        <p>--The StyleHints Team.</p>
                </div>

            </div>
            `
            const cnfrm = {
                from: 'StyleHints <no-reply@thestylehint.com>',
                to: `${req.decoded.user.email}`,
                subject: 'Order confirmation',
                text: 'The StyleHints Team',
                html: confirmation
            };
                
            mailgun.messages().send(cnfrm, (error, body) => {
                if (error) return error;
            });

            //charge customer
            let stripeToken = req.body.stripeToken;
            let amountPayable = Math.round(req.body.amount * 100);
            

            stripe.customers
                .create({
                source: stripeToken
                })
                .then(function(customer) {
                return stripe.charges.create({
                    amount: amountPayable,
                    currency: 'usd',
                    customer: customer.id,
                    transfer_group: `ORDER_${order._id}`
                });
                }).then(function(charge) {
                    if (charge.payment_method_details.card.country == "US") {
                        order.fees = Math.round10(((2.9 * req.body.amount) / 100) + 0.30, -2);
                    } else {
                        order.fees = 1
                    }
            });
             
 
            req.body.sortedDesProds.forEach(prod => {
                User.findById(prod.owner, (err, designer) => {
                    if (err) return err;

                    let percent = ((15 * prod.amount) / 100);
                    let designerToReceive = prod.amount - percent;
                    let designerReceived = Math.round((designerToReceive * 100) / 100);

                    //payment to designer
                    return stripe.transfers.create({
                        amount: designerReceived,
                        currency: "usd",
                        destination: designer.stripeAcct,
                        transfer_group: `ORDER_${order._id}`
                    }).then(function(transfer) {

                        //create order for each designer
                        let designerOrder = new Dorder();
                        designerOrder.for = designer._id;
                        designerOrder.from = req.decoded.user._id;
                        designerOrder.ref = order._id;
                        if (req.body.address.zip) designerOrder.address.zip = req.body.address.zip;
                        if (req.body.address.main) designerOrder.address.main = req.body.address.main;
                        if (req.body.address.city) designerOrder.address.city = req.body.address.city;
                        if (req.body.address.state) designerOrder.address.state = req.body.address.state;
                        if (req.body.address.country) designerOrder.address.country = req.body.address.country;
                        
                        designerOrder.products = prod.products;
                        designerOrder.companyReceived = percent;
                        designerOrder.designerReceived = designerReceived / 100;
                        designerOrder.totalPaid = prod.amount;

                        designerOrder.save();

                        
                        
            
                        //send email and notification to designer
                        //push notification
                        let userIds = [];
                        userIds.push(designer['oneSignalId']);
                        if (userIds.length !== 0) {
                            var message = { 
                                app_id: "4e5b4450-3330-4ac4-a16e-c60e26ec271d",
                                headings:{"en": `Order placed`},
                                contents: {"en": `A user just made a purchase for one or more of your products.`},
                                include_player_ids: userIds
                            };
                            sendNotification(message);
                        }
                        
            
                        //in app notification
                        let notification = new Notification();
                        notification.for.push(designer._id);
                        notification.fromUsername = 'StyleHints';
                        notification.typeOf = 'purchase';
                        notification.message = 'A user just made a purchase for one or more of your products.';
                        notification.save();
            
                        //email notification for designer
                        const output = `
                        <div style="text-align: center; font-size: medium">
                            <img style="width: 20%" src="https://res.cloudinary.com/stylehint/image/upload/v1563869996/towel_l5xkio.png" >
                            <h1>Order placed</h1>
                            <p>Dear Designer,</p>
                            <p>This is to inform you that, a user just made a purchase of one or more of your products.</p>
                            <p>Please take immediate action to make sure the the user/customer gets his or her purchased product.</p>
            
                            <p>--The StyleHints Team.</p>
                        </div>
                        `
                        const data = {
                            from: 'StyleHints <no-reply@thestylehint.com>',
                            to: `${designer.email}`,
                            subject: 'Order placed',
                            text: 'The StyleHints Team',
                            html: output
                        };
                            
                        mailgun.messages().send(data, (error, body) => {
                            if (error) return error;
                        });

                        //check product quantity
            if (product.type == 'clothing') {
                let clothIndex = product.cloth.findIndex(c => c.color == p.color);
                let sizeIndex = product.cloth[clothIndex].info.findIndex(c => c.size == p.size);
                product.cloth[clothIndex].info[sizeIndex].quantity  -= p.quantity;

                //send email and notification for product out of stock.
                if (product.cloth[clothIndex].info[sizeIndex].quantity == 0) {
                    product.oos = true;
                    let userIds = [];
                    //push notification
                    userIds.push(designer['oneSignalId']);
                    if (userIds.length !== 0) {
                        var message = { 
                            app_id: "4e5b4450-3330-4ac4-a16e-c60e26ec271d",
                            headings:{"en": `Out of Stock`},
                            contents: {"en": `One or more of your products is out of stock.`},
                            include_player_ids: userIds
                        };
                        sendNotification(message);
                    }
                   
                    
                    //in app notification
                    let notification = new Notification();
                    notification.for.push(designer._id);
                    notification.fromUsername = 'StyleHints';
                    notification.typeOf = 'oos';
                    notification.message = 'One or more of your products is out of stock.';
                    notification.save();

                    //email notification
                    const output = `
                    <div style="text-align: center; font-size: medium">
                        <img style="width: 20%" src="https://res.cloudinary.com/stylehint/image/upload/v1563869996/towel_l5xkio.png" >
                        <h1>Product out of stock</h1>
                        <p>Dear Designer,</p>
                        <p>This is to inform you that, one or more of your products has a size which is out of stock.</p>
                        <p>If you have more products in stock, you can refill the number of product in stock on our platform by using the following steps:</p>
                        <div style="text-align: center; font-size: medium">
                            <p>1. Log onto the app, and move to the designer's section.</p>
                            <p>2. In the designer's section, click on the <b>Products</b> section on the side menu.</p>
                            <p>3. Click on the product with the <b>out of stock label</b></p>
                            <p>4. Input the number of products you have in stock in the <b>Quantity</b> input field</p>
                            <p>5. Finally, when done click the <b>update</b> button and you're good to go</p>
                            <p><b>Please make sure you update the quantity in respect to the size of the products you have in stock or your product will not be available for users to buy.</b></p>
                            <p>--The StyleHints Team.</p>
                        </div>
                    </div>
                    `
                    const data = {
                        from: 'StyleHints <no-reply@thestylehint.com>',
                        to: `${designer.email}`,
                        subject: 'Out of Stock',
                        text: 'The StyleHints Team',
                        html: output
                    };
                    
                    mailgun.messages().send(data, (error, body) => {
                        if (error) return error;
                    });
                }
                product.save();
            } else if(product.type == 'shoe'){
                let shoeIndex = product.shoe.findIndex(s => s.color == p.color);
                let sizeIndex = product.shoe[shoeIndex].info.findIndex(s => s.size == parseInt(p.size));
                product.shoe[shoeIndex].info[sizeIndex].quantity  -= p.quantity;

                //send email and notification for product out of stock.
                if (product.shoe[shoeIndex].info[sizeIndex].quantity == 0) {
                    product.oos = true;
                    let userIds = [];
                    //push notification
                    userIds.push(designer['oneSignalId']);
                    if (userIds.length !== 0) {
                        var message = { 
                            app_id: "4e5b4450-3330-4ac4-a16e-c60e26ec271d",
                            headings:{"en": `Out of Stock`},
                            contents: {"en": `One or more of your products is out of stock.`},
                            include_player_ids: userIds
                        };
                        sendNotification(message);
                    }
                    
                    
                    //in app notification
                    let notification = new Notification();
                    notification.for.push(designer._id);
                    notification.fromUsername = 'StyleHints';
                    notification.typeOf = 'oos';
                    notification.message = 'One or more of your products is out of stock.';
                    notification.save();

                    //email notification
                    const output = `
                    <div style="text-align: center; font-size: medium">
                        <img style="width: 20%" src="https://res.cloudinary.com/stylehint/image/upload/v1563869996/towel_l5xkio.png" >
                        <h1>Product out of stock</h1>
                        <p>Hello Designer,</p>
                        <p>This is to inform you that, one or more of your products has a size which is out of stock.</p>
                        <p>If you have more products in stock, you can refill the number of product in stock on our platform by using the following steps:</p>
                        <div style="text-align: center; font-size: medium">
                            <p>1. Log onto the app, and move to the designer's section.</p>
                            <p>2. In the designer's section, click on the <b>Products</b> section on the side menu.</p>
                            <p>3. Click on the product with the <b>out of stock label</b></p>
                            <p>4. Input the number of products you have in stock in the <b>Quantity</b> input field</p>
                            <p>5. Finally, when done click the <b>update</b> button and you're good to go</p>
                            <p><b>Please make sure you update the quantity in respect to the size of the products you have in stock or your product will not be available for users to buy.</b></p>
                            <p>--The StyleHints Team.</p>
                        </div>
                    </div>
                    `
                    const data = {
                        from: 'StyleHints <no-reply@thestylehint.com>',
                        to: `${designer.email}`,
                        subject: 'Out of Stock',
                        text: 'The StyleHints Team',
                        html: output
                    };
                    
                    mailgun.messages().send(data, (error, body) => {
                        if (error) return error;
                    });
                }
                product.save();
            }

                        res.json({
                            success: true,
                            message: 'order successfully placed'
                        })
            });
                    })
            });
        });
    });
});

//get all my orders
router.get('/orders', checkJwt, (req, res) => {
    Order.find({from: req.decoded.user._id})
        .select(['products', 'totalPaid', 'orderedAt', '_id'])
        .exec((err, orders) => {
            if (err) return err;

            res.json({
                success: true,
                orders: orders
            })
        });
});

//get single order
router.get('/order/:id', checkJwt, (req, res) => {
    Order.findById(req.params.id)
        .select(['address', 'products', 'totalPaid', 'orderedAt', '_id', 'cardNumber', 'from'])
        .populate('from')
        .exec((err, orders) => {
            if (err) return err;

            res.json({
                success: true,
                orders: orders
            })
        });
});

//get single order for designer
router.get('/dorder/:id', checkJwt, (req, res) => {
    Dorder.findById(req.params.id)
        .select(['address', 'products', 'totalPaid', 'orderedAt', '_id', 'cardNumber', 'from'])
        .populate('from')
        .exec((err, orders) => {
            if (err) return err;

            res.json({
                success: true,
                orders: orders
            })
        });
});

module.exports = router;