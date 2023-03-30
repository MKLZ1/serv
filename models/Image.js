var mongoose = require("mongoose");
const Schema = mongoose.Schema;

const imageSchema = new Schema({
  name: String,
  desc: String,
  img: Buffer,
});

//Image is a model which has a schema imageSchema

module.exports = new mongoose.model("image", imageSchema, "image");
