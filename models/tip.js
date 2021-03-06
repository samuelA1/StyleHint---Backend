const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const TipSchema = new Schema({
   owner: {type: Schema.Types.ObjectId, ref: 'User'},
   ownerUsername: String,
   picture: String,
   imageUrl: {type: String, required: true},
   hintId: {type: Schema.Types.ObjectId, ref: 'Hint'},
   usersToSee: [{type: Schema.Types.ObjectId, ref: 'User'}],
   seenBy: [{type: Schema.Types.ObjectId, ref: 'User'}],
   message: String,
   notifyId: {type: Schema.Types.ObjectId, ref: 'Notification'},
   comments: [{
       commenterId: {type: Schema.Types.ObjectId, ref: 'User'},
       commenter: String,
       comment: String,
       picture: String,
       commentedAt:{type: Date, default: Date.now}
   }],
   createdAt: {type: Date, default: Date.now, index: { expires: 86400 }}
});

module.exports = mongoose.model('Tip', TipSchema);