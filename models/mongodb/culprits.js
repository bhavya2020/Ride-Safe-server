const mongoose = require("mongoose");

const culpritSchema = mongoose.Schema({

    licencePlateNo:String,
    count:{
        type:Number,
        default:1
    }
});

module.exports = mongoose.model("culprit", culpritSchema);