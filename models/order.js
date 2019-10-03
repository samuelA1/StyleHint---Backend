const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const OrderSchema = new Schema({
    for: {type: Schema.Types.ObjectId, ref: 'User'},
    from: {type: Schema.Types.ObjectId, ref: 'User'},
    address: {
        name: {type: String, default: ''},
        main: {type: String, default: ''},
        city: {type: String, default: ''},
        state: {type: String, default: ''},
        country: {type: String, default: ''}
    },
    size: {type: String, lowercase: true, default: ''},
    product: {type: Schema.Types.ObjectId, ref: 'Product'},
    quantity: {type: Number, default: 1},
    orderedAt: {type: Date, default: Date.now},
    totalPaid: {type: Number, default: 0},
    companyReceived: {type: Number, default: 0},
    designerReceived: {type: Number, default: 0},
    isShipped: {type: Boolean, default: false},
    shippedAt: {type: String, default: ''},
    fees: {type: Number, default: 0}
});

module.exports = mongoose.model('Order', OrderSchema);