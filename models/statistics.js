const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const StatisticSchema = new Schema({
   createdAt: {type: Date, default: Date.now},
   currentlyActiveUsers: {type: Number, default: 0},
   dailyUsers: {type: Number, default: 0}
});

module.exports = mongoose.model('Statistic', StatisticSchema);