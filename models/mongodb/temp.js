const mongoose = require("mongoose");

const tempSchema = mongoose.Schema({
    category: String
},{
    timestamps:true
});

module.exports = mongoose.model("temp", tempSchema);