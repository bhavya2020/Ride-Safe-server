const mongoose = require("mongoose");

const distractionResultSchema = mongoose.Schema({
    driver:String,
    c0: [String],
    c1: [String],
    c2: [String],
    c3: [String],
    c4: [String],
    c5: [String],
    c6: [String],
    c7: [String],

},{
    timestamps:true
});

module.exports = mongoose.model("distractionResult", distractionResultSchema);