const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const NewsSchema = new Schema({
   owner: {type: Schema.Types.ObjectId, ref: 'User'},
   url: {type: String, required: true},
   citation: {type: String, required: true},
   overview: {type: String, required: true},
   headline: {type: String, required: true},
   genre: {type: String, required: true},
   likedBy: [{type: Schema.Types.ObjectId, ref: 'User'}],
   comments: [{
    commenterId: {type: Schema.Types.ObjectId, ref: 'User'},
    commenter: String,
    comment: String,
    commentedAt:{type: Date, default: Date.now}
    }],
   createdAt: {type: Date, default: Date.now}
});

module.exports = mongoose.model('News', NewsSchema);