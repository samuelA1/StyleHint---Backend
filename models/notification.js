const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const NotificationSchema = new Schema({
    for: {type: Schema.Types.ObjectId, ref: 'User'},
    from: {type: Schema.Types.ObjectId, ref: 'User'},
    createdAt: {type: Date, default: Date.now},
    typeOf: String,
    message: String,
    route: String,
});

module.exports = mongoose.model('Notification', NotificationSchema);