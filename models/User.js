const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const imageSchema = new Schema({
    name: String,
    desc: String,
    base64: String,
  });
const userSchema = new Schema({
    username:String,
    password:String,
    images:[imageSchema],
    map:String
    
});
module.exports = mongoose.model('user',userSchema,"user");