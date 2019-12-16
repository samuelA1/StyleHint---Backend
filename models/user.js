const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const bcrypt = require('bcrypt-nodejs');
const algolia = require('mongoose-algolia');

const UserSchema = new Schema({
    username: {type: String, lowercase: true, unique: true, required: true},
    name: {type: String, lowercase: true, unique: true, required: true},
    email: {type: String, lowercase: true, unique: true, required: true},
    password: String,
    picture: String,
    oneSignalId: {type: String, default: ''},
    country: {type: String, lowercase:true, default: 'united states', required: true},
    location: {
      state: {type: String, lowercase: true},
      country: {type: String, lowercase: true},
    },
    addresses: [
      {
        main: {type: String, default: ''},
        city: {type: String, default: ''},
        state: {type: String, default: ''},
        country: {type: String, default: ''},
        zip: {type: Number},
      }
    ],
    cards: [
      {
        number: {type: Number},
        expMonth: {type: Number},
        expYear: {type: Number},
        cvc: {type: Number},
        zip: {type: Number},
      }
    ],
    designers: [{type: Schema.Types.ObjectId, ref: 'User'}],
    cart: [
      {
        owner: {type: Schema.Types.ObjectId, ref: 'User'},
        size: String,
        color: String,
        img: String,
        quantity: Number,
        whatYouSell: String,
        price: Number,
        productId: String
      }
    ],
    wishlist: [
      {
        owner: {type: Schema.Types.ObjectId, ref: 'User'},
        size: String,
        color: String,
        img: String,
        quantity: Number,
        whatYouSell: String,
        price: Number,
        productId: String
      }
    ],
    category:  [{type: String, default: ''}],
    description: {type: String, default: ''},
    gender: {type: String, lowercase: true, default: ''},
    size: {type: String, lowercase: true, default: ''},
    interest: {type: String, lowercase: true, default: ''},
    isAdmin: {type: Boolean, default: false},
    isDesigner: {type: Boolean, default: false},
    stripeAcct: {type: String, default: ''},
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
    selector: '_id username name picture',
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
