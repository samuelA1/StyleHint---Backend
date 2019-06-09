const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const HintSchema = new Schema({
   owner: {type: Schema.Types.ObjectId, ref: 'User'},
   url: {type: String, required: true},
   overview: {type: String, required: true},
   recommendations: {type: String, required: true},
   alternatives: {type: String, required: true},
   do: {type: String, required: true},
   dont: {type: String, required: true},
   gender : {type: String, lowercase: true},
   size : [{type: String, lowercase: true}],
   interest : [{type: String, lowercase: true}],
   weather: [{type: String, lowercase: true}],
   season: [{type: String, lowercase: true}],
   occasion: [{type: String, lowercase: true}],
   country: {type: String, lowercase: true}
});


module.exports = mongoose.model('Hint', HintSchema);