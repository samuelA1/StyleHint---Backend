const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const bcrypt = require('bcrypt-nodejs');

const UserSchema = new Schema({
    email: {type: String, lowercase: true, unique: true, required: true},
    password: String,
    country: {type: String, lowercase:true, default: 'united states', required: true},
    gender: {type: String, lowercase: true},
    size: {type: String, lowercase: true},
    interest: {type: String, lowercase: true},
    isAdmin: {type: Boolean, default: false}
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



module.exports = mongoose.model('User', UserSchema);