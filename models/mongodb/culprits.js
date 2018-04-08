const mongoose = require("mongoose");

const culpritSchema = mongoose.Schema({

    plateNo:String,
    categories:[Boolean],
    reporterID:String
});

module.exports = mongoose.model("culprit", culpritSchema);