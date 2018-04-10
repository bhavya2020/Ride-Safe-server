const mongoose = require("mongoose");

const mapSchema = mongoose.Schema({

    ownerID:String,
    drivers:[String]
});

module.exports = mongoose.model("managerDriverMap", mapSchema);