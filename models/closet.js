const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ClosetSchema = new Schema({
   owner: {type: Schema.Types.ObjectId, ref: 'User'},
   collections: [{name: String, hints: [{type: Schema.Types.ObjectId, ref: 'Hint'}]}]
});

module.exports = mongoose.model('Closet', ClosetSchema);