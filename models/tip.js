const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const TipSchema = new Schema({
   owner: {type: Schema.Types.ObjectId, ref: 'User'},
   ownerUsername: String,
   imageUrl: {type: String, required: true},
   hintId: {type: Schema.Types.ObjectId, ref: 'Hint'},
   usersToSee: [{type: Schema.Types.ObjectId, ref: 'User'}],
   message: String,
   comments: [{
       commenterId: {type: Schema.Types.ObjectId, ref: 'User'},
       commenter: String,
       comment: String,
       commentedAt:{type: Date, default: Date.now}
   }],
   createdAt: {type: Date, default: Date.now}
});

module.exports = mongoose.model('Tip', TipSchema);