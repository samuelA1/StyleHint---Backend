const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const bcrypt = require('bcrypt-nodejs');
const algolia = require('mongoose-algolia');

const UserSchema = new Schema({
    username: {type: String, lowercase: true, unique: true, required: true},
    email: {type: String, lowercase: true, unique: true, required: true},
    password: String,
    oneSignalId: {type: String, default: ''},
    country: {type: String, lowercase:true, default: 'united states', required: true},
    gender: {type: String, lowercase: true, default: ''},
    size: {type: String, lowercase: true, default: ''},
    interest: {type: String, lowercase: true, default: ''},
    isAdmin: {type: Boolean, default: false},
    tips: [{type: Schema.Types.ObjectId, ref: 'Tip'}],
    myTips: [{type: Schema.Types.ObjectId, ref: 'Tip'}],
    friends: [{type: Schema.Types.ObjectId, ref: 'User'}],
    createdAt: {type: Date, default: Date.now},
    notifications: {type: Number, default: 0},
});

UserSchema.plugin(algolia, {
    appId: 'X1ROWG5RKS',
    apiKey: '39c62197312b40a371657727f4df78cf',
    indexName: 'stylehint',
    selector: '_id username',
    defaults: {
      author: 'uknown'
    },
    mappings: {
      username: function(value) {
        return `${value}`
      }
    },
    debug: true
  });

UserSchema.pre('save', function (next) {
    const user = this;
    if (!user.isModified('password')) return next();

    bcrypt.hash(user.password, null, null, function (err, hash) {
        if (err) return next(err);

        user.password = hash;
        next();
    });
});

UserSchema.methods.comparePassword = function (password) {
    return bcrypt.compareSync(password, this.password);
}



UserSchema.plugin(algolia);
let Model = mongoose.model('User', UserSchema);
Model.SyncToAlgolia();
Model.SetAlgoliaSettings({
  searchableAttributes: ['username']
});

module.exports = Model;
