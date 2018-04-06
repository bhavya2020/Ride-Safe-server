const mongoose = require("mongoose");

const reportSchema = mongoose.Schema({

    reporterID:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "user"
    },
    licencePlateNo:String,
    categories: [String],
});

module.exports = mongoose.model("report", reportSchema);