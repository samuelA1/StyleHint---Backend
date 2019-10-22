const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ProductSchema = new Schema({
    owner: {type: Schema.Types.ObjectId, ref: 'User'},
    hintId: {type: Schema.Types.ObjectId, ref: 'Hint'},
    price: {type: Number, default: 0},
    mainImage: {type: String, default: ''},
    imgOne: {type: String, default: ''},
    imgTwo: {type: String, default: ''},
    imgThree: {type: String, default: ''},
    whatYouSell: {type: String, default: ''},
    type: {type: String, default: ''},
    shoe: [{color:{type: String, lowercase: true, default: ''} ,
            info: [{size: {type: Number, default: 0}, quantity: {type: Number, default: 0}}]}],
    cloth: [{color:{type: String, lowercase: true, default: ''} ,
            info: [{size: {type: String, default: ''}, quantity: {type: Number, default: 0}}]
    }],
    oos: {type: Boolean, default: false}, //for out of stock products
    isPublished: {type: String, default: ''},
    reason: {type: String, default: ''},
    reviewedBy: {type: Schema.Types.ObjectId, ref: 'User'},
    createdAt: {type: Date, default: Date.now}
});

module.exports = mongoose.model('Product', ProductSchema);