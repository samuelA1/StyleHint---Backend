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
    info: [{size: {type: String, default: 'small'}, quantity: {type: Number, default: 0}}],
    isPublished: {type: String, default: ''},
    reason: {type: String, default: ''},
    reviewedBy: {type: Schema.Types.ObjectId, ref: 'User'}
});

module.exports = mongoose.model('Product', ProductSchema);