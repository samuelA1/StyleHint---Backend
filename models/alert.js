const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const AlertSchema = new Schema({
   createdAt: {type: Date, default: Date.now},
   numberOfAlerts: {type: Number, default: 0}
});

module.exports = mongoose.model('Alert', AlertSchema);