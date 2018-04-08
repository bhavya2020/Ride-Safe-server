const mongoose = require("mongoose");

const userSchema = mongoose.Schema({
    email:String,
    DLno:String,
    licencePlateNo:String,
    gender: String,
    age:String,
    phoneNo: String
});

module.exports = mongoose.model("user", userSchema);