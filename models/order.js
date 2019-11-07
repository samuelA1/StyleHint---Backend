const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const OrderSchema = new Schema({
    for: {type: Schema.Types.ObjectId, ref: 'User'},
    from: {type: Schema.Types.ObjectId, ref: 'User'},
    address: {
        zip: {type: Number},
        main: {type: String, default: ''},
        city: {type: String, default: ''},
        state: {type: String, default: ''},
        country: {type: String, default: ''}
    },
    cardNumber: Number,
    products: [{
        size: {type: String, lowercase: true, default: ''},
        whatYouSell: {type: String, lowercase: true, default: ''},
        color: {type: String, lowercase: true, default: ''},
        productId: {type: Schema.Types.ObjectId, ref: 'Product'},
        quantity: {type: Number, default: 1},
        price: {type: Number, default: 0},
        img: {type: String, default: ''},
    }],
    orderedAt: {type: Date, default: Date.now},
    totalPaid: {type: Number, default: 0},
    companyReceived: {type: Number, default: 0},
    designerReceived: {type: Number, default: 0},
    isShipped: {type: Boolean, default: false},
    shippedAt: {type: String, default: ''},
    fees: {type: Number, default: 0}
});

module.exports = mongoose.model('Order', OrderSchema);