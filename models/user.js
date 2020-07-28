// require the needed modules

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const Schema = mongoose.Schema;

/** With mongoose, everything is derived from the schema.
 We have a Schema below with email, password, profile, address, history properties */
const UserSchema = new Schema({
    email: {type: String, unique: true, lowercase: true},
	username:String,
    secretToken: String,
    password: String,
    active:Boolean,
    verified:Boolean,
    AccountNumber:{type:Number},
    ifscCode:{type:String},
	email:{type:String },
	phoneNumber:{type:Number},
    profile: {
        name: {type: String, default: ''},
        picture: {type: String, default: ''}
    },
    address: String,
    history: [{
        paid: {type: Number, default: 0},
        item: {type: Schema.Types.ObjectId, ref: 'Product'}
    }],
	
});


const User = mongoose.model('user', UserSchema);
module.exports = User;


module.exports.hashPassword = async (password) => {
    try {
        const salt = await bcrypt.genSalt(10);
        return await bcrypt.hash(password, salt);
    } catch(error) {
        throw new Error('Hashing failed', error);
    }
};

module.exports.comparePasswords = async (inputPassword, hashedPassword) => {
    try {
        return await bcrypt.compare(inputPassword, hashedPassword);
    } catch(error) {
        throw new Error('Comparing failed', error);
    }
};

/** compiling our schema into a model object - a class that constructs documents in mongoose */
