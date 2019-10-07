const router = require('express').Router();
const checkJwt = require('../middleware/check-jwt');
const User = require('../models/user');
const Order = require('../models/order');
const Notification = require('../models/notification');
const Product = require('../models/product');
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
            sucess: true
        });
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

//add to cart
router.post('/add-cart/:id', checkJwt, (req, res) => {
    User.findById(req.decoded.user._id, (err, user) => {
        if (err) return err;

        user.cart.push(req.params.id);

        user.save();
        res.json({
            success: true,
            message: 'Product added to cart'
        });
    });
});

//get items in card
router.get('/get-cart', checkJwt, (req, res) => {
    User.findById(req.decoded.user._id, (err, user) => {
        if (err) return err;

        res.json({
            success: true,
            cart: user.cart
        })
    });
});

//remove item from cart
router.post('/remove-from-cart/:id', checkJwt, (req, res) => {
    User.findById(req.decoded.user._id, (err, user) => {
        if (err) return err;

        user.cart.splice(user.cart.findIndex(c => c == req.params.id), 1);

        user.save();
        res.json({
            success: true,
            message: 'Product removed from cart'
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
router.post('/orders/:id', checkJwt, (req, res) => {
    User.findById(req.params.id, (err, designer) => {
        if (err) return err;

        let stripeToken = req.body.stripeToken;
        let amountPayable = req.body.amount;
        let designerToReceive = amountPayable - ((15 * amountPayable) / 100)
        let designerReceived = Math.round(designerToReceive * 100) / 100
        const today = new Date().toLocaleDateString('en-US', {timeZone: "UTC"});
        let order = new Order();
        let notification = new Notification();

        //customer payment
        stripe.charge.create({
            amount: amountPayable,
            currency: 'usd',
            transaction: 'customer charged',
            source: stripeToken
        }, (err, charge) => {
            if (err) return err;

            if (charge.payment_method_details.country == "US") {
                order.fees = ((2.9 * amountPayable) / 100) + 0.30;
            } else {
                order.fees = 1
            }

            //payment to designer
            stripe.transfers.create({
                amount: designerReceived,
                currency: "usd",
                destination: designer.stripeAcct,
                transfer_group: `ORDER_${order._id}`
              }, (err, transfer) => {
                if (err) return err;

                order.for = designer._id;
                order.from = req.decoded.user._id;
                if (req.body.address.name) order.address.name = req.body.address.name;
                if (req.body.address.main) order.address.main = req.body.address.main;
                if (req.body.address.city) order.address.city = req.body.address.city;
                if (req.body.address.state) order.address.state = req.body.address.state;
                if (req.body.address.country) order.address.country = req.body.address.country;
                order.product = req.body.productId;
                order.quantity = req.body.quantity;
                order.size = req.body.size;
                order.totalPaid = req.body.amount;
                order.companyReceived = Math.floor(amountPayable - order.fees);
                order.designerReceived = designerReceived;

                order.save();

                Product.findById(req.body.productId, (err, product) => {
                    if (err) return err;

                    let sizeIndex = product.info.findIndex(p => p.size == req.body.size);
                    product.info[sizeIndex].quantity  -= req.body.quantity;

                    //send email and notification for product out of stock.
                    if (product.info[sizeIndex].quantity == 0) {
                        //push notification
                        userIds.push(designer['oneSignalId']);
                        var message = { 
                            app_id: "4e5b4450-3330-4ac4-a16e-c60e26ec271d",
                            headings:{"en": `Out of Stock`},
                            contents: {"en": `One or more of your products is out of stock.`},
                            include_player_ids: userIds
                        };
                        sendNotification(message);
                        
                        //in app notification
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

                    //send email and notification to designer
                    //push notification
                    userIds.push(designer['oneSignalId']);
                    var message = { 
                        app_id: "4e5b4450-3330-4ac4-a16e-c60e26ec271d",
                        headings:{"en": `Order placed`},
                        contents: {"en": `A user just made a purchase for one or more of your products.`},
                        include_player_ids: userIds
                    };
                    sendNotification(message);

                     //in app notification
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
                          <p>Hello Designer,</p>
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
                                <p><b>Order total: $${req.body.amount}</b></p>
                                <p><b>Ordered on: ${today}</b></p>
                                <p>--The StyleHints Team.</p>
                        </div>

                          <p>--The StyleHints Team.</p>
                      </div>
                      `
                      const cnfrm = {
                          from: 'StyleHints <no-reply@thestylehint.com>',
                          to: `${req.decoded.user.email}`,
                          subject: 'Order placed',
                          text: 'The StyleHints Team',
                          html: confirmation
                      };
                        
                      mailgun.messages().send(cnfrm, (error, body) => {
                          if (error) return error;
                      });

                    res.json({
                        success: true,
                        message: 'order successfully placed'
                    })
                });
              });
        });
    });
});

//get all my orders
router.get('/orders', checkJwt, (req, res) => {
    Order.find({from: req.decoded.user._id})
        .select(['product', 'totalPaid', 'orderedAt'])
        .populate('product')
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
        .select(['address', 'product', 'totalPaid', 'orderedAt'])
        .populate('product')
        .exec((err, orders) => {
            if (err) return err;

            res.json({
                success: true,
                orders: orders
            })
        });
});

module.exports = router;